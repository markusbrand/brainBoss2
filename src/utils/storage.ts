import {
  Badge,
  CustomQuestion,
  DailyQuest,
  GameMode,
  KidProfile,
  ParentConfig,
  PlayerProfile,
  ScannedMaterialBatch,
  SkinThemeId,
  SubjectArea,
  AuthorizedUser,
  ChildTask,
  ChildTest,
  TestSubmission,
  UserProfile,
  UserRole,
} from '../types';
import { db, initFirebaseAuth, getFamilySyncKey, SUPER_ADMIN_EMAIL } from '../lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_PARENT = 'brainboss_parent_config_v3';
const STORAGE_KEY_LEGACY = 'brainboss_player_profile_v2';
const STORAGE_KEY_CUSTOM_QUESTIONS = 'brainboss_custom_questions_v1';
const STORAGE_KEY_SCANNED_BATCHES = 'brainboss_scanned_batches_v1';

// Debounced background sync with Firebase Firestore and optional PostgreSQL backend
let syncTimer: any = null;

export const triggerRemoteDbSync = () => {
  if (typeof window === 'undefined') return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const parentConfig = loadParentConfig();
      const customQuestions = loadCustomQuestions();
      const scannedBatches = loadScannedBatches();

      // 1. Sync to Firebase Firestore
      try {
        await initFirebaseAuth();
        const familyKey = getFamilySyncKey();
        const configDocRef = doc(db, 'parent_configs', familyKey);
        await setDoc(configDocRef, {
          ...parentConfig,
          familyId: familyKey,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const questionsDocRef = doc(db, 'custom_questions', familyKey);
        await setDoc(questionsDocRef, {
          familyId: familyKey,
          items: customQuestions,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const batchesDocRef = doc(db, 'scanned_batches', familyKey);
        await setDoc(batchesDocRef, {
          familyId: familyKey,
          items: scannedBatches,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('[Firebase Sync] Firestore background sync note:', firestoreErr);
      }

      // 2. Fallback / dual sync with PostgreSQL backend (if running in Docker)
      await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentConfig, customQuestions, scannedBatches }),
      });
    } catch {
      // Offline fallback: keep localStorage intact
    }
  }, 1200);
};

export const fetchRemoteDbData = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  let hasUpdates = false;

  // 1. Try fetching from Firebase Firestore first
  try {
    await initFirebaseAuth();
    const familyKey = getFamilySyncKey();
    const configDocRef = doc(db, 'parent_configs', familyKey);
    const configSnap = await getDoc(configDocRef);

    if (configSnap.exists()) {
      const remoteConfig = configSnap.data() as ParentConfig;
      if (remoteConfig && remoteConfig.kids && remoteConfig.kids.length > 0) {
        localStorage.setItem(STORAGE_KEY_PARENT, JSON.stringify(remoteConfig));
        hasUpdates = true;
      }
    }

    const questionsDocRef = doc(db, 'custom_questions', familyKey);
    const questionsSnap = await getDoc(questionsDocRef);
    if (questionsSnap.exists()) {
      const data = questionsSnap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(data.items));
        hasUpdates = true;
      }
    }

    const batchesDocRef = doc(db, 'scanned_batches', familyKey);
    const batchesSnap = await getDoc(batchesDocRef);
    if (batchesSnap.exists()) {
      const data = batchesSnap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        localStorage.setItem(STORAGE_KEY_SCANNED_BATCHES, JSON.stringify(data.items));
        hasUpdates = true;
      }
    }

    if (hasUpdates) return true;
  } catch (firestoreErr) {
    console.warn('[Firebase Load] Note:', firestoreErr);
  }

  // 2. Try fetching from PostgreSQL / Express server
  try {
    const res = await fetch('/api/db/sync');
    if (!res.ok) return hasUpdates;
    const json = await res.json();
    if (!json.success || !json.data) return hasUpdates;

    const { parentConfig, customQuestions, scannedBatches } = json.data;

    if (parentConfig && parentConfig.kids && parentConfig.kids.length > 0) {
      localStorage.setItem(STORAGE_KEY_PARENT, JSON.stringify(parentConfig));
      hasUpdates = true;
    }

    if (Array.isArray(customQuestions) && customQuestions.length > 0) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(customQuestions));
      hasUpdates = true;
    }

    if (Array.isArray(scannedBatches) && scannedBatches.length > 0) {
      localStorage.setItem(STORAGE_KEY_SCANNED_BATCHES, JSON.stringify(scannedBatches));
      hasUpdates = true;
    }

    return hasUpdates;
  } catch {
    return hasUpdates;
  }
};

