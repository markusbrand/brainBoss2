import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { MascotBot } from '../MascotBot';
import { useLanguage } from '../../context/LanguageContext';

export const BrandAssetGallery: React.FC = () => {
  const { language } = useLanguage();
  const isGerman = language === 'de';
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorPalettes = [
    {
      name: isGerman ? 'BrainBoss Indigo (Primär)' : 'BrainBoss Indigo (Primary)',
      hex: '#4f46e5',
      desc: isGerman ? 'Hauptmarke, Header & zentrale Schaltflächen' : 'Main brand, headers & key CTA buttons',
    },
    {
      name: isGerman ? 'Kosmisches Violett (Akzent)' : 'Cosmic Violet (Accent)',
      hex: '#7c3aed',
      desc: isGerman ? 'Farbverläufe, Banner & sekundäre Highlights' : 'Gradients, hero banners & secondary highlights',
    },
    {
      name: isGerman ? 'Smaragdgrün (Richtig)' : 'Emerald Spark (Correct)',
      hex: '#10b981',
      desc: isGerman ? 'Erfolgs-Feedback, Erfolge & Mathe-Gewinne' : 'Success feedback, unlocked achievements & math wins',
    },
    {
      name: isGerman ? 'Sonnengold (Münzen & Beute)' : 'Sunburst Gold (Coins & Loot)',
      hex: '#f59e0b',
      desc: isGerman ? 'Schatztruhen, Tagesbelohnungen & Sterne' : 'Loot chests, daily rewards & stars',
    },
    {
      name: isGerman ? 'Karminrot (Herzen & Boss)' : 'Crimson Rose (Hearts & Boss)',
      hex: '#f43f5e',
      desc: isGerman ? 'Herzen, Drachenkämpfe & dringende Alarme' : 'Hearts, high-stakes dragon battles & urgent alerts',
    },
    {
      name: isGerman ? 'Cyan-Flux (Edelsteine & Tech)' : 'Cyan Flux (Gems & Tech)',
      hex: '#06b6d4',
      desc: isGerman ? 'KI-Story-Engine, seltene Edelsteine & Gedächtnismatrix' : 'AI story engine, rare gems & matrix memory',
    },
  ];

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    soundFx.playPop();
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 text-white shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
          <Palette className="w-4 h-4" />
          <span>{isGerman ? 'Design- & Asset-System' : 'Brand Design & Asset System'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {isGerman ? 'BrainBoss Design-Tokens & Maskottchen' : 'BrainBoss Design Tokens & Mascot Assets'}
        </h1>
        <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-2xl leading-relaxed">
          {isGerman
            ? 'Hochauflösende Vektor-Assets, Farbpaletten, Maskottchen-Zustände und Typografie-Tokens für kinder- und jugendgerechte Bildungs-Gamification.'
            : 'High-resolution vector assets, color palettes, mascot mood variants, and typography tokens crafted for children and high school educational gamification.'}
        </p>
      </div>

      {/* Vector Logo Showcase */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isGerman ? 'Offizielle Logo-Varianten' : 'Official Brand Logo Variations'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {isGerman ? 'Vektorgenaue, responsive Bildmarken' : 'Vector-crisp responsive brandmarks'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-xl">
            Design Spec v2.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Logo Cyber */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50">
              🧠
            </div>
            <div>
              <div className="font-bold text-white text-base">BrainBoss Core</div>
              <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                {isGerman ? 'Immersive UI System' : 'Immersive UI System'}
              </div>
            </div>
          </div>

          {/* Logo Dark Arcade */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/50">
              🧠
            </div>
            <div>
              <div className="font-bold text-white text-base">BrainBoss Pro</div>
              <div className="text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-wider">
                {isGerman ? 'Arcade Cyber Modus' : 'Arcade Cyber Mode'}
              </div>
            </div>
          </div>

          {/* Logo Badge */}
          <div className="p-6 rounded-2xl bg-linear-to-br from-blue-950/80 to-indigo-950/80 border border-blue-500/40 flex flex-col items-center justify-center space-y-3 text-center text-white">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/40">
              ⚡
            </div>
            <div>
              <div className="font-bold text-white text-base">Math Quest Hero</div>
              <div className="text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-wider">
                {isGerman ? 'Gamification-Emblem' : 'Gamification Emblem'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mascot Mood Gallery */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-md space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">
            {isGerman ? 'Maskottchen "Brainy Bot" Ausdrucksformen' : 'Mascot "Brainy Bot" Expressive States'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {isGerman
              ? 'Interaktive SVG-Reaktionen auf Spielerfolge und Fehler von Kindern'
              : 'Interactive SVG companion reactions tied to kid gameplay actions'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center space-y-2 text-center">
            <MascotBot mood="idle" speechText={isGerman ? 'Bereit zum Rechnen!' : 'Ready for calculations!'} />
            <span className="text-xs font-mono font-bold text-slate-300">
              {isGerman ? '1. Fokussiert / Bereit' : '1. Idle / Focused'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center space-y-2 text-center">
            <MascotBot mood="happy" speechText={isGerman ? 'Super Mathe-Star!' : 'Super math star!'} />
            <span className="text-xs font-mono font-bold text-slate-300">
              {isGerman ? '2. Freude / Richtig' : '2. Joy / Correct'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center space-y-2 text-center">
            <MascotBot mood="hinting" speechText={isGerman ? 'Geheimer Tipp freigeschaltet!' : 'Quantum hint unlocked!'} />
            <span className="text-xs font-mono font-bold text-slate-300">
              {isGerman ? '3. Brain Spark / Tipp' : '3. Brain Spark / Clue'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center space-y-2 text-center">
            <MascotBot mood="celebrating" speechText={isGerman ? 'Epischer Boss-Sieg!' : 'Epic Boss Victory!'} />
            <span className="text-xs font-mono font-bold text-slate-300">
              {isGerman ? '4. Champion / Feier' : '4. Champion Matrix'}
            </span>
          </div>
        </div>
      </div>

      {/* Color Palette Tokens */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-md space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            {isGerman ? 'Design-Token Farbmatrix' : 'Design Token Color Matrix'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {isGerman
              ? 'Barrierefreie Kontrastfarben (WCAG AA konform)'
              : 'Accessible high-contrast palette tokens (WCAG AA compliant)'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colorPalettes.map((color) => {
            const isCopied = copiedColor === color.hex;
            return (
              <div
                key={color.hex}
                onClick={() => handleCopyHex(color.hex)}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl shadow-xs border border-white/10 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {color.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {color.desc}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-slate-400 group-hover:text-white">
                  {isCopied ? (
                    <span className="text-emerald-400 font-bold font-mono">{isGerman ? 'Kopiert!' : 'Copied!'}</span>
                  ) : (
                    color.hex
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
