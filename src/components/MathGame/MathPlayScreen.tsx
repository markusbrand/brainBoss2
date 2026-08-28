import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Zap, Heart, Clock, ArrowLeft, Lightbulb, Shield, ShieldCheck, Flame, Award, Crown, Volume2 } from 'lucide-react';
import { GameMode, ProblemItem, PlayerProfile, SubjectArea, TargetLearnLanguage } from '../../types';
import { generateTask } from '../../utils/mathEngine';
import {
  generateNatureProblem,
  generateGeographyProblem,
  generateArtProblem,
  generateLanguageProblem,
  speakWord,
  getLanguageDisplayName,
  getLanguageFlag,
  getLangLocale,
} from '../../utils/subjectEngines';
import { VisualProblemRenderer } from './VisualProblemRenderer';
import { MascotBot, MascotMood } from '../MascotBot';
import { soundFx } from '../../utils/audio';
import { getSkinTheme } from '../../utils/skins';
import { useLanguage } from '../../context/LanguageContext';

interface MathPlayScreenProps {
  profile: PlayerProfile;
  mode: GameMode;
  topic: string;
  subject?: SubjectArea;
  targetLanguage?: TargetLearnLanguage;
  onExit: () => void;
  onUpdateStats: (xp: number, coins: number, isCorrect: boolean, mode: GameMode, score?: number, subject?: SubjectArea) => void;
  onUsePowerUp: (powerUpKey: keyof PlayerProfile['powerUps']) => boolean;
}

