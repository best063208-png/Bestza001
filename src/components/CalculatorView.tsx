import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  FileText,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import {
  DOWN_PERCENT_TIERS,
  TENOR_OPTIONS,
} from '../data/defaultCatalog';
import {
  BenefitCategories,
  BrandId,
  CalculatedQuote,
  DealerSettings,
  QuoteState,
  VehicleTrim,
} from '../types/dealer';
import {
  buildLineShareText,
  formatRate,
  formatTHB,
  formatTHBDecimal,
  getLineShareUrl,
} from '../utils/finance';

interface CalculatorViewProps {
  settings: DealerSettings;
  state: QuoteState;
  calc: CalculatedQuote;
  onUpdateState: (updater: (prev: QuoteState) => QuoteState) => void;
  onSelectTrim: (trim: VehicleTrim) => void;
  onOpenFullQuote: () => void;
  onOpenBenefitsPage: () => void;
  onExportImage: () => void;
  onExportPdf: () => void;
  onCopyText: () => void;
  isExporting: boolean;
}

const DISCOUNT_PRESETS = [0, 20000, 30000, 50000, 100000];
const SUBSIDY_PRESETS = [0, 20000, 30000, 50000, 80000, 100000];
const BOOKING_PRESETS = [0, 4000, 5000, 10000];

const CARD_SURFACE = 'card-premium rounded-2xl';

