/**
 * Vocabulary exercise generator.
 *
 * Turns structured learning material extracted by the vision AI (vocabulary +
 * dialogues) into a varied, gamified exercise pool. Runs without any AI calls,
 * so it scales to hundreds of exercises and is fully deterministic for a seed.
 *
 * Guarantees: every vocabulary item becomes the target of at least
 * `perVocab` (default 3) single exercises using different exercise variants.
 * Group exercises (matching, sorting, dialogues) are added on top.
 */
import type { CustomQuestion, ExerciseType, GradeLevel } from '../types';
import { DIALOGUE_SEPARATOR, encodeOrderedTiles, encodePairs, encodeSort, normalizeAnswer } from './exerciseAnswers';

export type VocabKind =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'phrase'
  | 'number'
  | 'colour'
  | 'function_word'
  | 'other';

export interface ExtractedVocab {
  en: string;
  de: string;
  example?: string;
  exampleDe?: string;
  category?: string;
  kind?: VocabKind | string;
  emoji?: string | null;
  numberValue?: number | null;
  colorHex?: string | null;
}

export interface ExtractedDialogue {
  title?: string;
  lines: { speaker: string; text: string }[];
}

export interface ExtractedMaterial {
  vocab: ExtractedVocab[];
  dialogues?: ExtractedDialogue[];
}

export interface GeneratorOptions {
  /** Language of instructions/explanations. */
  lang?: 'de' | 'en';
  /** Minimum number of single exercises per vocabulary item. */
  perVocab?: number;
  seed?: number;
  schoolGrade?: number;
  idPrefix?: string;
}

/** Single-target exercise variants (direction matters for multiple choice). */
export type ExerciseVariant =
  | 'mc_de_en'
  | 'mc_en_de'
  | 'listen_choose'
  | 'emoji_choice'
  | 'visual_choice'
  | 'letter_puzzle'
  | 'sentence_builder'
  | 'cloze_wordbank';

interface NormalizedVocab {
  en: string; // display form as in book
  core: string; // cleaned form (no parentheses), used as answer
  de: string;
  example?: string;
  exampleDe?: string;
  category: string;
  kind: VocabKind;
  emoji?: string;
  numberValue?: number;
  colorHex?: string;
}

type Draft = Omit<CustomQuestion, 'id' | 'gradeLevel' | 'schoolGrade' | 'xp' | 'coins' | 'subject' | 'topic' | 'difficulty'> & {
  exerciseType: ExerciseType;
};

// ---------------------------------------------------------------------------
// Random helpers (seeded for reproducible tests)
// ---------------------------------------------------------------------------

export const createRng = (seed: number = Date.now()) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(arr: T[], rng: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Shuffles until the order differs from the original (if possible). */
const shuffleDifferent = <T,>(arr: T[], rng: () => number, key: (x: T[]) => string): T[] => {
  const original = key(arr);
  for (let i = 0; i < 12; i++) {
    const s = shuffle(arr, rng);
    if (key(s) !== original) return s;
  }
  return [...arr].reverse();
};

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const VALID_KINDS: VocabKind[] = ['noun', 'verb', 'adjective', 'phrase', 'number', 'colour', 'function_word', 'other'];

export const cleanEnglish = (en: string): string =>
  en
    .replace(/\(\s*=[^)]*\)/g, '') // "I am (= I'm) fine." -> "I am fine."
    .replace(/\(([^)]*)\)\s*/g, '') // "(email) address" -> "address"
    .replace(/\s+/g, ' ')
    .trim();

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

const inferKind = (v: ExtractedVocab, core: string): VocabKind => {
  const k = String(v.kind || '').toLowerCase();
  if (k === 'color') return 'colour';
  if (VALID_KINDS.includes(k as VocabKind)) return k as VocabKind;
  if (typeof v.numberValue === 'number') return 'number';
  if (v.colorHex) return 'colour';
  if (/^to\s+\w/i.test(core)) return 'verb';
  if (wordCount(core) >= 3 || /[?!.]$/.test(core)) return 'phrase';
  return 'other';
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c))
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'basic_vocab';

