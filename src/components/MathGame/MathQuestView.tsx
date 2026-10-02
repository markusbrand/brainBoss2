import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  BookOpen,
  Target,
  Clock,
  Brain,
  Compass,
  Bot,
  Flame,
  Volume2,
  Globe,
  Sparkles,
  ChevronRight,
  Zap,
  RotateCcw,
  Lock,
  Award,
} from 'lucide-react';
import {
  GameMode,
  ParentConfig,
  PlayerProfile,
  SkinTheme,
  SubjectArea,
  TargetLearnLanguage,
  ChildTest,
} from '../../types';
import { MascotBot } from '../MascotBot';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';
import { getSkinTheme } from '../../utils/skins';
import {
  getLanguageDisplayName,
  getLanguageFlag,
  speakWord,
  getLangLocale,
} from '../../utils/subjectEngines';
import { loadScannedBatches, loadCustomQuestions, DEFAULT_PARENT_CONFIG } from '../../utils/storage';

interface MathQuestViewProps {
  profile: PlayerProfile;
  config?: ParentConfig;
  skin?: SkinTheme;
  activeSubject?: SubjectArea;
  selectedTopic?: string;
  onSelectTopic?: (topic: string) => void;
  onSelectSubject?: (subject: SubjectArea) => void;
  onStartGame: (mode: GameMode, topic?: string, subject?: SubjectArea, targetLang?: TargetLearnLanguage) => void;
  onOpenAiStory: () => void;
  onUpdateTargetLanguage?: (lang: TargetLearnLanguage) => void;
  onStartTest?: (test: ChildTest) => void;
}

