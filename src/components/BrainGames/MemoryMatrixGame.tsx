import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface MemoryMatrixGameProps {
  profile: PlayerProfile;
  onExit: () => void;
  onUpdateStats: (xp: number, coins: number, isCorrect: boolean, mode: any, score?: number) => void;
}

export const MemoryMatrixGame: React.FC<MemoryMatrixGameProps> = ({
  onExit,
  onUpdateStats,
}) => {
  const { t } = useLanguage();
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3); // 3x3 to 5x5
  const [litTiles, setLitTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'memorizing' | 'recalling' | 'success' | 'failed' | 'gameover'>('idle');
  const [score, setScore] = useState(0);

  // Generate pattern for current level
  const generateLevelPattern = useCallback((lvl: number) => {
    // 3x3 for lvl 1-3, 4x4 for lvl 4-6, 5x5 for lvl 7+
    const size = lvl <= 3 ? 3 : lvl <= 6 ? 4 : 5;
    setGridSize(size);

    const tileCount = size * size;
    const targetCount = Math.min(tileCount - 2, 2 + lvl);

    const chosen: number[] = [];
    while (chosen.length < targetCount) {
      const idx = Math.floor(Math.random() * tileCount);
      if (!chosen.includes(idx)) {
        chosen.push(idx);
      }
    }

    setLitTiles(chosen);
    setSelectedTiles([]);
    setGameState('memorizing');

    // Memorization display window (2.0s to 3.5s)
    setTimeout(() => {
      setGameState('recalling');
    }, 2200);
  }, []);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    generateLevelPattern(1);
    soundFx.playCorrect();
  };

  const handleTileClick = (idx: number) => {
    if (gameState !== 'recalling') return;
    if (selectedTiles.includes(idx)) return;

    soundFx.playPop(700);
    const nextSelected = [...selectedTiles, idx];
    setSelectedTiles(nextSelected);

    // Check if clicked tile is valid
    if (!litTiles.includes(idx)) {
      // Wrong tile picked
      soundFx.playWrong();
      setGameState('failed');
      setTimeout(() => {
        setGameState('gameover');
        onUpdateStats(level * 10, level * 5, false, 'memory_matrix', score);
      }, 1000);
      return;
    }

    // Check if all lit tiles found
    if (nextSelected.length === litTiles.length) {
      soundFx.playCorrect();
      setGameState('success');
      const pts = level * 25;
      setScore((prev) => prev + pts);
      onUpdateStats(level * 15, level * 8, true, 'memory_matrix', score + pts);

      if (level % 3 === 0) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }

      setTimeout(() => {
        const nextLvl = level + 1;
        setLevel(nextLvl);
        generateLevelPattern(nextLvl);
      }, 1200);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300 text-white">
      {/* Top Bar */}
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

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-bold">
            {t.brainGames.sectorLevel} {level}
          </div>
          <div className="text-xs font-mono font-bold text-slate-400">
            {t.brainGames.score}: <span className="text-cyan-400 font-black font-mono text-sm">{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            🧠
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.brainGames.memoryMatrixTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-mono">
              {t.brainGames.memoryMatrixSub}
            </p>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-3.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            {t.brainGames.initiateMatrix} 🚀
          </button>
        </div>
      )}

      {(gameState === 'memorizing' || gameState === 'recalling' || gameState === 'success' || gameState === 'failed') && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white font-mono">
              {gameState === 'memorizing' && t.brainGames.memorizingStatus}
              {gameState === 'recalling' && t.brainGames.recallingStatus}
              {gameState === 'success' && t.brainGames.successStatus}
              {gameState === 'failed' && t.brainGames.failedStatus}
            </h3>
            <p className="text-xs text-cyan-300/80 font-mono">
              {litTiles.length} {t.brainGames.targetNodesBuffer}
            </p>
          </div>

          {/* Dynamic Grid */}
          <div
            className="grid gap-3 max-w-xs sm:max-w-sm mx-auto p-4 bg-slate-950/90 border border-slate-800 rounded-3xl shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const isLit = litTiles.includes(idx);
              const isSelected = selectedTiles.includes(idx);

              let tileStyle = 'bg-slate-800/90 border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-750';

              if (gameState === 'memorizing' && isLit) {
                tileStyle = 'bg-cyan-400 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)] scale-98 animate-pulse';
              } else if (gameState === 'recalling' && isSelected) {
                tileStyle = 'bg-cyan-500 border-cyan-300 text-white font-black shadow-[0_0_15px_rgba(34,211,238,0.7)]';
              } else if (gameState === 'failed' && isLit) {
                tileStyle = 'bg-amber-400 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]';
              }

              return (
                <button
                  key={idx}
                  disabled={gameState !== 'recalling'}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl border-2 transition-all duration-200 ${tileStyle}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="bg-slate-900/95 rounded-3xl border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="text-4xl animate-bounce">🏆</div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{t.brainGames.matrixRunComplete}</h2>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t.brainGames.sectorReached}</span>
              <div className="text-2xl font-black text-cyan-400 font-mono">{level}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t.brainGames.score}</span>
              <div className="text-2xl font-black text-purple-400 font-mono">{score}</div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:scale-105"
            >
              {t.brainGames.replayMatrix} 🔄
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
