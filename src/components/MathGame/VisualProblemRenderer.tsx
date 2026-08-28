import React from 'react';
import { Volume2, Sparkles, MapPin, Palette } from 'lucide-react';
import { VisualProblemData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { speakWord } from '../../utils/subjectEngines';

interface VisualProblemRendererProps {
  visual?: VisualProblemData;
}

export const VisualProblemRenderer: React.FC<VisualProblemRendererProps> = ({ visual }) => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  if (!visual) return null;

  switch (visual.type) {
    case 'audio_phrase': {
      const handleSpeak = () => {
        if (visual.pronounceText) {
          speakWord(visual.pronounceText, visual.pronounceLang || 'en-US');
        }
      };

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-950/80 border border-violet-500/40 rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-4">
            <div className="text-4xl sm:text-5xl animate-bounce">
              {visual.symbol || '🗣️'}
            </div>
            {visual.pronounceText && (
              <button
                type="button"
                onClick={handleSpeak}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isGerman ? 'Aussprache anhören' : 'Listen to Audio'}</span>
              </button>
            )}
          </div>
          {visual.audioHint && (
            <span className="text-xs text-violet-300 font-mono font-semibold">
              {visual.audioHint}
            </span>
          )}
        </div>
      );
    }

    case 'flag': {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950/80 border border-cyan-500/40 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="text-5xl sm:text-6xl drop-shadow-md">
            {visual.flagEmoji || '🏳️'}
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {isGerman ? 'Nationalflagge' : 'National Flag'}
          </span>
        </div>
      );
    }

    case 'landmark': {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950/80 border border-amber-500/40 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <div className="text-5xl sm:text-6xl">
            {visual.symbol || '🏛️'}
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{isGerman ? 'Welt-Sehenswürdigkeit' : 'World Landmark'}</span>
          </span>
        </div>
      );
    }

    case 'color_palette': {
      return (
        <div className="flex items-center justify-center gap-4 p-4 bg-slate-950/80 border border-fuchsia-500/40 rounded-2xl shadow-[0_0_25px_rgba(217,70,239,0.15)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl shadow-md border border-white/20"
              style={{ backgroundColor: visual.secondaryHex || '#eab308' }}
            />
            <span className="text-lg font-bold text-white">+</span>
            <div
              className="w-10 h-10 rounded-xl shadow-md border border-white/20"
              style={{ backgroundColor: '#3b82f6' }}
            />
            <span className="text-lg font-bold text-white">=</span>
            <div
              className="w-12 h-12 rounded-xl shadow-lg border-2 border-dashed border-white/40 flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: visual.colorHex || '#22c55e' }}
            >
              ?
            </div>
          </div>
        </div>
      );
    }

    case 'science_badge': {
      return (
        <div className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-slate-950/80 border border-emerald-500/40 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <div className="text-4xl sm:text-5xl">
            {visual.symbol || '🔬'}
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-300">
            {isGerman ? 'Forschungs-Objekt' : 'Research Subject'}
          </span>
        </div>
      );
    }

    case 'blocks': {
      const countA = visual.countA || 0;
      const countB = visual.countB || 0;
      const symbol = visual.symbol || '+';

      return (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
          {/* Group A Blocks */}
          <div className="flex flex-wrap gap-1.5 max-w-[160px] justify-center">
            {Array.from({ length: Math.min(countA, 25) }).map((_, idx) => (
              <div
                key={`a-${idx}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center justify-center text-[10px] text-white font-mono font-bold animate-in fade-in zoom-in-75 duration-200"
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Operation Symbol */}
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-cyan-300 font-mono font-extrabold text-lg flex items-center justify-center border border-blue-500/40">
            {symbol}
          </div>

          {/* Group B Blocks */}
          <div className="flex flex-wrap gap-1.5 max-w-[160px] justify-center">
            {Array.from({ length: Math.min(countB, 25) }).map((_, idx) => (
              <div
                key={`b-${idx}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-linear-to-br from-pink-500 to-rose-600 border border-pink-400 shadow-[0_0_10px_rgba(244,63,94,0.3)] flex items-center justify-center text-[10px] text-white font-mono font-bold animate-in fade-in zoom-in-75 duration-200"
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'grid': {
      const rows = visual.countA || 2;
      const cols = visual.countB || 2;

      return (
        <div className="flex flex-col items-center justify-center gap-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
          <p className="text-xs font-mono font-bold text-slate-400">
            {isGerman ? `${rows} Zeilen × ${cols} Spalten Matrix` : `${rows} Rows × ${cols} Columns Matrix`}
          </p>
          <div
            className="grid gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: rows * cols }).map((_, idx) => (
              <div
                key={`grid-${idx}`}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 border border-emerald-400 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              >
                ★
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'pie': {
      const [num, denom] = visual.fractionA || [1, 4];
      const radius = 42;
      const center = 50;

      // Generate SVG pie slices
      const slices = Array.from({ length: denom }).map((_, idx) => {
        const startAngle = (idx * 2 * Math.PI) / denom - Math.PI / 2;
        const endAngle = ((idx + 1) * 2 * Math.PI) / denom - Math.PI / 2;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        const isFilled = idx < num;

        return (
          <path
            key={`slice-${idx}`}
            d={pathData}
            fill={isFilled ? '#38bdf8' : '#1e293b'}
            stroke="#475569"
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
        );
      });

      return (
        <div className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
          <div className="w-28 h-28 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              {slices}
            </svg>
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300">
            {isGerman
              ? `${num} von ${denom} Sektoren farbig markiert`
              : `${num} shaded out of ${denom} total sectors`}
          </div>
        </div>
      );
    }

    case 'comparison': {
      const a = visual.countA || 0;
      const b = visual.countB || 0;

      return (
        <div className="flex items-center justify-center gap-6 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-white font-mono font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/50">
              {a}
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">
              {isGerman ? 'Linke Zahl' : 'Left Node'}
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-mono font-black text-2xl flex items-center justify-center border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-bounce">
            ?
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-600 to-pink-700 text-white font-mono font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-400/50">
              {b}
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">
              {isGerman ? 'Rechte Zahl' : 'Right Node'}
            </span>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