export const loadScannedBatches = (): ScannedMaterialBatch[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCANNED_BATCHES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load scanned batches:', err);
  }
  return [];
};

export const saveScannedBatches = (batches: ScannedMaterialBatch[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SCANNED_BATCHES, JSON.stringify(batches));
    triggerRemoteDbSync();
  } catch (err) {
    console.error('Failed to save scanned batches:', err);
  }
};

export const addScannedBatchWithQuestions = (
  batch: ScannedMaterialBatch,
  questions: CustomQuestion[]
): { batches: ScannedMaterialBatch[]; questions: CustomQuestion[] } => {
  const currentBatches = loadScannedBatches();
  const updatedBatches = [batch, ...currentBatches.filter((b) => b.id !== batch.id)];
  saveScannedBatches(updatedBatches);

  const currentQuestions = loadCustomQuestions();
  const formattedQuestions = questions.map((q) => ({
    ...q,
    source: 'schoolbook_scan' as const,
    scanBatchId: batch.id,
    scanBatchTitle: batch.title,
    assignedKidId: batch.assignedKidId,
    isCustom: true,
    createdAt: q.createdAt || new Date().toISOString(),
  }));

  const updatedQuestions = [...formattedQuestions, ...currentQuestions.filter((q) => q.scanBatchId !== batch.id)];
  saveCustomQuestions(updatedQuestions);

  return { batches: updatedBatches, questions: updatedQuestions };
};

export const deleteScannedBatch = (batchId: string): { batches: ScannedMaterialBatch[]; questions: CustomQuestion[] } => {
  const currentBatches = loadScannedBatches();
  const updatedBatches = currentBatches.filter((b) => b.id !== batchId);
  saveScannedBatches(updatedBatches);

  const currentQuestions = loadCustomQuestions();
  const updatedQuestions = currentQuestions.filter((q) => q.scanBatchId !== batchId);
  saveCustomQuestions(updatedQuestions);

  return { batches: updatedBatches, questions: updatedQuestions };
};

export const updateScannedBatchAssignment = (
  batchId: string,
  newAssignedKidId: string
): { batches: ScannedMaterialBatch[]; questions: CustomQuestion[] } => {
  const currentBatches = loadScannedBatches();
  const updatedBatches = currentBatches.map((b) =>
    b.id === batchId ? { ...b, assignedKidId: newAssignedKidId } : b
  );
  saveScannedBatches(updatedBatches);

  const currentQuestions = loadCustomQuestions();
  const updatedQuestions = currentQuestions.map((q) =>
    q.scanBatchId === batchId ? { ...q, assignedKidId: newAssignedKidId } : q
  );
  saveCustomQuestions(updatedQuestions);

  return { batches: updatedBatches, questions: updatedQuestions };
};

export const loadCustomQuestions = (): CustomQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load custom questions:', err);
  }
  return [];
};

export const saveCustomQuestions = (questions: CustomQuestion[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(questions));
    triggerRemoteDbSync();
  } catch (err) {
    console.error('Failed to save custom questions:', err);
  }
};

export const addCustomQuestion = (question: CustomQuestion): CustomQuestion[] => {
  const current = loadCustomQuestions();
  const updated = [
    { ...question, isCustom: true, createdAt: question.createdAt || new Date().toISOString() },
    ...current.filter((q) => q.id !== question.id),
  ];
  saveCustomQuestions(updated);
  return updated;
};

export const deleteCustomQuestion = (questionId: string): CustomQuestion[] => {
  const current = loadCustomQuestions();
  const updated = current.filter((q) => q.id !== questionId);
  saveCustomQuestions(updated);
  return updated;
};

