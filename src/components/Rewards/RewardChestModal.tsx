import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Coins, Gem, Zap } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { PlayerProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface RewardChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onAwardLoot: (coins: number, gems: number, powerUp?: keyof PlayerProfile['powerUps']) => void;
}

export const RewardChestModal: React.FC<RewardChestModalProps> = ({
  isOpen,
  onClose,
  profile,
  onAwardLoot,
}) => {
  const { language, t } = useLanguage();
  const isGerman = language === 'de';

  const [chestState, setChestState] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [loot, setLoot] = useState<{ coins: number; gems: number; powerUpName?: string } | null>(null);

  if (!isOpen) return null;

  const costCoins = 100;
  const canAfford = profile.coins >= costCoins;

  const handleOpenChest = () => {
    if (chestState !== 'closed' || !canAfford) return;

    soundFx.playChestOpen();
    setChestState('opening');

    // Generate random rewarding loot
    const earnedCoins = Math.floor(Math.random() * 80) + 60; // 60-140 coins
    const earnedGems = Math.floor(Math.random() * 4) + 2; // 2-5 gems

    const powerUpTypes: (keyof PlayerProfile['powerUps'])[] = [
      'freezeTime',
      'fiftyFifty',
      'brainSpark',
      'doubleStars',
      'streakShield',
    ];
    const pickedPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

    setTimeout(() => {
      setChestState('opened');
      setLoot({
        coins: earnedCoins,
        gems: earnedGems,
        powerUpName: pickedPowerUp,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });

      onAwardLoot(earnedCoins - costCoins, earnedGems, pickedPowerUp);
    }, 1000);
  };

  const handleReset = () => {
    setChestState('closed');
    setLoot(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 w-full max-w-md rounded-3xl border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] p-6 sm:p-8 text-center space-y-6 relative overflow-hidden text-white">
        {/* Laser Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-400 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isGerman ? 'Geheimnisvolle Quest-Beute' : 'Mystery Quest Loot'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isGerman ? 'Goldene Schatztruhe' : 'Golden Treasure Cache'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {isGerman
              ? 'Öffne die magische Truhe und entdecke glänzende Edelsteine, Münzen und Power-Ups!'
              : 'Open the magical chest to discover shiny gems, coins, and battle power-ups!'}
          </p>
        </div>

        {/* 3D Visual Chest Graphic */}
        <div className="py-4 flex justify-center">
          <div
            onClick={chestState === 'closed' ? handleOpenChest : undefined}
            className={`relative cursor-pointer transition-transform duration-300 ${
              chestState === 'closed' ? 'hover:scale-110 active:scale-95 animate-bounce' : ''
            }`}
          >
            {chestState === 'closed' && (
              <div className="w-32 h-32 rounded-3xl bg-linear-to-tr from-amber-600 via-yellow-500 to-amber-700 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center text-6xl relative">
                📦
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-300 border border-amber-600 flex items-center justify-center text-xs animate-ping" />
              </div>
            )}

            {chestState === 'opening' && (
              <div className="w-32 h-32 rounded-3xl bg-linear-to-tr from-yellow-300 via-amber-400 to-yellow-500 border-2 border-yellow-300 shadow-[0_0_40px_rgba(234,179,8,0.6)] flex items-center justify-center text-6xl animate-spin">
                ✨
              </div>
            )}

            {chestState === 'opened' && (
              <div className="w-32 h-32 rounded-3xl bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.6)] flex items-center justify-center text-6xl animate-in zoom-in-75">
                🎉
              </div>
            )}
          </div>
        </div>

        {/* Chest Loot Drops */}
        {chestState === 'opened' && loot && (
          <div className="space-y-4 animate-in zoom-in-95 duration-300">
            <div className="text-sm font-bold text-white font-mono">{isGerman ? 'Du hast freigeschaltet:' : 'You unlocked:'}</div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-950/80 border border-amber-800/60 rounded-2xl flex flex-col items-center">
                <Coins className="w-5 h-5 text-amber-400 fill-amber-400/30" />
                <span className="text-xs font-mono font-bold text-amber-300 mt-1">+{loot.coins}</span>
                <span className="text-[10px] text-slate-400 font-mono">{t.chestModal.coins}</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-cyan-800/60 rounded-2xl flex flex-col items-center">
                <Gem className="w-5 h-5 text-cyan-400 fill-cyan-400/30" />
                <span className="text-xs font-mono font-bold text-cyan-300 mt-1">+{loot.gems}</span>
                <span className="text-[10px] text-slate-400 font-mono">{t.chestModal.gems}</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-purple-800/60 rounded-2xl flex flex-col items-center">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-mono font-bold text-purple-300 mt-1">+1</span>
                <span className="text-[10px] text-slate-400 capitalize font-mono">{loot.powerUpName}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
            >
              {isGerman ? 'Noch eine Truhe öffnen 📦' : 'Open Another Chest 📦'}
            </button>
          </div>
        )}

        {/* Closed state action button */}
        {chestState === 'closed' && (
          <div className="space-y-2">
            <button
              onClick={handleOpenChest}
              disabled={!canAfford}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                canAfford
                  ? 'bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>{isGerman ? 'Truhe für 100 Münzen öffnen' : 'Unlock Cache for 100 Coins'}</span>
            </button>
            {!canAfford && (
              <p className="text-[11px] text-rose-400 font-mono font-bold">
                {isGerman
                  ? `Benötigt noch ${costCoins - profile.coins} Münzen! Löse Mathe-Quests, um Münzen zu verdienen.`
                  : `Requires ${costCoins - profile.coins} more coins! Solve math quests to earn coins.`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
