import React, { useState, useEffect } from 'react';
import {
  Clock,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildTest, KidProfile, ProblemItem, TestSubmission } from '../../types';
import { recordTestSubmission, addXPAndCoins } from '../../utils/storage';
import { soundFx } from '../../utils/audio';

interface ChildTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: ChildTest;
  profile: KidProfile;
  onTestCompleted: (submission: TestSubmission, updatedProfile: KidProfile) => void;
}

export const ChildTestModal: React.FC<ChildTestModalProps> = ({
  isOpen,
  onClose,
  test,
  profile,
  onTestCompleted,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    test.timeLimitMinutes > 0 ? test.timeLimitMinutes * 60 : 0
  );
  const [isFinished, setIsFinished] = useState(false);
  const [completedSubmission, setCompletedSubmission] = useState<TestSubmission | null>(null);
  const [startTime] = useState<number>(Date.now());

  const questions = test.questions || [];
  const currentQuestion = questions[currentIdx];

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isFinished || test.timeLimitMinutes <= 0) return;
    if (timeLeftSeconds <= 0) {
      handleFinishTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isFinished, timeLeftSeconds, test.timeLimitMinutes]);

  if (!isOpen) return null;

  const handleSelectOption = (option: string | number) => {
    if (isFinished || !currentQuestion) return;
    soundFx.playPop();
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: option,
    });
  };

  const handleFinishTest = () => {
    if (isFinished) return;
    setIsFinished(true);

    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    let correctCount = 0;

    const answerDetails = questions.map((q) => {
      const selected = userAnswers[q.id];
      const isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: selected ?? 'Keine Antwort',
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const accuracy = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const score = Math.round(accuracy * 10);
    const earnedXp = correctCount * 25 + (accuracy >= 80 ? 50 : 20);
    const earnedCoins = correctCount * 10 + (accuracy >= 80 ? 25 : 10);

    const submission: TestSubmission = {
      id: `sub_${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      kidId: profile.id,
      kidName: profile.name,
      subject: test.subject,
      score,
      totalQuestions: questions.length,
      correctCount,
      accuracy,
      answers: answerDetails,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
    };

    setCompletedSubmission(submission);
    recordTestSubmission(submission);

    // Award XP and Coins to kid
    const result = addXPAndCoins(profile, earnedXp, earnedCoins);
    onTestCompleted(submission, result.profile as KidProfile);

    if (accuracy >= 70) {
      soundFx.playCorrect();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      soundFx.playPop();
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        {/* 1. Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">{test.title}</h3>
              <p className="text-xs text-slate-400">
                {test.schoolGrade}. Schulstufe • {questions.length} Fragen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {test.timeLimitMinutes > 0 && !isFinished && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  timeLeftSeconds < 120
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-cyan-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeString}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Content */}
        {!isFinished ? (
          <div className="py-6 flex-1 overflow-y-auto space-y-6">
            {/* Pagination Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all flex-shrink-0 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Card */}
            {currentQuestion ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
                <div>
                  <span className="text-xs font-bold text-amber-400">
                    Frage {currentIdx + 1} von {questions.length}:
                  </span>
                  <h4 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-snug">
                    {currentQuestion.question}
                  </h4>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <span>{String(opt)}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Result Summary Screen */
          <div className="py-6 flex-1 overflow-y-auto space-y-6 text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-indigo-600 shadow-xl shadow-indigo-500/25 mb-2">
              <Award className="w-10 h-10 text-white" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">Test abgeschlossen!</h3>
              <p className="text-sm text-slate-400 mt-1">Super Leistung, {profile.name}!</p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="block text-[11px] text-slate-400 font-semibold">Genauigkeit</span>
                <span className="text-2xl font-extrabold text-cyan-400">{completedSubmission?.accuracy}%</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="block text-[11px] text-slate-400 font-semibold">Richtig</span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  {completedSubmission?.correctCount} / {completedSubmission?.totalQuestions}
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="block text-[11px] text-slate-400 font-semibold">Belohnung</span>
                <span className="text-2xl font-extrabold text-amber-400">+{completedSubmission?.score} XP</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Footer navigation */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 relative z-10">
          {!isFinished ? (
            <>
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => {
                  soundFx.playPop();
                  setCurrentIdx((prev) => Math.max(0, prev - 1));
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Vorherige Frage</span>
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPop();
                    setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                  }}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Nächste Frage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishTest}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Test jetzt abgeben</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md"
            >
              Fertig & Zurück zum Hauptmenü
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