export const resetCustomQuestions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_QUESTIONS);
  } catch (e) {
    console.error(e);
  }
};

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge_math_5',
    title: 'Math Cadet',
    description: 'Solve your first 5 math problems successfully!',
    icon: '🌟',
    color: 'from-amber-400 to-orange-500',
    category: 'math',
    unlocked: false,
  },
  {
    id: 'badge_math_25',
    title: 'Equation Hero',
    description: 'Solve 25 math challenges on your quest.',
    icon: '⚡',
    color: 'from-blue-400 to-indigo-600',
    category: 'math',
    unlocked: false,
  },
  {
    id: 'badge_nature_10',
    title: 'Eco Ranger',
    description: 'Master 10 Nature & Science discoveries!',
    icon: '🌿',
    color: 'from-emerald-400 to-teal-600',
    category: 'nature',
    unlocked: false,
  },
  {
    id: 'badge_geo_10',
    title: 'Globe Trotter',
    description: 'Correctly identify 10 world capitals, flags, or landmarks!',
    icon: '🌍',
    color: 'from-cyan-400 to-blue-600',
    category: 'geography',
    unlocked: false,
  },
  {
    id: 'badge_art_10',
    title: 'Art & Melody Maestro',
    description: 'Identify 10 masterpieces, instruments, and color theories!',
    icon: '🎨',
    color: 'from-fuchsia-400 to-rose-600',
    category: 'art',
    unlocked: false,
  },
  {
    id: 'badge_polyglot_10',
    title: 'Polyglot Pioneer',
    description: 'Learn 10 new foreign language vocabulary words and phrases!',
    icon: '🗣️',
    color: 'from-violet-400 to-purple-600',
    category: 'languages',
    unlocked: false,
  },
  {
    id: 'badge_speed_300',
    title: 'Speed Sprint Master',
    description: 'Score 300 or more points in a single 60s Speed Sprint.',
    icon: '⏱️',
    color: 'from-emerald-400 to-teal-600',
    category: 'speed',
    unlocked: false,
  },
  {
    id: 'badge_classic_200',
    title: 'Color & Number Ace',
    description: 'Score 200+ in the Classic BrainBoss Reflex challenge.',
    icon: '🎯',
    color: 'from-rose-400 to-red-600',
    category: 'brain',
    unlocked: false,
  },
  {
    id: 'badge_matrix_5',
    title: 'Memory Titan',
    description: 'Reach Level 5 or higher in Memory Matrix.',
    icon: '🧩',
    color: 'from-cyan-400 to-blue-600',
    category: 'brain',
    unlocked: false,
  },
  {
    id: 'badge_streak_3',
    title: 'Streak Fire',
    description: 'Play BrainBoss on 3 consecutive days.',
    icon: '🔥',
    color: 'from-amber-500 to-red-500',
    category: 'streak',
    unlocked: false,
  },
  {
    id: 'badge_boss_win',
    title: 'Dragon Conqueror',
    description: 'Defeat the Boss in high-stakes knowledge combat!',
    icon: '🏆',
    color: 'from-yellow-400 to-amber-600',
    category: 'quest',
    unlocked: false,
  },
];

export const generateDailyQuests = (): DailyQuest[] => {
  return [
    {
      id: 'daily_math_5',
      title: 'Daily Math Explorer',
      description: 'Solve 5 learning problems in any subject.',
      target: 5,
      current: 0,
      rewardType: 'coins',
      rewardAmount: 50,
      completed: false,
      claimed: false,
    },
    {
      id: 'daily_speed_1',
      title: 'Speed Sprinter',
      description: 'Play 1 round of 60s Speed Sprint or Vocab Blitz.',
      target: 1,
      current: 0,
      rewardType: 'xp',
      rewardAmount: 60,
      completed: false,
      claimed: false,
    },
    {
      id: 'daily_multidiscipline',
      title: 'Polymath Discovery',
      description: 'Solve at least 2 questions in Nature, Geography, Art, or Languages.',
      target: 2,
      current: 0,
      rewardType: 'gems',
      rewardAmount: 5,
      completed: false,
      claimed: false,
    },
  ];
};

const createEmptySubjectStats = () => ({
  math: { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 },
  nature: { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 },
  geography: { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 },
  art: { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 },
  languages: { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 },
});

export const createDefaultKid = (
  id: string,
  name: string,
  avatar: string,
  gradeLevel: 'primary' | 'high_school' = 'primary',
  targetLanguage: 'en' | 'fr' | 'it' | 'es' | 'de' = 'en',
  skinId: SkinThemeId = 'cyber_neon',
  manualDifficulty: number = 2,
  schoolGrade?: number,
  schoolClass?: string,
  loginCode?: string,
  pin?: string
): KidProfile => {
  const actualSchoolGrade = schoolGrade || (gradeLevel === 'high_school' ? 5 : 2);
  const actualClass = schoolClass || `${actualSchoolGrade}A`;
  const generatedCode = loginCode || `KID-${Math.floor(1000 + Math.random() * 9000)}`;
  const kidPin = pin || '1234';

  return {
    id,
    name,
    avatar,
    gradeLevel,
    schoolGrade: actualSchoolGrade,
    schoolClass: actualClass,
    loginCode: generatedCode,
    pin: kidPin,
    targetLanguage,
    skinId,
    manualDifficulty,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    coins: 120,
    gems: 10,
    streakDays: 1,
    lastPlayedDate: new Date().toISOString().split('T')[0],
    totalSolved: 0,
    correctCount: 0,
    dailyGoalProblems: 10,
    todayProblemsSolved: 0,
    todayMinutesPlayed: 0,
    highScores: {
      speed_sprint: 0,
      classic_color_number: 0,
      memory_matrix: 0,
      speed_stroop: 0,
      boss_battle: 0,
      vocab_sprint: 0,
    },
    badges: INITIAL_BADGES,
    powerUps: {
      freezeTime: 2,
      fiftyFifty: 2,
      brainSpark: 3,
      doubleStars: 1,
      streakShield: 1,
    },
    dailyQuests: generateDailyQuests(),
    subjectStats: createEmptySubjectStats(),
    enabledTopics: {},
    disabledGames: [],
  };
};

