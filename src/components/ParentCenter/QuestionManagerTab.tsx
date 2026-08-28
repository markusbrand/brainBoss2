import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Filter,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  Sliders,
  Layers,
  GraduationCap,
  Volume2,
} from 'lucide-react';
import { CustomQuestion, GradeLevel, ProblemItem, SubjectArea, TargetLearnLanguage } from '../../types';
import {
  loadCustomQuestions,
  saveCustomQuestions,
  deleteCustomQuestion,
  addCustomQuestion,
  resetCustomQuestions,
} from '../../utils/storage';
import { NATURE_BANK, GEOGRAPHY_BANK, ART_BANK, VOCAB_DATABASE, getLanguageDisplayName, getLanguageFlag } from '../../utils/subjectEngines';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

export const QuestionManagerTab: React.FC = () => {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(() => loadCustomQuestions());
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedDiffFilter, setSelectedDiffFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Generator Panel state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiSubject, setAiSubject] = useState<SubjectArea>('math');
  const [aiTopic, setAiTopic] = useState<string>('all');
  const [aiGrade, setAiGrade] = useState<GradeLevel>('primary');
  const [aiDifficulty, setAiDifficulty] = useState<number>(3);
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiTargetLang, setAiTargetLang] = useState<TargetLearnLanguage>('en');
  const [aiInstructions, setAiInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);
  const [genErrorMsg, setGenErrorMsg] = useState<string | null>(null);

  // Manual Creation Panel state
  const [showManualForm, setShowManualForm] = useState(false);
  const [formSubject, setFormSubject] = useState<SubjectArea>('math');
  const [formTopic, setFormTopic] = useState<string>('general');
  const [formGrade, setFormGrade] = useState<GradeLevel>('primary');
  const [formDifficulty, setFormDifficulty] = useState<number>(3);
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formSubtext, setFormSubtext] = useState<string>('');
  const [formOpt1, setFormOpt1] = useState<string>('');
  const [formOpt2, setFormOpt2] = useState<string>('');
  const [formOpt3, setFormOpt3] = useState<string>('');
  const [formOpt4, setFormOpt4] = useState<string>('');
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formHint, setFormHint] = useState<string>('');

  useEffect(() => {
    setCustomQuestions(loadCustomQuestions());
  }, []);

  const refreshList = () => {
    setCustomQuestions(loadCustomQuestions());
  };

  const handleDelete = (id: string) => {
    soundFx.playPop();
    const updated = deleteCustomQuestion(id);
    setCustomQuestions(updated);
  };

  const handleResetAll = () => {
    if (window.confirm(isDe ? 'Möchtest du wirklich alle benutzerdefinierten und KI-generierten Fragen löschen?' : 'Do you really want to reset and delete all custom/AI generated questions?')) {
      resetCustomQuestions();
      setCustomQuestions([]);
      soundFx.playPop();
    }
  };

  // Generate Questions with Server Gemini API
  const handleRunAiGeneration = async () => {
    setIsGenerating(true);
    setGenSuccessMsg(null);
    setGenErrorMsg(null);

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
          gradeLevel: aiGrade,
          difficulty: aiDifficulty,
          count: aiCount,
          targetLanguage: aiTargetLang,
          customPrompt: aiInstructions,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        let currentPool = loadCustomQuestions();
        const newQuestions: CustomQuestion[] = data.questions.map((q: any) => ({
          ...q,
          isCustom: true,
          createdAt: new Date().toISOString(),
        }));

        const merged = [...newQuestions, ...currentPool];
        saveCustomQuestions(merged);
        setCustomQuestions(merged);
        soundFx.playLevelUp();
        setGenSuccessMsg(
          isDe
            ? `🎉 Erfolgreich ${newQuestions.length} neue Fragen generiert und gespeichert!`
            : `🎉 Successfully generated & saved ${newQuestions.length} new questions!`
        );
        setShowAiGenerator(false);
        setAiInstructions('');
      } else {
        throw new Error('No questions returned');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenErrorMsg(isDe ? 'Fehler bei der Generierung. Bitte versuche es erneut.' : 'Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save manual custom question
  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formOpt1.trim() || !formOpt2.trim()) {
      alert(isDe ? 'Bitte fülle Frage und mindestens 2 Antwortoptionen aus!' : 'Please enter a question and at least 2 options!');
      return;
    }

    const options = [formOpt1.trim(), formOpt2.trim(), formOpt3.trim() || '---', formOpt4.trim() || '---'].filter(
      (opt) => opt !== '---'
    );
    const chosenCorrect = options[formCorrectIndex] || options[0];

    const newQ: CustomQuestion = {
      id: `custom-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subject: formSubject,
      topic: formTopic,
      gradeLevel: formGrade,
      difficulty: formDifficulty,
      question: formQuestion.trim(),
      subtext: formSubtext.trim() || (isDe ? 'Individuelle Frage' : 'Custom question'),
      options,
      correctAnswer: chosenCorrect,
      explanation: formExplanation.trim() || (isDe ? `Die richtige Antwort ist: ${chosenCorrect}` : `The correct answer is: ${chosenCorrect}`),
      hint: formHint.trim() || (isDe ? 'Lies die Frage genau!' : 'Read the question carefully!'),
      xp: 25 + formDifficulty * 5,
      coins: 10 + formDifficulty * 3,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    addCustomQuestion(newQ);
    refreshList();
    soundFx.playCorrect();
    setShowManualForm(false);
    // Reset form
    setFormQuestion('');
    setFormSubtext('');
    setFormOpt1('');
    setFormOpt2('');
    setFormOpt3('');
    setFormOpt4('');
    setFormExplanation('');
    setFormHint('');
  };

  // Build combined questions list for display
  const allDisplayQuestions: { item: ProblemItem; isCustom: boolean; sourceName: string }[] = [
    ...customQuestions.map((q) => ({ item: q, isCustom: true, sourceName: 'Custom/AI' })),
    ...NATURE_BANK.map((item, idx) => ({
      item: {
        id: `nat-bank-${idx}`,
        subject: 'nature' as SubjectArea,
        topic: item.topic,
        gradeLevel: item.grade,
        difficulty: item.difficulty || 2,
        question: isDe ? item.qDe : item.qEn,
        subtext: isDe ? item.subDe : item.subEn,
        options: isDe ? item.optionsDe : item.optionsEn,
        correctAnswer: isDe ? item.correctDe : item.correctEn,
        explanation: isDe ? item.expDe : item.expEn,
        hint: isDe ? item.hintDe : item.hintEn,
        xp: 25,
        coins: 10,
      },
      isCustom: false,
      sourceName: 'Natur & Wissenschaft',
    })),
    ...GEOGRAPHY_BANK.map((item, idx) => ({
      item: {
        id: `geo-bank-${idx}`,
        subject: 'geography' as SubjectArea,
        topic: item.topic,
        gradeLevel: item.grade,
        difficulty: item.difficulty || 2,
        question: isDe ? item.qDe : item.qEn,
        subtext: isDe ? item.subDe : item.subEn,
        options: isDe ? item.optionsDe : item.optionsEn,
        correctAnswer: isDe ? item.correctDe : item.correctEn,
        explanation: isDe ? item.expDe : item.expEn,
        hint: isDe ? item.hintDe : item.hintEn,
        xp: 25,
        coins: 10,
      },
      isCustom: false,
      sourceName: 'Geografie & Welt',
    })),
    ...ART_BANK.map((item, idx) => ({
      item: {
        id: `art-bank-${idx}`,
        subject: 'art' as SubjectArea,
        topic: item.topic,
        gradeLevel: item.grade,
        difficulty: item.difficulty || 2,
        question: isDe ? item.qDe : item.qEn,
        subtext: isDe ? item.subDe : item.subEn,
        options: isDe ? item.optionsDe : item.optionsEn,
        correctAnswer: isDe ? item.correctDe : item.correctEn,
        explanation: isDe ? item.expDe : item.expEn,
        hint: isDe ? item.hintDe : item.hintEn,
        xp: 25,
        coins: 10,
      },
      isCustom: false,
      sourceName: 'Kunst & Musik',
    })),
  ];

  // Filtering
  const filteredQuestions = allDisplayQuestions.filter(({ item, isCustom }) => {
    if (selectedSubjectFilter !== 'all' && item.subject !== selectedSubjectFilter) return false;
    if (selectedGradeFilter !== 'all' && item.gradeLevel !== selectedGradeFilter) return false;
    if (selectedDiffFilter !== 'all' && String(item.difficulty || 2) !== selectedDiffFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQ = item.question?.toLowerCase().includes(q);
      const matchTopic = item.topic?.toLowerCase().includes(q);
      const matchAns = String(item.correctAnswer).toLowerCase().includes(q);
      if (!matchQ && !matchTopic && !matchAns) return false;
    }
    return true;
  });

  const getDifficultyLabel = (diff: number) => {
    switch (diff) {
      case 1: return { text: isDe ? '1: Anfänger' : '1: Beginner', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50' };
      case 2: return { text: isDe ? '2: Leicht' : '2: Easy', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50' };
      case 3: return { text: isDe ? '3: Mittel' : '3: Medium', color: 'text-amber-400 bg-amber-950/60 border-amber-700/50' };
      case 4: return { text: isDe ? '4: Schwer' : '4: Hard', color: 'text-orange-400 bg-orange-950/60 border-orange-700/50' };
      case 5: default: return { text: isDe ? '5: Meister' : '5: Master', color: 'text-rose-400 bg-rose-950/60 border-rose-700/50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>{isDe ? 'Fragen-Verwaltung & KI-Generator' : 'Question Bank & AI Generator'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isDe
              ? `Insgesamt ${allDisplayQuestions.length} Fragen im Pool (${customQuestions.length} KI-/Eigene Fragen). Erstelle neue oder lösche alte Fragen.`
              : `Total ${allDisplayQuestions.length} questions in pool (${customQuestions.length} custom/AI questions). Generate new or delete old items.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowAiGenerator(!showAiGenerator);
              setShowManualForm(false);
              soundFx.playPop();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isDe ? '✨ KI-Fragen generieren' : '✨ Generate with AI'}</span>
          </button>

          <button
            onClick={() => {
              setShowManualForm(!showManualForm);
              setShowAiGenerator(false);
              soundFx.playPop();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>{isDe ? '➕ Eigene Frage' : '➕ Custom Question'}</span>
          </button>

          {customQuestions.length > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
              title={isDe ? 'Alle benutzerdefinierten Fragen löschen' : 'Reset all custom questions'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Success / Error alerts */}
      {genSuccessMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{genSuccessMsg}</span>
          </div>
          <button onClick={() => setGenSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {genErrorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{genErrorMsg}</span>
          </div>
          <button onClick={() => setGenErrorMsg(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 1. AI QUESTION GENERATOR PANEL */}
      {showAiGenerator && (
        <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/50 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isDe ? 'Gemini 3.7 KI-Fragen-Generator' : 'Gemini 3.7 AI Question Generator'}</span>
            </h4>
            <button
              onClick={() => setShowAiGenerator(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ {isDe ? 'Schließen' : 'Close'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Fachgebiet' : 'Subject'}</label>
              <select
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value as SubjectArea)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
              >
                <option value="math">{isDe ? '🔢 Mathematik' : '🔢 Mathematics'}</option>
                <option value="nature">{isDe ? '🌿 Natur & Wissenschaft' : '🌿 Nature & Science'}</option>
                <option value="geography">{isDe ? '🌍 Geografie & Welt' : '🌍 Geography & World'}</option>
                <option value="art">{isDe ? '🎨 Kunst & Musik' : '🎨 Art & Music'}</option>
                <option value="languages">{isDe ? '🗣️ Sprachen-Akademie' : '🗣️ Languages'}</option>
              </select>
            </div>

            {/* Grade Level */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Schulstufe' : 'Grade Level'}</label>
              <select
                value={aiGrade}
                onChange={(e) => setAiGrade(e.target.value as GradeLevel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
              >
                <option value="primary">{isDe ? '🎒 Grundstufe (1.-4. Schulstufe)' : '🎒 Primary (Grades 1-4)'}</option>
                <option value="high_school">{isDe ? '🎓 Mittelschule (5.-8. Schulstufe)' : '🎓 High School (Grades 5-8)'}</option>
              </select>
            </div>

            {/* Difficulty (1-5) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>{isDe ? 'Schwierigkeitsgrad' : 'Difficulty'}</span>
                <span className="text-amber-400 font-mono">{aiDifficulty} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1: Anfänger</span>
                <span>3: Mittel</span>
                <span>5: Meister</span>
              </div>
            </div>

            {/* Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Anzahl Fragen' : 'Question Count'}</label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
              >
                <option value={3}>3 {isDe ? 'Fragen' : 'Questions'}</option>
                <option value={5}>5 {isDe ? 'Fragen' : 'Questions'}</option>
                <option value={10}>10 {isDe ? 'Fragen' : 'Questions'}</option>
              </select>
            </div>
          </div>

          {/* Languages target selector if applicable */}
          {aiSubject === 'languages' && (
            <div className="space-y-1 max-w-xs">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Zielsprache' : 'Target Language'}</label>
              <select
                value={aiTargetLang}
                onChange={(e) => setAiTargetLang(e.target.value as TargetLearnLanguage)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="en">🇬🇧 {isDe ? 'Englisch' : 'English'}</option>
                <option value="fr">🇫🇷 {isDe ? 'Französisch' : 'French'}</option>
                <option value="es">🇪🇸 {isDe ? 'Spanisch' : 'Spanish'}</option>
                <option value="it">🇮🇹 {isDe ? 'Italienisch' : 'Italian'}</option>
                <option value="de">🇩🇪 {isDe ? 'Deutsch' : 'German'}</option>
              </select>
            </div>
          )}

          {/* Custom instructions / Teacher Prompt */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">
              {isDe ? 'Spezifische Eltern- / Lehrer-Anweisungen (optional)' : 'Specific Teacher / Parent Prompt (Optional)'}
            </label>
            <input
              type="text"
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder={
                isDe
                  ? 'Z.B. „Schwerpunkt auf Bruchrechnen mit Pizza-Beispielen“ oder „Länder in Südamerika“'
                  : 'E.g. "Focus on fractions with pizza examples" or "South American rainforests"'
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleRunAiGeneration}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isDe ? 'KI generiert Aufgaben...' : 'AI generating questions...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isDe ? `${aiCount} Aufgaben jetzt generieren` : `Generate ${aiCount} Questions Now`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. MANUAL QUESTION CREATOR FORM */}
      {showManualForm && (
        <form onSubmit={handleSaveManualQuestion} className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>{isDe ? 'Neue eigene Frage erstellen' : 'Create Custom Question'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ {isDe ? 'Abbrechen' : 'Cancel'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Fach' : 'Subject'}</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value as SubjectArea)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="math">{isDe ? 'Mathe' : 'Math'}</option>
                <option value="nature">{isDe ? 'Natur & Wissenschaft' : 'Nature & Science'}</option>
                <option value="geography">{isDe ? 'Geografie' : 'Geography'}</option>
                <option value="art">{isDe ? 'Kunst & Musik' : 'Art & Music'}</option>
                <option value="languages">{isDe ? 'Sprachen' : 'Languages'}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Schulstufe' : 'Grade'}</label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value as GradeLevel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="primary">{isDe ? 'Grundstufe (1-4)' : 'Primary (1-4)'}</option>
                <option value="high_school">{isDe ? 'Mittelschule (5-8)' : 'Middle School (5-8)'}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Schwierigkeit (1-5)' : 'Difficulty (1-5)'}</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value={1}>1 - {isDe ? 'Anfänger' : 'Beginner'}</option>
                <option value={2}>2 - {isDe ? 'Leicht' : 'Easy'}</option>
                <option value={3}>3 - {isDe ? 'Mittel' : 'Medium'}</option>
                <option value={4}>4 - {isDe ? 'Schwer' : 'Hard'}</option>
                <option value={5}>5 - {isDe ? 'Meister' : 'Master'}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Fragestellung *' : 'Question Prompt *'}</label>
            <input
              type="text"
              required
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder={isDe ? 'Z.B. Welcher Planet ist der Sonne am nächsten?' : 'E.g. Which planet is closest to the Sun?'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Untertitel / Hinweis-Kontext' : 'Subtitle / Subtext'}</label>
            <input
              type="text"
              value={formSubtext}
              onChange={(e) => setFormSubtext(e.target.value)}
              placeholder={isDe ? 'Z.B. Wähle die richtige Antwort' : 'E.g. Choose the correct answer'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {/* 4 Options & Correct answer Radio */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300">
              {isDe ? 'Antwortoptionen (Markiere die richtige Option grün) *' : 'Options (Select the correct option) *'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                <input
                  type="radio"
                  name="correctOpt"
                  checked={formCorrectIndex === 0}
                  onChange={() => setFormCorrectIndex(0)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <input
                  type="text"
                  required
                  placeholder="Option 1"
                  value={formOpt1}
                  onChange={(e) => setFormOpt1(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                <input
                  type="radio"
                  name="correctOpt"
                  checked={formCorrectIndex === 1}
                  onChange={() => setFormCorrectIndex(1)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <input
                  type="text"
                  required
                  placeholder="Option 2"
                  value={formOpt2}
                  onChange={(e) => setFormOpt2(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                <input
                  type="radio"
                  name="correctOpt"
                  checked={formCorrectIndex === 2}
                  onChange={() => setFormCorrectIndex(2)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Option 3"
                  value={formOpt3}
                  onChange={(e) => setFormOpt3(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                <input
                  type="radio"
                  name="correctOpt"
                  checked={formCorrectIndex === 3}
                  onChange={() => setFormCorrectIndex(3)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Option 4"
                  value={formOpt4}
                  onChange={(e) => setFormOpt4(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Erklärung (nach Beantwortung)' : 'Explanation'}</label>
              <input
                type="text"
                value={formExplanation}
                onChange={(e) => setFormExplanation(e.target.value)}
                placeholder={isDe ? 'Z.B. Merkur ist der innerste Planet des Sonnensystems.' : 'E.g. Mercury is the closest planet to the Sun.'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">{isDe ? 'Tipp / Hilfestellung' : 'Hint'}</label>
              <input
                type="text"
                value={formHint}
                onChange={(e) => setFormHint(e.target.value)}
                placeholder={isDe ? 'Z.B. Er beginnt mit dem Buchstaben M.' : 'E.g. It starts with letter M.'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              {isDe ? 'Abbrechen' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {isDe ? 'Frage speichern' : 'Save Question'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">{isDe ? 'Alle Fächer' : 'All Subjects'}</option>
            <option value="math">🔢 {isDe ? 'Mathematik' : 'Math'}</option>
            <option value="nature">🌿 {isDe ? 'Natur & Wissenschaft' : 'Nature & Science'}</option>
            <option value="geography">🌍 {isDe ? 'Geografie & Welt' : 'Geography & World'}</option>
            <option value="art">🎨 {isDe ? 'Kunst & Musik' : 'Art & Music'}</option>
            <option value="languages">🗣️ {isDe ? 'Sprachen' : 'Languages'}</option>
          </select>

          {/* Grade Level Filter */}
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">{isDe ? 'Alle Stufen' : 'All Grades'}</option>
            <option value="primary">{isDe ? '🎒 Grundstufe' : '🎒 Primary'}</option>
            <option value="high_school">{isDe ? '🎓 Mittelschule' : '🎓 Middle School'}</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDiffFilter}
            onChange={(e) => setSelectedDiffFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">{isDe ? 'Alle Schwierigkeiten (1-5)' : 'All Difficulties (1-5)'}</option>
            <option value="1">⭐ 1: {isDe ? 'Anfänger' : 'Beginner'}</option>
            <option value="2">⭐⭐ 2: {isDe ? 'Leicht' : 'Easy'}</option>
            <option value="3">⭐⭐⭐ 3: {isDe ? 'Mittel' : 'Medium'}</option>
            <option value="4">⭐⭐⭐⭐ 4: {isDe ? 'Schwer' : 'Hard'}</option>
            <option value="5">⭐⭐⭐⭐⭐ 5: {isDe ? 'Meister' : 'Master'}</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isDe ? 'Suche in Fragen...' : 'Search questions...'}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Questions Cards List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold">{isDe ? 'Keine passenden Fragen gefunden.' : 'No matching questions found.'}</p>
            <p className="text-xs text-slate-500">
              {isDe ? 'Passe die Filter an oder generiere neue Fragen mit dem KI-Generator oben.' : 'Adjust your filters or generate new questions with the AI tool above.'}
            </p>
          </div>
        ) : (
          filteredQuestions.map(({ item, isCustom, sourceName }, index) => {
            const diffInfo = getDifficultyLabel(item.difficulty || 2);
            return (
              <div
                key={item.id || index}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCustom
                    ? 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Question details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Source tag */}
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase border ${
                        isCustom
                          ? 'bg-fuchsia-950/80 border-fuchsia-600 text-fuchsia-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {isCustom ? '✨ KI / EIGENE' : sourceName}
                    </span>

                    {/* Grade Level */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                      {item.gradeLevel === 'primary' ? (isDe ? '🎒 Grundstufe' : '🎒 Primary') : (isDe ? '🎓 Mittelschule' : '🎓 Middle School')}
                    </span>

                    {/* Granular Difficulty Badge */}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${diffInfo.color}`}>
                      {diffInfo.text}
                    </span>

                    {item.topic && (
                      <span className="text-[10px] font-mono text-slate-400">
                        #{item.topic}
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {item.question}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = String(opt).trim().toLowerCase() === String(item.correctAnswer).trim().toLowerCase();
                      return (
                        <div
                          key={optIdx}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border truncate ${
                            isCorrect
                              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                          <span className="truncate">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Hint */}
                  {(item.explanation || item.hint) && (
                    <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {item.explanation && (
                        <span>
                          <strong className="text-slate-300">{isDe ? 'Erklärung:' : 'Explanation:'}</strong> {item.explanation}
                        </span>
                      )}
                      {item.hint && (
                        <span>
                          <strong className="text-slate-300">{isDe ? 'Tipp:' : 'Hint:'}</strong> {item.hint}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                  {isCustom ? (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                      title={isDe ? 'Diese Frage löschen' : 'Delete this question'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">
                      {isDe ? 'System-Aufgabe' : 'Core Bank'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