/** Removes empty entries and merges duplicates (e.g. the same page photographed twice). */
export const dedupeVocab = (vocab: ExtractedVocab[]): ExtractedVocab[] => {
  const map = new Map<string, ExtractedVocab>();
  for (const raw of vocab || []) {
    if (!raw || typeof raw.en !== 'string' || typeof raw.de !== 'string') continue;
    const en = raw.en.trim();
    const de = raw.de.trim();
    if (!en || !de) continue;
    const key = normalizeAnswer(cleanEnglish(en)).replace(/[.!?]$/, '');
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...raw, en, de });
    } else {
      // fill missing information from the duplicate
      for (const field of ['example', 'exampleDe', 'category', 'kind', 'emoji', 'numberValue', 'colorHex'] as const) {
        if ((existing[field] === undefined || existing[field] === null || existing[field] === '') && raw[field] != null) {
          (existing as any)[field] = raw[field];
        }
      }
    }
  }
  return Array.from(map.values());
};

const normalizeVocab = (v: ExtractedVocab, lang: 'de' | 'en'): NormalizedVocab => {
  const core = cleanEnglish(v.en);
  const kind = inferKind(v, core);
  const fallbackCategory = lang === 'de' ? 'Wörter' : 'Words';
  return {
    en: v.en.trim(),
    core,
    de: v.de.trim(),
    example: v.example?.trim() || undefined,
    exampleDe: v.exampleDe?.trim() || undefined,
    category: (v.category || '').trim() || fallbackCategory,
    kind,
    emoji: v.emoji?.trim() || undefined,
    numberValue: typeof v.numberValue === 'number' ? v.numberValue : undefined,
    colorHex: v.colorHex && /^#[0-9a-f]{3,8}$/i.test(v.colorHex.trim()) ? v.colorHex.trim() : undefined,
  };
};

// ---------------------------------------------------------------------------
// Texts (German instructions for German native kids; English fallback)
// ---------------------------------------------------------------------------