export const DEFAULT_PARENT_CONFIG: ParentConfig = {
  pin: '1234',
  activeKidId: 'kid_1',
  kids: [
    createDefaultKid('kid_1', 'Felix', '🚀', 'primary', 'en', 'cyber_neon', 2, 3, '3A', 'FELIX-101', '1234'),
    createDefaultKid('kid_2', 'Sophie', '🦉', 'high_school', 'fr', 'cosmic_galaxy', 3, 6, '6B', 'SOPHIE-202', '1234'),
  ],
  tasks: [
    {
      id: 'task_math_basics',
      title: 'Kopfrechen-Training: Addition & Subtraktion',
      description: 'Löse 10 Rechenaufgaben fehlerfrei für die Klassenarbeit.',
      subject: 'math',
      topic: 'addition_subtraction',
      targetCount: 10,
      currentCount: 4,
      assignedKidId: 'all',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'in_progress',
      rewardXp: 80,
      rewardCoins: 40,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_vocab_en',
      title: 'Englisch Vokabel-Check: Alltag & Essen',
      description: 'Trainiere die neuen Schulvokabeln im Vokabel-Sprint.',
      subject: 'languages',
      topic: 'food_dining',
      targetCount: 8,
      currentCount: 0,
      assignedKidId: 'kid_1',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'assigned',
      rewardXp: 100,
      rewardCoins: 50,
      createdAt: new Date().toISOString(),
    },
  ],
  tests: [
    {
      id: 'test_demo_grade3',
      title: 'Schularbeit-Vorbereitung: Grundstufe 3',
      description: 'Überprüfung der Rechenkompetenzen & logisches Denken (15 Minuten)',
      subject: 'math',
      schoolGrade: 3,
      assignedKidIds: ['all'],
      timeLimitMinutes: 15,
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: 'Eltern / Lehrkraft',
      questions: [
        {
          id: 'tq_1',
          subject: 'math',
          topic: 'addition_subtraction',
          gradeLevel: 'primary',
          schoolGrade: 3,
          difficulty: 2,
          question: 'Berechne: 45 + 38 = ?',
          options: [73, 83, 85, 93],
          correctAnswer: 83,
          explanation: '40 + 30 = 70 und 5 + 8 = 13. 70 + 13 = 83.',
          hint: 'Zerlege die Zehner und Einer!',
          xp: 25,
          coins: 10,
        },
        {
          id: 'tq_2',
          subject: 'math',
          topic: 'multiplication_division',
          gradeLevel: 'primary',
          schoolGrade: 3,
          difficulty: 3,
          question: 'Einmaleins: 7 × 8 = ?',
          options: [54, 56, 58, 64],
          correctAnswer: 56,
          explanation: '7 mal 8 ergibt exakt 56.',
          hint: 'Denke an 7 × 7 = 49 + 7 = 56.',
          xp: 30,
          coins: 15,
        },
        {
          id: 'tq_3',
          subject: 'math',
          topic: 'missing_number',
          gradeLevel: 'primary',
          schoolGrade: 3,
          difficulty: 3,
          question: 'Finde die fehlende Zahl: 100 - ? = 64',
          options: [26, 34, 36, 46],
          correctAnswer: 36,
          explanation: '100 - 64 = 36.',
          hint: 'Ziehe 60 ab (40), dann noch 4 abziehen.',
          xp: 35,
          coins: 20,
        },
      ],
    },
  ],
  testSubmissions: [],
  allowedSubjects: ['math', 'nature', 'geography', 'art', 'languages'],
  allowedGameModes: [
    'math_quest',
    'speed_sprint',
    'survival_hearts',
    'boss_battle',
    'ai_story',
    'classic_color_number',
    'memory_matrix',
    'speed_stroop',
    'nature_quest',
    'geo_quest',
    'art_quest',
    'language_quest',
    'vocab_sprint',
  ],
  dailyTimeLimitMinutes: 45,
  enforceDailyGoal: false,
  allowShopPurchases: true,
};

