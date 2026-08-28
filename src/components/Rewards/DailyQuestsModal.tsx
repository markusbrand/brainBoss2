import React from 'react';
import confetti from 'canvas-confetti';
import { Gift, X, Coins, Gem, Sparkles } from 'lucide-react';
import { DailyQuest, PlayerProfile } from '../../types';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onClaimQuest: (questId: string) => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onClaimQuest,
}) => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  if (!isOpen) return null;

  const handleClaim = (q: DailyQuest) => {
    if (!q.completed || q.claimed) return;
    soundFx.playCorrect();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    onClaimQuest(q.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 w-full max-w-lg rounded-3xl border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] p-6 sm:p-8 space-y-6 relative text-white">
        {/* Laser Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-pink-500 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-mono font-bold uppercase">
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            <span>{isGerman ? 'Tägliche Missionen' : 'Daily Directives'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isGerman ? 'Tägliche Quests' : 'Daily Quest Matrix'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {isGerman
              ? 'Schließe tägliche Denkaufgaben ab, um Bonus-Münzen, XP und Edelsteine zu verdienen!'
              : 'Complete daily brain challenges to earn bonus coins, XP, and gems!'}
          </p>
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {profile.dailyQuests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  quest.claimed
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : quest.completed
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{quest.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{quest.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.completed ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Reward & Claim Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                  <div className="flex items-center gap-1 font-mono font-bold text-xs">
                    {quest.rewardType === 'coins' && (
                      <span className="flex items-center gap-1 text-amber-300 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-800/60">
                        <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                        +{quest.rewardAmount}
                      </span>
                    )}
                    {quest.rewardType === 'gems' && (
                      <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-800/60">
                        <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                        +{quest.rewardAmount}
                      </span>
                    )}
                    {quest.rewardType === 'xp' && (
                      <span className="flex items-center gap-1 text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/60">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        +{quest.rewardAmount} XP
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!quest.completed || quest.claimed}
                    onClick={() => handleClaim(quest)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      quest.claimed
                        ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-default'
                        : quest.completed
                        ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95'
                        : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed font-mono'
                    }`}
                  >
                    {quest.claimed
                      ? (isGerman ? 'Eingelöst ✓' : 'Claimed ✓')
                      : quest.completed
                      ? (isGerman ? 'Belohnung abholen! 🎁' : 'Claim Loot! 🎁')
                      : (isGerman ? 'Ausstehend' : 'Pending')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
