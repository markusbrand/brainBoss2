import React from 'react';
import { Palette, Check, Sparkles, X, Shield } from 'lucide-react';
import { KidProfile, SkinThemeId } from '../../types';
import { SKIN_THEMES, getSkinTheme } from '../../utils/skins';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface SkinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKid: KidProfile;
  onSelectSkin: (skinId: SkinThemeId) => void;
}

export const SkinSelectorModal: React.FC<SkinSelectorModalProps> = ({
  isOpen,
  onClose,
  activeKid,
  onSelectSkin,
}) => {
  const { language } = useLanguage();
  const isDe = language === 'de';

  if (!isOpen) return null;

  const currentSkinId = activeKid.skinId || 'cyber_neon';

  const handleSelect = (skinId: SkinThemeId) => {
    soundFx.playCorrect();
    onSelectSkin(skinId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-cyan-400 via-fuchsia-500 to-amber-400" />

        {/* Top title & Close button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {isDe ? 'UI Design & Skins' : 'UI Themes & Skins'}
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                {isDe
                  ? `Wähle das Lieblings-Design für ${activeKid.name} (${activeKid.avatar})`
                  : `Choose the favorite visual theme for ${activeKid.name} (${activeKid.avatar})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skins Grid */}
        <div className="overflow-y-auto py-4 space-y-3 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SKIN_THEMES.map((skin) => {
              const isSelected = skin.id === currentSkinId;
              return (
                <div
                  key={skin.id}
                  onClick={() => handleSelect(skin.id)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{skin.icon}</span>
                        <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {isDe ? skin.nameDe : skin.nameEn}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                        {skin.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {isDe ? skin.descriptionDe : skin.descriptionEn}
                    </p>
                  </div>

                  {/* Bottom: Color swatches & Select status */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {skin.previewColors.map((col, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-xl">
                        <Check className="w-3.5 h-3.5" />
                        {isDe ? 'Aktiviert' : 'Equipped'}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                        {isDe ? 'Ausrüsten' : 'Equip'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>✨</span>
            <span>{isDe ? 'Jedes Kind kann seinen eigenen Skin wählen' : 'Each kid can choose their own skin theme'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            {isDe ? 'Fertig' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