export const loadParentConfig = (): ParentConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARENT);
    if (raw) {
      const parsed: ParentConfig = JSON.parse(raw);
      if (parsed.kids && parsed.kids.length > 0) {
        // Ensure all kids have modern fields
        parsed.kids = parsed.kids.map((kid) => {
          const mergedBadges = INITIAL_BADGES.map((b) => {
            const existing = (kid.badges || []).find((eb) => eb.id === b.id);
            return existing || b;
          });
          return {
            ...createDefaultKid(kid.id || 'kid_1', kid.name || 'Learner', kid.avatar || '🤖'),
            ...kid,
            skinId: kid.skinId || 'cyber_neon',
            schoolGrade: typeof kid.schoolGrade === 'number' ? kid.schoolGrade : (kid.gradeLevel === 'high_school' ? 5 : 2),
            manualDifficulty: typeof kid.manualDifficulty === 'number' ? kid.manualDifficulty : 2,
            badges: mergedBadges,
            subjectStats: {
              ...createEmptySubjectStats(),
              ...(kid.subjectStats || {}),
            },
          };
        });
        return {
          ...DEFAULT_PARENT_CONFIG,
          ...parsed,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : (DEFAULT_PARENT_CONFIG.tasks || []),
          tests: Array.isArray(parsed.tests) ? parsed.tests : (DEFAULT_PARENT_CONFIG.tests || []),
          testSubmissions: Array.isArray(parsed.testSubmissions) ? parsed.testSubmissions : [],
        };
      }
    }

    // Try legacy single profile migration
    const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migratedKid: KidProfile = {
        ...createDefaultKid('kid_1', legacy.name || 'Brain Cadet', legacy.avatar || '🤖', legacy.gradeLevel || 'primary'),
        ...legacy,
        subjectStats: createEmptySubjectStats(),
      };
      const initialConfig: ParentConfig = {
        ...DEFAULT_PARENT_CONFIG,
        kids: [migratedKid],
        activeKidId: migratedKid.id,
      };
      saveParentConfig(initialConfig);
      return initialConfig;
    }
  } catch (err) {
    console.error('Failed to load parent config:', err);
  }
  return DEFAULT_PARENT_CONFIG;
};

export const saveParentConfig = (config: ParentConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PARENT, JSON.stringify(config));
    triggerRemoteDbSync();
  } catch (err) {
    console.error('Failed to save parent config:', err);
  }
};

export const getActiveKidProfile = (config: ParentConfig): KidProfile => {
  return (
    config.kids.find((k) => k.id === config.activeKidId) ||
    config.kids[0] ||
    DEFAULT_PARENT_CONFIG.kids[0]
  );
};

export const loadPlayerProfile = (): PlayerProfile => {
  const config = loadParentConfig();
  const activeKid = config.kids.find((k) => k.id === config.activeKidId) || config.kids[0] || DEFAULT_PARENT_CONFIG.kids[0];

  const today = new Date().toISOString().split('T')[0];
  if (activeKid.lastPlayedDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const streak = activeKid.lastPlayedDate === yesterday ? (activeKid.streakDays || 1) + 1 : 1;
    const updated = {
      ...activeKid,
      streakDays: streak,
      lastPlayedDate: today,
      todayProblemsSolved: 0,
      todayMinutesPlayed: 0,
      dailyQuests: generateDailyQuests(),
    };
    savePlayerProfile(updated);
    return updated;
  }

  return activeKid;
};

export const savePlayerProfile = (profile: PlayerProfile): void => {
  const config = loadParentConfig();
  const updatedKids = config.kids.map((k) => (k.id === profile.id ? profile : k));
  const updatedConfig = { ...config, kids: updatedKids };
  saveParentConfig(updatedConfig);
};

export const switchActiveKid = (kidId: string): KidProfile => {
  const config = loadParentConfig();
  const target = config.kids.find((k) => k.id === kidId);
  if (target) {
    config.activeKidId = kidId;
    saveParentConfig(config);
    return target;
  }
  return config.kids[0];
};

export const addXPAndCoins = (
  profile: PlayerProfile,
  xpGain: number,
  coinGain: number,
  gemGain = 0
): { profile: PlayerProfile; leveledUp: boolean } => {
  let { level, xp, xpToNextLevel, coins, gems } = profile;
  let leveledUp = false;

  xp += xpGain;
  coins += coinGain;
  gems += gemGain;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = Math.round(xpToNextLevel * 1.35);
    coins += level * 30; // Bonus coins on level up
    gems += 2;
    leveledUp = true;
  }

  const updated: PlayerProfile = {
    ...profile,
    level,
    xp,
    xpToNextLevel,
    coins,
    gems,
  };

  savePlayerProfile(updated);
  return { profile: updated, leveledUp };
};

