import { describe, it, expect } from 'vitest';
import {
  generateExercisesFromMaterial,
  dedupeVocab,
  sampleBalancedTest,
  cleanEnglish,
  ExtractedMaterial,
} from './vocabExerciseGenerator';
import { isAnswerCorrect, isInteractiveExercise, encodePairs, encodeSort } from './exerciseAnswers';

// Fixture modelled on the uploaded "More! 1" workbook pages (Unit 1).
const material: ExtractedMaterial = {
  vocab: [
    { en: 'red', de: 'rot', category: 'Farben', kind: 'colour', colorHex: '#e53935' },
    { en: 'yellow', de: 'gelb', category: 'Farben', kind: 'colour', colorHex: '#fdd835' },
    { en: 'blue', de: 'blau', category: 'Farben', kind: 'colour', colorHex: '#1e88e5' },
    { en: 'green', de: 'grün', category: 'Farben', kind: 'colour', colorHex: '#43a047' },
    { en: 'pink', de: 'rosa', category: 'Farben', kind: 'colour', colorHex: '#f48fb1' },
    { en: 'seven', de: 'sieben', category: 'Zahlen', kind: 'number', numberValue: 7 },
    { en: 'seventeen', de: 'siebzehn', category: 'Zahlen', kind: 'number', numberValue: 17 },
    { en: 'six', de: 'sechs', category: 'Zahlen', kind: 'number', numberValue: 6 },
    { en: 'sixteen', de: 'sechzehn', category: 'Zahlen', kind: 'number', numberValue: 16 },
    { en: 'twenty-one', de: 'einundzwanzig', category: 'Zahlen', kind: 'number', numberValue: 21 },
    { en: 'cat', de: 'Katze', category: 'Tiere', kind: 'noun', emoji: '🐱' },
    { en: 'dog', de: 'Hund', category: 'Tiere', kind: 'noun', emoji: '🐶' },
    { en: 'frog', de: 'Frosch', category: 'Tiere', kind: 'noun', emoji: '🐸' },
    { en: 'crocodile', de: 'Krokodil', category: 'Tiere', kind: 'noun', emoji: '🐊' },
    { en: 'scissors', de: 'Schere', category: 'Klassenzimmer', kind: 'noun', emoji: '✂️' },
    { en: 'ruler', de: 'Lineal', category: 'Klassenzimmer', kind: 'noun', emoji: '📏' },
    { en: 'pencil case', de: 'Federpennal', category: 'Klassenzimmer', kind: 'noun' },
    { en: 'rubber', de: 'Radiergummi', category: 'Klassenzimmer', kind: 'noun' },
    { en: 'a', de: 'ein/eine', category: 'Wörter', kind: 'function_word' },
    { en: 'the', de: 'der/die/das', category: 'Wörter', kind: 'function_word' },
    { en: "What's your name?", de: 'Wie heißt du?', category: 'Begrüßung & Phrasen', kind: 'phrase' },
    { en: 'My name is John.', de: 'Ich heiße John.', category: 'Begrüßung & Phrasen', kind: 'phrase' },
    { en: 'How are you?', de: 'Wie geht es dir?', category: 'Begrüßung & Phrasen', kind: 'phrase' },
    { en: "I am (= I'm) fine.", de: 'Es geht mir gut.', category: 'Begrüßung & Phrasen', kind: 'phrase' },
    { en: 'to give', de: 'geben', example: 'Give me your school bag.', exampleDe: 'Gib mir deine Schultasche.', category: 'Verben', kind: 'verb' },
    { en: 'to understand', de: 'verstehen', example: 'I understand the question.', exampleDe: 'Ich verstehe die Frage.', category: 'Verben', kind: 'verb' },
    { en: 'to write', de: 'schreiben', example: 'Write the numbers.', exampleDe: 'Schreib die Zahlen.', category: 'Verben', kind: 'verb' },
    { en: 'to listen', de: 'zuhören', example: 'Listen to the song.', exampleDe: 'Hör dir das Lied an.', category: 'Verben', kind: 'verb' },
    { en: '(email) address', de: '(E-Mail-)Adresse', example: 'My email address is sara@linkways.com.', category: 'Wörter', kind: 'noun' },
    { en: 'favourite', de: 'Lieblings-', example: 'Green is my favourite colour.', exampleDe: 'Grün ist meine Lieblingsfarbe.', category: 'Wörter', kind: 'adjective' },
    // duplicate from the second photo of the same page
    { en: 'red', de: 'rot', category: 'Farben' },
  ],
  dialogues: [
    {
      title: 'Dave & Jenny',
      lines: [
        { speaker: 'Jenny', text: 'Hi, Dave. How are you?' },
        { speaker: 'Dave', text: "Hello, Jenny. I'm fine, thanks. And you?" },
        { speaker: 'Jenny', text: 'Great, thanks.' },
        { speaker: 'Dave', text: 'Oh, I must go, Jenny. Bye!' },
        { speaker: 'Jenny', text: 'Bye, Dave.' },
      ],
    },
  ],
};

const generate = (seed = 42) => generateExercisesFromMaterial(material, { seed, lang: 'de', idPrefix: 't' });

