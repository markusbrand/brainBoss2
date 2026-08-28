import React from 'react';
import { Trophy, CheckCircle2, Lock } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AchievementsViewProps {
  profile: PlayerProfile;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ profile }) => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  const unlockedCount = profile.badges.filter((b) => b.unlocked).length;
  const totalCount = profile.badges.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 text-white shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-400 to-transparent" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold uppercase text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isGerman ? 'Ruhmeshalle & Trophäen' : 'Trophy & Hall of Fame'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isGerman ? 'Heroische Mathe-Erfolge' : 'Heroic Math Achievements'}
          </h1>
          <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-lg">
            {isGerman
              ? 'Schalte Prestige-Abzeichen frei, indem du Mathe-Aufgaben löst, Serien aufbaust und Spielmodi meisterst!'
              : 'Unlock prestige badges as you solve math problems, build streaks, and conquer game modes!'}
          </p>
        </div>

        <div className="bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800 text-center shadow-inner">
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">{unlockedCount} / {totalCount}</div>
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {isGerman ? 'Abzeichen Freigeschaltet' : 'Badges Earned'}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.badges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                badge.unlocked
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-400'
                  : 'bg-slate-950/60 border-slate-800 opacity-50'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-xs border ${
                  badge.unlocked
                    ? 'bg-linear-to-br from-amber-950/80 to-yellow-950/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-800 grayscale'
                }`}
              >
                {badge.icon}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{badge.title}</h3>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {isGerman ? 'Erreicht' : 'Unlocked'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {isGerman ? 'Gesperrt' : 'Locked'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">{badge.description}</p>
                {badge.unlockedAt && (
                  <p className="text-[10px] text-amber-400 font-mono font-semibold pt-1">
                    {isGerman
                      ? `Freigeschaltet am ${new Date(badge.unlockedAt).toLocaleDateString('de-DE')}`
                      : `Unlocked on ${new Date(badge.unlockedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