const STEP_BADGE =
  'w-7 h-7 rounded-xl btn-gold-copper font-extrabold text-sm inline-flex items-center justify-center shrink-0 mt-0.5';

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  settings,
  state,
  calc,
  onUpdateState,
  onSelectTrim,
  onOpenFullQuote,
  onOpenBenefitsPage,
  onExportImage,
  onExportPdf,
  onCopyText,
  isExporting,
}) => {
  const [brandFilter, setBrandFilter] = useState<'ALL' | BrandId>('ALL');
  const [showInlineBenefitsEditor, setShowInlineBenefitsEditor] =
    useState(false);

  const activeTrims = useMemo(
    () =>
      settings.trims.filter(
        (t) => t.active && (brandFilter === 'ALL' || t.brand === brandFilter)
      ),
    [settings.trims, brandFilter]
  );

  const modelGroups = useMemo(() => {
    const map = new Map<string, VehicleTrim[]>();
    activeTrims.forEach((trim) => {
      const list = map.get(trim.modelId) || [];
      list.push(trim);
      map.set(trim.modelId, list);
    });
    return Array.from(map.values());
  }, [activeTrims]);

  const lineShareUrl = useMemo(() => {
    const text = buildLineShareText(settings, state, calc);
    return getLineShareUrl(text);
  }, [settings, state, calc]);

  const activeMatrix =
    calc.trim.rateTable === 'lumin'
      ? settings.rateMatrices.lumin
      : settings.rateMatrices.standard;

  const updateCustomItem = (
    index: 0 | 1 | 2 | 3,
    field: 'label' | 'amount',
    value: string
  ) => {
    onUpdateState((prev) => {
      const nextItems = [
        ...prev.customDeliveryItems,
      ] as QuoteState['customDeliveryItems'];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };
      return {
        ...prev,
        customDeliveryItems: nextItems,
      };
    });
  };

  const toggleFreebie = (id: string) => {
    onUpdateState((prev) => {
      const exists = prev.selectedFreebieIds.includes(id);
      return {
        ...prev,
        selectedFreebieIds: exists
          ? prev.selectedFreebieIds.filter((item) => item !== id)
          : [...prev.selectedFreebieIds, id],
      };
    });
  };

  const updateBenefitField = <K extends keyof BenefitCategories>(
    key: K,
    value: BenefitCategories[K]
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      benefitsOverride: {
        ...(prev.benefitsOverride ?? calc.trim.benefits),
        [key]: value,
      },
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
      {/* Left/Main Column: Fast Input Controls */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-7">
        {/* Showroom Identity Banner */}
        <div className="card-midnight-hero text-white rounded-2xl overflow-hidden border border-amber-400/25">
          <div className="h-1 gold-copper-bar" />
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {settings.showroom.logoUrl ? (
                <img
                  src={settings.showroom.logoUrl}
                  alt={settings.showroom.showroomName}
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 rounded-xl object-contain border border-amber-400/40 bg-white p-1 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-13 h-13 rounded-xl btn-gold-copper font-extrabold text-sm flex items-center justify-center shrink-0">
                  JIN
                </div>
              )}
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-extrabold text-white truncate">
                  {settings.showroom.showroomName}
                </div>
                <div className="text-xs text-slate-300 truncate mt-0.5">
                  {settings.showroom.branchName}
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right shrink-0">
              <div className="text-xs text-slate-400">รุ่นที่กำลังคำนวณ</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {calc.trim.modelName} ·{' '}
                <span className="text-amber-300">{calc.trim.trimName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Model & Trim Selection */}
        <section className={`${CARD_SURFACE} p-5 sm:p-7`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <span className={STEP_BADGE}>1</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-950">
                  เลือกรุ่นรถและรุ่นย่อย
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กดเลือกรุ่นย่อยเพื่อคำนวณราคา ตารางดอกเบี้ย และสิทธิประโยชน์อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl self-start">
              {(['ALL', 'DEEPAL', 'CHANGAN'] as const).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setBrandFilter(brand)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    brandFilter === brand
                      ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {brand === 'ALL' ? 'ทุกรุ่น' : brand}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modelGroups.map((group) => {
              const first = group[0];
              const isDeepal = first.brand === 'DEEPAL';
              return (
                <div
                  key={first.modelId}
                  className="border border-slate-200/80 rounded-xl p-4 bg-gradient-to-b from-slate-50/90 to-white shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-950">
                      {first.modelName}
                    </span>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        isDeepal ? 'text-sky-700' : 'text-amber-700'
                      }`}
                    >
                      {first.brand} · {first.powertrain}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.map((trim) => {
                      const isSelected = trim.id === calc.trim.id;
                      const hasSpecial = trim.specialPrice < trim.normalPrice;
                      return (
                        <button
                          key={trim.id}
                          type="button"
                          onClick={() => onSelectTrim(trim)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'btn-midnight border-amber-400 ring-2 ring-amber-400/40'
                              : 'bg-gradient-to-b from-white to-slate-50/70 text-slate-800 border-slate-200 hover:border-amber-400 hover:shadow-xs'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {trim.trimName}
                            </div>
                            {hasSpecial && (
                              <div className="text-[11px] line-through font-mono-num text-slate-400">
                                ปกติ {formatTHB(trim.normalPrice)} บ.
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className={`text-sm font-bold font-mono-num ${
                                isSelected ? 'text-amber-400' : 'text-slate-950'
                              }`}
                            >
                              {formatTHB(trim.specialPrice)} บ.
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Pricing, Discounts & Subsidy VAT 7% */}
        <section className={`${CARD_SURFACE} p-5 sm:p-7 space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <span className={STEP_BADGE}>2</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-950">
                  ราคา ส่วนลด และ VAT 7% (กรณีซับดาวน์)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {calc.trim.modelName} ({calc.trim.trimName})
                </p>
              </div>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() =>
                  onUpdateState((p) => ({ ...p, includeVat: true }))
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  state.includeVat
                    ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เก็บ VAT 7% ซับดาวน์
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateState((p) => ({ ...p, includeVat: false }))
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  !state.includeVat
                    ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ไม่เก็บ VAT 7%
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 px-4 sm:px-5 bg-gradient-to-r from-amber-50/70 via-amber-50/40 to-white rounded-xl border border-amber-200/70">
            <div>
              <div className="text-xs text-slate-600">ราคาปกติ</div>
              <div
                className={`text-base sm:text-lg font-bold font-mono-num mt-0.5 ${
                  calc.netCarPrice !== calc.normalPrice
                    ? 'text-slate-400 line-through'
                    : 'text-slate-950'
                }`}
              >
                {formatTHB(calc.normalPrice)} บาท
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600">ราคาพิเศษสุทธิ</div>
              <div className="text-lg sm:text-xl font-extrabold font-mono-num text-slate-950 mt-0.5">
                {formatTHB(calc.netCarPrice)} บาท
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-600">
                ค่า VAT 7% (กรณีซับดาวน์)
              </div>
              <div className="text-base sm:text-lg font-bold font-mono-num text-amber-700 mt-0.5">
                {state.includeVat
                  ? `${formatTHB(calc.subsidyVatAmount)} บาท`
                  : '0 บาท (ไม่เก็บ)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ส่วนลดราคาตัวรถ (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={state.vehicleDiscount}
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    vehicleDiscount: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-slate-900"
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {DISCOUNT_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, vehicleDiscount: amt }))
                    }
                    className={`px-2.5 py-1 text-xs font-mono-num rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      state.vehicleDiscount === amt
                        ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 border-slate-950 shadow-xs'
                        : 'bg-gradient-to-b from-white to-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {amt === 0 ? 'ไม่มีส่วนลด' : `-${formatTHB(amt)}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ส่วนลดเพิ่มเป็นเงินดาวน์ / ซับดาวน์ (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={state.downPaymentSubsidy}
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    downPaymentSubsidy: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-slate-900"
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SUBSIDY_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, downPaymentSubsidy: amt }))
                    }
                    className={`px-2.5 py-1 text-xs font-mono-num rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      state.downPaymentSubsidy === amt
                        ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 border-slate-950 shadow-xs'
                        : 'bg-gradient-to-b from-white to-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {amt === 0 ? '0 บ.' : `${formatTHB(amt)}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Down Payment, Tenor & Interest Rate */}
        <section className={`${CARD_SURFACE} p-5 sm:p-7 space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <span className={STEP_BADGE}>3</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-950">
                  เงินดาวน์ ระยะเวลาผ่อน และดอกเบี้ย
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตารางดอกเบี้ย: {calc.trim.rateTable === 'lumin' ? 'Lumin L DC' : 'มาตรฐานปกติ'}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() =>
                  onUpdateState((p) => ({ ...p, downMode: 'percent' }))
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  state.downMode === 'percent'
                    ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เลือกเป็น %
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateState((p) => ({
                    ...p,
                    downMode: 'amount',
                    downAmountInput: calc.downPaymentGross,
                  }))
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  state.downMode === 'amount'
                    ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กำหนดเป็นบาท
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">
                สัดส่วนเงินดาวน์
              </span>
              <span className="text-xs font-mono-num font-semibold text-sky-700">
                คิดเป็น {calc.downPercentActual.toFixed(1)}% ({formatTHB(calc.downPaymentGross)} บาท)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {DOWN_PERCENT_TIERS.map((tier) => {
                const isLuminBlocked =
                  calc.trim.rateTable === 'lumin' && tier === 5;
                const isActive =
                  state.downMode === 'percent' &&
                  state.downPercentInput === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({
                        ...p,
                        downMode: 'percent',
                        downPercentInput: tier,
                      }))
                    }
                    className={`py-2.5 px-2 rounded-xl border text-sm font-bold font-mono-num transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                        : isLuminBlocked
                        ? 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                        : 'bg-gradient-to-b from-white to-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {tier}%{tier === 5 ? '**' : ''}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {state.downMode === 'percent'
                    ? 'กำหนด % ดาวน์เอง'
                    : 'กำหนดเงินดาวน์เอง (บาท)'}
                </label>
                {state.downMode === 'percent' ? (
                  <input
                    type="number"
                    min={0}
                    max={95}
                    step={1}
                    value={state.downPercentInput}
                    onChange={(e) =>
                      onUpdateState((p) => ({
                        ...p,
                        downMode: 'percent',
                        downPercentInput: Math.min(
                          95,
                          Math.max(0, Number(e.target.value) || 0)
                        ),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={state.downAmountInput}
                    onChange={(e) =>
                      onUpdateState((p) => ({
                        ...p,
                        downMode: 'amount',
                        downAmountInput: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ยอดจัดไฟแนนซ์ (คำนวณอัตโนมัติ)
                </label>
                <div className="px-3.5 py-2.5 text-sm font-bold font-mono-num bg-gradient-to-r from-sky-50 to-white border border-sky-200 rounded-xl text-slate-950">
                  {formatTHB(calc.financeAmount)} บาท
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-800">
              ระยะเวลาผ่อนชำระ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {TENOR_OPTIONS.map((opt) => {
                const rateForCell =
                  calc.tierMatched !== null
                    ? activeMatrix[calc.tierMatched][opt.months]
                    : null;
                const unavailable =
                  calc.trim.rateTable === 'lumin' && opt.months === 36;
                const isSelected = state.tenorMonths === opt.months;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, tenorMonths: opt.months }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                        : unavailable
                        ? 'bg-slate-50 text-slate-400 border-slate-200'
                        : 'bg-gradient-to-b from-white to-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold whitespace-nowrap">
                      {opt.months} งวด
                    </div>
                    <div
                      className={`text-[11px] flex items-center justify-between gap-1 mt-0.5 ${
                        isSelected ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      <span>({opt.years} ปี)</span>
                      <span className="font-mono-num">
                        {unavailable
                          ? 'ไม่เปิดรับ'
                          : rateForCell !== null
                          ? `${rateForCell.toFixed(2)}%`
                          : '-'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  อัตราดอกเบี้ยต่อปี (%)
                </label>
                {state.customInterestRate !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, customInterestRate: null }))
                    }
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    ใช้ค่าตามตาราง
                  </button>
                )}
              </div>

              <input
                type="number"
                min={0}
                max={25}
                step={0.01}
                value={
                  state.customInterestRate !== null
                    ? state.customInterestRate
                    : calc.tableRate ?? ''
                }
                placeholder="ระบุอัตราดอกเบี้ย"
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateState((p) => ({
                    ...p,
                    customInterestRate:
                      val === '' ? null : Math.max(0, Number(val) || 0),
                  }));
                }}
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              {calc.isRateUnavailable ? (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  เงื่อนไขนี้ไม่เปิดรับในตารางมาตรฐาน กรุณาเปลี่ยนงวด/เงินดาวน์ หรือกรอกอัตราดอกเบี้ยเอง
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500 font-mono-num">
                  ดอกเบี้ยสุทธิที่ใช้คำนวณ: {calc.effectiveInterestRate.toFixed(2)}% ต่อปี
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-white border border-emerald-200/80 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  ชำระงวดแรกวันที่รับรถ
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  รับส่วนลดดอกเบี้ย -{settings.earlyPaymentDiscount.toFixed(2)}%
                  (บวกค่างวดแรกในยอดวันรับรถ)
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.payFirstInstallmentOnDelivery}
                onClick={() =>
                  onUpdateState((p) => ({
                    ...p,
                    payFirstInstallmentOnDelivery:
                      !p.payFirstInstallmentOnDelivery,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  state.payFirstInstallmentOnDelivery
                    ? 'bg-emerald-600'
                    : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.payFirstInstallmentOnDelivery
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 4. Delivery Day Expenses + Booking Deposit + 4 Blank Custom Items */}
        <section className={`${CARD_SURFACE} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
            <span className={STEP_BADGE}>4</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950">
                ยอดชำระวันรับรถ เงินจอง และรายการอื่นๆ เพิ่มเติม
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ค่าจองจะถูกหักออกจากยอดชำระวันรับรถอัตโนมัติ และกรอกรายการเพิ่มเติมได้ 4 ช่อง
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เงินจองหักวันรับรถ (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={state.bookingDeposit}
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    bookingDeposit: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {BOOKING_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, bookingDeposit: amt }))
                    }
                    className={`px-2 py-0.5 text-[11px] font-mono-num rounded-md border cursor-pointer transition-all ${
                      state.bookingDeposit === amt
                        ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 border-slate-950'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {formatTHB(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ค่ามัดจำป้ายแดง (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={state.redPlateDeposit}
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    redPlateDeposit: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ค่าจดทะเบียน (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={state.registrationFee}
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    registrationFee: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">
              รายการอื่นๆ เพิ่มเติม (คิดรวมวันรับรถ 4 ช่อง)
            </div>
            {state.customDeliveryItems.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2.5 items-center"
              >
                <div className="col-span-7 sm:col-span-8">
                  <input
                    type="text"
                    value={item.label}
                    placeholder={`รายการเพิ่มเติมช่องที่ ${idx + 1}`}
                    onChange={(e) =>
                      updateCustomItem(
                        idx as 0 | 1 | 2 | 3,
                        'label',
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="col-span-5 sm:col-span-4">
                  <input
                    type="number"
                    min={0}
                    value={item.amount}
                    placeholder="จำนวนเงิน (บาท)"
                    onChange={(e) =>
                      updateCustomItem(
                        idx as 0 | 1 | 2 | 3,
                        'amount',
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono-num text-right border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Customer Info, Freebies, Promotions & Inline Editable Benefits */}
        <section className={`${CARD_SURFACE} p-5 sm:p-7 space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <span className={STEP_BADGE}>5</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-950">
                  ข้อมูลลูกค้า ของแถม โปรโมชั่น และสิทธิประโยชน์
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กรอกชื่อลูกค้า ของแถม โปรโมชั่น และแก้ไขสิทธิประโยชน์เฉพาะใบเสนอราคานี้ได้ทันที
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInlineBenefitsEditor((v) => !v)}
              className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-200/80 via-amber-100 to-amber-200/80 hover:from-amber-300/80 hover:to-amber-200 text-amber-950 rounded-xl inline-flex items-center gap-1.5 self-start whitespace-nowrap shadow-2xs transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {showInlineBenefitsEditor
                ? 'ซ่อนช่องแก้ไขสิทธิประโยชน์'
                : 'แก้ไขสิทธิประโยชน์'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อลูกค้า (แสดงในใบเสนอราคาและ LINE)
              </label>
              <input
                type="text"
                value={state.customerName}
                placeholder="เช่น สมชาย ใจดี"
                onChange={(e) =>
                  onUpdateState((p) => ({ ...p, customerName: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรลูกค้า
              </label>
              <input
                type="tel"
                value={state.customerPhone}
                placeholder="08X-XXX-XXXX"
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    customerPhone: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {showInlineBenefitsEditor && (
            <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-50/50 to-white border border-amber-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  แก้ไขสิทธิประโยชน์ ({calc.trim.packageTitle})
                </div>
                {state.benefitsOverride && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateState((p) => ({ ...p, benefitsOverride: null }))
                    }
                    className="text-xs text-amber-700 hover:text-amber-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    คืนค่าตามรุ่น
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ประกันภัยชั้น 1 และ พ.ร.บ.
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.insuranceAndAct}
                    onChange={(e) =>
                      updateBenefitField('insuranceAndAct', e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    โฮมชาร์จเจอร์
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.homeCharger}
                    onChange={(e) =>
                      updateBenefitField('homeCharger', e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    รับประกันตัวรถ
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.vehicleWarranty}
                    onChange={(e) =>
                      updateBenefitField('vehicleWarranty', e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    รับประกันแบตเตอรี่
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.batteryWarranty}
                    onChange={(e) =>
                      updateBenefitField('batteryWarranty', e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lifetime Battery Warranty
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.lifetimeBatteryWarranty}
                    onChange={(e) =>
                      updateBenefitField(
                        'lifetimeBatteryWarranty',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    บริการช่วยเหลือฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={calc.activeBenefits.roadsideAssistance}
                    onChange={(e) =>
                      updateBenefitField('roadsideAssistance', e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    สิทธิประโยชน์เพิ่มเติม
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateBenefitField('extraItems', [
                        ...calc.activeBenefits.extraItems,
                        '',
                      ])
                    }
                    className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่มข้อ
                  </button>
                </div>
                {calc.activeBenefits.extraItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      placeholder="ระบุสิทธิประโยชน์เพิ่มเติม"
                      onChange={(e) => {
                        const next = [...calc.activeBenefits.extraItems];
                        next[idx] = e.target.value;
                        updateBenefitField('extraItems', next);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = calc.activeBenefits.extraItems.filter(
                          (_, i) => i !== idx
                        );
                        updateBenefitField('extraItems', next);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              เลือกรายการของแถมเพิ่มเติม
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {settings.freebiePresets.map((freebie) => {
                const checked = state.selectedFreebieIds.includes(freebie.id);
                return (
                  <button
                    key={freebie.id}
                    type="button"
                    onClick={() => toggleFreebie(freebie.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${
                      checked
                        ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-white border-slate-950 shadow-xs'
                        : 'bg-gradient-to-b from-white to-slate-50/70 text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-amber-400 text-slate-950'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="truncate">{freebie.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ของแถมเพิ่มเติม (พิมพ์เอง)
              </label>
              <input
                type="text"
                value={state.customFreebieNote}
                placeholder="เช่น ฟิล์ม Lamina Mystery, คูปองชาร์จไฟ..."
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    customFreebieNote: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                โปรโมชั่นพิเศษ (พิมพ์เอง)
              </label>
              <input
                type="text"
                value={state.promotionNote}
                placeholder="เช่น ดอกเบี้ยพิเศษ 0%, ฟรีค่าบำรุงรักษา..."
                onChange={(e) =>
                  onUpdateState((p) => ({
                    ...p,
                    promotionNote: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุใบเสนอราคา
            </label>
            <input
              type="text"
              value={state.quoteNote}
              placeholder="เช่น เงื่อนไขเป็นไปตามที่บริษัทฯ และไฟแนนซ์กำหนด"
              onChange={(e) =>
                onUpdateState((p) => ({ ...p, quoteNote: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </section>
      </div>

      {/* Right Column: Sticky Live Summary & Instant Export */}
      <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-5">
        <div className="card-midnight-hero text-white rounded-2xl overflow-hidden border border-amber-400/25">
          <div className="h-1.5 gold-copper-bar" />
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <div className="text-xs text-slate-400">
                  {state.customerName.trim()
                    ? `เสนอราคาคุณ${state.customerName.trim()}`
                    : 'รุ่นที่เลือก'}
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {calc.trim.modelName}
                </div>
                <div className="text-xs text-amber-300 font-semibold">
                  {calc.trim.trimName} · {calc.trim.packageTitle}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenFullQuote}
                className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-b from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 text-white border border-white/15 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                ดูใบเต็ม
              </button>
            </div>

            <div className="py-5 border-b border-white/10">
              <div className="text-xs text-slate-300">
                ค่างวดรายเดือน ({calc.tenorMonths} งวด / {calc.tenorYears} ปี)
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono-num text-amber-300 mt-1">
                {calc.isRateUnavailable
                  ? 'ไม่เปิดรับ'
                  : `${formatTHB(calc.monthlyInstallment)}`}
                {!calc.isRateUnavailable && (
                  <span className="text-sm font-medium text-slate-300 ml-1.5">
                    บาท/เดือน
                  </span>
                )}
              </div>
              <div className="text-xs font-mono-num text-slate-400 mt-1.5">
                อัตราดอกเบี้ยสุทธิ: {formatRate(calc.effectiveInterestRate)} ต่อปี
                {state.payFirstInstallmentOnDelivery &&
                  ` (ลด -${settings.earlyPaymentDiscount.toFixed(2)}%)`}
              </div>
            </div>

            <dl className="py-4 space-y-2 text-xs sm:text-sm border-b border-white/10">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">ราคารถ</dt>
                <dd className="font-mono-num font-semibold text-white">
                  {formatTHB(calc.netCarPrice)} บ.
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">
                  เงินดาวน์ ({calc.downPercentActual.toFixed(1)}%)
                </dt>
                <dd className="font-mono-num text-slate-200">
                  {formatTHB(calc.downPaymentGross)} บ.
                </dd>
              </div>
              {calc.downPaymentSubsidy > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">หักส่วนลดเงินดาวน์</dt>
                  <dd className="font-mono-num text-emerald-400">
                    -{formatTHB(calc.downPaymentSubsidy)} บ.
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">เงินดาวน์คงเหลือ</dt>
                <dd className="font-mono-num font-semibold text-white">
                  {formatTHB(calc.netDownPayment)} บ.
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">ยอดจัดไฟแนนซ์</dt>
                <dd className="font-mono-num font-semibold text-sky-300">
                  {formatTHB(calc.financeAmount)} บ.
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">ดอกเบี้ยทั้งหมด</dt>
                <dd className="font-mono-num text-slate-300">
                  {formatTHBDecimal(calc.totalInterest)} บ.
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">ยอดชำระรวม</dt>
                <dd className="font-mono-num text-slate-300">
                  {formatTHBDecimal(calc.totalPayable)} บ.
                </dd>
              </div>
            </dl>

            <div className="py-4 border-b border-white/10">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-slate-200">
                  ยอดชำระวันรับรถสุทธิ
                </span>
                <span className="text-xl font-extrabold font-mono-num text-emerald-400">
                  {formatTHB(calc.totalDeliveryCashDue)} บาท
                </span>
              </div>
              <div className="mt-2.5 space-y-1 text-xs text-slate-400 font-mono-num">
                <div className="flex justify-between">
                  <span>เงินดาวน์คงเหลือ</span>
                  <span>{formatTHB(calc.netDownPayment)} บ.</span>
                </div>
                {calc.downPaymentSubsidy > 0 && (
                  <div className="flex justify-between">
                    <span>ค่า VAT 7% (กรณีซับดาวน์)</span>
                    <span>
                      {calc.includeVat
                        ? `${formatTHB(calc.subsidyVatAmount)} บ.`
                        : '0 บ.'}
                    </span>
                  </div>
                )}
                {calc.registrationFee > 0 && (
                  <div className="flex justify-between">
                    <span>ค่าจดทะเบียน</span>
                    <span>{formatTHB(calc.registrationFee)} บ.</span>
                  </div>
                )}
                {calc.redPlateDeposit > 0 && (
                  <div className="flex justify-between">
                    <span>ค่ามัดจำป้ายแดง</span>
                    <span>{formatTHB(calc.redPlateDeposit)} บ.</span>
                  </div>
                )}
                {calc.firstInstallmentDueOnDelivery > 0 && (
                  <div className="flex justify-between">
                    <span>ค่างวดงวดแรก (วันรับรถ)</span>
                    <span>
                      {formatTHB(calc.firstInstallmentDueOnDelivery)} บ.
                    </span>
                  </div>
                )}
                {calc.customDeliveryTotal > 0 && (
                  <div className="flex justify-between">
                    <span>
                      รายการเพิ่มเติม ({calc.customDeliveryItemsParsed.length} รายการ)
                    </span>
                    <span>{formatTHB(calc.customDeliveryTotal)} บ.</span>
                  </div>
                )}
                {calc.bookingDeposit > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>หักเงินจอง</span>
                    <span>-{formatTHB(calc.bookingDeposit)} บ.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-5 space-y-2.5">
              <a
                href={lineShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#06C755] via-[#05b84d] to-[#049e42] hover:from-[#07d65c] hover:to-[#05b34c] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-md shadow-emerald-600/25"
              >
                <Send className="w-4 h-4" />
                ส่งข้อความผ่าน LINE
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={onExportImage}
                  className="btn-gold-copper py-2.5 px-3 disabled:opacity-60 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  บันทึกรูปภาพ
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={onExportPdf}
                  className="py-2.5 px-3 bg-gradient-to-b from-white to-slate-100 hover:from-slate-50 hover:to-slate-200 disabled:opacity-60 text-[#0c1733] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  สร้างไฟล์ PDF
                </button>
              </div>

              <button
                type="button"
                onClick={onCopyText}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-white/15 to-white/5 hover:from-white/20 hover:to-white/10 text-slate-100 border border-white/15 font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
              >
                <Copy className="w-4 h-4 text-amber-300" />
                คัดลอกข้อความเสนอราคา
              </button>
            </div>
          </div>
        </div>

        <div className={`${CARD_SURFACE} p-5`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900">
              สิทธิประโยชน์ {calc.trim.packageTitle}
            </div>
            <button
              type="button"
              onClick={onOpenBenefitsPage}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
            >
              แก้ไขทั้งหมด
            </button>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
            <li>• {calc.activeBenefits.insuranceAndAct}</li>
            <li>• {calc.activeBenefits.homeCharger}</li>
            <li>• {calc.activeBenefits.vehicleWarranty}</li>
            <li>• {calc.activeBenefits.lifetimeBatteryWarranty}</li>
            <li>• {calc.activeBenefits.roadsideAssistance}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