export const addXpAndCoins = addXPAndCoins;

export const updateGameStats = (
  profile: PlayerProfile,
  isCorrect: boolean,
  mode: GameMode,
  score = 0,
  subject: SubjectArea = 'math'
): PlayerProfile => {
  // Update subject stats
  const currentSubjectStats = profile.subjectStats[subject] || { solved: 0, correct: 0, accuracy: 100, streak: 0, bestScore: 0 };
  const nextSolved = currentSubjectStats.solved + 1;
  const nextCorrect = currentSubjectStats.correct + (isCorrect ? 1 : 0);
  const nextAccuracy = Math.round((nextCorrect / nextSolved) * 100);
  const nextStreak = isCorrect ? currentSubjectStats.streak + 1 : 0;
  const nextBestScore = Math.max(currentSubjectStats.bestScore, score);

  const updatedSubjectStats = {
    ...profile.subjectStats,
    [subject]: {
      solved: nextSolved,
      correct: nextCorrect,
      accuracy: nextAccuracy,
      streak: nextStreak,
      bestScore: nextBestScore,
    },
  };

  const updated: PlayerProfile = {
    ...profile,
    totalSolved: profile.totalSolved + 1,
    correctCount: profile.correctCount + (isCorrect ? 1 : 0),
    todayProblemsSolved: (profile.todayProblemsSolved || 0) + 1,
    subjectStats: updatedSubjectStats,
    highScores: {
      ...profile.highScores,
      [mode]: Math.max(profile.highScores[mode] || 0, score),
    },
    dailyQuests: profile.dailyQuests.map((q) => {
      let nextCurrent = q.current;
      if (q.id === 'daily_math_5' && isCorrect) {
        nextCurrent = Math.min(q.target, q.current + 1);
      } else if (q.id === 'daily_speed_1' && (mode === 'speed_sprint' || mode === 'vocab_sprint')) {
        nextCurrent = Math.min(q.target, q.current + 1);
      } else if (q.id === 'daily_multidiscipline' && isCorrect && subject !== 'math') {
        nextCurrent = Math.min(q.target, q.current + 1);
      }

      return {
        ...q,
        current: nextCurrent,
        completed: nextCurrent >= q.target,
      };
    }),
    badges: profile.badges.map((b) => {
      let shouldUnlock = b.unlocked;
      if (!b.unlocked) {
        if (b.id === 'badge_math_5' && profile.correctCount + (isCorrect ? 1 : 0) >= 5) shouldUnlock = true;
        if (b.id === 'badge_math_25' && profile.correctCount + (isCorrect ? 1 : 0) >= 25) shouldUnlock = true;
        if (b.id === 'badge_nature_10' && updatedSubjectStats.nature.correct >= 10) shouldUnlock = true;
        if (b.id === 'badge_geo_10' && updatedSubjectStats.geography.correct >= 10) shouldUnlock = true;
        if (b.id === 'badge_art_10' && updatedSubjectStats.art.correct >= 10) shouldUnlock = true;
        if (b.id === 'badge_polyglot_10' && updatedSubjectStats.languages.correct >= 10) shouldUnlock = true;
        if (b.id === 'badge_speed_300' && (mode === 'speed_sprint' || mode === 'vocab_sprint') && score >= 300) shouldUnlock = true;
        if (b.id === 'badge_classic_200' && mode === 'classic_color_number' && score >= 200) shouldUnlock = true;
        if (b.id === 'badge_matrix_5' && mode === 'memory_matrix' && score >= 100) shouldUnlock = true;
        if (b.id === 'badge_streak_3' && profile.streakDays >= 3) shouldUnlock = true;
        if (b.id === 'badge_boss_win' && mode === 'boss_battle' && isCorrect) shouldUnlock = true;
      }
      return {
        ...b,
        unlocked: shouldUnlock,
        unlockedAt: shouldUnlock && !b.unlocked ? new Date().toISOString() : b.unlockedAt,
      };
    }),
  };

  savePlayerProfile(updated);
  return updated;
};

export const usePowerUpItem = (
  profile: PlayerProfile,
  powerUpKey: keyof PlayerProfile['powerUps']
): { profile: PlayerProfile; success: boolean } => {
  const currentCount = profile.powerUps[powerUpKey] || 0;
  if (currentCount <= 0) {
    return { profile, success: false };
  }

  const updated: PlayerProfile = {
    ...profile,
    powerUps: {
      ...profile.powerUps,
      [powerUpKey]: currentCount - 1,
    },
  };

  savePlayerProfile(updated);
  return { profile: updated, success: true };
};

