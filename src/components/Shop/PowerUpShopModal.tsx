import React from 'react';
import { ShoppingBag, X, Coins, Gem } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface PowerUpShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onBuyPowerUp: (key: keyof PlayerProfile['powerUps'], costCoins: number, costGems: number) => void;
}

export const PowerUpShopModal: React.FC<PowerUpShopModalProps> = ({
  isOpen,
  onClose,
  profile,
  onBuyPowerUp,
}) => {
  const { language, t } = useLanguage();
  if (!isOpen) return null;

  const isGerman = language === 'de';

  const SHOP_ITEMS = [
    {
      key: 'fiftyFifty' as const,
      name: isGerman ? '50/50 Eliminator' : '50/50 Eliminator',
      description: isGerman
        ? 'Entfernt sofort 2 falsche Antwortmöglichkeiten bei Mathe-Aufgaben.'
        : 'Instantly removes 2 incorrect answer choices during math quests.',
      icon: '⚡',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      costCoins: 40,
      costGems: 0,
    },
    {
      key: 'freezeTime' as const,
      name: isGerman ? 'Zeitstopp ⏰' : 'Time Freeze ⏰',
      description: isGerman
        ? 'Fügt +15 Sekunden zu deiner Sprint-Uhr hinzu.'
        : 'Adds +15 seconds to your Speed Sprint timer.',
      icon: '⏰',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      costCoins: 50,
      costGems: 0,
    },
    {
      key: 'brainSpark' as const,
      name: isGerman ? 'Brain Spark ✨' : 'Brain Spark ✨',
      description: isGerman
        ? 'Zeigt einen genialen Rechentrick oder Schritt-für-Schritt-Hinweis.'
        : 'Reveals a clever visual calculation trick or step-by-step hint.',
      icon: '✨',
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      costCoins: 35,
      costGems: 0,
    },
    {
      key: 'doubleStars' as const,
      name: isGerman ? 'Doppel-Sterne 🌟' : 'Double Stars 🌟',
      description: isGerman
        ? 'Verdoppelt alle verdienten XP- und Münz-Belohnungen für 3 Fragen.'
        : 'Doubles all XP & Coin rewards earned for the next 3 questions.',
      icon: '🌟',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      costCoins: 75,
      costGems: 1,
    },
    {
      key: 'streakShield' as const,
      name: isGerman ? 'Serien-Schild 🛡️' : 'Streak Shield 🛡️',
      description: isGerman
        ? 'Schützt deine aktive Trefferserie vor dem Verlust bei einem Fehler.'
        : 'Protects your active streak multiplier from being lost on a mistake.',
      icon: '🛡️',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      costCoins: 60,
      costGems: 1,
    },
  ];

  const handleBuy = (item: (typeof SHOP_ITEMS)[0]) => {
    if (profile.coins < item.costCoins || profile.gems < item.costGems) {
      soundFx.playWrong();
      return;
    }
    soundFx.playPowerUp();
    onBuyPowerUp(item.key, item.costCoins, item.costGems);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 w-full max-w-xl rounded-3xl border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto text-white">
        {/* Laser Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-mono font-bold uppercase">
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isGerman ? 'Ausrüstungs-Station' : 'Armory Station'}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {isGerman ? 'Power-Up Shop' : 'Power-Up Emporium'}
            </h2>
          </div>

          {/* Current Funds Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
              <span>{profile.coins}</span>
            </div>
            <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-300">
              <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
              <span>{profile.gems}</span>
            </div>
          </div>
        </div>

        {/* Item Cards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_ITEMS.map((item) => {
            const owned = profile.powerUps[item.key] || 0;
            const canAfford = profile.coins >= item.costCoins && profile.gems >= item.costGems;

            return (
              <div
                key={item.key}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-xs">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                      {isGerman ? `Besitz: ${owned}` : `Owned: ${owned}`}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{item.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5 font-mono">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                    canAfford
                      ? 'bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{isGerman ? 'Kaufen für' : 'Acquire for'}</span>
                  {item.costCoins > 0 && (
                    <span className="flex items-center gap-0.5 font-mono">
                      {item.costCoins} <Coins className="w-3 h-3 text-amber-300 fill-amber-300" />
                    </span>
                  )}
                  {item.costGems > 0 && (
                    <span className="flex items-center gap-0.5 ml-1 font-mono">
                      {item.costGems} <Gem className="w-3 h-3 text-cyan-300 fill-cyan-300" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