describe('vocabExerciseGenerator', () => {
  it('dedupes vocabulary photographed twice', () => {
    const deduped = dedupeVocab(material.vocab);
    expect(deduped.filter((v) => v.en === 'red')).toHaveLength(1);
    expect(deduped).toHaveLength(material.vocab.length - 1);
  });

  it('cleans parentheses from English answers', () => {
    expect(cleanEnglish("I am (= I'm) fine.")).toBe('I am fine.');
    expect(cleanEnglish('(email) address')).toBe('address');
  });

  it('creates at least 3 single exercises per vocabulary item with distinct variants', () => {
    const qs = generate();
    const vocab = dedupeVocab(material.vocab).map((v) => cleanEnglish(v.en));
    for (const word of vocab) {
      const single = qs.filter(
        (q) => q.exerciseData?.targetVocab?.length === 1 && q.exerciseData.targetVocab[0] === word
      );
      expect(single.length, word).toBeGreaterThanOrEqual(3);
      // variant = type + question wording direction; must not repeat the exact same exercise
      const keys = new Set(single.map((q) => `${q.exerciseType}|${q.correctAnswer}`));
      expect(keys.size, word).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses at least 3 different exercise types for words with rich material', () => {
    const qs = generate();
    for (const word of ['to give', 'red', 'seventeen', 'frog', 'scissors']) {
      const types = new Set(
        qs.filter((q) => q.exerciseData?.targetVocab?.[0] === word && q.exerciseData.targetVocab.length === 1).map((q) => q.exerciseType)
      );
      expect(types.size, word).toBeGreaterThanOrEqual(3);
    }
  });

  it('produces a varied mix including group and drag & drop exercises', () => {
    const qs = generate();
    const types = new Set(qs.map((q) => q.exerciseType));
    for (const t of [
      'multiple_choice',
      'listen_choose',
      'emoji_choice',
      'visual_choice',
      'letter_puzzle',
      'sentence_builder',
      'cloze_wordbank',
      'match_pairs',
      'category_sort',
      'dialogue_order',
      'dialogue_complete',
    ]) {
      expect(types.has(t as any), t).toBe(true);
    }
  });

  it('only uses emoji for concrete nouns and visuals for numbers/colours', () => {
    const qs = generate();
    for (const q of qs.filter((x) => x.exerciseType === 'emoji_choice')) {
      expect(q.exerciseData?.emoji).toBeTruthy();
    }
    for (const q of qs.filter((x) => x.exerciseType === 'visual_choice')) {
      expect(q.exerciseData?.colorHex || typeof q.exerciseData?.numberValue === 'number').toBeTruthy();
    }
    expect(qs.some((q) => q.exerciseType === 'emoji_choice' && q.correctAnswer === 'to understand')).toBe(false);
  });

  it('builds valid choice questions: 4 distinct options containing the answer', () => {
    const qs = generate().filter((q) => !isInteractiveExercise(q));
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.options.length, q.question).toBe(4);
      expect(new Set(q.options.map((o) => String(o).toLowerCase())).size, q.question).toBe(4);
      expect(q.options.map(String)).toContain(String(q.correctAnswer));
    }
  });

  it('builds solvable tile exercises (tiles reassemble to the answer)', () => {
    const qs = generate();
    for (const q of qs.filter((x) => ['sentence_builder', 'letter_puzzle', 'dialogue_order'].includes(x.exerciseType!))) {
      const tiles = q.exerciseData!.tiles!;
      const sep = q.exerciseData!.separator!;
      const answerParts = sep === '' ? String(q.correctAnswer).split('') : String(q.correctAnswer).split(sep);
      expect([...tiles].sort()).toEqual([...answerParts].sort());
      expect(tiles.join(sep)).not.toBe(q.correctAnswer); // must be shuffled
    }
  });

  it('builds cloze exercises with the answer in the word bank and a gap in the sentence', () => {
    const qs = generate().filter((q) => q.exerciseType === 'cloze_wordbank');
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.exerciseData!.clozeSentence).toContain('___');
      expect(q.exerciseData!.tiles).toContain(q.correctAnswer);
    }
    const give = qs.find((q) => q.exerciseData?.targetVocab?.[0] === 'to give');
    if (give) {
      expect(give.correctAnswer).toBe('Give');
      expect(give.exerciseData!.clozeSentence).toBe('___ me your school bag.');
    }
  });

  it('encodes matching and sorting answers order-independently', () => {
    const qs = generate();
    const match = qs.find((q) => q.exerciseType === 'match_pairs')!;
    expect(isAnswerCorrect(match, encodePairs([...match.exerciseData!.pairs!].reverse()))).toBe(true);
    const sort = qs.find((q) => q.exerciseType === 'category_sort')!;
    expect(isAnswerCorrect(sort, encodeSort(sort.exerciseData!.sortItems!))).toBe(true);
    const wrong = sort.exerciseData!.sortItems!.map((i, idx) =>
      idx === 0 ? { ...i, category: sort.exerciseData!.categories!.find((c) => c !== i.category)! } : i
    );
    expect(isAnswerCorrect(sort, encodeSort(wrong))).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    expect(generate(7)).toEqual(generate(7));
  });

  it('samples a balanced test covering many types', () => {
    const qs = generate();
    const sample = sampleBalancedTest(qs, 30, 1);
    expect(sample).toHaveLength(30);
    expect(new Set(sample.map((q) => q.id)).size).toBe(30);
    expect(new Set(sample.map((q) => q.exerciseType)).size).toBeGreaterThanOrEqual(8);
  });

  it('handles empty material gracefully', () => {
    expect(generateExercisesFromMaterial({ vocab: [] }, { seed: 1 })).toEqual([]);
  });
});

describe('exerciseAnswers', () => {
  it('compares answers tolerant to case, whitespace and apostrophes', () => {
    expect(isAnswerCorrect({ correctAnswer: "What's your name?" }, ' what’s  your name? ')).toBe(true);
    expect(isAnswerCorrect({ correctAnswer: 'ruler' }, 'rule')).toBe(false);
    expect(isAnswerCorrect({ correctAnswer: 'ruler' }, undefined)).toBe(false);
  });
});
