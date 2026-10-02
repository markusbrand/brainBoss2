import React from 'react';
import {
  Globe,
  CheckCircle2,
  X,
  Compass,
  RotateCcw,
  Sparkles,
  Check,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundFx } from '../../utils/audio';

interface LocalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalizationModal: React.FC<LocalizationModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    unitSystem,
    localizationMode,
    detectedBrowserLanguage,
    detectedBrowserUnitSystem,
    browserLocale,
    setLanguage,
    setUnitSystem,
    setAutodetect,
    t,
    isGerman,
    formatDistance,
    formatWeight,
    formatTemperature,
  } = useLanguage();

  if (!isOpen) return null;

  const loc = t.localization || {
    title: isGerman ? 'Sprache & Maßeinheiten' : 'Language & Measurement Units',
    subtitle: isGerman
      ? 'Automatisch an dein System angepasst oder manuell einstellbar'
      : 'Automatically adapted to your browser settings or customizable',
    autoMode: isGerman ? 'Automatisch (Browser)' : 'Automatic (Browser)',
    manualMode: isGerman ? 'Manuell' : 'Manual',
    autodetectPrompt: isGerman ? '🌐 Automatisch vom Browser erkennen' : '🌐 Auto-detect from browser',
    languageLabel: isGerman ? 'App-Sprache' : 'App Language',
    unitsLabel: isGerman ? 'Maßeinheiten & Mess-System' : 'Measurement Units System',
    metric: isGerman ? 'Metrisch (m, km, kg, Liter, °C)' : 'Metric (m, km, kg, Liters, °C)',
    imperial: isGerman ? 'Imperial / US (ft, mi, lbs, gal, °F)' : 'Imperial / US (ft, mi, lbs, gal, °F)',
    savedNotice: isGerman
      ? 'Deine Auswahl wird auf diesem Gerät gespeichert.'
      : 'Your preference is saved on this device.',
    resetToAuto: isGerman
      ? 'Auf Browser-Erkennung zurücksetzen'
      : 'Reset to Browser Detection',
    currentDetection: isGerman ? 'Erkannte Browser-Einstellung' : 'Detected Browser Setting',
  };

  const handleSelectAuto = () => {
    soundFx.playCorrect();
    setAutodetect();
  };

  const handleSelectLanguage = (lang: 'de' | 'en') => {
    soundFx.playPop();
    setLanguage(lang);
  };

  const handleSelectUnits = (units: 'metric' | 'imperial') => {
    soundFx.playPop();
    setUnitSystem(units);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-white overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{loc.title}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    localizationMode === 'auto'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {localizationMode === 'auto' ? loc.autoMode : loc.manualMode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{loc.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Primary Choice: Auto-detect from Browser */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSelectAuto}
            className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
              localizationMode === 'auto'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span className="font-extrabold text-sm text-white">{loc.autodetectPrompt}</span>
                {localizationMode === 'auto' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isGerman ? 'Aktiv' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isGerman
                  ? `Erkennt Sprache (${detectedBrowserLanguage === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}) und Maßeinheiten (${
                      detectedBrowserUnitSystem === 'metric' ? '📏 Metrisch' : '📐 Imperial'
                    }) automatisch über den Browser (${browserLocale}).`
                  : `Automatically adapts language (${detectedBrowserLanguage === 'de' ? '🇩🇪 German' : '🇬🇧 English'}) and units (${
                      detectedBrowserUnitSystem === 'metric' ? '📏 Metric' : '📐 Imperial'
                    }) from browser (${browserLocale}).`}
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                localizationMode === 'auto'
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                  : 'border-slate-700 bg-slate-900 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>
        </div>

        {/* 2. Manual Customization Section */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGerman ? 'Individuelle Einstellungen (Manuell):' : 'Custom Preferences (Manual):'}</span>
            </span>
            {localizationMode === 'manual' && (
              <button
                type="button"
                onClick={handleSelectAuto}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold underline underline-offset-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{loc.resetToAuto}</span>
              </button>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>{loc.languageLabel}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {language === 'de' ? 'Deutsch (DE/AT/CH)' : 'English (EN)'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage('de')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  language === 'de'
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base">🇩🇪</span>
                <span>Deutsch</span>
                {language === 'de' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base">🇬🇧</span>
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Units Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>{loc.unitsLabel}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {unitSystem === 'metric' ? 'km, m, kg, °C' : 'mi, ft, lbs, °F'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectUnits('metric')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  unitSystem === 'metric'
                    ? 'bg-indigo-950/50 border-indigo-400 text-white shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>📏</span>
                    <span>{isGerman ? 'Metrisch' : 'Metric'}</span>
                  </span>
                  {unitSystem === 'metric' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400">m, km, Gramm, kg, Liter, °C</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnits('imperial')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  unitSystem === 'imperial'
                    ? 'bg-indigo-950/50 border-indigo-400 text-white shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>📐</span>
                    <span>{isGerman ? 'Imperial / US' : 'Imperial / US'}</span>
                  </span>
                  {unitSystem === 'imperial' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400">ft, mi, lbs, fl oz, °F</p>
              </button>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isGerman ? 'Vorschau in Quests:' : 'Live Preview:'}</span>
            </span>
            <div className="flex items-center gap-3 font-mono font-bold text-[11px] text-white">
              <span>{formatDistance(2500)}</span>
              <span className="opacity-40">•</span>
              <span>{formatWeight(750)}</span>
              <span className="opacity-40">•</span>
              <span>{formatTemperature(22)}</span>
            </div>
          </div>
        </div>

        {/* Footer info & OK button */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            🔒 {loc.savedNotice}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            {isGerman ? 'Fertig' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
