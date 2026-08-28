export type Language = 'de' | 'en';

export type TargetLearnLanguage = 'en' | 'fr' | 'it' | 'es' | 'de';

export type SubjectArea = 'math' | 'nature' | 'geography' | 'art' | 'languages';

export type GradeLevel = 'primary' | 'high_school';

export type GameMode =
  | 'math_quest'
  | 'speed_sprint'
  | 'survival_hearts'
  | 'boss_battle'
  | 'ai_story'
  | 'classic_color_number'
  | 'memory_matrix'
  | 'speed_stroop'
  | 'nature_quest'
  | 'geo_quest'
  | 'art_quest'
  | 'language_quest'
  | 'vocab_sprint';

export type PrimaryTopic =
  | 'addition_subtraction'
  | 'multiplication_division'
  | 'missing_number'
  | 'fractions_visual'
  | 'number_comparison'
  | 'number_patterns';

export type HighSchoolTopic =
  | 'algebra_linear'
  | 'order_of_operations'
  | 'exponents_roots'
  | 'percentages_ratios'
  | 'quick_quadratics'
  | 'estimation_duel';

export type MathTopic = PrimaryTopic | HighSchoolTopic | 'all';

export type NatureTopic =
  | 'animals_ecosystems'
  | 'plants_botany'
  | 'solar_system_space'
  | 'weather_climate'
  | 'human_body_biology'
  | 'physics_inventions'
  | 'all';

export type GeographyTopic =
  | 'world_capitals'
  | 'flags_countries'
  | 'continents_oceans'
  | 'famous_landmarks'
  | 'mountains_rivers'
  | 'maps_coordinates'
  | 'all';

export type ArtTopic =
  | 'famous_masterpieces'
  | 'color_theory'
  | 'musical_instruments'
  | 'art_movements'
  | 'architecture_world'
  | 'classical_composers'
  | 'all';

export type LanguageTopic =
  | 'basic_vocab'
  | 'food_dining'
  | 'animals_nature'
  | 'travel_city'
  | 'numbers_colors'
  | 'common_phrases'
  | 'grammar_articles'
  | 'grammar_verbs_tenses'
  | 'grammar_plurals'
  | 'grammar_pronouns'
  | 'grammar_sentence_structure'
  | 'all';

export type SubjectTopic = MathTopic | NatureTopic | GeographyTopic | ArtTopic | LanguageTopic;

export interface VisualProblemData {
  type?: 'blocks' | 'grid' | 'pie' | 'comparison' | 'number_line' | 'balance' | 'flag' | 'color_palette' | 'audio_phrase' | 'landmark' | 'science_badge';
  countA?: number;
  countB?: number;
  symbol?: string;
  fractionA?: [number, number];
  fractionB?: [number, number];
  items?: string[];
  flagEmoji?: string;
  flagCode?: string;
  colorHex?: string;
  secondaryHex?: string;
  imagePrompt?: string;
  pronounceText?: string;
  pronounceLang?: string;
  audioHint?: string;
}

export type VisualMathData = VisualProblemData;

export interface ProblemItem {
  id: string;
  subject?: SubjectArea;
  topic: string;
  gradeLevel: GradeLevel;
  difficulty: number; // 1 to 5
  schoolGrade?: number; // 1 to 8 (1. Schulstufe bis 8. Schulstufe)
  targetLanguage?: TargetLearnLanguage;
  question: string;
  subtext?: string;
  visual?: VisualProblemData;
  options: (number | string)[];
  correctAnswer: number | string;
  explanation: string;
  hint: string;
  xp: number;
  coins: number;
  source?: 'built_in' | 'ai_generator' | 'manual' | 'schoolbook_scan';
  scanBatchId?: string;
  scanBatchTitle?: string;
  assignedKidId?: string;
}

export type MathProblem = ProblemItem;

export interface AiQuestStep {
  id: string;
  story: string;
  problem: string;
  correctAnswer: number | string;
  options: (number | string)[];
  hint: string;
  xp: number;
  coins: number;
}

export interface AiQuestPackage {
  questTitle: string;
  theme: string;
  storyIntro: string;
  steps: AiQuestStep[];
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardType: 'coins' | 'gems' | 'xp';
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
}

export interface PowerUpInventory {
  freezeTime: number;
  fiftyFifty: number;
  brainSpark: number;
  doubleStars: number;
  streakShield: number;
}

export interface Badge {
  id: string;
  name?: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'math' | 'speed' | 'streak' | 'quest' | 'brain' | 'nature' | 'geography' | 'art' | 'languages';
  unlocked?: boolean;
  unlockedAt?: string;
  requirement?: number;
  currentValueKey?: string;
}

export interface SubjectStats {
  solved: number;
  correct: number;
  accuracy: number;
  streak: number;
  bestScore: number;
}

export type SkinThemeId =
  | 'cyber_neon'
  | 'cosmic_galaxy'
  | 'emerald_forest'
  | 'sunset_arcade'
  | 'candy_pastel'
  | 'steampunk_gold'
  | 'deep_ocean';

export interface SkinTheme {
  id: SkinThemeId;
  nameDe: string;
  nameEn: string;
  icon: string;
  badge: string;
  descriptionDe: string;
  descriptionEn: string;
  bodyBgClass: string;
  appWrapperClass: string;
  cardBgClass: string;
  borderClass: string;
  accentGradient: string;
  textAccent: string;
  glowColor: string;
  previewColors: string[];
}

export interface ScannedMaterialBatch {
  id: string;
  title: string;
  subject: SubjectArea;
  topic?: string;
  gradeLevel: GradeLevel;
  schoolGrade: number; // 1 to 8 (1. Schulstufe bis 8. Schulstufe)
  difficulty: number; // 1 to 5
  assignedKidId: string; // 'all' or specific kid ID
  createdAt: string;
  questionCount: number;
  extractedSummary?: string;
  sourceBookOrChapter?: string;
}

export interface CustomQuestion extends ProblemItem {
  isCustom?: boolean;
  createdAt?: string;
}

export interface KidProfile {
  id: string;
  name: string;
  avatar: string;
  gradeLevel: GradeLevel;
  schoolGrade?: number; // 1 to 8 (1. Schulstufe bis 8. Schulstufe)
  targetLanguage: TargetLearnLanguage;
  skinId?: SkinThemeId;
  manualDifficulty?: number; // 1 to 5 (mapped to school year / complexity)
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  gems: number;
  streakDays: number;
  lastPlayedDate: string;
  totalSolved: number;
  correctCount: number;
  dailyGoalProblems: number;
  todayProblemsSolved: number;
  todayMinutesPlayed: number;
  highScores: Record<string, number>;
  unlockedBadges?: string[];
  badges: Badge[];
  powerUps: PowerUpInventory;
  dailyQuests: DailyQuest[];
  subjectStats: Record<SubjectArea, SubjectStats>;
  enabledTopics?: Partial<Record<SubjectArea, string[]>>;
  disabledGames?: string[];
}

export type PlayerProfile = KidProfile;

export interface ParentConfig {
  pin: string; // 4-digit PIN e.g. "1234"
  activeKidId: string;
  kids: KidProfile[];
  allowedSubjects: SubjectArea[];
  allowedGameModes: GameMode[];
  dailyTimeLimitMinutes: number; // 0 = unlimited
  enforceDailyGoal: boolean;
  allowShopPurchases: boolean;
}

export interface OpenSpecDoc {
  id: string;
  title: string;
  version: string;
  category: string;
  overview: string;
  acceptanceCriteria: string[];
  components: string[];
  promptTemplate: string;
  schemaJson?: string;
  markdownDoc?: string;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number;
}