const TXT = {
  de: {
    mcDeEn: (de: string) => [`Wie heißt „${de}“ auf Englisch?`, `Was ist „${de}“ auf Englisch?`, `Übersetze ins Englische: „${de}“`],
    mcEnDe: (en: string) => [`Was bedeutet „${en}“?`, `Was heißt „${en}“ auf Deutsch?`, `Übersetze ins Deutsche: „${en}“`],
    listenWord: 'Hör genau hin! Welches Wort hörst du?',
    listenPhrase: 'Hör genau hin! Welchen Satz hörst du?',
    listenMeaning: 'Hör zu! Was bedeutet das auf Deutsch?',
    emoji: 'Was ist das auf Englisch?',
    number: 'Wie schreibt man diese Zahl auf Englisch?',
    colour: 'Welche Farbe ist das auf Englisch?',
    letters: (de: string) => `Bau das englische Wort für „${de}“!`,
    sentenceWithDe: (de: string) => `Bau den Satz auf Englisch: „${de}“`,
    sentenceNoDe: 'Bring die Wörter in die richtige Reihenfolge!',
    cloze: 'Welches Wort fehlt? Zieh es in die Lücke!',
    match: 'Verbinde die passenden Paare!',
    sort: 'Sortiere die Wörter in die richtige Gruppe!',
    dialogueOrder: 'Bring den Dialog in die richtige Reihenfolge!',
    dialogueComplete: (speaker: string) => `Was sagt ${speaker} als Nächstes?`,
    explainTranslation: (en: string, de: string) => `„${en}“ heißt auf Deutsch „${de}“.`,
    explainExample: (ex: string, exDe?: string) => ` Beispiel: „${ex}“${exDe ? ` (${exDe})` : ''}`,
    hintStartsWith: (letter: string, len: number) => `Das Wort beginnt mit „${letter}“ und hat ${len} Buchstaben.`,
    hintFirstWord: (w: string) => `Der Ausdruck beginnt mit „${w}“.`,
    hintMeaning: (de: string) => `Es bedeutet „${de}“.`,
    hintListen: 'Tippe auf den Lautsprecher, um es nochmal zu hören.',
    hintSentence: (first: string) => `Der Satz beginnt mit „${first}“.`,
    hintMatch: 'Fang mit den Wörtern an, die du sicher kennst!',
    hintSort: 'Überlege bei jedem Wort: Zu welcher Gruppe gehört es?',
    hintDialogue: 'Ein Dialog beginnt meistens mit einer Begrüßung.',
    hintDialogueComplete: 'Lies die letzte Zeile genau: Was wäre eine passende Antwort?',
    explainPairs: (pairs: string) => `Die richtigen Paare: ${pairs}`,
    explainSort: (s: string) => `Richtig sortiert: ${s}`,
    explainDialogue: (d: string) => `Richtige Reihenfolge: ${d}`,
    subNumber: 'Zahlen',
    subColour: 'Farben',
    subListen: '🔊 Hörverstehen',
    subLetters: '🔤 Buchstaben-Puzzle',
    subSentence: '🧩 Satz bauen',
    subCloze: '✍️ Lückentext',
    subMatch: '🔗 Paare finden',
    subSort: '🗂️ Sortieren',
    subDialogue: '💬 Dialog',
  },
  en: {
    mcDeEn: (de: string) => [`What is „${de}“ in English?`, `Translate into English: „${de}“`],
    mcEnDe: (en: string) => [`What does „${en}“ mean in German?`, `Translate into German: „${en}“`],
    listenWord: 'Listen carefully! Which word do you hear?',
    listenPhrase: 'Listen carefully! Which sentence do you hear?',
    listenMeaning: 'Listen! What does it mean in German?',
    emoji: 'What is this in English?',
    number: 'How do you write this number in English?',
    colour: 'Which colour is this in English?',
    letters: (de: string) => `Build the English word for „${de}“!`,
    sentenceWithDe: (de: string) => `Build the sentence in English: „${de}“`,
    sentenceNoDe: 'Put the words in the right order!',
    cloze: 'Which word is missing? Drag it into the gap!',
    match: 'Match the pairs!',
    sort: 'Sort the words into the right group!',
    dialogueOrder: 'Put the dialogue in the right order!',
    dialogueComplete: (speaker: string) => `What does ${speaker} say next?`,
    explainTranslation: (en: string, de: string) => `„${en}“ means „${de}“ in German.`,
    explainExample: (ex: string, exDe?: string) => ` Example: „${ex}“${exDe ? ` (${exDe})` : ''}`,
    hintStartsWith: (letter: string, len: number) => `The word starts with „${letter}“ and has ${len} letters.`,
    hintFirstWord: (w: string) => `It starts with „${w}“.`,
    hintMeaning: (de: string) => `It means „${de}“.`,
    hintListen: 'Tap the speaker to listen again.',
    hintSentence: (first: string) => `The sentence starts with „${first}“.`,
    hintMatch: 'Start with the words you know for sure!',
    hintSort: 'Think about each word: which group does it belong to?',
    hintDialogue: 'A dialogue usually starts with a greeting.',
    hintDialogueComplete: 'Read the last line carefully: what would be a good answer?',
    explainPairs: (pairs: string) => `Correct pairs: ${pairs}`,
    explainSort: (s: string) => `Correctly sorted: ${s}`,
    explainDialogue: (d: string) => `Correct order: ${d}`,
    subNumber: 'Numbers',
    subColour: 'Colours',
    subListen: '🔊 Listening',
    subLetters: '🔤 Letter puzzle',
    subSentence: '🧩 Sentence builder',
    subCloze: '✍️ Fill the gap',
    subMatch: '🔗 Match pairs',
    subSort: '🗂️ Sorting',
    subDialogue: '💬 Dialogue',
  },
};

const DIFFICULTY: Record<ExerciseType, number> = {
  multiple_choice: 1,
  listen_choose: 2,
  emoji_choice: 1,
  visual_choice: 1,
  letter_puzzle: 2,
  match_pairs: 2,
  category_sort: 2,
  cloze_wordbank: 3,
  sentence_builder: 3,
  dialogue_order: 3,
  dialogue_complete: 3,
};

