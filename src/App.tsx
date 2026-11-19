import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, FileText, Printer, Send } from 'lucide-react';
import { BenefitsView } from './components/BenefitsView';
import { CalculatorView } from './components/CalculatorView';
import { QuotationSheet } from './components/QuotationSheet';
import { SettingsView } from './components/SettingsView';
import {
  createInitialQuoteState,
  DEFAULT_SETTINGS,
} from './data/defaultCatalog';
import {
  BenefitCategories,
  DealerSettings,
  QuoteState,
  VehicleTrim,
} from './types/dealer';
import {
  exportQuotationAsImage,
  exportQuotationAsPdf,
} from './utils/exportQuote';
import {
  buildLineShareText,
  calculateQuote,
  getLineShareUrl,
} from './utils/finance';

type AppView = 'calculator' | 'benefits' | 'quotation' | 'settings';

const SETTINGS_STORAGE_KEY = 'jin_motor_dealer_settings_v2';

function loadSavedSettings(): DealerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DealerSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      showroom: { ...DEFAULT_SETTINGS.showroom, ...(parsed.showroom || {}) },
      deliveryDefaults: {
        ...DEFAULT_SETTINGS.deliveryDefaults,
        ...(parsed.deliveryDefaults || {}),
      },
      rateMatrices: {
        standard: {
          ...DEFAULT_SETTINGS.rateMatrices.standard,
          ...(parsed.rateMatrices?.standard || {}),
        },
        lumin: {
          ...DEFAULT_SETTINGS.rateMatrices.lumin,
          ...(parsed.rateMatrices?.lumin || {}),
        },
      },
      trims:
        Array.isArray(parsed.trims) && parsed.trims.length > 0
          ? parsed.trims
          : DEFAULT_SETTINGS.trims,
      freebiePresets:
        Array.isArray(parsed.freebiePresets) && parsed.freebiePresets.length > 0
          ? parsed.freebiePresets
          : DEFAULT_SETTINGS.freebiePresets,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [settings, setSettings] = useState<DealerSettings>(() =>
    loadSavedSettings()
  );
  const [quoteState, setQuoteState] = useState<QuoteState>(() =>
    createInitialQuoteState(loadSavedSettings())
  );
  const [activeView, setActiveView] = useState<AppView>('calculator');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportSheetRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const calc = useMemo(
    () => calculateQuote(settings, quoteState),
    [settings, quoteState]
  );

  const lineShareText = useMemo(
    () => buildLineShareText(settings, quoteState, calc),
    [settings, quoteState, calc]
  );

  const lineShareUrl = useMemo(
    () => getLineShareUrl(lineShareText),
    [lineShareText]
  );

  const handleSelectTrim = (trim: VehicleTrim) => {
    setQuoteState((prev) => {
      const nextTenor =
        trim.rateTable === 'lumin' && prev.tenorMonths === 36
          ? 48
          : prev.tenorMonths;
      const nextDownPercent =
        trim.rateTable === 'lumin' &&
        prev.downMode === 'percent' &&
        prev.downPercentInput < 10
          ? 15
          : prev.downPercentInput;

      return {
        ...prev,
        selectedTrimId: trim.id,
        vehicleDiscount: trim.defaultVehicleDiscount,
        downPaymentSubsidy: trim.defaultDownSubsidy,
        tenorMonths: nextTenor,
        downPercentInput: nextDownPercent,
        customInterestRate: null,
        benefitsOverride: null,
      };
    });
  };

  const handleSaveBenefitsToModel = (
    trimId: string,
    benefits: BenefitCategories
  ) => {
    const cleanedBenefits: BenefitCategories = {
      ...benefits,
      extraItems: benefits.extraItems.map((s) => s.trim()).filter(Boolean),
    };
    setSettings((prev) => ({
      ...prev,
      trims: prev.trims.map((t) =>
        t.id === trimId ? { ...t, benefits: cleanedBenefits } : t
      ),
    }));
    setQuoteState((prev) => ({
      ...prev,
      benefitsOverride: null,
    }));
    showToast('บันทึกสิทธิประโยชน์เป็นค่าเริ่มต้นของรุ่นนี้เรียบร้อยแล้ว');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(lineShareText);
      showToast('คัดลอกข้อความใบเสนอราคาเรียบร้อยแล้ว');
    } catch {
      showToast('ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExportImage = async () => {
    if (!exportSheetRef.current) return;
    setIsExporting(true);
    try {
      const safeName = `${settings.showroom.showroomName}_${calc.trim.modelName}_${calc.trim.trimName}`
        .replace(/\s+/g, '_')
        .replace(/[^\w\u0E00-\u0E7F-]/g, '');
      await exportQuotationAsImage(exportSheetRef.current, safeName);
      showToast('บันทึกใบเสนอราคาเป็นรูปภาพเรียบร้อยแล้ว');
    } catch {
      showToast('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!exportSheetRef.current) return;
    setIsExporting(true);
    try {
      const safeName = `${settings.showroom.showroomName}_${calc.trim.modelName}_${calc.trim.trimName}`
        .replace(/\s+/g, '_')
        .replace(/[^\w\u0E00-\u0E7F-]/g, '');
      await exportQuotationAsPdf(exportSheetRef.current, safeName);
      showToast('สร้างไฟล์ PDF ใบเสนอราคาเรียบร้อยแล้ว');
    } catch {
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setQuoteState(createInitialQuoteState(DEFAULT_SETTINGS));
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    showToast('คืนค่าข้อมูลเริ่มต้นทั้งหมดเรียบร้อยแล้ว');
  };

  const navItems: { id: AppView; label: string }[] = [
    { id: 'calculator', label: 'คำนวณราคา' },
    { id: 'benefits', label: 'สิทธิประโยชน์' },
    { id: 'quotation', label: 'ใบเสนอราคา' },
    { id: 'settings', label: 'ตั้งค่า' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-midnight-canvas text-slate-900">
      {/* Top Bar Contract: Midnight Navy Gradient Header with Gold/Copper Accent */}
      <header className="no-print sticky top-0 z-30 header-midnight border-b border-amber-400/25">
        <div className="h-1 gold-copper-bar" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('calculator')}
            className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            {settings.showroom.showroomName || 'JIN MOTOR'}
          </button>

          {/* Zone 2: 4 single-line nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-amber-300 font-bold border-amber-400'
                      : 'text-slate-300 hover:text-white border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <a
              href={lineShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-copper px-4 py-2 text-xs sm:text-sm font-bold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              ส่ง LINE
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Non-Sticky Navigation Strip */}
      <div className="no-print md:hidden bg-[#0c1733] border-b border-slate-800 px-3 py-2.5">
        <div className="grid grid-cols-4 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap truncate cursor-pointer ${
                  isActive
                    ? 'btn-gold-copper font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-9">
        {activeView === 'calculator' && (
          <CalculatorView
            settings={settings}
            state={quoteState}
            calc={calc}
            onUpdateState={setQuoteState}
            onSelectTrim={handleSelectTrim}
            onOpenFullQuote={() => setActiveView('quotation')}
            onOpenBenefitsPage={() => setActiveView('benefits')}
            onExportImage={handleExportImage}
            onExportPdf={handleExportPdf}
            onCopyText={handleCopyText}
            isExporting={isExporting}
          />
        )}

        {activeView === 'benefits' && (
          <BenefitsView
            settings={settings}
            state={quoteState}
            calc={calc}
            onUpdateState={setQuoteState}
            onSelectTrim={handleSelectTrim}
            onSaveBenefitsToModel={handleSaveBenefitsToModel}
            onGoToCalculator={() => setActiveView('calculator')}
          />
        )}

        {activeView === 'quotation' && (
          <div className="space-y-6">
            {/* Export Toolbar */}
            <div className="no-print max-w-[820px] mx-auto card-premium rounded-2xl overflow-hidden">
              <div className="h-1 gold-copper-bar" />
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-[#0c1733]">
                    ใบเสนอราคาลูกค้า ({calc.trim.modelName})
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ส่งออกเป็นรูปภาพ, PDF, คัดลอกข้อความ หรือส่งผ่าน LINE ได้ทันที
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={lineShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#06C755] to-[#049e42] hover:from-[#07d65c] hover:to-[#05b84d] text-white rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-600/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    ส่ง LINE
                  </a>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportImage}
                    className="btn-gold-copper px-4 py-2 text-xs font-bold disabled:opacity-60 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    บันทึกรูปภาพ
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportPdf}
                    className="btn-midnight px-4 py-2 text-xs font-semibold disabled:opacity-60 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    สร้างไฟล์ PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-b from-white to-slate-100 hover:to-slate-200 text-slate-800 border border-slate-200 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    คัดลอกข้อความ
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-b from-white to-slate-100 hover:to-slate-200 text-slate-800 border border-slate-200 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    พิมพ์
                  </button>
                </div>
              </div>
            </div>

            <QuotationSheet
              settings={settings}
              state={quoteState}
              calc={calc}
            />
          </div>
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetDefaults={handleResetDefaults}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Dedicated Fixed-800px Export Sheet */}
      <div
        aria-hidden="true"
        className="no-print fixed left-0 top-0 w-0 h-0 overflow-hidden pointer-events-none -z-50"
      >
        <div className="w-[800px]">
          <QuotationSheet
            forExport
            sheetRef={exportSheetRef}
            settings={settings}
            state={quoteState}
            calc={calc}
          />
        </div>
      </div>

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 card-midnight-hero text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl border border-amber-400/40"
        >
          {toastMessage}
        </div>
      )}

      <footer className="no-print bg-[#070d1f] text-slate-300 border-t border-amber-400/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-amber-300">
              {settings.showroom.showroomName}
            </span>{' '}
            · {settings.showroom.branchName}
          </div>
          <div className="font-mono-num text-slate-400">
            {settings.showroom.salesName} · {settings.showroom.salesPhone}
          </div>
        </div>
      </footer>
    </div>
  );
}
