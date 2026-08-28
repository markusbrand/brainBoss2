import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, X, Clock, Flame } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface SpeedStroopGameProps {
  profile: PlayerProfile;
  onExit: () => void;
  onUpdateStats: (xp: number, coins: number, isCorrect: boolean, mode: any, score?: number) => void;
}

const STROOP_COLORS = [
  { key: 'RED', textClass: 'text-rose-500', hex: '#f43f5e' },
  { key: 'BLUE', textClass: 'text-blue-500', hex: '#3b82f6' },
  { key: 'GREEN', textClass: 'text-emerald-500', hex: '#10b981' },
  { key: 'YELLOW', textClass: 'text-amber-500', hex: '#f59e0b' },
  { key: 'PURPLE', textClass: 'text-purple-500', hex: '#a855f7' },
];

export const SpeedStroopGame: React.FC<SpeedStroopGameProps> = ({
  onExit,
  onUpdateStats,
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isGameOver, setIsGameOver] = useState(false);

  // Stroop round state
  const [wordKey, setWordKey] = useState('RED');
  const [inkColor, setInkColor] = useState(STROOP_COLORS[0]);

  const isMatch = wordKey === inkColor.key;

  const nextRound = useCallback(() => {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    const word = STROOP_COLORS[wordIdx].key;

    // 50% chance of matching color
    let ink = STROOP_COLORS[wordIdx];
    if (Math.random() > 0.5) {
      const otherIdx = Math.floor(Math.random() * STROOP_COLORS.length);
      ink = STROOP_COLORS[otherIdx];
    }

    setWordKey(word);
    setInkColor(ink);
  }, []);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(40);
    setIsGameOver(false);
    setIsPlaying(true);
    nextRound();
    soundFx.playCorrect();
  };

  // Timer Effect
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsGameOver(true);
          setIsPlaying(false);
          soundFx.playLevelUp();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onUpdateStats(Math.round(score * 0.5), Math.round(score * 0.2), true, 'speed_stroop', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, score, onUpdateStats]);

  const handleAnswer = (userSaidMatch: boolean) => {
    if (!isPlaying || isGameOver) return;

    if (userSaidMatch === isMatch) {
      soundFx.playPop(750);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const mult = nextStreak >= 6 ? 2.5 : nextStreak >= 3 ? 1.5 : 1;
      const pts = Math.round(25 * mult);
      setScore((prev) => prev + pts);
      onUpdateStats(5, 2, true, 'speed_stroop', score + pts);

      if (nextStreak % 5 === 0) {
        soundFx.playStreak(nextStreak);
      }
      nextRound();
    } else {
      soundFx.playWrong();
      setStreak(0);
      setScore((prev) => Math.max(0, prev - 15));
      onUpdateStats(0, 0, false, 'speed_stroop');
      nextRound();
    }
  };

  const getTranslatedWord = (key: string) => {
    switch (key) {
      case 'RED':
        return t.brainGames.colorRed.toUpperCase();
      case 'BLUE':
        return t.brainGames.colorBlue.toUpperCase();
      case 'GREEN':
        return t.brainGames.colorGreen.toUpperCase();
      case 'YELLOW':
        return t.brainGames.colorYellow.toUpperCase();
      case 'PURPLE':
        return t.brainGames.colorPurple.toUpperCase();
      default:
        return key;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300 text-white">
      {/* Header */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xl flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => {
            soundFx.playPop();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.brainGames.exitGame}</span>
        </button>

        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 text-amber-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}
          {isPlaying && (
            <div className="flex items-center gap-1 bg-orange-950/60 border border-orange-800/60 text-orange-400 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/30" />
              <span>{streak} {t.brainGames.streak}</span>
            </div>
          )}
          <div className="text-xs font-mono font-bold text-slate-400">
            {t.brainGames.score}: <span className="text-cyan-400 font-black font-mono text-sm">{score}</span>
          </div>
        </div>
      </div>

      {!isPlaying && !isGameOver && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-400 to-transparent" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            ⚡
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.brainGames.speedStroopTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-mono">
              {t.brainGames.speedStroopSub}
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-1 text-left text-slate-300 font-mono">
            <div><b>{t.brainGames.rule}:</b> {t.brainGames.stroopRule1}</div>
            <div>{t.brainGames.stroopRule2}</div>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            {t.brainGames.startChallenge} 🚀
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            {t.brainGames.stroopDirective}
          </div>

          {/* Big Stroop Text */}
          <div className="py-6 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
            <span
              className={`text-5xl sm:text-7xl font-black font-mono tracking-wider transition-colors drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] ${inkColor.textClass}`}
            >
              {getTranslatedWord(wordKey)}
            </span>
          </div>

          {/* Yes / No Tactile Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="py-5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/60 text-rose-300 font-extrabold text-lg sm:text-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-6 h-6" />
              <span>{t.brainGames.noMismatch}</span>
            </button>

            <button
              onClick={() => handleAnswer(true)}
              className="py-5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 font-extrabold text-lg sm:text-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              <span>{t.brainGames.yesMatch}</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="bg-slate-900/95 rounded-3xl border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="text-4xl animate-bounce">🏆</div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{t.brainGames.reflexRoundFinished}</h2>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-xs mx-auto space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t.brainGames.finalScore}</span>
            <div className="text-3xl font-black text-cyan-400 font-mono">{score}</div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
            >
              {t.brainGames.replayChallenge} 🔄
            </button>
            <button
              onClick={onExit}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm transition-all"
            >
              {t.brainGames.backToCommand}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