const FALLBACK_EN = ['apple', 'house', 'window', 'to run', 'happy', 'water', 'tree', 'friend'];
const FALLBACK_DE = ['Apfel', 'Haus', 'Fenster', 'laufen', 'glücklich', 'Wasser', 'Baum', 'Freund'];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateExercisesFromMaterial(
  material: ExtractedMaterial,
  options: GeneratorOptions = {}
): CustomQuestion[] {
  const lang = options.lang === 'en' ? 'en' : 'de';
  const T = TXT[lang];
  const perVocab = Math.max(1, options.perVocab ?? 3);
  const rng = createRng(options.seed ?? Date.now());
  const schoolGrade = Number(options.schoolGrade) || 3;
  const gradeLevel: GradeLevel = schoolGrade > 4 ? 'high_school' : 'primary';
  const idPrefix = options.idPrefix || `ex-${Date.now()}`;

  const vocab = dedupeVocab(material?.vocab || []).map((v) => normalizeVocab(v, lang));
  const dialogues = (material?.dialogues || []).filter(
    (d) => d && Array.isArray(d.lines) && d.lines.filter((l) => l?.text?.trim()).length >= 2
  ).map((d) => ({
    title: d.title,
    lines: d.lines
      .filter((l) => l?.text?.trim())
      .map((l) => ({ speaker: (l.speaker || '').trim() || '?', text: l.text.trim() })),
  }));

  const out: CustomQuestion[] = [];
  let counter = 0;
  const push = (draft: Draft, category: string) => {
    const difficulty = DIFFICULTY[draft.exerciseType] ?? 2;
    counter += 1;
    out.push({
      ...draft,
      id: `${idPrefix}-${counter}`,
      subject: 'languages',
      topic: slug(category),
      targetLanguage: 'en',
      gradeLevel,
      schoolGrade,
      difficulty,
      xp: 20 + difficulty * 5,
      coins: 8 + difficulty * 3,
      source: 'schoolbook_scan',
      isCustom: true,
    } as CustomQuestion);
  };

  // --- distractors --------------------------------------------------------
  const pickDistractors = (target: NormalizedVocab, field: 'core' | 'de', n = 3, pool = vocab): string[] => {
    const own = normalizeAnswer(target[field]);
    const seen = new Set<string>([own]);
    const scored = shuffle(pool, rng)
      .filter((v) => v !== target)
      .map((v) => {
        let score = 0;
        if (v.category === target.category) score += 3;
        if (v.kind === target.kind) score += 2;
        if (Math.abs(wordCount(v.core) - wordCount(target.core)) === 0) score += 1;
        return { v, score };
      })
      .sort((a, b) => b.score - a.score);
    const result: string[] = [];
    // take from the best candidates, but with a little randomness
    const top = scored.slice(0, Math.max(n * 2, 6));
    for (const { v } of shuffle(top, rng).sort((a, b) => b.score - a.score)) {
      const value = v[field];
      const key = normalizeAnswer(value);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
      if (result.length >= n) break;
    }
    for (const { v } of scored) {
      if (result.length >= n) break;
      const key = normalizeAnswer(v[field]);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(v[field]);
      }
    }
    const fallback = field === 'core' ? FALLBACK_EN : FALLBACK_DE;
    for (const f of shuffle(fallback, rng)) {
      if (result.length >= n) break;
      if (!seen.has(normalizeAnswer(f))) {
        seen.add(normalizeAnswer(f));
        result.push(f);
      }
    }
    return result.slice(0, n);
  };

  const explanationFor = (v: NormalizedVocab) =>
    T.explainTranslation(v.core, v.de) + (v.example ? T.explainExample(v.example, v.exampleDe) : '');

  const hintFor = (v: NormalizedVocab) =>
    wordCount(v.core) > 1 ? T.hintFirstWord(v.core.split(' ')[0]) : T.hintStartsWith(v.core[0], v.core.replace(/[^a-zA-Z]/g, '').length);

  // --- single target builders --------------------------------------------
  const builders: Record<ExerciseVariant, (v: NormalizedVocab) => Draft | null> = {
    mc_de_en: (v) => ({
      exerciseType: 'multiple_choice',
      question: pick(T.mcDeEn(v.de), rng),
      subtext: v.category,
      options: shuffle([v.core, ...pickDistractors(v, 'core')], rng),
      correctAnswer: v.core,
      explanation: explanationFor(v),
      hint: hintFor(v),
      exerciseData: { solutionSpeech: v.core, targetVocab: [v.core] },
    }),
    mc_en_de: (v) => ({
      exerciseType: 'multiple_choice',
      question: pick(T.mcEnDe(v.core), rng),
      subtext: v.category,
      options: shuffle([v.de, ...pickDistractors(v, 'de')], rng),
      correctAnswer: v.de,
      explanation: explanationFor(v),
      hint: v.example ? T.explainExample(v.example).trim() : T.hintListen,
      visual: { pronounceText: v.core, pronounceLang: 'en-GB' },
      exerciseData: { solutionSpeech: v.core, targetVocab: [v.core] },
    }),
    listen_choose: (v) => {
      const meaning = rng() < 0.4;
      return {
        exerciseType: 'listen_choose',
        question: meaning ? T.listenMeaning : wordCount(v.core) >= 3 ? T.listenPhrase : T.listenWord,
        subtext: T.subListen,
        options: meaning
          ? shuffle([v.de, ...pickDistractors(v, 'de')], rng)
          : shuffle([v.core, ...pickDistractors(v, 'core')], rng),
        correctAnswer: meaning ? v.de : v.core,
        explanation: explanationFor(v),
        hint: meaning ? T.hintListen : T.hintMeaning(v.de),
        exerciseData: { speakText: v.core, solutionSpeech: v.core, targetVocab: [v.core] },
      };
    },
    emoji_choice: (v) => {
      if (!v.emoji || v.kind !== 'noun') return null;
      const emojiPool = vocab.filter((x) => x.emoji && x.kind === 'noun');
      const distractors = pickDistractors(v, 'core', 3, emojiPool.length >= 4 ? emojiPool : vocab);
      return {
        exerciseType: 'emoji_choice',
        question: T.emoji,
        subtext: v.category,
        options: shuffle([v.core, ...distractors], rng),
        correctAnswer: v.core,
        explanation: explanationFor(v),
        hint: T.hintMeaning(v.de),
        exerciseData: { emoji: v.emoji, solutionSpeech: v.core, targetVocab: [v.core] },
      };
    },
    visual_choice: (v) => {
      if (v.kind === 'number' && typeof v.numberValue === 'number') {
        const n = v.numberValue;
        const numbers = vocab.filter((x) => x !== v && typeof x.numberValue === 'number');
        // prefer confusable numbers: neighbours, same last digit (seven / seventeen)
        const ranked = shuffle(numbers, rng).sort((a, b) => {
          const s = (x: NormalizedVocab) => {
            const m = x.numberValue as number;
            return (Math.abs(m - n) === 1 ? 3 : 0) + (m % 10 === n % 10 ? 3 : 0) + (Math.abs(m - n) <= 3 ? 1 : 0);
          };
          return s(b) - s(a);
        });
        const distractors = ranked.slice(0, 3).map((x) => x.core);
        if (distractors.length < 3) distractors.push(...pickDistractors(v, 'core', 3 - distractors.length));
        return {
          exerciseType: 'visual_choice',
          question: T.number,
          subtext: T.subNumber,
          options: shuffle([v.core, ...distractors], rng),
          correctAnswer: v.core,
          explanation: explanationFor(v),
          hint: hintFor(v),
          exerciseData: { numberValue: n, solutionSpeech: v.core, targetVocab: [v.core] },
        };
      }
      if (v.kind === 'colour' && v.colorHex) {
        const colours = vocab.filter((x) => x.kind === 'colour');
        return {
          exerciseType: 'visual_choice',
          question: T.colour,
          subtext: T.subColour,
          options: shuffle([v.core, ...pickDistractors(v, 'core', 3, colours.length >= 4 ? colours : vocab)], rng),
          correctAnswer: v.core,
          explanation: explanationFor(v),
          hint: T.hintMeaning(v.de),
          exerciseData: { colorHex: v.colorHex, solutionSpeech: v.core, targetVocab: [v.core] },
        };
      }
      return null;
    },
    letter_puzzle: (v) => {
      const word = v.kind === 'verb' ? v.core.replace(/^to\s+/i, '') : v.core;
      if (!/^[A-Za-z'-]{3,12}$/.test(word)) return null;
      const letters = word.split('');
      if (new Set(letters.map((l) => l.toLowerCase())).size < 2) return null;
      const tiles = shuffleDifferent(letters, rng, (x) => x.join('').toLowerCase());
      return {
        exerciseType: 'letter_puzzle',
        question: T.letters(v.de),
        subtext: T.subLetters,
        options: [],
        correctAnswer: encodeOrderedTiles(letters, ''),
        explanation: explanationFor(v),
        hint: T.hintStartsWith(word[0], word.length),
        exerciseData: { tiles, separator: '', solutionSpeech: word, targetVocab: [v.core] },
      };
    },
    sentence_builder: (v) => {
      let sentence: string | undefined;
      let prompt: string;
      if (v.example && wordCount(v.example) >= 3 && wordCount(v.example) <= 10) {
        sentence = v.example;
        prompt = v.exampleDe ? T.sentenceWithDe(v.exampleDe) : T.sentenceNoDe;
      } else if (v.kind === 'phrase' && wordCount(v.core) >= 3 && wordCount(v.core) <= 10) {
        sentence = v.core;
        prompt = T.sentenceWithDe(v.de);
      } else {
        return null;
      }
      const words = sentence.split(/\s+/).filter(Boolean);
      const tiles = shuffleDifferent(words, rng, (x) => normalizeAnswer(x.join(' ')));
      return {
        exerciseType: 'sentence_builder',
        question: prompt,
        subtext: T.subSentence,
        options: [],
        correctAnswer: encodeOrderedTiles(words, ' '),
        explanation: explanationFor(v),
        hint: T.hintSentence(words[0]),
        exerciseData: { tiles, separator: ' ', solutionSpeech: sentence, targetVocab: [v.core] },
      };
    },
    cloze_wordbank: (v) => {
      if (!v.example || wordCount(v.example) < 3) return null;
      const target = v.kind === 'verb' ? v.core.replace(/^to\s+/i, '') : v.core.replace(/[.!?]$/, '');
      if (!target || wordCount(target) > 3) return null;
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^A-Za-z'])(${escaped})(?![A-Za-z'])`, 'i');
      const match = v.example.match(re);
      if (!match || match.index === undefined) return null;
      const found = match[2];
      const start = match.index + match[1].length;
      const clozeSentence = v.example.slice(0, start) + '___' + v.example.slice(start + found.length);
      if (wordCount(clozeSentence.replace('___', '')) < 2) return null;
      const capitalized = /^[A-Z]/.test(found) && found !== found.toUpperCase();
      const sameKind = vocab.filter((x) => x !== v && x.kind === v.kind && wordCount(x.core) <= 3);
      const raw = pickDistractors(v, 'core', 3, sameKind.length >= 3 ? sameKind : vocab).map((d) =>
        v.kind === 'verb' ? d.replace(/^to\s+/i, '') : d.replace(/[.!?]$/, '')
      );
      const distractors = raw
        .map((d) => (capitalized ? d.charAt(0).toUpperCase() + d.slice(1) : d))
        .filter((d) => normalizeAnswer(d) !== normalizeAnswer(found));
      if (distractors.length < 2) return null;
      return {
        exerciseType: 'cloze_wordbank',
        question: T.cloze,
        subtext: T.subCloze,
        options: [],
        correctAnswer: found,
        explanation: explanationFor(v),
        hint: v.exampleDe ? `„${v.exampleDe}“` : T.hintMeaning(v.de),
        exerciseData: {
          clozeSentence,
          tiles: shuffle([found, ...distractors], rng),
          solutionSpeech: v.example,
          targetVocab: [v.core],
        },
      };
    },
  };

  const SPECIAL: ExerciseVariant[] = ['visual_choice', 'emoji_choice', 'letter_puzzle', 'sentence_builder', 'cloze_wordbank'];
  const BASIC: ExerciseVariant[] = ['mc_de_en', 'mc_en_de', 'listen_choose'];

  for (const v of vocab) {
    const specials = shuffle(SPECIAL, rng)
      .map((variant) => ({ variant, draft: builders[variant](v) }))
      .filter((x) => x.draft);
    const chosen: { variant: ExerciseVariant; draft: Draft | null }[] = [];
    // keep at least one basic translation/listening exercise per word
    const specialSlots = Math.max(0, perVocab - 1);
    chosen.push(...specials.slice(0, specialSlots));
    for (const variant of shuffle(BASIC, rng)) {
      if (chosen.length >= perVocab) break;
      chosen.push({ variant, draft: builders[variant](v) });
    }
    // if still short (perVocab > available variants), reuse remaining specials
    for (const s of specials.slice(specialSlots)) {
      if (chosen.length >= perVocab) break;
      chosen.push(s);
    }
    for (const c of chosen) if (c.draft) push(c.draft, v.category);
  }

  // --- group exercises -----------------------------------------------------
  const byCategory = new Map<string, NormalizedVocab[]>();
  for (const v of vocab) {
    const list = byCategory.get(v.category) || [];
    list.push(v);
    byCategory.set(v.category, list);
  }

  // Matching pairs: chunks of 4-5 words per category (leftovers are mixed)
  const leftovers: NormalizedVocab[] = [];
  const makeMatch = (group: NormalizedVocab[], category: string) => {
    const seenL = new Set<string>();
    const seenR = new Set<string>();
    const pairs = group
      .filter((v) => {
        const l = normalizeAnswer(v.core);
        const r = normalizeAnswer(v.de);
        if (seenL.has(l) || seenR.has(r)) return false;
        seenL.add(l);
        seenR.add(r);
        return true;
      })
      .map((v) => ({ left: v.core, right: v.de }));
    if (pairs.length < 3) return;
    push(
      {
        exerciseType: 'match_pairs',
        question: T.match,
        subtext: `${T.subMatch} · ${category}`,
        options: [],
        correctAnswer: encodePairs(pairs),
        explanation: T.explainPairs(pairs.map((p) => `${p.left} = ${p.right}`).join(', ')),
        hint: T.hintMatch,
        exerciseData: { pairs: shuffle(pairs, rng), targetVocab: pairs.map((p) => p.left) },
      },
      category
    );
  };
  for (const [category, list] of byCategory) {
    const shuffled = shuffle(list, rng);
    let i = 0;
    while (shuffled.length - i >= 4) {
      const size = shuffled.length - i === 6 ? 3 : Math.min(5, shuffled.length - i);
      makeMatch(shuffled.slice(i, i + size), category);
      i += size;
    }
    leftovers.push(...shuffled.slice(i));
  }
  for (let i = 0; i + 3 <= leftovers.length; i += 5) {
    makeMatch(leftovers.slice(i, i + 5), lang === 'de' ? 'Gemischt' : 'Mixed');
  }

  // Category sorting: 2-3 categories with 2-3 single words each
  const sortable = Array.from(byCategory.entries())
    .map(([cat, list]) => [cat, list.filter((v) => wordCount(v.core) <= 3)] as const)
    .filter(([, list]) => list.length >= 2);
  if (sortable.length >= 2) {
    const rounds = Math.min(12, Math.max(1, Math.ceil(vocab.length / 10)));
    for (let r = 0; r < rounds; r++) {
      const cats = shuffle(sortable, rng).slice(0, sortable.length >= 3 && rng() < 0.6 ? 3 : 2);
      const perCat = cats.length === 3 ? 2 : 3;
      const usedText = new Set<string>();
      const items: { text: string; category: string }[] = [];
      for (const [cat, list] of cats) {
        for (const v of shuffle(list, rng)) {
          if (items.filter((i) => i.category === cat).length >= perCat) break;
          const key = normalizeAnswer(v.core);
          if (usedText.has(key)) continue;
          usedText.add(key);
          items.push({ text: v.core, category: cat });
        }
      }
      if (items.length < 4) continue;
      push(
        {
          exerciseType: 'category_sort',
          question: T.sort,
          subtext: T.subSort,
          options: [],
          correctAnswer: encodeSort(items),
          explanation: T.explainSort(
            cats.map(([cat]) => `${cat}: ${items.filter((i) => i.category === cat).map((i) => i.text).join(', ')}`).join(' · ')
          ),
          hint: T.hintSort,
          exerciseData: {
            categories: cats.map(([cat]) => cat),
            sortItems: shuffle(items, rng),
            targetVocab: items.map((i) => i.text),
          },
        },
        cats[0][0]
      );
    }
  }

  // Dialogues: order + complete the next line
  const allLines = dialogues.flatMap((d) => d.lines.map((l) => l.text));
  const phraseVocab = vocab.filter((v) => v.kind === 'phrase').map((v) => v.core);
  const dialogueCategory = lang === 'de' ? 'Dialoge' : 'Dialogues';
  for (const d of dialogues) {
    if (d.lines.length >= 3 && d.lines.length <= 8) {
      const lines = d.lines.map((l) => `${l.speaker}: ${l.text}`);
      if (new Set(lines.map(normalizeAnswer)).size === lines.length) {
        push(
          {
            exerciseType: 'dialogue_order',
            question: T.dialogueOrder,
            subtext: d.title ? `${T.subDialogue} · ${d.title}` : T.subDialogue,
            options: [],
            correctAnswer: encodeOrderedTiles(lines, DIALOGUE_SEPARATOR),
            explanation: T.explainDialogue(lines.join(' → ')),
            hint: T.hintDialogue,
            exerciseData: {
              tiles: shuffleDifferent(lines, rng, (x) => x.join('|')),
              separator: DIALOGUE_SEPARATOR,
              solutionSpeech: d.lines.map((l) => l.text).join(' '),
            },
          },
          dialogueCategory
        );
      }
    }
    const indices = shuffle(
      d.lines.map((_, i) => i).filter((i) => i >= 1),
      rng
    ).slice(0, 3);
    for (const i of indices.sort((a, b) => a - b)) {
      const correct = d.lines[i];
      const seen = new Set<string>([normalizeAnswer(correct.text)]);
      const distractors: string[] = [];
      for (const cand of shuffle([...allLines, ...phraseVocab], rng)) {
        const key = normalizeAnswer(cand);
        if (seen.has(key)) continue;
        // avoid the line that directly precedes (would be confusing)
        if (key === normalizeAnswer(d.lines[i - 1].text)) continue;
        seen.add(key);
        distractors.push(cand);
        if (distractors.length >= 3) break;
      }
      if (distractors.length < 3) continue;
      push(
        {
          exerciseType: 'dialogue_complete',
          question: T.dialogueComplete(correct.speaker),
          subtext: d.title ? `${T.subDialogue} · ${d.title}` : T.subDialogue,
          options: shuffle([correct.text, ...distractors], rng),
          correctAnswer: correct.text,
          explanation: T.explainDialogue(
            d.lines.slice(Math.max(0, i - 2), i + 1).map((l) => `${l.speaker}: ${l.text}`).join(' → ')
          ),
          hint: T.hintDialogueComplete,
          exerciseData: {
            dialogueContext: d.lines.slice(Math.max(0, i - 3), i),
            solutionSpeech: correct.text,
          },
        },
        dialogueCategory
      );
    }
  }

  return out;
}

/**
 * Picks a balanced subset for a test: rotates through exercise types and
 * prefers exercises whose vocabulary has not been covered yet.
 */
export function sampleBalancedTest<T extends { id: string; exerciseType?: ExerciseType; exerciseData?: { targetVocab?: string[] } }>(
  questions: T[],
  size: number,
  seed: number = Date.now()
): T[] {
  if (questions.length <= size) return [...questions];
  const rng = createRng(seed);
  const groups = new Map<string, T[]>();
  for (const q of shuffle(questions, rng)) {
    const key = q.exerciseType || 'multiple_choice';
    const list = groups.get(key) || [];
    list.push(q);
    groups.set(key, list);
  }
  const usedVocab = new Set<string>();
  const result: T[] = [];
  const types = shuffle(Array.from(groups.keys()), rng);
  while (result.length < size) {
    let progressed = false;
    for (const type of types) {
      if (result.length >= size) break;
      const list = groups.get(type)!;
      if (list.length === 0) continue;
      let idx = list.findIndex((q) => !(q.exerciseData?.targetVocab || []).some((v) => usedVocab.has(v)));
      if (idx < 0) idx = 0;
      const [q] = list.splice(idx, 1);
      (q.exerciseData?.targetVocab || []).forEach((v) => usedVocab.add(v));
      result.push(q);
      progressed = true;
    }
    if (!progressed) break;
  }
  return shuffle(result, rng);
}
