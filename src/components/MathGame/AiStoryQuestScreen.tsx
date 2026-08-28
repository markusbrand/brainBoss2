import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Bot, Sparkles, ArrowLeft, Lightbulb, RefreshCw, ChevronRight } from 'lucide-react';
import { AiQuestPackage, AiQuestStep, PlayerProfile } from '../../types';
import { MascotBot, MascotMood } from '../MascotBot';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface AiStoryQuestScreenProps {
  profile: PlayerProfile;
  onExit: () => void;
  onUpdateStats: (xp: number, coins: number, isCorrect: boolean, mode: any) => void;
}

export const AiStoryQuestScreen: React.FC<AiStoryQuestScreenProps> = ({
  profile,
  onExit,
  onUpdateStats,
}) => {
  const { language, t } = useLanguage();
  const [selectedTheme, setSelectedTheme] = useState('space');
  const [difficulty, setDifficulty] = useState(2);
  const [loading, setLoading] = useState(false);
  const [quest, setQuest] = useState<AiQuestPackage | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Question Interaction
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [questCompleted, setQuestCompleted] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotSpeech, setMascotSpeech] = useState(
    language === 'de'
      ? 'Wähle ein Abenteuer-Thema und ich erstelle eine spannende Mathe-Geschichte für dich! ✨'
      : 'Pick an adventure theme and I will generate a custom math story for you! ✨'
  );

  const themePresets = [
    { id: 'space', name: language === 'de' ? 'Weltraum-Forscher' : 'Space Explorer', emoji: '🚀' },
    { id: 'dragon', name: language === 'de' ? 'Drachenburg' : 'Dragon Castle', emoji: '🏰' },
    { id: 'dino', name: language === 'de' ? 'Dinosaurier Safari' : 'Dinosaur Safari', emoji: '🦕' },
    { id: 'cyber', name: language === 'de' ? 'Roboterstadt 3000' : 'Robo-City 3000', emoji: '🤖' },
    { id: 'ocean', name: language === 'de' ? 'Korallenriff-Geheimnis' : 'Coral Reef Mystery', emoji: '🐬' },
    { id: 'wizard', name: language === 'de' ? 'Zauberer-Akademie' : 'Wizard Academy', emoji: '🧙' },
  ];

  // Generate Quest via Gemini Server API
  const handleGenerateQuest = async () => {
    setLoading(true);
    setQuest(null);
    setCurrentStepIndex(0);
    setQuestCompleted(false);
    setSelectedOption(null);
    setFeedback('idle');
    setShowHint(false);

    setMascotMood('thinking');
    setMascotSpeech(
      language === 'de'
        ? `Gemini KI erschafft ein ${selectedTheme}-Mathe-Abenteuer...`
        : `Summoning Gemini AI to weave a ${selectedTheme} math story quest...`
    );

    try {
      const res = await fetch('/api/gemini/generate-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel: profile.gradeLevel,
          theme: selectedTheme,
          difficulty,
          language,
        }),
      });

      const data = await res.json();
      if (data && data.steps && data.steps.length > 0) {
        setQuest(data);
        soundFx.playChestOpen();
        setMascotMood('celebrating');
        setMascotSpeech(
          language === 'de'
            ? `Abenteuer bereit! "${data.questTitle}". Lass uns die Rätsel lösen!`
            : `Quest ready! "${data.questTitle}". Let's solve the mysteries!`
        );
      } else {
        throw new Error('Invalid quest format');
      }
    } catch {
      // Fallback procedural quest package
      const fallbackPackage: AiQuestPackage = {
        questTitle: language === 'de' ? `${selectedTheme.toUpperCase()} Abenteuer` : `${selectedTheme.toUpperCase()} Adventure`,
        theme: selectedTheme,
        storyIntro: language === 'de'
          ? `Willkommen! Dein Team erkundet die Welt von ${selectedTheme}. Schnelles Denken ist gefragt!`
          : `Welcome! Your team is exploring the realm of ${selectedTheme}. Quick thinking is needed!`,
        steps: [
          {
            id: 'step-1',
            story: language === 'de'
              ? `Wir haben 8 Vorratskisten und finden 7 weitere im Tresor. Wie viele Kisten haben wir insgesamt?`
              : `We have 8 supply crates and discovered 7 more hidden in the vault. How many crates do we have in total?`,
            problem: '8 + 7 = ?',
            correctAnswer: 15,
            options: [13, 14, 15, 16],
            hint: language === 'de' ? 'Denke: 8 + 2 = 10, dann noch 5 dazu = 15!' : 'Think: 8 + 2 = 10, then add the remaining 5 to make 15!',
            xp: 30,
            coins: 15,
          },
          {
            id: 'step-2',
            story: language === 'de'
              ? `Der Torschutz benötigt 24 Energiekristalle. Wir finden 3 Truhen mit je 6 Kristallen. Wie viele fehlen noch?`
              : `The gateway shield needs 24 power crystals. We found 3 chests with 6 crystals each. How many more do we still need?`,
            problem: '24 - (3 × 6) = ?',
            correctAnswer: 6,
            options: [4, 6, 8, 10],
            hint: language === 'de' ? 'Rechne zuerst 3 × 6 = 18. Dann subtrahiere: 24 - 18 = 6!' : 'First calculate 3 × 6 = 18. Then subtract: 24 - 18 = 6!',
            xp: 40,
            coins: 20,
          },
          {
            id: 'step-3',
            story: language === 'de'
              ? `Boss-Finale: Der Wächter belohnt dich für die Lösung: 5 Gruppen mit je 8 leuchtenden Edelsteinen!`
              : `Boss Climax: The guardian offers a treasure if you solve the master puzzle: 5 groups of 8 glowing power gems!`,
            problem: '5 × 8 = ?',
            correctAnswer: 40,
            options: [35, 40, 45, 50],
            hint: language === 'de' ? 'Zähle in 5er Schritten: 5, 10, 15, 20, 25, 30, 35, 40!' : 'Count by 5s: 5, 10, 15, 20, 25, 30, 35, 40!',
            xp: 60,
            coins: 30,
          },
        ],
      };
      setQuest(fallbackPackage);
      setMascotMood('idle');
      setMascotSpeech(language === 'de' ? `Lass uns deine ${selectedTheme}-Mission starten!` : `Let's start your ${selectedTheme} quest!`);
    } finally {
      setLoading(false);
    }
  };

  const currentStep: AiQuestStep | undefined = quest?.steps[currentStepIndex];

  // Handle Option selection
  const handleSelectOption = (option: string | number) => {
    if (!currentStep || feedback !== 'idle') return;

    setSelectedOption(option);
    const isCorrect = String(option) === String(currentStep.correctAnswer);

    if (isCorrect) {
      soundFx.playCorrect();
      setFeedback('correct');
      setMascotMood('happy');
      setMascotSpeech(language === 'de' ? 'Richtig! Kapitel erfolgreich abgeschlossen! ⭐' : 'Correct! Story chapter completed! ⭐');
      onUpdateStats(currentStep.xp, currentStep.coins, true, 'ai_story');

      // Check if quest completed
      if (currentStepIndex + 1 >= (quest?.steps.length || 0)) {
        setTimeout(() => {
          setQuestCompleted(true);
          soundFx.playLevelUp();
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
          });
          setMascotMood('celebrating');
          setMascotSpeech(language === 'de' ? '🎉 QUEST MEISTERHAFT GELÖST! Große Belohnung freigeschaltet!' : '🎉 QUEST CONQUERED! You unlocked the Grand Story Treasure!');
        }, 800);
      }
    } else {
      soundFx.playWrong();
      setFeedback('wrong');
      setMascotMood('thinking');
      setMascotSpeech(language === 'de' ? `Versuche es noch einmal! Tipp: ${currentStep.hint}` : `Try again! Hint: ${currentStep.hint}`);
      setShowHint(true);
      onUpdateStats(0, 0, false, 'ai_story');
    }
  };

  const handleNextStep = () => {
    setSelectedOption(null);
    setFeedback('idle');
    setShowHint(false);
    setCurrentStepIndex((prev) => prev + 1);
    setMascotMood('idle');
    setMascotSpeech(language === 'de' ? 'Nächstes Kapitel! Wie geht das Abenteuer weiter?' : 'Next chapter! What happens next?');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 text-white">
      {/* Top Header */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xl flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => {
            soundFx.playPop();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'de' ? 'Zurück zur Übersicht' : 'Back to Quest Hub'}</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-mono font-bold">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gemini AI Narrative Engine</span>
        </div>
      </div>

      {/* Generator Form if no quest is active */}
      {!quest && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(59,130,246,0.4)] animate-pulse">
              ✨
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'de' ? 'KI-Mathe-Abenteuer erstellen' : 'Create an AI Math Adventure'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              {language === 'de'
                ? `Gemini KI generiert eine personalisierte 3-teilige Mathe-Geschichte, angepasst an deine Stufe (${profile.gradeLevel === 'primary' ? 'Grundschule' : 'Oberstufe'}).`
                : `Gemini AI generates a personalized, 3-chapter math storyline tailored to your grade level (${profile.gradeLevel === 'primary' ? 'Primary School' : 'High School'}).`}
            </p>
          </div>

          {/* Theme Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'de' ? '1. Wähle eine Abenteuerwelt' : '1. Select Narrative World'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themePresets.map((tItem) => {
                const isSelected = selectedTheme === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    id={`theme-btn-${tItem.id}`}
                    onClick={() => {
                      soundFx.playPop();
                      setSelectedTheme(tItem.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-cyan-400 bg-blue-500/20 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-bold'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/80 text-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{tItem.emoji}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">{tItem.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              <span>{language === 'de' ? '2. Quest-Schwierigkeit' : '2. Quest Difficulty'}</span>
              <span className="text-cyan-400 font-bold font-mono">
                {language === 'de' ? `Stufe ${difficulty} von 5` : `Level ${difficulty} of 5`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Generate Button */}
          <button
            id="generate-ai-quest-btn"
            disabled={loading}
            onClick={handleGenerateQuest}
            className="w-full py-4 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{language === 'de' ? 'Generiere KI-Geschichte mit Gemini...' : 'Generating AI Storyline with Gemini...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>{language === 'de' ? 'Geschichte synthetisieren' : 'Synthesize Story Quest'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Active Quest Player Screen */}
      {quest && !questCompleted && currentStep && (
        <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          {/* Story Quest Title & Stage Progress */}
          <div className="space-y-3 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
                {quest.theme.toUpperCase()} {language === 'de' ? 'MISSION' : 'MISSION'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {language === 'de' ? `Kapitel ${currentStepIndex + 1} von ${quest.steps.length}` : `Chapter ${currentStepIndex + 1} of ${quest.steps.length}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{quest.questTitle}</h2>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex gap-1 border border-slate-800">
              {quest.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    idx < currentStepIndex
                      ? 'bg-emerald-400'
                      : idx === currentStepIndex
                      ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Narrative Story Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <span>📖 {language === 'de' ? 'Geschichtenkapitel' : 'Story Chapter'}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-mono">
              {currentStep.story}
            </p>
          </div>

          {/* Math Problem Text */}
          <div className="text-center py-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl shadow-inner">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {currentStep.problem}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentStep.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = String(opt) === String(currentStep.correctAnswer);

              let style =
                'bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-white';

              if (feedback === 'correct' && isSelected) {
                style = 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]';
              } else if (feedback === 'wrong' && isSelected) {
                style = 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.3)]';
              } else if (feedback === 'wrong' && isCorrect) {
                style = 'bg-emerald-950/80 border border-emerald-500 text-emerald-300';
              }

              return (
                <button
                  key={idx}
                  id={`ai-option-btn-${idx}`}
                  disabled={feedback === 'correct'}
                  onClick={() => handleSelectOption(opt)}
                  className={`py-4 px-6 rounded-2xl font-bold text-xl transition-all shadow-xs flex items-center justify-between font-mono ${style}`}
                >
                  <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                  <span className="font-mono text-center flex-1">{opt}</span>
                  <span className="w-4" />
                </button>
              );
            })}
          </div>

          {/* Hint Card */}
          {showHint && (
            <div className="p-3.5 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs sm:text-sm text-amber-200 space-y-1 font-mono">
              <div className="font-bold flex items-center gap-1 text-amber-300">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>{language === 'de' ? 'Brainy Hinweis:' : 'Brain Spark Clue:'}</span>
              </div>
              <p>{currentStep.hint}</p>
            </div>
          )}

          {/* Next Step Button upon Correct Answer */}
          {feedback === 'correct' && currentStepIndex + 1 < quest.steps.length && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextStep}
                className="px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <span>{language === 'de' ? 'Zum nächsten Kapitel' : 'Proceed to Next Chapter'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quest Completed Banner */}
      {questCompleted && (
        <div className="bg-slate-900/95 rounded-3xl border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-tr from-yellow-400 to-amber-600 text-white flex items-center justify-center text-4xl shadow-lg animate-bounce">
            👑
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {quest?.questTitle} {language === 'de' ? 'Abgeschlossen!' : 'Completed!'}
            </h2>
            <p className="text-sm text-slate-400 font-mono">
              {language === 'de'
                ? 'Du hast alle Herausforderungen der Geschichte gemeistert und epische Belohnungen erhalten!'
                : 'You mastered every challenge in the story and unlocked grand narrative loot!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-2 font-mono font-bold text-sm">
            <div className="px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
              +150 XP
            </div>
            <div className="px-4 py-2 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-300">
              +75 {t.chestModal.coins} 🪙
            </div>
            <div className="px-4 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
              +5 {t.chestModal.gems} 💎
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                soundFx.playPop();
                setQuest(null);
                setQuestCompleted(false);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-105"
            >
              {language === 'de' ? 'Neues KI-Abenteuer starten ✨' : 'Synthesize New Story Quest ✨'}
            </button>
            <button
              onClick={() => {
                soundFx.playPop();
                onExit();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm transition-all"
            >
              {language === 'de' ? 'Zurück zum Hauptquartier' : 'Back to Command Center'}
            </button>
          </div>
        </div>
      )}

      {/* Mascot Assistant */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xs">
        <MascotBot mood={mascotMood} speechText={mascotSpeech} />
      </div>
    </div>
  );
};
