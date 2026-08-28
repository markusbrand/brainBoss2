import React, { useState } from 'react';
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
  Palette,
  Leaf,
  Layers,
} from 'lucide-react';
import {
  GameMode,
  PlayerProfile,
  SubjectArea,
  TargetLearnLanguage,
} from '../../types';
import { MascotBot } from '../MascotBot';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLanguageDisplayName,
  getLanguageFlag,
  speakWord,
  getLangLocale,
} from '../../utils/subjectEngines';

interface MathQuestViewProps {
  profile: PlayerProfile;
  activeSubject?: SubjectArea;
  onSelectSubject?: (subject: SubjectArea) => void;
  onStartGame: (mode: GameMode, topic?: string, subject?: SubjectArea, targetLang?: TargetLearnLanguage) => void;
  onOpenAiStory: () => void;
  onUpdateTargetLanguage?: (lang: TargetLearnLanguage) => void;
}

export const MathQuestView: React.FC<MathQuestViewProps> = ({
  profile,
  activeSubject: initialSubject = 'math',
  onSelectSubject,
  onStartGame,
  onOpenAiStory,
  onUpdateTargetLanguage,
}) => {
  const { t, language } = useLanguage();
  const isGerman = language === 'de';
  const isPrimary = profile.gradeLevel === 'primary';

  const [currentSubject, setCurrentSubject] = useState<SubjectArea>(initialSubject);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [targetLanguage, setTargetLanguage] = useState<TargetLearnLanguage>(
    profile.targetLanguage || (language === 'de' ? 'en' : 'fr')
  );

  const handleSubjectChange = (subj: SubjectArea) => {
    soundFx.playPop();
    setCurrentSubject(subj);
    setSelectedTopic('all');
    if (onSelectSubject) onSelectSubject(subj);
  };

  const handleTargetLanguageChange = (lang: TargetLearnLanguage) => {
    soundFx.playPop();
    setTargetLanguage(lang);
    if (onUpdateTargetLanguage) onUpdateTargetLanguage(lang);
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

  const currentTopicList =
    currentSubject === 'math'
      ? (isPrimary ? mathPrimaryTopics : mathHighSchoolTopics)
      : currentSubject === 'nature'
      ? natureTopics
      : currentSubject === 'geography'
      ? geographyTopics
      : currentSubject === 'art'
      ? artTopics
      : languageTopics;

  const subjectMeta = {
    math: {
      name: t.subjects.math,
      desc: t.subjects.mathDesc,
      icon: '🔢',
      color: 'from-blue-600 to-indigo-600',
      border: 'border-blue-500/40',
      accent: 'text-cyan-300',
      mode: 'math_quest' as GameMode,
    },
    nature: {
      name: t.subjects.nature,
      desc: t.subjects.natureDesc,
      icon: '🌿',
      color: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-500/40',
      accent: 'text-emerald-300',
      mode: 'nature_quest' as GameMode,
    },
    geography: {
      name: t.subjects.geography,
      desc: t.subjects.geographyDesc,
      icon: '🌍',
      color: 'from-cyan-600 to-blue-600',
      border: 'border-cyan-500/40',
      accent: 'text-cyan-300',
      mode: 'geo_quest' as GameMode,
    },
    art: {
      name: t.subjects.art,
      desc: t.subjects.artDesc,
      icon: '🎨',
      color: 'from-fuchsia-600 to-pink-600',
      border: 'border-pink-500/40',
      accent: 'text-pink-300',
      mode: 'art_quest' as GameMode,
    },
    languages: {
      name: t.subjects.languages,
      desc: t.subjects.languagesDesc,
      icon: '🗣️',
      color: 'from-violet-600 to-purple-600',
      border: 'border-violet-500/40',
      accent: 'text-violet-300',
      mode: 'language_quest' as GameMode,
    },
  }[currentSubject];

  const handleLaunchHeroGame = () => {
    soundFx.playPop();
    onStartGame(subjectMeta.mode, selectedTopic, currentSubject, targetLanguage);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 5 Disciplines Master Switcher Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
        {(['math', 'nature', 'geography', 'art', 'languages'] as SubjectArea[]).map((subj) => {
          const isSelected = currentSubject === subj;
          const icon = subj === 'math' ? '🔢' : subj === 'nature' ? '🌿' : subj === 'geography' ? '🌍' : subj === 'art' ? '🎨' : '🗣️';
          const name = t.subjects[subj];

          return (
            <button
              key={subj}
              id={`subject-tab-${subj}`}
              onClick={() => handleSubjectChange(subj)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-linear-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-102 border border-indigo-400/50'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Language Learning Bar (when Languages subject is active) */}
      {currentSubject === 'languages' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                <span>{t.languagesLearning.title}</span>
              </h3>
              <p className="text-xs text-slate-300">{t.languagesLearning.subtitle}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-900/60 border border-violet-700 text-violet-200 text-xs font-mono">
              <span>{t.languagesLearning.motherTongueNote}</span>
              <span className="font-bold">{language === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}</span>
            </div>
          </div>

          {/* Target Language Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs font-semibold text-slate-400 font-mono">
              {t.languagesLearning.targetLanguagePrompt}
            </span>
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-105'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                  </button>
                );
              })}

            <button
              onClick={() => speakWord('Hello, welcome to BrainBoss!', getLangLocale(targetLanguage))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 ml-auto cursor-pointer"
              title="Test Web Speech Audio"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.languagesLearning.audioPronounce}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Quest Mission Banner with Immersive Glow & Accents */}
      <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 border ${subjectMeta.border} p-6 sm:p-8 text-white shadow-[0_0_40px_rgba(99,102,241,0.15)]`}>
        {/* Top Glowing Laser Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Ambient Glow Orbs */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold tracking-widest uppercase">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{subjectMeta.name}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {isPrimary ? t.questView.heroPrimaryTitle : t.questView.heroHighSchoolTitle}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg">
              {subjectMeta.desc}
            </p>

            {/* Quick Launch Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-play-quest-btn"
                onClick={handleLaunchHeroGame}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>{t.questView.launchQuest}</span>
              </button>

              <button
                id="hero-play-ai-story-btn"
                onClick={() => {
                  soundFx.playPop();
                  onOpenAiStory();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-300 font-bold text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>{t.questView.aiStoryQuest}</span>
              </button>
            </div>
          </div>

          {/* Companion Mascot Display in Immersive Capsule */}
          <div className="bg-slate-950/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
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

      {/* Topic Filter Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{t.questView.selectFocus} ({subjectMeta.name})</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {currentTopicList.length - 1} {t.questView.modulesOnline}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {currentTopicList.map((item) => {
            const isSelected = selectedTopic === item.id;
            return (
              <button
                key={item.id}
                id={`topic-chip-${item.id}`}
                onClick={() => {
                  soundFx.playPop();
                  setSelectedTopic(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-cyan-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-105'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Quest Modes Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <span>{t.questView.missionOperations}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode 1: Core Subject Quest */}
          <div
            id="mode-card-subject-quest"
            onClick={handleLaunchHeroGame}
            className="group relative bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-blue-500/60 shadow-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                {subjectMeta.icon}
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                  {currentSubject === 'math'
                    ? t.questView.modeMathQuestTitle
                    : currentSubject === 'nature'
                    ? t.questView.modeNatureQuestTitle
                    : currentSubject === 'geography'
                    ? t.questView.modeGeoQuestTitle
                    : currentSubject === 'art'
                    ? t.questView.modeArtQuestTitle
                    : t.questView.modeLanguageQuestTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isGerman ? 'Adaptiv' : 'Adaptive'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
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

            <div className="pt-4 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>{t.questView.playNow}</span>
              <Play className="w-3.5 h-3.5 fill-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 2: 60s Speed Sprint / Vocab Blitz */}
          <div
            id="mode-card-speed-sprint"
            onClick={() => {
              soundFx.playPop();
              onStartGame(
                currentSubject === 'languages' ? 'vocab_sprint' : 'speed_sprint',
                selectedTopic,
                currentSubject,
                targetLanguage
              );
            }}
            className="group relative bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-amber-500/60 shadow-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-2xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner">
                ⚡
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                  {currentSubject === 'languages'
                    ? t.questView.modeVocabSprintTitle
                    : t.questView.modeSpeedSprintTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> 60s
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentSubject === 'languages'
                  ? t.questView.modeVocabSprintDesc
                  : t.questView.modeSpeedSprintDesc}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>{t.questView.bestSprintScore}: {profile.highScores.speed_sprint || 0} pts</span>
              <Play className="w-3.5 h-3.5 fill-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 3: Survival 3-Hearts */}
          <div
            id="mode-card-survival"
            onClick={() => {
              soundFx.playPop();
              onStartGame('survival_hearts', selectedTopic, currentSubject, targetLanguage);
            }}
            className="group relative bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-rose-500/60 shadow-xl hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-2xl group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
                ❤️
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">
                  {t.questView.modeSurvivalHeartsTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  3 ❤️
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.questView.modeSurvivalHeartsDesc}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-bold text-rose-400">
              <span>{t.questView.startChallenge}</span>
              <Play className="w-3.5 h-3.5 fill-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 4: Boss Battle */}
          <div
            id="mode-card-boss-battle"
            onClick={() => {
              soundFx.playPop();
              onStartGame('boss_battle', selectedTopic, currentSubject, targetLanguage);
            }}
            className="group relative bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-purple-500/60 shadow-xl hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-2xl group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                👑
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                  {t.questView.modeBossBattleTitle}
                </h3>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-purple-400" /> 5 {isGerman ? 'Phasen' : 'Phases'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.questView.modeBossBattleDesc}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-bold text-purple-400">
              <span>{t.questView.duelBoss}</span>
              <Play className="w-3.5 h-3.5 fill-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Classic BrainBoss Cognitive Reflex Games */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {t.questView.brainReflexLabs}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {isGerman
                ? 'Trainiere Kognition, Fokus, Reaktionszeit und das Arbeitsgedächtnis'
                : 'Cognitive reflex, focus, speed, and working memory training modules'}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-xl self-start sm:self-auto">
            {isGerman ? 'NEURO-STIMULATION AKTIV' : 'NEURO-STIMULATION ACTIVE'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Classic Color & Number Rush */}
          <div
            id="brain-game-classic"
            onClick={() => {
              soundFx.playPop();
              onStartGame('classic_color_number');
            }}
            className="group bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-pink-500/60 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="text-2xl">🎯</div>
              <h4 className="font-bold text-white group-hover:text-pink-400 transition-colors">
                {t.questView.modeClassicReflexTitle}
              </h4>
              <p className="text-xs text-slate-400">
                {t.questView.modeClassicReflexDesc}
              </p>
            </div>
            <div className="pt-3 flex items-center justify-between text-xs text-pink-400 font-mono font-bold">
              <span>High: {profile.highScores.classic_color_number || 0}</span>
              <span>{t.questView.playNow} &rarr;</span>
            </div>
          </div>

          {/* Memory Matrix */}
          <div
            id="brain-game-memory"
            onClick={() => {
              soundFx.playPop();
              onStartGame('memory_matrix');
            }}
            className="group bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="text-2xl">🧩</div>
              <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                {t.questView.modeMemoryMatrixTitle}
              </h4>
              <p className="text-xs text-slate-400">
                {t.questView.modeMemoryMatrixDesc}
              </p>
            </div>
            <div className="pt-3 flex items-center justify-between text-xs text-cyan-400 font-mono font-bold">
              <span>{t.nav.level}: {profile.highScores.memory_matrix || 1}</span>
              <span>{t.questView.testMemory} &rarr;</span>
            </div>
          </div>

          {/* Speed Stroop Reflex */}
          <div
            id="brain-game-stroop"
            onClick={() => {
              soundFx.playPop();
              onStartGame('speed_stroop');
            }}
            className="group bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="text-2xl">⚡</div>
              <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.questView.modeSpeedStroopTitle}
              </h4>
              <p className="text-xs text-slate-400">
                {t.questView.modeSpeedStroopDesc}
              </p>
            </div>
            <div className="pt-3 flex items-center justify-between text-xs text-emerald-400 font-mono font-bold">
              <span>High: {profile.highScores.speed_stroop || 0}</span>
              <span>{t.questView.enterLab} &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
