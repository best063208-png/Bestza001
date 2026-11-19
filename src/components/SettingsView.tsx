import React, { useState } from 'react';
import { Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import {
  DOWN_PERCENT_TIERS,
  JIN_MOTOR_LOGO_PATH,
  TENOR_OPTIONS,
} from '../data/defaultCatalog';
import {
  DealerSettings,
  RateTableType,
  VehicleTrim,
} from '../types/dealer';

interface SettingsViewProps {
  settings: DealerSettings;
  onUpdateSettings: (updater: (prev: DealerSettings) => DealerSettings) => void;
  onResetDefaults: () => void;
  onNotify: (message: string) => void;
}

type SettingsTab = 'showroom' | 'pricing' | 'rates' | 'benefits';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('showroom');
  const [rateMatrixTab, setRateMatrixTab] = useState<RateTableType>('standard');
  const [editingTrimId, setEditingTrimId] = useState<string>(
    settings.trims[0]?.id || ''
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const selectedBenefitTrim =
    settings.trims.find((t) => t.id === editingTrimId) || settings.trims[0];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings((prev) => ({
          ...prev,
          showroom: { ...prev.showroom, logoUrl: reader.result as string },
        }));
        onNotify('อัปโหลดโลโก้โชว์รูมเรียบร้อยแล้ว');
      }
    };
    reader.readAsDataURL(file);
  };

  const updateTrim = (
    trimId: string,
    patch: Partial<VehicleTrim>
  ) => {
    onUpdateSettings((prev) => ({
      ...prev,
      trims: prev.trims.map((t) => (t.id === trimId ? { ...t, ...patch } : t)),
    }));
  };

  const addNewTrim = () => {
    const newId = `custom-trim-${Date.now()}`;
    const newTrim: VehicleTrim = {
      id: newId,
      modelId: `custom-model-${Date.now()}`,
      brand: 'DEEPAL',
      modelName: 'DEEPAL รุ่นใหม่',
      trimName: 'Standard',
      powertrain: 'BEV',
      normalPrice: 999000,
      specialPrice: 999000,
      defaultVehicleDiscount: 0,
      defaultDownSubsidy: 0,
      rateTable: 'standard',
      packageTitle: 'Standard Care',
      active: true,
      benefits: {
        insuranceAndAct: 'ประกันภัยชั้น 1 ฟรี 1 ปี พร้อม พ.ร.บ.',
        homeCharger: 'ฟรี Home Charger พร้อมติดตั้ง',
        vehicleWarranty: 'รับประกันตัวรถ 5 ปี หรือ 120,000 กิโลเมตร',
        batteryWarranty: 'รับประกันแบตเตอรี่ 8 ปี หรือ 160,000 กิโลเมตร',
        lifetimeBatteryWarranty: 'รับประกันแบตเตอรี่ตลอดอายุการใช้งาน',
        roadsideAssistance: 'บริการช่วยเหลือฉุกเฉิน 24 ชั่วโมง นาน 8 ปี',
        extraItems: ['ฟรีสายชาร์จฉุกเฉิน'],
      },
    };
    onUpdateSettings((prev) => ({
      ...prev,
      trims: [...prev.trims, newTrim],
    }));
    setEditingTrimId(newId);
    onNotify('เพิ่มรุ่นรถใหม่แล้ว สามารถแก้ไขชื่อและราคาได้ทันที');
  };

  const updateRateCell = (
    matrixType: RateTableType,
    tier: (typeof DOWN_PERCENT_TIERS)[number],
    months: (typeof TENOR_OPTIONS)[number]['months'],
    rawValue: string
  ) => {
    const trimmed = rawValue.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && Number.isNaN(parsed)) return;

    onUpdateSettings((prev) => ({
      ...prev,
      rateMatrices: {
        ...prev.rateMatrices,
        [matrixType]: {
          ...prev.rateMatrices[matrixType],
          [tier]: {
            ...prev.rateMatrices[matrixType][tier],
            [months]: parsed,
          },
        },
      },
    }));
  };

  const addFreebiePreset = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      freebiePresets: [
        ...prev.freebiePresets,
        {
          id: `freebie-${Date.now()}`,
          label: 'รายการของแถมใหม่',
          defaultChecked: false,
        },
      ],
    }));
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950">
            ตั้งค่าระบบขายและใบเสนอราคา
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            แก้ไขราคา ส่วนลด อัตราดอกเบี้ย สิทธิประโยชน์ โปรโมชั่น และข้อมูลโชว์รูมได้ทันที (บันทึกอัตโนมัติ)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-gradient-to-b from-white to-slate-100 hover:to-slate-200 border border-slate-200 rounded-xl inline-flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              คืนค่าเริ่มต้น
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  setConfirmReset(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl whitespace-nowrap shadow-sm cursor-pointer"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl whitespace-nowrap cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto">
        {(
          [
            { id: 'showroom', label: 'ข้อมูลโชว์รูมและเซลส์' },
            { id: 'pricing', label: 'ราคารถและส่วนลด' },
            { id: 'rates', label: 'ตารางอัตราดอกเบี้ย' },
            { id: 'benefits', label: 'สิทธิประโยชน์และของแถม' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Showroom & Sales Advisor */}
      {activeTab === 'showroom' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 space-y-6 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-slate-100">
            <img
              src={settings.showroom.logoUrl}
              alt={settings.showroom.showroomName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-xs shrink-0"
            />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                โลโก้โชว์รูมในใบเสนอราคา
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-slate-950 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-amber-400 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  อัปโหลดโลโก้ใหม่
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings((prev) => ({
                      ...prev,
                      showroom: {
                        ...prev.showroom,
                        logoUrl: JIN_MOTOR_LOGO_PATH,
                      },
                    }));
                    onNotify('ใช้โลโก้ JIN MOTOR เริ่มต้นแล้ว');
                  }}
                  className="px-3.5 py-2 text-xs font-medium bg-gradient-to-b from-white to-slate-100 hover:to-slate-200 text-slate-700 border border-slate-200 rounded-xl cursor-pointer"
                >
                  ใช้โลโก้ JIN MOTOR
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อโชว์รูม / ดีลเลอร์
              </label>
              <input
                type="text"
                value={settings.showroom.showroomName}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, showroomName: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สาขา / คำอธิบายโชว์รูม
              </label>
              <input
                type="text"
                value={settings.showroom.branchName}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, branchName: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่โชว์รูม
              </label>
              <input
                type="text"
                value={settings.showroom.address}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, address: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อที่ปรึกษาการขาย (เซลส์)
              </label>
              <input
                type="text"
                value={settings.showroom.salesName}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, salesName: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรเซลส์
              </label>
              <input
                type="text"
                value={settings.showroom.salesPhone}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, salesPhone: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรโชว์รูม
              </label>
              <input
                type="text"
                value={settings.showroom.phone}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, phone: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE ID / Line OA
              </label>
              <input
                type="text"
                value={settings.showroom.lineId}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: { ...prev.showroom, lineId: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนวันยืนราคาในใบเสนอราคา
              </label>
              <input
                type="number"
                min={1}
                value={settings.showroom.quoteValidityDays}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showroom: {
                      ...prev.showroom,
                      quoteValidityDays: Math.max(
                        1,
                        Number(e.target.value) || 15
                      ),
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicle Prices & Discounts */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                แก้ไขราคาปกติ ราคาพิเศษ และส่วนลดเริ่มต้นของแต่ละรุ่น
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ค่าที่แก้ไขจะอัปเดตในหน้าคำนวณราคาทันที
              </p>
            </div>
            <button
              type="button"
              onClick={addNewTrim}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-1.5 self-start whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรุ่นรถใหม่
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">แบรนด์ / รุ่น</th>
                  <th className="py-3 px-4 font-semibold">รุ่นย่อย</th>
                  <th className="py-3 px-4 font-semibold">ราคาปกติ (บาท)</th>
                  <th className="py-3 px-4 font-semibold">ราคาพิเศษ (บาท)</th>
                  <th className="py-3 px-4 font-semibold">ส่วนลดตัวรถเริ่มต้น</th>
                  <th className="py-3 px-4 font-semibold">ซับดาวน์เริ่มต้น</th>
                  <th className="py-3 px-4 font-semibold text-center">เปิดขาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.trims.map((trim) => (
                  <tr key={trim.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 min-w-[170px]">
                      <input
                        type="text"
                        value={trim.modelName}
                        onChange={(e) =>
                          updateTrim(trim.id, { modelName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 min-w-[140px]">
                      <input
                        type="text"
                        value={trim.trimName}
                        onChange={(e) =>
                          updateTrim(trim.id, { trimName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 min-w-[130px]">
                      <input
                        type="number"
                        step={1000}
                        value={trim.normalPrice}
                        onChange={(e) =>
                          updateTrim(trim.id, {
                            normalPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono-num text-right border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 min-w-[130px]">
                      <input
                        type="number"
                        step={1000}
                        value={trim.specialPrice}
                        onChange={(e) =>
                          updateTrim(trim.id, {
                            specialPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono-num text-right border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 min-w-[130px]">
                      <input
                        type="number"
                        step={1000}
                        value={trim.defaultVehicleDiscount}
                        onChange={(e) =>
                          updateTrim(trim.id, {
                            defaultVehicleDiscount: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono-num text-right border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 min-w-[130px]">
                      <input
                        type="number"
                        step={1000}
                        value={trim.defaultDownSubsidy}
                        onChange={(e) =>
                          updateTrim(trim.id, {
                            defaultDownSubsidy: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono-num text-right border border-slate-200 rounded bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={trim.active}
                        onChange={(e) =>
                          updateTrim(trim.id, { active: e.target.checked })
                        }
                        className="w-4 h-4 accent-slate-950 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Interest Rate Matrices */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                แก้ไขตารางอัตราดอกเบี้ย (ปลายงวด)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เว้นว่างไว้หากต้องการตั้งค่าเป็น &quot;ไม่เปิดรับ&quot;
              </p>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setRateMatrixTab('standard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  rateMatrixTab === 'standard'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                ตารางปกติ (ทุกรุ่นยกเว้น Lumin)
              </button>
              <button
                type="button"
                onClick={() => setRateMatrixTab('lumin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  rateMatrixTab === 'lumin'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Lumin L DC
              </button>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ส่วนลดดอกเบี้ยเมื่อชำระงวดแรกวันรับรถ (%)
            </label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.01}
              value={settings.earlyPaymentDiscount}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  earlyPaymentDiscount: Math.max(
                    0,
                    Number(e.target.value) || 0
                  ),
                }))
              }
              className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">% ดาวน์</th>
                  {TENOR_OPTIONS.map((t) => (
                    <th key={t.months} className="py-3 px-3 font-semibold text-center">
                      {t.months} งวด ({t.years} ปี)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DOWN_PERCENT_TIERS.map((tier) => (
                  <tr key={tier}>
                    <td className="py-2.5 px-4 font-bold font-mono-num text-slate-900 bg-slate-50/50">
                      {tier}%{tier === 5 ? '**' : ''}
                    </td>
                    {TENOR_OPTIONS.map((t) => {
                      const val =
                        settings.rateMatrices[rateMatrixTab][tier][t.months];
                      return (
                        <td key={t.months} className="py-2 px-2">
                          <input
                            type="number"
                            step={0.01}
                            placeholder="ไม่เปิดรับ"
                            value={val === null ? '' : val}
                            onChange={(e) =>
                              updateRateCell(
                                rateMatrixTab,
                                tier,
                                t.months,
                                e.target.value
                              )
                            }
                            className="w-full min-w-[82px] px-2.5 py-1.5 text-xs font-mono-num text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Benefits, Freebies & Delivery Defaults */}
      {activeTab === 'benefits' && (
        <div className="space-y-6">
          {/* Model Benefits Editor */}
          {selectedBenefitTrim && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    แก้ไขสิทธิประโยชน์รายรุ่น
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกรุ่นรถที่ต้องการแก้ไขรายละเอียดแพ็กเกจ
                  </p>
                </div>
                <select
                  value={selectedBenefitTrim.id}
                  onChange={(e) => setEditingTrimId(e.target.value)}
                  className="px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg"
                >
                  {settings.trims.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.modelName} — {t.trimName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อแพ็กเกจ (เช่น NEVO Care / Premium Care)
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.packageTitle}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        packageTitle: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประกันภัยชั้น 1 และ พ.ร.บ.
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.insuranceAndAct}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          insuranceAndAct: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    โฮมชาร์จเจอร์
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.homeCharger}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          homeCharger: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รับประกันตัวรถ
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.vehicleWarranty}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          vehicleWarranty: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รับประกันแบตเตอรี่
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.batteryWarranty}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          batteryWarranty: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lifetime Battery Warranty
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.lifetimeBatteryWarranty}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          lifetimeBatteryWarranty: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บริการช่วยเหลือฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={selectedBenefitTrim.benefits.roadsideAssistance}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          roadsideAssistance: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สิทธิประโยชน์เพิ่มเติม (แยกบรรทัดละ 1 รายการ)
                  </label>
                  <textarea
                    rows={3}
                    value={selectedBenefitTrim.benefits.extraItems.join('\n')}
                    onChange={(e) =>
                      updateTrim(selectedBenefitTrim.id, {
                        benefits: {
                          ...selectedBenefitTrim.benefits,
                          extraItems: e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Freebies & Delivery Defaults */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-950">
                  รายการของแถมและโปรโมชั่นตัวเลือกด่วน
                </h3>
                <button
                  type="button"
                  onClick={addFreebiePreset}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรายการ
                </button>
              </div>
              <div className="space-y-2.5">
                {settings.freebiePresets.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      title="เลือกเป็นค่าเริ่มต้น"
                      checked={item.defaultChecked}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          freebiePresets: prev.freebiePresets.map((f) =>
                            f.id === item.id
                              ? { ...f, defaultChecked: e.target.checked }
                              : f
                          ),
                        }))
                      }
                      className="w-4 h-4 accent-slate-950 shrink-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          freebiePresets: prev.freebiePresets.map((f) =>
                            f.id === item.id
                              ? { ...f, label: e.target.value }
                              : f
                          ),
                        }))
                      }
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          freebiePresets: prev.freebiePresets.filter(
                            (f) => f.id !== item.id
                          ),
                        }))
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-950">
                ค่าใช้จ่ายวันรับรถเริ่มต้น
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ค่าจดทะเบียนเริ่มต้น (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.deliveryDefaults.registrationFee}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        deliveryDefaults: {
                          ...prev.deliveryDefaults,
                          registrationFee: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ค่ามัดจำป้ายแดงเริ่มต้น (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.deliveryDefaults.redPlateDeposit}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        deliveryDefaults: {
                          ...prev.deliveryDefaults,
                          redPlateDeposit: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เงินจองหักวันรับรถเริ่มต้น (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.deliveryDefaults.bookingDeposit}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        deliveryDefaults: {
                          ...prev.deliveryDefaults,
                          bookingDeposit: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