export const claimDailyQuest = (profile: PlayerProfile, questId: string): PlayerProfile => {
  let updatedCoins = profile.coins;
  let updatedGems = profile.gems;
  let updatedXp = profile.xp;

  const updatedQuests = profile.dailyQuests.map((q) => {
    if (q.id === questId && q.completed && !q.claimed) {
      if (q.rewardType === 'coins') updatedCoins += q.rewardAmount;
      if (q.rewardType === 'gems') updatedGems += q.rewardAmount;
      if (q.rewardType === 'xp') updatedXp += q.rewardAmount;
      return { ...q, claimed: true };
    }
    return q;
  });

  const updated: PlayerProfile = {
    ...profile,
    coins: updatedCoins,
    gems: updatedGems,
    xp: updatedXp,
    dailyQuests: updatedQuests,
  };

  savePlayerProfile(updated);
  return updated;
};

// -------------------------------------------------------------
// CHILD TASKS & HOMEWORK MANAGEMENT
// -------------------------------------------------------------

export const saveChildTask = (task: ChildTask) => {
  const config = loadParentConfig();
  const existingTasks = config.tasks || [];
  const idx = existingTasks.findIndex((t) => t.id === task.id);
  let updatedTasks: ChildTask[];
  if (idx >= 0) {
    updatedTasks = [...existingTasks];
    updatedTasks[idx] = task;
  } else {
    updatedTasks = [task, ...existingTasks];
  }
  const updatedConfig = { ...config, tasks: updatedTasks };
  saveParentConfig(updatedConfig);
  return updatedConfig;
};

export const deleteChildTask = (taskId: string) => {
  const config = loadParentConfig();
  const updatedTasks = (config.tasks || []).filter((t) => t.id !== taskId);
  const updatedConfig = { ...config, tasks: updatedTasks };
  saveParentConfig(updatedConfig);
  return updatedConfig;
};

export const updateChildTaskProgress = (taskId: string, increment = 1): { config: ParentConfig; completed: boolean } => {
  const config = loadParentConfig();
  let completedNow = false;
  const updatedTasks = (config.tasks || []).map((t) => {
    if (t.id === taskId) {
      const nextCount = Math.min(t.targetCount, t.currentCount + increment);
      const isComplete = nextCount >= t.targetCount;
      if (isComplete && t.status !== 'completed') {
        completedNow = true;
      }
      return {
        ...t,
        currentCount: nextCount,
        status: isComplete ? ('completed' as const) : ('in_progress' as const),
        completedAt: isComplete && !t.completedAt ? new Date().toISOString() : t.completedAt,
      };
    }
    return t;
  });
  const updatedConfig = { ...config, tasks: updatedTasks };
  saveParentConfig(updatedConfig);
  return { config: updatedConfig, completed: completedNow };
};

// -------------------------------------------------------------
// CHILD TESTS & EXAMS MANAGEMENT
// -------------------------------------------------------------

export const saveChildTest = (test: ChildTest) => {
  const config = loadParentConfig();
  const existingTests = config.tests || [];
  const idx = existingTests.findIndex((t) => t.id === test.id);
  let updatedTests: ChildTest[];
  if (idx >= 0) {
    updatedTests = [...existingTests];
    updatedTests[idx] = test;
  } else {
    updatedTests = [test, ...existingTests];
  }
  const updatedConfig = { ...config, tests: updatedTests };
  saveParentConfig(updatedConfig);
  return updatedConfig;
};

export const deleteChildTest = (testId: string) => {
  const config = loadParentConfig();
  const updatedTests = (config.tests || []).filter((t) => t.id !== testId);
  const updatedConfig = { ...config, tests: updatedTests };
  saveParentConfig(updatedConfig);
  return updatedConfig;
};

export const recordTestSubmission = (submission: TestSubmission): ParentConfig => {
  const config = loadParentConfig();
  const existingSubmissions = config.testSubmissions || [];
  const updatedSubmissions = [submission, ...existingSubmissions.filter((s) => s.id !== submission.id)];
  const updatedConfig = { ...config, testSubmissions: updatedSubmissions };
  saveParentConfig(updatedConfig);
  return updatedConfig;
};

// -------------------------------------------------------------
// SUPER ADMIN: AUTHORIZED ADMINS & PARENTS MANAGEMENT
// -------------------------------------------------------------

