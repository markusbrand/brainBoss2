import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Clock, Flame } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface ClassicColorNumberGameProps {
  profile: PlayerProfile;
  onExit: () => void;
  onUpdateStats: (xp: number, coins: number, isCorrect: boolean, mode: any, score?: number) => void;
}

interface TileItem {
  id: number;
  number: number;
  colorKey: string;
  colorClass: string;
}

const COLORS = [
  { key: 'red', class: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600' },
  { key: 'blue', class: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600' },
  { key: 'green', class: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600' },
  { key: 'yellow', class: 'bg-amber-400 hover:bg-amber-500 text-slate-900 border-amber-500' },
  { key: 'purple', class: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600' },
];

export const ClassicColorNumberGame: React.FC<ClassicColorNumberGameProps> = ({
  onExit,
  onUpdateStats,
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [targetNumber, setTargetNumber] = useState<number>(1);
  const [targetColorKey, setTargetColorKey] = useState<string>('red');
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Generate 9 dynamic tiles with exactly 1 matching target
  const generateNewRound = useCallback(() => {
    const nextNum = Math.floor(Math.random() * 9) + 1;
    const nextColorObj = COLORS[Math.floor(Math.random() * COLORS.length)];

    setTargetNumber(nextNum);
    setTargetColorKey(nextColorObj.key);

    const newTiles: TileItem[] = [];
    // Correct tile
    newTiles.push({
      id: 0,
      number: nextNum,
      colorKey: nextColorObj.key,
      colorClass: nextColorObj.class,
    });

    // 8 distractor tiles
    for (let i = 1; i < 9; i++) {
      let rNum = Math.floor(Math.random() * 9) + 1;
      let rColor = COLORS[Math.floor(Math.random() * COLORS.length)];

      // Ensure distractor does not match BOTH number AND color
      while (rNum === nextNum && rColor.key === nextColorObj.key) {
        rNum = (rNum % 9) + 1;
      }

      newTiles.push({
        id: i,
        number: rNum,
        colorKey: rColor.key,
        colorClass: rColor.class,
      });
    }

    // Shuffle tiles
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }

    setTiles(newTiles);
  }, []);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(45);
    setIsGameOver(false);
    setIsPlaying(true);
    generateNewRound();
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
          onUpdateStats(Math.round(score * 0.5), Math.round(score * 0.2), true, 'classic_color_number', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, score, onUpdateStats]);

  // Handle Tile Click
  const handleTileClick = (tile: TileItem) => {
    if (!isPlaying || isGameOver) return;

    if (tile.number === targetNumber && tile.colorKey === targetColorKey) {
      soundFx.playPop();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const mult = nextStreak >= 5 ? 2.5 : nextStreak >= 3 ? 1.5 : 1;
      const pts = Math.round(20 * mult);
      setScore((prev) => prev + pts);
      onUpdateStats(5, 2, true, 'classic_color_number', score + pts);

      if (nextStreak % 5 === 0) {
        soundFx.playStreak(nextStreak);
      }

      generateNewRound();
    } else {
      soundFx.playWrong();
      setStreak(0);
      setScore((prev) => Math.max(0, prev - 10));
      onUpdateStats(0, 0, false, 'classic_color_number');
    }
  };

  const getTranslatedColorName = (key: string) => {
    switch (key) {
      case 'red':
        return t.brainGames.colorRed;
      case 'blue':
        return t.brainGames.colorBlue;
      case 'green':
        return t.brainGames.colorGreen;
      case 'yellow':
        return t.brainGames.colorYellow;
      case 'purple':
        return t.brainGames.colorPurple;
      default:
        return key.toUpperCase();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-300 text-white">
      {/* Top Header */}
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
            <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
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
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-rose-500 to-transparent" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            🎯
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.brainGames.colorNumberTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-mono">
              {t.brainGames.colorNumberSub}
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 inline-block text-left text-xs space-y-1.5 text-slate-300 font-mono">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🎮 {t.brainGames.missionBrief}:</span>
            </div>
            <div>{t.brainGames.colorNumberRule1}</div>
            <div>{t.brainGames.colorNumberRule2}</div>
            <div>{t.brainGames.colorNumberRule3}</div>
          </div>

          <div>
            <button
              id="start-classic-btn"
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-linear-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-bold text-base shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              {t.brainGames.startMission} 🚀
            </button>
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-5 sm:p-7 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          
          {/* Target Prompt Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-white text-center space-y-1 shadow-inner">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">
              {t.brainGames.targetMatchDirective}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono flex items-center justify-center gap-2">
              <span className="text-slate-400">{t.brainGames.find}:</span>
              <span
                className={`px-4 py-1 rounded-xl font-black font-mono shadow-md ${
                  targetColorKey === 'red'
                    ? 'bg-rose-600 text-white shadow-rose-600/50'
                    : targetColorKey === 'blue'
                    ? 'bg-blue-600 text-white shadow-blue-600/50'
                    : targetColorKey === 'green'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/50'
                    : targetColorKey === 'yellow'
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/50'
                    : 'bg-purple-600 text-white shadow-purple-600/50'
                }`}
              >
                {getTranslatedColorName(targetColorKey)} {targetNumber}
              </span>
            </div>
          </div>

          {/* 3x3 Tile Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`aspect-square rounded-2xl font-black text-3xl sm:text-4xl shadow-lg border border-white/20 active:scale-95 transition-all flex items-center justify-center font-mono ${tile.colorClass}`}
              >
                {tile.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="bg-slate-900/95 rounded-3xl border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center space-y-5 text-white animate-in zoom-in-95 duration-300">
          <div className="text-4xl animate-bounce">🏆</div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{t.brainGames.rushFinished}</h2>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-xs mx-auto space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t.brainGames.finalScore}</span>
            <div className="text-3xl font-black text-cyan-400 font-mono">{score}</div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all hover:scale-105"
            >
              {t.brainGames.replayMission} 🔄
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
