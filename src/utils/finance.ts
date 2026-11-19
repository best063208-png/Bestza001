import { DOWN_PERCENT_TIERS } from '../data/defaultCatalog';
import {
  CalculatedQuote,
  DealerSettings,
  DownPercentTier,
  QuoteState,
} from '../types/dealer';

export function formatTHB(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatTHBDecimal(value: number): string {
  const hasFraction = Math.abs(value - Math.round(value)) > 0.001;
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRate(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) return 'ไม่เปิดรับ';
  return `${rate.toFixed(2)}%`;
}

export function formatThaiDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function matchDownPercentTier(percent: number): DownPercentTier | null {
  for (const tier of DOWN_PERCENT_TIERS) {
    if (percent >= tier - 0.01) {
      return tier;
    }
  }
  return null;
}

export function calculateQuote(
  settings: DealerSettings,
  state: QuoteState
): CalculatedQuote {
  const trim =
    settings.trims.find((t) => t.id === state.selectedTrimId) ||
    settings.trims.find((t) => t.active) ||
    settings.trims[0];

  const activeBenefits = state.benefitsOverride ?? trim.benefits;

  const normalPrice = trim.normalPrice;
  const baseSpecialPrice = trim.specialPrice;
  const vehicleDiscount = Math.max(0, state.vehicleDiscount);
  const netCarPrice = Math.max(0, baseSpecialPrice - vehicleDiscount);

  let downPaymentGross = 0;
  let downPercentActual = 0;

  if (state.downMode === 'percent') {
    downPercentActual = Math.min(99, Math.max(0, state.downPercentInput));
    downPaymentGross = Math.round(netCarPrice * (downPercentActual / 100));
  } else {
    downPaymentGross = Math.min(netCarPrice, Math.max(0, state.downAmountInput));
    downPercentActual =
      netCarPrice > 0 ? (downPaymentGross / netCarPrice) * 100 : 0;
  }

  const downPaymentSubsidy = Math.max(0, state.downPaymentSubsidy);
  const netDownPayment = Math.max(0, downPaymentGross - downPaymentSubsidy);
  const excessSubsidy = Math.max(0, downPaymentSubsidy - downPaymentGross);

  // VAT 7% กรณีซับดาวน์ (ส่วนลดเพิ่มเป็นเงินดาวน์)
  const subsidyVatAmount = state.includeVat
    ? Math.round(downPaymentSubsidy * 0.07)
    : 0;

  const financeAmount = Math.max(0, netCarPrice - downPaymentGross);

  const tierMatched = matchDownPercentTier(downPercentActual);
  const matrix =
    trim.rateTable === 'lumin'
      ? settings.rateMatrices.lumin
      : settings.rateMatrices.standard;

  const tableRate =
    tierMatched !== null ? matrix[tierMatched][state.tenorMonths] : null;

  const isRateUnavailable =
    state.customInterestRate === null && tableRate === null;

  const baseRate =
    state.customInterestRate !== null
      ? state.customInterestRate
      : tableRate ?? 0;

  const earlyPaymentDiscountApplied = state.payFirstInstallmentOnDelivery
    ? settings.earlyPaymentDiscount
    : 0;

  const effectiveInterestRate = Math.max(
    0,
    Number((baseRate - earlyPaymentDiscountApplied).toFixed(2))
  );

  const tenorYears = state.tenorMonths / 12;
  const totalInterest = Number(
    (financeAmount * (effectiveInterestRate / 100) * tenorYears).toFixed(2)
  );
  const totalPayable = Number((financeAmount + totalInterest).toFixed(2));
  const monthlyInstallment =
    state.tenorMonths > 0 ? Math.round(totalPayable / state.tenorMonths) : 0;

  const firstInstallmentDueOnDelivery = state.payFirstInstallmentOnDelivery
    ? monthlyInstallment
    : 0;

  const registrationFee = Math.max(0, state.registrationFee);
  const redPlateDeposit = Math.max(0, state.redPlateDeposit);
  const bookingDeposit = Math.max(0, state.bookingDeposit);

  const customDeliveryItemsParsed = state.customDeliveryItems
    .map((item) => {
      const cleaned = String(item.amount).replace(/,/g, '').trim();
      const num = cleaned === '' ? 0 : Math.max(0, Number(cleaned) || 0);
      return {
        label: item.label.trim(),
        amount: num,
      };
    })
    .filter((item) => item.label !== '' || item.amount > 0);

  const customDeliveryTotal = customDeliveryItemsParsed.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalDeliveryCashDue = Math.max(
    0,
    netDownPayment +
      subsidyVatAmount +
      registrationFee +
      redPlateDeposit +
      customDeliveryTotal +
      firstInstallmentDueOnDelivery -
      bookingDeposit
  );

  return {
    trim,
    activeBenefits,
    normalPrice,
    baseSpecialPrice,
    vehicleDiscount,
    netCarPrice,
    downPaymentGross,
    downPercentActual,
    downPaymentSubsidy,
    netDownPayment,
    excessSubsidy,
    includeVat: state.includeVat,
    subsidyVatAmount,
    financeAmount,
    tenorMonths: state.tenorMonths,
    tenorYears,
    tierMatched,
    tableRate,
    isRateUnavailable,
    earlyPaymentDiscountApplied,
    effectiveInterestRate,
    totalInterest,
    totalPayable,
    monthlyInstallment,
    firstInstallmentDueOnDelivery,
    registrationFee,
    redPlateDeposit,
    bookingDeposit,
    customDeliveryItemsParsed,
    customDeliveryTotal,
    totalDeliveryCashDue,
  };
}

export function buildLineShareText(
  settings: DealerSettings,
  state: QuoteState,
  calc: CalculatedQuote
): string {
  const { showroom } = settings;
  const selectedFreebies = settings.freebiePresets
    .filter((f) => state.selectedFreebieIds.includes(f.id))
    .map((f) => f.label);

  const downPctLabel = Number.isInteger(Number(calc.downPercentActual.toFixed(1)))
    ? `${Math.round(calc.downPercentActual)}%`
    : `${calc.downPercentActual.toFixed(1)}%`;

  const lines: string[] = [
    `🚗 ${calc.trim.modelName} ${calc.trim.trimName}`,
    state.customerName.trim() ? `เรียนคุณ: ${state.customerName.trim()}` : '',
    ``,
    calc.netCarPrice !== calc.normalPrice
      ? `💰 ราคาปกติ: ${formatTHB(calc.normalPrice)} บาท`
      : `💰 ราคารถ: ${formatTHB(calc.normalPrice)} บาท`,
    calc.netCarPrice !== calc.normalPrice
      ? `💰 ราคาพิเศษ: ${formatTHB(calc.netCarPrice)} บาท`
      : '',
    calc.vehicleDiscount > 0
      ? `🏷️ ส่วนลดราคาตัวรถ: ${formatTHB(calc.vehicleDiscount)} บาท`
      : '',
    calc.downPaymentSubsidy > 0
      ? `🎉 ส่วนลดเงินดาวน์: ${formatTHB(calc.downPaymentSubsidy)} บาท`
      : '',
    calc.bookingDeposit > 0
      ? `💵 เงินจอง: ${formatTHB(calc.bookingDeposit)} บาท`
      : '',
    calc.redPlateDeposit > 0
      ? `🔖 ค่ามัดจำป้ายแดง: ${formatTHB(calc.redPlateDeposit)} บาท\n(ได้รับป้ายขาวแล้ว คืนให้ครับ)`
      : '',
    ``,
    `⸻`,
    ``,
    `💵 ยอดชำระวันรับรถ`,
    ``,
    `เงินดาวน์ ${downPctLabel} = ${formatTHB(calc.downPaymentGross)} บาท`,
    calc.downPaymentSubsidy > 0
      ? `หักส่วนลดเงินดาวน์ ${formatTHB(calc.downPaymentSubsidy)} บาท`
      : '',
    `➡️ คงเหลือ = ${formatTHB(calc.netDownPayment)} บาท`,
    ``,
    calc.includeVat && calc.subsidyVatAmount > 0
      ? `ค่า VAT 7% (กรณีซับดาวน์) = ${formatTHB(calc.subsidyVatAmount)} บาท`
      : !calc.includeVat && calc.downPaymentSubsidy > 0
      ? `ค่า VAT 7% (กรณีซับดาวน์) = ไม่เก็บ (0 บาท)`
      : '',
    calc.registrationFee > 0
      ? `ค่าจดทะเบียน = ${formatTHB(calc.registrationFee)} บาท`
      : '',
    calc.redPlateDeposit > 0
      ? `ค่ามัดจำป้ายแดง = ${formatTHB(calc.redPlateDeposit)} บาท`
      : '',
    calc.firstInstallmentDueOnDelivery > 0
      ? `ค่างวดงวดแรก (วันรับรถ) = ${formatTHB(calc.firstInstallmentDueOnDelivery)} บาท`
      : '',
    ...calc.customDeliveryItemsParsed.map(
      (item) =>
        `${item.label || 'รายการเพิ่มเติม'} = ${formatTHB(item.amount)} บาท`
    ),
    calc.bookingDeposit > 0
      ? `หักเงินจอง = ${formatTHB(calc.bookingDeposit)} บาท`
      : '',
    ``,
    `✅ ยอดชำระวันรับรถสุทธิ = ${formatTHB(calc.totalDeliveryCashDue)} บาทครับ`,
    ``,
    `⸻`,
    ``,
    `📌 รายละเอียดการผ่อน`,
    ``,
    `• ระยะเวลาผ่อน: ${calc.tenorMonths} เดือน (${calc.tenorYears} ปี)`,
    `• อัตราดอกเบี้ย: ${calc.effectiveInterestRate.toFixed(2)}% ต่อปี${
      state.payFirstInstallmentOnDelivery ? ' (ลดต้นงวดแล้ว)' : ''
    }`,
    `• เงินดาวน์: ${formatTHB(calc.downPaymentGross)} บาท (${downPctLabel})`,
    `• ยอดจัดไฟแนนซ์: ${formatTHB(calc.financeAmount)} บาท`,
    `• ดอกเบี้ยทั้งหมด: ${formatTHBDecimal(calc.totalInterest)} บาท`,
    `• ยอดชำระรวม: ${formatTHBDecimal(calc.totalPayable)} บาท`,
    `• ค่างวดประมาณ: ${formatTHB(calc.monthlyInstallment)} บาท/เดือนครับ`,
    ``,
    `⸻`,
    ``,
    `🛡️ สิทธิประโยชน์ (${calc.trim.packageTitle})`,
    `• ${calc.activeBenefits.insuranceAndAct}`,
    `• ${calc.activeBenefits.homeCharger}`,
    `• ${calc.activeBenefits.vehicleWarranty}`,
    `• ${calc.activeBenefits.batteryWarranty}`,
    `• ${calc.activeBenefits.lifetimeBatteryWarranty}`,
    `• ${calc.activeBenefits.roadsideAssistance}`,
    ...calc.activeBenefits.extraItems.map((b) => `• ${b}`),
  ];

  if (
    selectedFreebies.length > 0 ||
    state.customFreebieNote.trim() ||
    state.promotionNote.trim()
  ) {
    lines.push(``);
    lines.push(`🎁 ของแถมและโปรโมชั่น`);
    selectedFreebies.forEach((f) => lines.push(`• ${f}`));
    if (state.customFreebieNote.trim()) {
      lines.push(`• ${state.customFreebieNote.trim()}`);
    }
    if (state.promotionNote.trim()) {
      lines.push(`• โปรโมชั่น: ${state.promotionNote.trim()}`);
    }
  }

  if (state.quoteNote.trim()) {
    lines.push(``);
    lines.push(`📝 หมายเหตุ: ${state.quoteNote.trim()}`);
  }

  lines.push(``);
  lines.push(`ติดต่อ ${showroom.salesName} (${showroom.showroomName})`);
  lines.push(`โทร: ${showroom.salesPhone || showroom.phone} | LINE: ${showroom.lineId}`);

  // Collapse consecutive empty strings cleanly while preserving single blank lines
  const filtered: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (filtered.length > 0 && filtered[filtered.length - 1] !== '') {
        filtered.push('');
      }
    } else {
      filtered.push(line);
    }
  }
  return filtered.join('\n').trim();
}

export function getLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}