export const fetchAuthorizedUsers = async (): Promise<AuthorizedUser[]> => {
  const defaultList: AuthorizedUser[] = SUPER_ADMIN_EMAIL
    ? [
        {
          email: SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          displayName: 'Super Admin',
          addedBy: 'system_root',
          createdAt: '2026-01-01T00:00:00.000Z',
          notes: 'Plattform-Hauptadministrator mit vollen Systemrechten',
        },
      ]
    : [];

  try {
    const snap = await getDocs(collection(db, 'authorized_users'));
    if (!snap.empty) {
      const items: AuthorizedUser[] = [];
      snap.forEach((d) => {
        const data = d.data() as AuthorizedUser;
        items.push({
          email: d.id || data.email,
          role: data.role || 'parent',
          displayName: data.displayName || d.id.split('@')[0],
          addedBy: data.addedBy || 'admin',
          createdAt: data.createdAt || new Date().toISOString(),
          notes: data.notes,
        });
      });
      // Ensure super admin is included if configured
      if (SUPER_ADMIN_EMAIL && !items.some((i) => i.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
        items.unshift(defaultList[0]);
      }
      return items;
    }
  } catch (err) {
    console.warn('[Firebase] fetchAuthorizedUsers note:', err);
  }

  // Fallback to local stored whitelist
  try {
    const local = localStorage.getItem('brainboss_authorized_users');
    if (local) {
      const parsed: AuthorizedUser[] = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return defaultList;
};

export const addAuthorizedAdmin = async (
  email: string,
  role: UserRole = 'parent',
  displayName?: string,
  notes?: string
): Promise<AuthorizedUser[]> => {
  const cleanEmail = email.toLowerCase().trim();
  const newUser: AuthorizedUser = {
    email: cleanEmail,
    role,
    displayName: displayName || cleanEmail.split('@')[0],
    addedBy: SUPER_ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
    notes: notes || 'Vom Haupt-Admin autorisierter Eltern-/Lehrkraft-Account',
  };

  try {
    await setDoc(doc(db, 'authorized_users', cleanEmail), newUser, { merge: true });
  } catch (e) {
    console.warn('[Firebase] addAuthorizedAdmin to cloud note:', e);
  }

  const currentList = await fetchAuthorizedUsers();
  const filtered = currentList.filter((u) => u.email.toLowerCase() !== cleanEmail);
  const updated = [newUser, ...filtered];
  try {
    localStorage.setItem('brainboss_authorized_users', JSON.stringify(updated));
  } catch {}
  return updated;
};

export const removeAuthorizedAdmin = async (email: string): Promise<AuthorizedUser[]> => {
  const cleanEmail = email.toLowerCase().trim();
  if (SUPER_ADMIN_EMAIL && cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Der Haupt-Administrator kann nicht entfernt werden.');
  }

  try {
    await deleteDoc(doc(db, 'authorized_users', cleanEmail));
  } catch (e) {
    console.warn('[Firebase] removeAuthorizedAdmin note:', e);
  }

  const currentList = await fetchAuthorizedUsers();
  const updated = currentList.filter((u) => u.email.toLowerCase() !== cleanEmail);
  try {
    localStorage.setItem('brainboss_authorized_users', JSON.stringify(updated));
  } catch {}
  return updated;
};

export {
  initFirebaseAuth,
  subscribeToAuth,
  signInWithGoogle,
  logOut,
  syncUserProfile,
  SUPER_ADMIN_EMAIL,
} from '../lib/firebase';


export const verifyChildLogin = (
  loginIdentifier: string,
  pinOrCode: string
): { success: boolean; kid?: KidProfile; error?: string } => {
  const config = loadParentConfig();
  const cleanId = (loginIdentifier || '').trim().toLowerCase();
  const cleanCode = (pinOrCode || '').trim().toLowerCase();

  // Find kid by loginCode or ID or Name
  const matchedKid = config.kids.find((k) => {
    const matchesCode = (k.loginCode || '').toLowerCase() === cleanCode || (k.loginCode || '').toLowerCase() === cleanId;
    const matchesPin = (k.pin || '1234') === pinOrCode || (k.pin || '1234') === loginIdentifier;
    const matchesName = k.name.toLowerCase() === cleanId || k.id.toLowerCase() === cleanId;

    return (matchesName && matchesPin) || matchesCode;
  });

  if (matchedKid) {
    return { success: true, kid: matchedKid };
  }

  // Fallback: match by code alone if unique
  const byCode = config.kids.find((k) => (k.loginCode || '').toLowerCase() === cleanId || (k.loginCode || '').toLowerCase() === cleanCode);
  if (byCode) {
    return { success: true, kid: byCode };
  }

  return {
    success: false,
    error: 'Ungültiger Kinder-Login-Code oder PIN. Bitte frage deine Eltern nach deinem Code (z. B. FELIX-101).',
  };
};