export const MathQuestView: React.FC<MathQuestViewProps> = ({
  profile: propProfile,
  config,
  skin: propSkin,
  activeSubject: initialSubject = 'math',
  selectedTopic: propSelectedTopic,
  onSelectTopic,
  onSelectSubject,
  onStartGame,
  onOpenAiStory,
  onUpdateTargetLanguage,
  onStartTest,
}) => {
  const safeProfile: PlayerProfile = propProfile && propProfile.id && propProfile.name
    ? propProfile
    : (config?.kids?.find((k) => k && k.id && k.name) || DEFAULT_PARENT_CONFIG.kids[0]);
  const profile = safeProfile;

  const { t, language } = useLanguage();
  const skin = propSkin || getSkinTheme(safeProfile.skinId);
  const isGerman = language === 'de';
  const isPrimary = safeProfile.gradeLevel === 'primary';

  // High-level hub mode: 'subjects' (Schulfächer) vs 'brain_labs' (Denk- & Reflexspiele)
  const [hubMode, setHubMode] = useState<'subjects' | 'brain_labs'>('subjects');
  const [currentSubject, setCurrentSubject] = useState<SubjectArea>(initialSubject);
  const [selectedTopic, setSelectedTopic] = useState<string>(
    propSelectedTopic || (initialSubject === 'languages' ? 'English Book Unit 1' : 'all')
  );
  const [targetLanguage, setTargetLanguage] = useState<TargetLearnLanguage>(
    safeProfile.targetLanguage || (language === 'de' ? 'en' : 'fr')
  );

  // Sync initialSubject prop changes from outside
  useEffect(() => {
    if (initialSubject && initialSubject !== currentSubject) {
      setCurrentSubject(initialSubject);
    }
  }, [initialSubject]);

  // Sync propSelectedTopic prop changes from outside
  useEffect(() => {
    if (propSelectedTopic && propSelectedTopic !== selectedTopic) {
      setSelectedTopic(propSelectedTopic);
    }
  }, [propSelectedTopic]);

  // When switching to languages (Language Academy), ensure 'English Book Unit 1' is selected
  // if topic is 'all' or empty, so Linus immediately sees the focus topic & quiz!
  useEffect(() => {
    if (currentSubject === 'languages' && (selectedTopic === 'all' || !selectedTopic)) {
      setSelectedTopic('English Book Unit 1');
      if (onSelectTopic) onSelectTopic('English Book Unit 1');
    }
  }, [currentSubject]);

  const handleSubjectChange = (subj: SubjectArea) => {
    soundFx.playPop();
    setCurrentSubject(subj);
    const nextTopic = subj === 'languages' ? 'English Book Unit 1' : 'all';
    setSelectedTopic(nextTopic);
    if (onSelectSubject) onSelectSubject(subj);
    if (onSelectTopic) onSelectTopic(nextTopic);
  };

  const handleTopicChange = (newTopic: string) => {
    soundFx.playPop();
    setSelectedTopic(newTopic);
    if (onSelectTopic) onSelectTopic(newTopic);
  };

  const handleTargetLanguageChange = (lang: TargetLearnLanguage) => {
    soundFx.playPop();
    setTargetLanguage(lang);
    if (onUpdateTargetLanguage) onUpdateTargetLanguage(lang);
  };

  const isModeDisabled = (mode: string): boolean => {
    if (profile.disabledGames && profile.disabledGames.includes(mode as any)) return true;
    if (config?.allowedGameModes && !config.allowedGameModes.includes(mode as any)) return true;
    return false;
  };

  // Topics per Subject
  const mathPrimaryTopics = [
    { id: 'all', name: t.topics.all, icon: '🌟' },
    { id: 'addition_subtraction', name: t.topics.addition_subtraction, icon: '➕➖' },
    { id: 'multiplication_division', name: t.topics.multiplication_division, icon: '✖️➗' },
    { id: 'missing_number', name: t.topics.missing_number, icon: '🧩' },
    { id: 'fractions_visual', name: t.topics.fractions_visual, icon: '🍕' },
    { id: 'number_comparison', name: t.topics.number_comparison, icon: '⚖️' },
    { id: 'number_patterns', name: t.topics.number_patterns, icon: '🔢' },
  ];

  const mathHighSchoolTopics = [
    { id: 'all', name: t.topics.all, icon: '🌌' },
    { id: 'algebra_linear', name: t.topics.algebra_linear, icon: '📐' },
    { id: 'order_of_operations', name: t.topics.order_of_operations, icon: '⚡' },
    { id: 'exponents_roots', name: t.topics.exponents_roots, icon: '💥' },
    { id: 'percentages_ratios', name: t.topics.percentages_ratios, icon: '📊' },
    { id: 'quick_quadratics', name: t.topics.quick_quadratics, icon: '🎯' },
    { id: 'estimation_duel', name: t.topics.estimation_duel, icon: '⏱️' },
  ];

  const natureTopics = [
    { id: 'all', name: t.topics.all, icon: '🌿' },
    { id: 'animals_ecosystems', name: t.topics.animals_ecosystems, icon: '🦁' },
    { id: 'plants_botany', name: t.topics.plants_botany, icon: '🌻' },
    { id: 'solar_system_space', name: t.topics.solar_system_space, icon: '🪐' },
    { id: 'weather_climate', name: t.topics.weather_climate, icon: '🌧️' },
    { id: 'human_body_biology', name: t.topics.human_body_biology, icon: '🫀' },
    { id: 'physics_inventions', name: t.topics.physics_inventions, icon: '⚡' },
  ];

  const geographyTopics = [
    { id: 'all', name: t.topics.all, icon: '🌍' },
    { id: 'world_capitals', name: t.topics.world_capitals, icon: '🏛️' },
    { id: 'flags_countries', name: t.topics.flags_countries, icon: '🚩' },
    { id: 'continents_oceans', name: t.topics.continents_oceans, icon: '🗺️' },
    { id: 'famous_landmarks', name: t.topics.famous_landmarks, icon: '🗼' },
    { id: 'mountains_rivers', name: t.topics.mountains_rivers, icon: '🏔️' },
    { id: 'maps_coordinates', name: t.topics.maps_coordinates, icon: '🧭' },
  ];

  const artTopics = [
    { id: 'all', name: t.topics.all, icon: '🎨' },
    { id: 'famous_masterpieces', name: t.topics.famous_masterpieces, icon: '🖼️' },
    { id: 'color_theory', name: t.topics.color_theory, icon: '🌈' },
    { id: 'musical_instruments', name: t.topics.musical_instruments, icon: '🎻' },
    { id: 'art_movements', name: t.topics.art_movements, icon: '🎭' },
    { id: 'architecture_world', name: t.topics.architecture_world, icon: '🏰' },
    { id: 'classical_composers', name: t.topics.classical_composers, icon: '🎼' },
  ];

  const languageTopics = [
    { id: 'all', name: t.topics.all, icon: '🗣️' },
    { id: 'basic_vocab', name: t.topics.basic_vocab, icon: '👋' },
    { id: 'food_dining', name: t.topics.food_dining, icon: '🍎' },
    { id: 'animals_nature', name: t.topics.animals_nature, icon: '🐱' },
    { id: 'travel_city', name: t.topics.travel_city, icon: '✈️' },
    { id: 'numbers_colors', name: t.topics.numbers_colors, icon: '🎨' },
    { id: 'common_phrases', name: t.topics.common_phrases, icon: '💬' },
    { id: 'grammar_articles', name: t.topics.grammar_articles, icon: '📚' },
    { id: 'grammar_verbs_tenses', name: t.topics.grammar_verbs_tenses, icon: '⏱️' },
    { id: 'grammar_sentence_structure', name: t.topics.grammar_sentence_structure, icon: '🧩' },
    { id: 'grammar_adjectives_prepositions', name: t.topics.grammar_adjectives_prepositions, icon: '🧭' },
  ];

  // Dynamically load custom focus topics for active subject from scanned batches, custom questions & tests
  const customFocusTopics = useMemo(() => {
    const batches = loadScannedBatches();
    const customQuestions = loadCustomQuestions();
    const configTests = config?.tests || [];

    const foundTopics = new Map<
      string,
      { id: string; name: string; icon: string; isCustom: boolean; badge?: string; count?: number }
    >();

    // 1. Scanned Batches
    (batches || []).filter(Boolean).forEach((b) => {
      if (b && b.subject === currentSubject && b.topic) {
        if (!b.assignedKidId || b.assignedKidId === 'all' || b.assignedKidId === safeProfile.id) {
          foundTopics.set(b.topic, {
            id: b.topic,
            name: b.topic,
            icon: '📖',
            isCustom: true,
            badge: isGerman ? 'Schulbuch' : 'Textbook',
            count: b.extractedQuestionsCount,
          });
        }
      }
    });

    // 2. Custom Questions
    (customQuestions || []).filter(Boolean).forEach((q) => {
      if (q && q.subject === currentSubject && q.topic && !foundTopics.has(q.topic)) {
        if (!q.assignedKidId || q.assignedKidId === 'all' || q.assignedKidId === safeProfile.id) {
          foundTopics.set(q.topic, {
            id: q.topic,
            name: q.topic,
            icon: '📖',
            isCustom: true,
            badge: isGerman ? 'Fokus' : 'Focus',
          });
        }
      }
    });

    // 3. Tests
    (configTests || []).filter(Boolean).forEach((t) => {
      if (t && t.subject === currentSubject && t.topic && !foundTopics.has(t.topic)) {
        if (t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(safeProfile.id)) {
          foundTopics.set(t.topic, {
            id: t.topic,
            name: t.topic,
            icon: '🏆',
            isCustom: true,
            badge: isGerman ? 'Schultest' : 'School Test',
            count: t.questions?.length,
          });
        }
      }
    });

    // Always ensure English Book Unit 1 is present in Language Academy
    if (currentSubject === 'languages' && !foundTopics.has('English Book Unit 1')) {
      foundTopics.set('English Book Unit 1', {
        id: 'English Book Unit 1',
        name: 'English Book Unit 1',
        icon: '📖',
        isCustom: true,
        badge: isGerman ? '1. Schultest' : '1st Test',
        count: 8,
      });
    }

    return Array.from(foundTopics.values()).filter((item) => Boolean(item && item.id && item.name));
  }, [currentSubject, safeProfile.id, config, isGerman]);

  const baseTopicList =
    currentSubject === 'math'
      ? (isPrimary ? mathPrimaryTopics : mathHighSchoolTopics)
      : currentSubject === 'nature'
      ? natureTopics
      : currentSubject === 'geography'
      ? geographyTopics
      : currentSubject === 'art'
      ? artTopics
      : languageTopics;

  // Insert custom focus topics right after the 'all' topic!
  const currentTopicList = useMemo(() => {
    const safeBase = (baseTopicList || []).filter((t) => Boolean(t && t.id && t.name));
    const safeCustom = (customFocusTopics || []).filter((t) => Boolean(t && t.id && t.name));
    const allTopic = safeBase.find((t) => t.id === 'all') || { id: 'all', name: t.topics.all, icon: '🌟' };
    const otherTopics = safeBase.filter((t) => t.id !== 'all');
    return [allTopic, ...safeCustom, ...otherTopics].filter((item) => Boolean(item && item.id && item.name));
  }, [baseTopicList, customFocusTopics, t.topics.all]);

  // Check if an official test is available for the currently selected topic or active subject
  const matchingTestForSelectedTopic = useMemo(() => {
    const tests = (config?.tests || []).filter((t) => Boolean(t && t.id));
    // 1. If a specific topic is selected, find exact or title match
    if (selectedTopic !== 'all') {
      const match = tests.find(
        (t) =>
          t &&
          t.subject === currentSubject &&
          (t.topic?.toLowerCase() === selectedTopic.toLowerCase() ||
            (t.title && t.title.toLowerCase().includes(selectedTopic.toLowerCase()))) &&
          (t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(safeProfile.id))
      );
      if (match) return match;
    }
    // 2. In Language Academy (or if focus topic has a test), find the primary official test
    if (currentSubject === 'languages') {
      return (
        tests.find(
          (t) =>
            t &&
            t.subject === 'languages' &&
            (t.topic === 'English Book Unit 1' || (t.title && (t.title.toLowerCase().includes('english') || t.title.toLowerCase().includes('unit 1')))) &&
            (t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(safeProfile.id))
        ) ||
        tests.find(
          (t) =>
            t &&
            t.subject === 'languages' &&
            (t.assignedKidIds?.includes('all') || t.assignedKidIds?.includes(safeProfile.id))
        ) || null
      );
    }
    return null;
  }, [selectedTopic, currentSubject, config?.tests, safeProfile.id]);

  const subjectMeta = {
    math: {
      name: t.subjects.math,
      desc: t.subjects.mathDesc,
      icon: '🔢',
      bgGradient: 'from-blue-600/30 via-indigo-600/20 to-slate-900',
      border: 'border-blue-500/40',
      accent: 'text-cyan-300',
      tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      mode: 'math_quest' as GameMode,
    },
    nature: {
      name: t.subjects.nature,
      desc: t.subjects.natureDesc,
      icon: '🌿',
      bgGradient: 'from-emerald-600/30 via-teal-600/20 to-slate-900',
      border: 'border-emerald-500/40',
      accent: 'text-emerald-300',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      mode: 'nature_quest' as GameMode,
    },
    geography: {
      name: t.subjects.geography,
      desc: t.subjects.geographyDesc,
      icon: '🌍',
      bgGradient: 'from-cyan-600/30 via-sky-600/20 to-slate-900',
      border: 'border-cyan-500/40',
      accent: 'text-cyan-300',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      mode: 'geo_quest' as GameMode,
    },
    art: {
      name: t.subjects.art,
      desc: t.subjects.artDesc,
      icon: '🎨',
      bgGradient: 'from-fuchsia-600/30 via-pink-600/20 to-slate-900',
      border: 'border-pink-500/40',
      accent: 'text-pink-300',
      tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      mode: 'art_quest' as GameMode,
    },
    languages: {
      name: t.subjects.languages,
      desc: t.subjects.languagesDesc,
      icon: '🗣️',
      bgGradient: 'from-violet-600/30 via-purple-600/20 to-slate-900',
      border: 'border-violet-500/40',
      accent: 'text-violet-300',
      tagColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      mode: 'language_quest' as GameMode,
    },
  }[currentSubject];

  const handleLaunchHeroGame = () => {
    soundFx.playPop();
    onStartGame(subjectMeta.mode, selectedTopic, currentSubject, targetLanguage);
  };

  const selectedTopicName = currentTopicList.find((t) => t.id === selectedTopic)?.name || t.topics.all;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Segmented Navigation Switcher: Schulfächer vs. Denkspiele */}
      <div
        className="flex items-center justify-center p-1.5 rounded-2xl shadow-lg max-w-md mx-auto border transition-all"
        style={{
          backgroundColor: skin.cardBg,
          borderColor: skin.cardBorder,
        }}
      >
        <button
          id="hub-tab-subjects"
          onClick={() => {
            soundFx.playPop();
            setHubMode('subjects');
          }}
          style={
            hubMode === 'subjects'
              ? {
                  background: skin.tabActiveGradient,
                  borderColor: skin.tabActiveBorder,
                  boxShadow: skin.tabActiveGlow,
                  color: skin.tabActiveText,
                }
              : {
                  color: skin.tabInactiveText,
                }
          }
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
            hubMode === 'subjects'
              ? 'scale-[1.02]'
              : 'border-transparent hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.hubTabs.subjects}</span>
        </button>
        <button
          id="hub-tab-brain-labs"
          onClick={() => {
            soundFx.playPop();
            setHubMode('brain_labs');
          }}
          style={
            hubMode === 'brain_labs'
              ? {
                  background: skin.tabActiveGradient,
                  borderColor: skin.tabActiveBorder,
                  boxShadow: skin.tabActiveGlow,
                  color: skin.tabActiveText,
                }
              : {
                  color: skin.tabInactiveText,
                }
          }
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
            hubMode === 'brain_labs'
              ? 'scale-[1.02]'
              : 'border-transparent hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>{t.hubTabs.brainLabs}</span>
        </button>
      </div>

      {hubMode === 'subjects' ? (
        /* ==================== SCHULFÄCHER & QUESTS ==================== */
        <div className="space-y-4 sm:space-y-6">
          {/* 5 Subjects Pill Bar */}
          <div
            className="p-1.5 rounded-2xl shadow-md flex items-center gap-1.5 overflow-x-auto no-scrollbar border transition-all"
            style={{
              backgroundColor: skin.cardBg,
              borderColor: skin.cardBorder,
            }}
          >
            {(['math', 'nature', 'geography', 'art', 'languages'] as SubjectArea[]).map((subj) => {
              const isSelected = currentSubject === subj;
              const icon =
                subj === 'math'
                  ? '🔢'
                  : subj === 'nature'
                  ? '🌿'
                  : subj === 'geography'
                  ? '🌍'
                  : subj === 'art'
                  ? '🎨'
                  : '🗣️';
              const name = t.subjects[subj];

              return (
                <button
                  key={subj}
                  id={`subject-tab-${subj}`}
                  onClick={() => handleSubjectChange(subj)}
                  style={
                    isSelected
                      ? {
                          background: skin.tabActiveGradient,
                          borderColor: skin.tabActiveBorder,
                          boxShadow: skin.tabActiveGlow,
                          color: skin.tabActiveText,
                        }
                      : {
                          backgroundColor: skin.tabInactiveBg,
                          borderColor: skin.tabInactiveBorder,
                          color: skin.tabInactiveText,
                        }
                  }
                  className={`flex-1 min-w-[95px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                >
                  <span className="text-base sm:text-lg">{icon}</span>
                  <span className="truncate">{name}</span>
                </button>
              );
            })}
          </div>

          {/* Language Learning Bar (Only shown when Languages subject is active) */}
          {currentSubject === 'languages' && (
            <div
              className="p-3.5 sm:p-4 rounded-2xl border shadow-md space-y-2.5 transition-all"
              style={{
                backgroundColor: skin.cardBg,
                borderColor: skin.cardBorder,
              }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: skin.highlightAccent }} />
                  <span className="text-xs font-bold text-white">
                    {t.languagesLearning.targetLanguagePrompt}
                  </span>
                </div>
                <button
                  onClick={() => speakWord('Hello, welcome to BrainBoss!', getLangLocale(targetLanguage))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: skin.secondaryButtonBg,
                    borderColor: skin.secondaryButtonBorder,
                    color: skin.secondaryButtonText,
                  }}
                  title="Audio Test"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.languagesLearning.audioPronounce}</span>
                </button>
              </div>

              {/* Target Language Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['en', 'fr', 'it', 'es', 'de'] as TargetLearnLanguage[])
                  .filter((lang) => lang !== language)
                  .map((lang) => {
                    const isSelected = targetLanguage === lang;
                    const flag = getLanguageFlag(lang);
                    const name = getLanguageDisplayName(lang, language);
                    return (
                      <button
                        key={lang}
                        onClick={() => handleTargetLanguageChange(lang)}
                        style={
                          isSelected
                            ? {
                                background: skin.tabActiveGradient,
                                borderColor: skin.tabActiveBorder,
                                boxShadow: skin.tabActiveGlow,
                                color: skin.tabActiveText,
                              }
                            : {
                                backgroundColor: skin.tabInactiveBg,
                                borderColor: skin.tabInactiveBorder,
                                color: skin.tabInactiveText,
                              }
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                      >
                        <span>{flag}</span>
                        <span>{name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Clean Quick Start & Focus Hero Card */}
          <div
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-7 text-white shadow-xl transition-all"
            style={{
              background: skin.heroGradient,
              borderColor: skin.heroBorder,
              boxShadow: `0 0 35px ${skin.glowRgba}`,
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-3 max-w-xl">
                {/* Active Subject & Grade Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border"
                    style={{
                      backgroundColor: skin.badgeBg,
                      borderColor: skin.badgeText,
                      color: skin.badgeText,
                    }}
                  >
                    <span>{subjectMeta.icon}</span>
                    <span>{subjectMeta.name}</span>
                  </span>
                  <span className="text-xs text-slate-300/80 font-mono">
                    {profile.schoolGrade ? `${profile.schoolGrade}. Schulstufe` : (isPrimary ? 'Grundstufe (1-4)' : 'Mittelschule (5-8)')}
                  </span>
                </div>

                {/* Main Headline */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {subjectMeta.desc}
                </h2>

                {/* Topic Selector Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <BookOpen className="w-3.5 h-3.5" style={{ color: skin.highlightAccent }} />
                    <span>Fokus-Thema:</span>
                    <span className="font-bold" style={{ color: skin.highlightAccent }}>
                      {selectedTopicName}
                    </span>
                    {(selectedTopic === 'English Book Unit 1' || currentTopicList.find((t) => t.id === selectedTopic)?.isCustom) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        📖 Schulbuch-Fokus
                      </span>
                    )}
                  </div>

                  {/* Horizontal Scrollable Topic Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {currentTopicList.map((item: any) => {
                      const isSelected = selectedTopic === item.id;
                      const isCustomTopic = item.isCustom || item.id === 'English Book Unit 1';

                      return (
                        <button
                          key={item.id}
                          id={`topic-chip-${item.id}`}
                          onClick={() => handleTopicChange(item.id)}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: isCustomTopic ? 'rgba(245, 158, 11, 0.25)' : skin.chipActiveBg,
                                  borderColor: isCustomTopic ? '#f59e0b' : skin.chipActiveBorder,
                                  color: isCustomTopic ? '#fbbf24' : skin.chipActiveText,
                                  boxShadow: isCustomTopic ? '0 0 15px rgba(245, 158, 11, 0.5)' : `0 0 12px ${skin.glowRgba}`,
                                }
                              : {
                                  backgroundColor: isCustomTopic ? 'rgba(30, 27, 75, 0.6)' : skin.tabInactiveBg,
                                  borderColor: isCustomTopic ? 'rgba(245, 158, 11, 0.4)' : skin.tabInactiveBorder,
                                  color: isCustomTopic ? '#fcd34d' : skin.tabInactiveText,
                                }
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                            isSelected ? 'scale-[1.03] ring-1 ring-amber-400/40' : 'hover:scale-[1.01]'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          {isCustomTopic && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                              {item.badge || 'Buch'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Official Test Card Banner when Focus Topic has an assigned test */}
                {matchingTestForSelectedTopic && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 shadow-lg space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-base">
                          🏆
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-amber-200">
                              {matchingTestForSelectedTopic.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-400/40 text-amber-300">
                              Offizieller Test
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {matchingTestForSelectedTopic.questions.length} Fragen • {matchingTestForSelectedTopic.timeLimitMinutes > 0 ? `${matchingTestForSelectedTopic.timeLimitMinutes} Min.` : 'Kein Zeitlimit'} • Belohnung: +{matchingTestForSelectedTopic.rewardXp || 150} XP
                          </p>
                        </div>
                      </div>

                      {onStartTest && (
                        <button
                          type="button"
                          id="btn-start-focus-topic-test"
                          onClick={() => {
                            soundFx.playCorrect();
                            onStartTest(matchingTestForSelectedTopic);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Award className="w-4 h-4 fill-slate-950" />
                          <span>🏆 Schultest / Quiz starten</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Launch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    id="hero-play-quest-btn"
                    onClick={handleLaunchHeroGame}
                    style={{
                      background: skin.primaryButtonGradient,
                      color: skin.primaryButtonText,
                      borderColor: skin.primaryButtonBorder,
                      boxShadow: skin.primaryButtonGlow,
                    }}
                    className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border font-black text-sm sm:text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{selectedTopic === 'English Book Unit 1' ? '▶️ Übungs-Quest starten (Unit 1)' : t.questView.launchQuest}</span>
                  </button>

                  <button
                    id="hero-play-ai-story-btn"
                    onClick={() => {
                      soundFx.playPop();
                      onOpenAiStory();
                    }}
                    style={{
                      backgroundColor: skin.secondaryButtonBg,
                      borderColor: skin.secondaryButtonBorder,
                      color: skin.secondaryButtonText,
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-xl border font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{t.questView.aiStoryQuest}</span>
                  </button>
                </div>
              </div>

              {/* Compact Mascot Companion */}
              <div
                className="border backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col items-center shrink-0 self-center md:self-auto"
                style={{
                  backgroundColor: skin.modeCardBg,
                  borderColor: skin.modeCardBorder,
                }}
              >
                <MascotBot
                  mood="cheering"
                  speechText={
                    isPrimary
                      ? t.questView.mascotPrimary(profile.level)
                      : t.questView.mascotHighSchool(profile.level)
                  }
                />
              </div>
            </div>
          </div>

          {/* Game Modes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2"
                style={{ color: skin.highlightAccent }}
              >
                <Target className="w-4 h-4" />
                <span>{t.hubTabs.chooseMode}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">


              {/* Mode 1: Core Subject Quest */}
              <div
                id="mode-card-subject-quest"
                onClick={handleLaunchHeroGame}
                style={{
                  backgroundColor: skin.modeCardBg,
                  borderColor: skin.modeCardBorder,
                }}
                className="group relative rounded-2xl p-4 sm:p-5 border hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                      style={{
                        backgroundColor: skin.accentSubtle,
                        borderColor: skin.cardBorder,
                        color: skin.highlightAccent,
                      }}
                    >
                      {subjectMeta.icon}
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: skin.badgeBg,
                        borderColor: skin.badgeText,
                        color: skin.badgeText,
                      }}
                    >
                      {isGerman ? 'Adaptiv' : 'Adaptive'}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-amber-200 transition-colors">
                    {currentSubject === 'math'
                      ? t.questView.modeMathQuestTitle
                      : currentSubject === 'nature'
                      ? t.questView.modeNatureQuestTitle
                      : currentSubject === 'geography'
                      ? t.questView.modeGeoQuestTitle
                      : currentSubject === 'art'
                      ? t.questView.modeArtQuestTitle
                      : t.questView.modeLanguageQuestTitle}
                  </h4>
                  <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                    {currentSubject === 'math'
                      ? t.questView.modeMathQuestDesc
                      : currentSubject === 'nature'
                      ? t.questView.modeNatureQuestDesc
                      : currentSubject === 'geography'
                      ? t.questView.modeGeoQuestDesc
                      : currentSubject === 'art'
                      ? t.questView.modeArtQuestDesc
                      : t.questView.modeLanguageQuestDesc}
                  </p>
                </div>

                <div
                  className="pt-3 flex items-center justify-between text-xs font-bold"
                  style={{ color: skin.highlightAccent }}
                >
                  <span>{t.questView.playNow}</span>
                  <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              {/* Mode 2: 60s Speed Sprint / Vocab Blitz */}
              {(() => {
                const sprintMode = currentSubject === 'languages' ? 'vocab_sprint' : 'speed_sprint';
                const isSprintDisabled = isModeDisabled(sprintMode);
                return (
                  <div
                    id="mode-card-speed-sprint"
                    onClick={() => {
                      if (isSprintDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame(sprintMode, selectedTopic, currentSubject, targetLanguage);
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group relative rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-lg ${
                      isSprintDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isSprintDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '⚡'}
                        </div>
                        <span
                          className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            backgroundColor: skin.badgeBg,
                            borderColor: skin.badgeText,
                            color: skin.badgeText,
                          }}
                        >
                          {isSprintDisabled ? 'Gesperrt' : <><Clock className="w-2.5 h-2.5" /> 60s</>}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-amber-200 transition-colors">
                        {currentSubject === 'languages'
                          ? t.questView.modeVocabSprintTitle
                          : t.questView.modeSpeedSprintTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                        {isSprintDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : currentSubject === 'languages'
                          ? t.questView.modeVocabSprintDesc
                          : t.questView.modeSpeedSprintDesc}
                      </p>
                    </div>

                    <div
                      className="pt-3 flex items-center justify-between text-xs font-bold"
                      style={{ color: skin.highlightAccent }}
                    >
                      <span>{isSprintDisabled ? 'Deaktiviert' : `High: ${profile.highScores.speed_sprint || 0} pts`}</span>
                      {!isSprintDisabled && <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </div>
                );
              })()}

              {/* Mode 3: Survival 3-Hearts */}
              {(() => {
                const isSurvivalDisabled = isModeDisabled('survival_hearts');
                return (
                  <div
                    id="mode-card-survival"
                    onClick={() => {
                      if (isSurvivalDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame('survival_hearts', selectedTopic, currentSubject, targetLanguage);
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group relative rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-lg ${
                      isSurvivalDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isSurvivalDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '❤️'}
                        </div>
                        <span
                          className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: skin.badgeBg,
                            borderColor: skin.badgeText,
                            color: skin.badgeText,
                          }}
                        >
                          {isSurvivalDisabled ? 'Gesperrt' : '3 ❤️'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">
                        {t.questView.modeSurvivalHeartsTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                        {isSurvivalDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : t.questView.modeSurvivalHeartsDesc}
                      </p>
                    </div>

                    <div
                      className="pt-3 flex items-center justify-between text-xs font-bold"
                      style={{ color: skin.highlightAccent }}
                    >
                      <span>{isSurvivalDisabled ? 'Deaktiviert' : t.questView.startChallenge}</span>
                      {!isSurvivalDisabled && <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </div>
                );
              })()}

              {/* Mode 4: Boss Battle */}
              {(() => {
                const isBossDisabled = isModeDisabled('boss_battle');
                return (
                  <div
                    id="mode-card-boss-battle"
                    onClick={() => {
                      if (isBossDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame('boss_battle', selectedTopic, currentSubject, targetLanguage);
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group relative rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-lg ${
                      isBossDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isBossDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '👑'}
                        </div>
                        <span
                          className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            backgroundColor: skin.badgeBg,
                            borderColor: skin.badgeText,
                            color: skin.badgeText,
                          }}
                        >
                          {isBossDisabled ? 'Gesperrt' : <><Flame className="w-2.5 h-2.5 text-purple-400" /> 5 {isGerman ? 'Phasen' : 'Phases'}</>}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                        {t.questView.modeBossBattleTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                        {isBossDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : t.questView.modeBossBattleDesc}
                      </p>
                    </div>

                    <div
                      className="pt-3 flex items-center justify-between text-xs font-bold"
                      style={{ color: skin.highlightAccent }}
                    >
                      <span>{isBossDisabled ? 'Deaktiviert' : t.questView.duelBoss}</span>
                      {!isBossDisabled && <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== DENK- & REFLEXSPIELE (BRAIN LABS) ==================== */
        <div className="space-y-4 sm:space-y-6">
          <div
            className="rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 border transition-all"
            style={{
              backgroundColor: skin.cardBg,
              borderColor: skin.cardBorder,
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" style={{ color: skin.highlightAccent }} />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {t.questView.brainReflexLabs}
                </h3>
              </div>
              <p className="text-xs text-slate-300/80 mt-1">
                {isGerman
                  ? 'Trainiere Kognition, Fokus, Reaktionszeit und das visuelle Arbeitsgedächtnis'
                  : 'Cognitive reflex, focus, speed, and working memory training modules'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Classic Color & Number Rush */}
              {(() => {
                const isClassicDisabled = isModeDisabled('classic_color_number');
                return (
                  <div
                    id="brain-game-classic"
                    onClick={() => {
                      if (isClassicDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame('classic_color_number');
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md ${
                      isClassicDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isClassicDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '🎯'}
                        </div>
                        {isClassicDisabled && (
                          <span
                            className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: skin.badgeBg,
                              borderColor: skin.badgeText,
                              color: skin.badgeText,
                            }}
                          >
                            Gesperrt
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-amber-200 transition-colors">
                        {t.questView.modeClassicReflexTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {isClassicDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : t.questView.modeClassicReflexDesc}
                      </p>
                    </div>
                    <div
                      className="pt-4 flex items-center justify-between text-xs font-mono font-bold border-t mt-3"
                      style={{
                        borderColor: skin.cardBorder,
                        color: skin.highlightAccent,
                      }}
                    >
                      <span>{isClassicDisabled ? 'Deaktiviert' : `High: ${profile.highScores.classic_color_number || 0} pts`}</span>
                      <span>{isClassicDisabled ? '' : `${t.questView.playNow} →`}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Memory Matrix */}
              {(() => {
                const isMemoryDisabled = isModeDisabled('memory_matrix');
                return (
                  <div
                    id="brain-game-memory"
                    onClick={() => {
                      if (isMemoryDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame('memory_matrix');
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md ${
                      isMemoryDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isMemoryDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '🧩'}
                        </div>
                        {isMemoryDisabled && (
                          <span
                            className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: skin.badgeBg,
                              borderColor: skin.badgeText,
                              color: skin.badgeText,
                            }}
                          >
                            Gesperrt
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-amber-200 transition-colors">
                        {t.questView.modeMemoryMatrixTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {isMemoryDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : t.questView.modeMemoryMatrixDesc}
                      </p>
                    </div>
                    <div
                      className="pt-4 flex items-center justify-between text-xs font-mono font-bold border-t mt-3"
                      style={{
                        borderColor: skin.cardBorder,
                        color: skin.highlightAccent,
                      }}
                    >
                      <span>{isMemoryDisabled ? 'Deaktiviert' : `Level ${profile.highScores.memory_matrix || 1}`}</span>
                      <span>{isMemoryDisabled ? '' : `${t.questView.testMemory} →`}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Speed Stroop Reflex */}
              {(() => {
                const isStroopDisabled = isModeDisabled('speed_stroop');
                return (
                  <div
                    id="brain-game-stroop"
                    onClick={() => {
                      if (isStroopDisabled) {
                        soundFx.playWrong();
                        return;
                      }
                      soundFx.playPop();
                      onStartGame('speed_stroop');
                    }}
                    style={{
                      backgroundColor: skin.modeCardBg,
                      borderColor: skin.modeCardBorder,
                    }}
                    className={`group border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md ${
                      isStroopDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform border"
                          style={{
                            backgroundColor: skin.accentSubtle,
                            borderColor: skin.cardBorder,
                          }}
                        >
                          {isStroopDisabled ? <Lock className="w-5 h-5 text-slate-500" /> : '⚡'}
                        </div>
                        {isStroopDisabled && (
                          <span
                            className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: skin.badgeBg,
                              borderColor: skin.badgeText,
                              color: skin.badgeText,
                            }}
                          >
                            Gesperrt
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-amber-200 transition-colors">
                        {t.questView.modeSpeedStroopTitle}
                      </h4>
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {isStroopDisabled
                          ? 'In Eltern-Konfiguration für dieses Kind deaktiviert.'
                          : t.questView.modeSpeedStroopDesc}
                      </p>
                    </div>
                    <div
                      className="pt-4 flex items-center justify-between text-xs font-mono font-bold border-t mt-3"
                      style={{
                        borderColor: skin.cardBorder,
                        color: skin.highlightAccent,
                      }}
                    >
                      <span>{isStroopDisabled ? 'Deaktiviert' : `High: ${profile.highScores.speed_stroop || 0} pts`}</span>
                      <span>{isStroopDisabled ? '' : `${t.questView.playNow} →`}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
