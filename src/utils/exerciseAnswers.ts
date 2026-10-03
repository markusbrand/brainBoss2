import type { ExerciseType, ProblemItem } from '../types';

/** Separator used for pair/sort encodings (never appears in normal vocabulary). */
export const ENTRY_SEPARATOR = ' || ';
export const DIALOGUE_SEPARATOR = ' | ';

/** Exercise types that need a dedicated interactive renderer instead of option buttons. */
export const INTERACTIVE_EXERCISE_TYPES: ExerciseType[] = [
  'sentence_builder',
  'letter_puzzle',
  'cloze_wordbank',
  'dialogue_order',
  'match_pairs',
  'category_sort',
];

export const isInteractiveExercise = (q: Pick<ProblemItem, 'exerciseType'> | null | undefined): boolean =>
  !!q?.exerciseType && INTERACTIVE_EXERCISE_TYPES.includes(q.exerciseType);

/** Normalizes an answer for tolerant-but-exact comparison (case, whitespace, apostrophes). */
export const normalizeAnswer = (value: unknown): string =>
  String(value ?? '')
    .replace(/[\u2018\u2019\u02BC`´]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const encodeOrderedTiles = (tiles: string[], separator: string): string => tiles.join(separator);

export const encodePairs = (pairs: { left: string; right: string }[]): string =>
  pairs
    .map((p) => `${p.left} = ${p.right}`)
    .sort((a, b) => a.localeCompare(b))
    .join(ENTRY_SEPARATOR);

export const encodeSort = (items: { text: string; category: string }[]): string =>
  items
    .map((i) => `${i.text} → ${i.category}`)
    .sort((a, b) => a.localeCompare(b))
    .join(ENTRY_SEPARATOR);

/** All-or-nothing check used by practice mode and tests alike. */
export const isAnswerCorrect = (
  q: Pick<ProblemItem, 'correctAnswer'>,
  answer: unknown
): boolean => {
  if (answer === undefined || answer === null || answer === '') return false;
  return normalizeAnswer(answer) === normalizeAnswer(q.correctAnswer);
};