export const MathPlayScreen: React.FC<MathPlayScreenProps> = ({
  profile,
  mode,
  topic,
  subject = 'math',
  targetLanguage = profile.targetLanguage || 'en',
  onExit,
  onUpdateStats,
  onUsePowerUp,
}) => {
  const { language, t } = useLanguage();
  const activeSubj: SubjectArea = (subject as SubjectArea) || 'math';
  const skin = getSkinTheme(profile.skinId || 'cyber_neon');
  const baseDifficulty = profile.manualDifficulty || 2;

  const getProblemForSubject = (subj: SubjectArea, currentDiff: number = baseDifficulty): ProblemItem => {
    // Effective difficulty calculation based on profile's manual difficulty slider and current streak
    const effectiveDiff = Math.min(5, Math.max(1, Math.round((currentDiff + baseDifficulty) / 2)));
    switch (subj) {
      case 'nature':
        return generateNatureProblem(topic, profile.gradeLevel, language);
      case 'geography':
        return generateGeographyProblem(topic, profile.gradeLevel, language);
      case 'art':
        return generateArtProblem(topic, profile.gradeLevel, language);
      case 'languages':
        return generateLanguageProblem(targetLanguage, topic, profile.gradeLevel, language);
      case 'math':
      default:
        return generateTask(profile.gradeLevel, topic as any, effectiveDiff, language);
    }
  };

  // Game states
  const [currentProblem, setCurrentProblem] = useState<ProblemItem>(() =>
    getProblemForSubject(activeSubj, baseDifficulty)
  );
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(mode === 'speed_sprint' || mode === 'vocab_sprint' ? 60 : 35);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused] = useState(false);

  // Selected feedback
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [disabledOptions, setDisabledOptions] = useState<(string | number)[]>([]);

  // Active power-up states
  const [hasShield, setHasShield] = useState(false);
  const [doubleStarsRemaining, setDoubleStarsRemaining] = useState(0);

  // Hints & AI Explanation
  const [showHint, setShowHint] = useState(false);
  const [aiHintText, setAiHintText] = useState<string | null>(null);
  const [loadingAiHint, setLoadingAiHint] = useState(false);

  // Mascot mood
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotSpeech, setMascotSpeech] = useState<string>(
    language === 'de' ? 'Bereit für die nächste Herausforderung!' : 'Ready for the next challenge!'
  );

  // Boss Battle Stage
  const [bossStage, setBossStage] = useState(1);
  const bossTotalStages = 5;

  // Next problem loader
  const loadNextProblem = (isWin = true) => {
    setSelectedOption(null);
    setFeedbackState('idle');
    setDisabledOptions([]);
    setShowHint(false);
    setAiHintText(null);

    const nextDiff = Math.min(5, Math.max(1, Math.floor(streak / 3) + 1));
    const nextProb = getProblemForSubject(activeSubj, nextDiff);
    setCurrentProblem(nextProb);

    if (isWin) {
      if (streak > 0 && streak % 3 === 0) {
        setMascotMood('joy');
        setMascotSpeech(
          language === 'de'
            ? `Fantastisch! ${streak}er Serie aktiv! Weiter so! 🔥`
            : `Awesome! ${streak} streak active! Keep going! 🔥`
        );
      } else {
        setMascotMood('idle');
        setMascotSpeech(
          language === 'de' ? 'Ausgezeichnet! Nächste Aufgabe geladen.' : 'Well done! Next question ready.'
        );
      }
    }
  };

  // Timer Effect for Speed Sprint & Timed modes
  useEffect(() => {
    if (isGameOver || isPaused) return;

    if (mode === 'speed_sprint' || mode === 'vocab_sprint') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isGameOver, isPaused, mode]);

  // Handle Game Over
  const handleGameOver = () => {
    setIsGameOver(true);
    soundFx.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Handle User selecting an option
  const handleOptionClick = (option: string | number) => {
    if (feedbackState !== 'idle' || isGameOver) return;

    setSelectedOption(option);
    const isCorrect = String(option).trim().toLowerCase() === String(currentProblem.correctAnswer).trim().toLowerCase();

    if (isCorrect) {
      // WIN SOUND & TOAST
      soundFx.playCorrect();
      setFeedbackState('correct');
      setSolvedCount((prev) => prev + 1);

      // Pronounce word automatically if language question
      if (subject === 'languages' && currentProblem.visual?.pronounceText) {
        speakWord(currentProblem.visual.pronounceText, currentProblem.visual.pronounceLang || 'en-US');
      }

      // Combo & Multiplier Calculation
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newMultiplier = Math.min(4, Math.floor(newStreak / 3) + 1);
      setMultiplier(newMultiplier);

      // Base XP and Coins
      let earnedXp = (currentProblem.xp || 20) * newMultiplier;
      let earnedCoins = (currentProblem.coins || 5) * newMultiplier;

      if (doubleStarsRemaining > 0) {
        earnedXp *= 2;
        earnedCoins *= 2;
        setDoubleStarsRemaining((prev) => prev - 1);
      }

      const pointsEarned = 100 * newMultiplier;
      setScore((prev) => prev + pointsEarned);

      // Confetti burst for milestone streaks
      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      // Notify parent about stats
      onUpdateStats(earnedXp, earnedCoins, true, mode, score + pointsEarned, subject);

      // Handle Boss Battle Mode advancement
      if (mode === 'boss_battle') {
        if (bossStage >= bossTotalStages) {
          setTimeout(() => {
            handleGameOver();
          }, 1000);
          return;
        } else {
          setBossStage((prev) => prev + 1);
        }
      }

      // Auto-advance to next question
      setTimeout(() => {
        loadNextProblem(true);
      }, 1100);
    } else {
      // MISTAKE LOGIC
      soundFx.playWrong();
      setFeedbackState('wrong');

      if (hasShield) {
        // Shield absorbed the mistake!
        setHasShield(false);
        setMascotMood('champion');
        setMascotSpeech(
          language === 'de'
            ? 'Dein Schutzschild hat den Fehler absorbiert!'
            : 'Your shield absorbed the mistake!'
        );
      } else {
        setStreak(0);
        setMultiplier(1);

        if (mode === 'survival_hearts') {
          const remainingHearts = hearts - 1;
          setHearts(remainingHearts);
          if (remainingHearts <= 0) {
            setTimeout(() => {
              handleGameOver();
            }, 1200);
            return;
          }
        }
      }

      setShowHint(true);
      onUpdateStats(2, 0, false, mode, score, subject);
    }
  };

  // Power-Up: 50/50 Laser
  const handleUseFiftyFifty = () => {
    if (disabledOptions.length > 0) return;
    const success = onUsePowerUp('fiftyFifty');
    if (!success) return;

    soundFx.playPop();
    const wrongOptions = currentProblem.options.filter(
      (opt) => String(opt).trim().toLowerCase() !== String(currentProblem.correctAnswer).trim().toLowerCase()
    );
    const toDisable = wrongOptions.slice(0, 2);
    setDisabledOptions(toDisable);
  };

  // Power-Up: Freeze Time
  const handleUseFreezeTime = () => {
    const success = onUsePowerUp('freezeTime');
    if (!success) return;

    soundFx.playPop();
    setTimeLeft((prev) => prev + 15);
    setMascotSpeech(language === 'de' ? '❄️ +15 Sekunden Zeitbonus aktiviert!' : '❄️ +15 seconds bonus time added!');
  };

  // Power-Up: Brain Spark (Instant Hint)
  const handleUseBrainSpark = () => {
    const success = onUsePowerUp('brainSpark');
    if (!success) return;

    soundFx.playPop();
    setShowHint(true);
    setMascotMood('hint');
  };

  // Power-Up: Double Stars
  const handleUseDoubleStars = () => {
    const success = onUsePowerUp('doubleStars');
    if (!success) return;

    soundFx.playPop();
    setDoubleStarsRemaining(3);
  };

  // Power-Up: Streak Shield
  const handleUseShield = () => {
    if (hasShield) return;
    const success = onUsePowerUp('streakShield');
    if (!success) return;

    soundFx.playPop();
    setHasShield(true);
  };

  // Step-by-Step AI Explanation Generator
  const handleFetchAiHint = () => {
    setShowHint(true);
    setAiHintText(currentProblem.explanation || currentProblem.hint);
  };

  // Subject Badge styling
  const subjectTheme = {
    math: { bg: 'from-blue-600 to-indigo-600', text: 'text-cyan-300', border: 'border-blue-500/30', icon: '🔢' },
    nature: { bg: 'from-emerald-600 to-teal-600', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: '🌿' },
    geography: { bg: 'from-cyan-600 to-blue-600', text: 'text-cyan-300', border: 'border-cyan-500/30', icon: '🌍' },
    art: { bg: 'from-fuchsia-600 to-pink-600', text: 'text-pink-300', border: 'border-pink-500/30', icon: '🎨' },
    languages: { bg: 'from-violet-600 to-purple-600', text: 'text-violet-300', border: 'border-violet-500/30', icon: '🗣️' },
  }[subject];

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-3 sm:p-6 text-white animate-in fade-in duration-300">
      {/* Top HUD Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Exit & Subject Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.gamePlay.giveUp}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">{subjectTheme.icon}</span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              {t.subjects[subject]}
            </span>
            {subject === 'languages' && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-violet-950 border border-violet-700 text-violet-300 font-bold">
                {getLanguageFlag(targetLanguage)} {getLanguageDisplayName(targetLanguage, language)}
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Stats HUD (Timer / Hearts / Boss) */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold text-xs sm:text-sm flex-wrap">
          {/* Active Skin Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span>{skin.icon}</span>
            <span className="text-slate-300 font-sans font-semibold text-[11px]">
              {language === 'de' ? skin.nameDe : skin.nameEn}
            </span>
          </div>

          {/* Granular Difficulty Level */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Stufe {baseDifficulty}/5</span>
          </div>

          {/* Timer if applicable */}
          {(mode === 'speed_sprint' || mode === 'vocab_sprint') && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${timeLeft < 10 ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-cyan-300'}`}>
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{timeLeft}s</span>
            </div>
          )}

          {/* Survival Hearts */}
          {mode === 'survival_hearts' && (
            <div className="flex items-center gap-1 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${i < hearts ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`}
                />
              ))}
            </div>
          )}

          {/* Boss Stage Indicator */}
          {mode === 'boss_battle' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Boss Stage {bossStage}/{bossTotalStages}</span>
            </div>
          )}

          {/* Streak & Multiplier */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{streak}</span>
            {multiplier > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                {multiplier}x
              </span>
            )}
          </div>

          {/* Shield Status */}
          {hasShield && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs animate-pulse">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shield Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Play Problem Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/30 p-5 sm:p-8 shadow-[0_0_40px_rgba(99,102,241,0.15)] space-y-6 relative overflow-hidden">
        {/* Laser Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-400 to-transparent" />

        {/* Difficulty & Topic Meta Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs">
              Level {currentProblem.difficulty || 1}/5
            </span>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              {currentProblem.topic.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchAiHint}
              disabled={loadingAiHint}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors shadow-sm cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.gamePlay.hint}</span>
            </button>
          </div>
        </div>

        {/* Visual Problem Graphic Renderer if present */}
        {currentProblem.visual && (
          <VisualProblemRenderer visual={currentProblem.visual} />
        )}

        {/* Question Text Panel */}
        <div className="bg-slate-950/75 border border-slate-800/90 rounded-2xl p-5 sm:p-7 text-center space-y-2 shadow-inner">
          <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {currentProblem.question}
          </div>
          {currentProblem.subtext && (
            <p className="text-xs sm:text-sm text-cyan-300/80 font-mono max-w-md mx-auto">
              {currentProblem.subtext}
            </p>
          )}
        </div>

        {/* Options Grid (4 Tactile Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentProblem.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = String(option).trim().toLowerCase() === String(currentProblem.correctAnswer).trim().toLowerCase();
            const isDisabled = disabledOptions.includes(option);

            let btnStyle =
              'bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-indigo-500/60 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]';

            if (feedbackState === 'correct' && isSelected) {
              btnStyle = 'bg-emerald-600 border border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-102';
            } else if (feedbackState === 'wrong' && isSelected) {
              btnStyle = 'bg-rose-600 border border-rose-400 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)]';
            } else if (feedbackState === 'wrong' && isCorrect) {
              btnStyle = 'bg-emerald-950 border border-emerald-400 text-emerald-200 animate-pulse';
            }

            if (isDisabled) {
              btnStyle = 'opacity-25 pointer-events-none bg-slate-950 border-slate-800 text-slate-600 line-through';
            }

            return (
              <button
                key={idx}
                disabled={feedbackState !== 'idle' || isDisabled}
                onClick={() => handleOptionClick(option)}
                className={`relative py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg sm:text-xl transition-all active:scale-95 flex items-center justify-between shadow-md cursor-pointer ${btnStyle}`}
              >
                <span className="w-8 h-8 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                  {idx + 1}
                </span>
                <span className="flex-1 text-center font-medium">{option}</span>
                <span className="w-8" />
              </button>
            );
          })}
        </div>

        {/* Step-by-Step Hint / Explanation Accordion */}
        {showHint && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>{t.gamePlay.explanationTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-mono">
              {aiHintText || currentProblem.explanation}
            </p>
            {feedbackState === 'wrong' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => loadNextProblem(false)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  {t.gamePlay.nextQuestion} &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Interactive Power-Ups Dock */}
        <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.gamePlay.powerUpsHeader}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 50/50 */}
            <button
              disabled={profile.powerUps.fiftyFifty <= 0 || disabledOptions.length > 0}
              onClick={handleUseFiftyFifty}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                profile.powerUps.fiftyFifty > 0
                  ? 'bg-purple-950/60 border-purple-800/80 text-purple-300 hover:bg-purple-900/60 hover:border-purple-500 shadow-sm cursor-pointer'
                  : 'opacity-30 bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Eliminate 2 wrong answers"
            >
              <span>⚡ 50/50</span>
              <span className="w-4 h-4 rounded-full bg-purple-800/80 text-purple-200 text-[10px] flex items-center justify-center font-mono font-bold">
                {profile.powerUps.fiftyFifty}
              </span>
            </button>

            {/* Freeze Time */}
            <button
              disabled={profile.powerUps.freezeTime <= 0}
              onClick={handleUseFreezeTime}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                profile.powerUps.freezeTime > 0
                  ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-500 shadow-sm cursor-pointer'
                  : 'opacity-30 bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Add 15s to timer"
            >
              <span>⏰ {t.shop.freezeTitle}</span>
              <span className="w-4 h-4 rounded-full bg-cyan-800/80 text-cyan-200 text-[10px] flex items-center justify-center font-mono font-bold">
                {profile.powerUps.freezeTime}
              </span>
            </button>

            {/* Brain Spark */}
            <button
              disabled={profile.powerUps.brainSpark <= 0}
              onClick={handleUseBrainSpark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                profile.powerUps.brainSpark > 0
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-300 hover:bg-amber-900/60 hover:border-amber-500 shadow-sm cursor-pointer'
                  : 'opacity-30 bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Instant step hint"
            >
              <span>✨ {t.shop.sparkTitle}</span>
              <span className="w-4 h-4 rounded-full bg-amber-800/80 text-amber-200 text-[10px] flex items-center justify-center font-mono font-bold">
                {profile.powerUps.brainSpark}
              </span>
            </button>

            {/* 2x Stars */}
            <button
              disabled={profile.powerUps.doubleStars <= 0 || doubleStarsRemaining > 0}
              onClick={handleUseDoubleStars}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                profile.powerUps.doubleStars > 0 && doubleStarsRemaining === 0
                  ? 'bg-yellow-950/60 border-yellow-800/80 text-yellow-300 hover:bg-yellow-900/60 hover:border-yellow-500 shadow-sm cursor-pointer'
                  : 'opacity-30 bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Double XP and Coins for 3 questions"
            >
              <span>🌟 {t.shop.doubleTitle}</span>
              <span className="w-4 h-4 rounded-full bg-yellow-800/80 text-yellow-200 text-[10px] flex items-center justify-center font-mono font-bold">
                {profile.powerUps.doubleStars}
              </span>
            </button>

            {/* Streak Shield */}
            <button
              disabled={profile.powerUps.streakShield <= 0 || hasShield}
              onClick={handleUseShield}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                profile.powerUps.streakShield > 0 && !hasShield
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-500 shadow-sm cursor-pointer'
                  : 'opacity-30 bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Shield protects against 1 mistake"
            >
              <span>🛡️ {t.shop.shieldTitle}</span>
              <span className="w-4 h-4 rounded-full bg-emerald-800/80 text-emerald-200 text-[10px] flex items-center justify-center font-mono font-bold">
                {profile.powerUps.streakShield}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mascot Companion at the bottom */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xl">
        <MascotBot mood={mascotMood} speechText={mascotSpeech} />
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-white">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mx-auto text-3xl">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">{t.gamePlay.gameOver}</h3>
              <p className="text-xs text-slate-400">{t.gamePlay.victoryTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
              <div>
                <span className="text-[10px] text-slate-400 block">{t.gamePlay.summaryScore}</span>
                <span className="text-xl font-bold text-cyan-400">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{t.questView.totalSolved}</span>
                <span className="text-xl font-bold text-emerald-400">{solvedCount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsGameOver(false);
                  setStreak(0);
                  setScore(0);
                  setHearts(3);
                  setTimeLeft(mode === 'speed_sprint' || mode === 'vocab_sprint' ? 60 : 35);
                  loadNextProblem(true);
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t.gamePlay.playAgain}
              </button>

              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {t.gamePlay.backToMenu}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
