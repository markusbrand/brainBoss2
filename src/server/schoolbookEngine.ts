import type { ExtractedMaterial, ExtractedVocab } from '../utils/vocabExerciseGenerator';

export interface VocabularyItem {
  term: string;
  translation: string;
  exampleSentence?: string;
  category?: string;
}

// Full 42 vocabulary items transcribed directly from IMG_5026 ("MORE Words and Phrases")
export const SAMPLE_PAGE_1_VOCAB: VocabularyItem[] = [
  { term: "to give", translation: "geben", exampleSentence: "Give me your school bag.", category: "verb" },
  { term: "time", translation: "Zeit", exampleSentence: "It's time for school.", category: "noun" },
  { term: "to understand", translation: "verstehen", exampleSentence: "I understand the question.", category: "verb" },
  { term: "to write", translation: "schreiben", exampleSentence: "Write the numbers.", category: "verb" },
  { term: "to enjoy", translation: "genießen", exampleSentence: "Enjoy the music.", category: "verb" },
  { term: "to listen", translation: "zuhören", exampleSentence: "Listen to the song.", category: "verb" },
  { term: "to love", translation: "lieben", exampleSentence: "I love blue. It's my favourite colour.", category: "verb" },
  { term: "more", translation: "mehr", exampleSentence: "I want more!", category: "adverb" },
  { term: "to read", translation: "lesen", exampleSentence: "Read the text.", category: "verb" },
  { term: "their", translation: "ihr/e", exampleSentence: "What's their address?", category: "pronoun" },
  { term: "to ask", translation: "fragen", exampleSentence: "Can I ask you a question?", category: "verb" },
  { term: "(email) address", translation: "(E-Mail-)Adresse", exampleSentence: "My email address is sara@linkways.com.", category: "noun" },
  { term: "How are you?", translation: "Wie geht es dir/Ihnen/euch?", exampleSentence: "How are you? - I am fine.", category: "phrase" },
  { term: "I am (= I'm) fine.", translation: "Es geht mir gut.", exampleSentence: "I am fine, thank you.", category: "phrase" },
  { term: "to meet", translation: "kennenlernen; sich treffen", exampleSentence: "Nice to meet you!", category: "verb" },
  { term: "then", translation: "dann, danach", exampleSentence: "Listen to the dialogue. Then read it.", category: "adverb" },
  { term: "your", translation: "dein/e; Ihr/e; euer/eure", exampleSentence: "What's your email address?", category: "pronoun" },
  { term: "to look", translation: "sehen, schauen; Schau mal.", exampleSentence: "Look at the animals.", category: "verb" },
  { term: "or", translation: "oder", exampleSentence: "Tick or correct the numbers.", category: "conjunction" },
  { term: "to eat", translation: "essen; fressen", exampleSentence: "I eat insects.", category: "verb" },
  { term: "to go", translation: "gehen", exampleSentence: "I must go. Bye.", category: "verb" },
  { term: "must", translation: "müssen", exampleSentence: "I must go now.", category: "verb" },
  { term: "how many", translation: "wie viele", exampleSentence: "How many frogs can you see?", category: "phrase" },
  { term: "to hate", translation: "hassen, nicht ausstehen können", exampleSentence: "I hate pink.", category: "verb" },
  { term: "here", translation: "hier", exampleSentence: "Here's your pencil case.", category: "adverb" },
  { term: "it", translation: "es", exampleSentence: "It's yellow.", category: "pronoun" },
  { term: "Let's ...", translation: "Lass(t) ...", exampleSentence: "Let's sing a song!", category: "phrase" },
  { term: "midnight", translation: "Mitternacht", exampleSentence: "It's twelve o'clock - midnight.", category: "noun" },
  { term: "our", translation: "unser/e", exampleSentence: "This is our school.", category: "pronoun" },
  { term: "favourite", translation: "Lieblings-", exampleSentence: "Green is my favourite colour.", category: "adjective" },
  { term: "to find", translation: "finden", exampleSentence: "Can you find my school tie?", category: "verb" },
  { term: "light", translation: "hell", exampleSentence: "My favourite colour is light blue.", category: "adjective" },
  { term: "child", translation: "Kind", exampleSentence: "The child is in class 1A.", category: "noun" },
  { term: "to clean", translation: "sauber machen, putzen", exampleSentence: "Clean the board.", category: "verb" },
  { term: "to close", translation: "schließen, zumachen", exampleSentence: "Close the door.", category: "verb" },
  { term: "to open", translation: "öffnen, aufmachen", exampleSentence: "Open the window.", category: "verb" },
  { term: "picture", translation: "Bild", exampleSentence: "Look at the pictures.", category: "noun" },
  { term: "to sit down", translation: "sich (hin-)setzen", exampleSentence: "Sit down, children.", category: "verb" },
  { term: "to speak", translation: "sprechen", exampleSentence: "Don't speak. Listen.", category: "verb" },
  { term: "to stand up", translation: "aufstehen", exampleSentence: "Don't stand up. Sit down.", category: "verb" },
  { term: "to take out", translation: "herausnehmen", exampleSentence: "Take out your books.", category: "verb" },
  { term: "class", translation: "(Schul-)Klasse", exampleSentence: "I'm in class 1A.", category: "noun" },
];

// Full 56 vocabulary items transcribed directly from IMG_5027 (Wörter ankreuzen, Numbers 1-25, Colours)
export const SAMPLE_PAGE_2_VOCAB: VocabularyItem[] = [
  // Section 20 Words & Greetings
  { term: "boy", translation: "Junge, Bub", exampleSentence: "The boy has a blue schoolbag.", category: "noun" },
  { term: "girl", translation: "Mädchen", exampleSentence: "The girl is reading a book.", category: "noun" },
  { term: "school", translation: "Schule", exampleSentence: "We love our school.", category: "noun" },
  { term: "apple", translation: "Apfel", exampleSentence: "This is a red apple.", category: "noun" },
  { term: "ball", translation: "Ball", exampleSentence: "We play with a ball.", category: "noun" },
  { term: "cat", translation: "Katze", exampleSentence: "The cat is sleeping.", category: "animals" },
  { term: "dog", translation: "Hund", exampleSentence: "The dog is happy.", category: "animals" },
  { term: "bear", translation: "Bär", exampleSentence: "A big brown bear.", category: "animals" },
  { term: "fish", translation: "Fisch", exampleSentence: "The fish swims in the river.", category: "animals" },
  { term: "frog", translation: "Frosch", exampleSentence: "The green frog can jump.", category: "animals" },
  { term: "crocodile", translation: "Krokodil", exampleSentence: "The crocodile has big teeth.", category: "animals" },
  { term: "gorilla", translation: "Gorilla", exampleSentence: "The gorilla eats bananas.", category: "animals" },
  { term: "insect", translation: "Insekt", exampleSentence: "An insect has six legs.", category: "animals" },
  { term: "honey", translation: "Honig", exampleSentence: "Bears love sweet honey.", category: "noun" },
  { term: "T-shirt", translation: "T-Shirt", exampleSentence: "My T-shirt is bright orange.", category: "clothes" },
  { term: "Hello!", translation: "Hallo!", exampleSentence: "Hello! Nice to meet you.", category: "phrase" },
  { term: "Bye!", translation: "Tschüss!", exampleSentence: "Bye! See you tomorrow.", category: "phrase" },
  { term: "What's your name?", translation: "Wie heißt du?", exampleSentence: "What's your name? - I'm John.", category: "phrase" },
  { term: "My name is John.", translation: "Mein Name ist John.", exampleSentence: "Hello, my name is John.", category: "phrase" },
  { term: "I'm Joanna.", translation: "Ich bin Joanna.", exampleSentence: "Hi, I'm Joanna.", category: "phrase" },
  { term: "I'm sorry.", translation: "Es tut mir leid.", exampleSentence: "I'm sorry, I forgot my pen.", category: "phrase" },
  { term: "please", translation: "bitte", exampleSentence: "Give me the book, please.", category: "phrase" },
  { term: "thank you", translation: "danke schön", exampleSentence: "Thank you very much!", category: "phrase" },
  { term: "to say", translation: "sagen", exampleSentence: "Say hello to your teacher.", category: "verb" },
  { term: "to sing", translation: "singen", exampleSentence: "Let's sing an English song.", category: "verb" },
  // Numbers
  { term: "one", translation: "eins (1)", exampleSentence: "I have one sister.", category: "number" },
  { term: "two", translation: "zwei (2)", exampleSentence: "Two yellow frogs.", category: "number" },
  { term: "three", translation: "drei (3)", exampleSentence: "Three books on the desk.", category: "number" },
  { term: "four", translation: "vier (4)", exampleSentence: "A car has four wheels.", category: "number" },
  { term: "five", translation: "fünf (5)", exampleSentence: "Give me five!", category: "number" },
  { term: "six", translation: "sechs (6)", exampleSentence: "Six coloured pencils.", category: "number" },
  { term: "seven", translation: "sieben (7)", exampleSentence: "There are seven days in a week.", category: "number" },
  { term: "eight", translation: "acht (8)", exampleSentence: "An octopus has eight arms.", category: "number" },
  { term: "nine", translation: "neun (9)", exampleSentence: "Nine apples in the tree.", category: "number" },
  { term: "ten", translation: "zehn (10)", exampleSentence: "Count to ten.", category: "number" },
  { term: "eleven", translation: "elf (11)", exampleSentence: "Soccer has eleven players.", category: "number" },
  { term: "twelve", translation: "zwölf (12)", exampleSentence: "It's twelve o'clock - midnight.", category: "number" },
  { term: "thirteen", translation: "dreizehn (13)", exampleSentence: "Thirteen stars in the sky.", category: "number" },
  { term: "fourteen", translation: "vierzehn (14)", exampleSentence: "Fourteen students in class.", category: "number" },
  { term: "fifteen", translation: "fünfzehn (15)", exampleSentence: "Fifteen minutes break.", category: "number" },
  { term: "sixteen", translation: "sechzehn (16)", exampleSentence: "Sixteen sweet cherries.", category: "number" },
  { term: "seventeen", translation: "siebzehn (17)", exampleSentence: "Seventeen birds flying.", category: "number" },
  { term: "eighteen", translation: "achtzehn (18)", exampleSentence: "Eighteen colourful balloons.", category: "number" },
  { term: "nineteen", translation: "neunzehn (19)", exampleSentence: "Nineteen coins collected.", category: "number" },
  { term: "twenty", translation: "zwanzig (20)", exampleSentence: "Twenty steps to the door.", category: "number" },
  { term: "twenty-one", translation: "einundzwanzig (21)", exampleSentence: "Page twenty-one in our book.", category: "number" },
  { term: "twenty-two", translation: "zweiundzwanzig (22)", exampleSentence: "Twenty-two butterflies.", category: "number" },
  { term: "twenty-three", translation: "dreiundzwanzig (23)", exampleSentence: "Twenty-three flowers.", category: "number" },
  { term: "twenty-four", translation: "vierundzwanzig (24)", exampleSentence: "Twenty-four hours a day.", category: "number" },
  { term: "twenty-five", translation: "fünfundzwanzig (25)", exampleSentence: "Twenty-five gold coins.", category: "number" },
  // Colours
  { term: "red", translation: "rot", exampleSentence: "The apple is bright red.", category: "colour" },
  { term: "yellow", translation: "gelb", exampleSentence: "The warm sun is yellow.", category: "colour" },
  { term: "blue", translation: "blau", exampleSentence: "The sky and sea are blue.", category: "colour" },
  { term: "green", translation: "grün", exampleSentence: "The frog and grass are green.", category: "colour" },
  { term: "orange", translation: "orange", exampleSentence: "An orange carrot.", category: "colour" },
  { term: "brown", translation: "braun", exampleSentence: "A furry brown bear.", category: "colour" },
  { term: "pink", translation: "rosa, pink", exampleSentence: "A lovely pink flamingo.", category: "colour" },
  { term: "white", translation: "weiß", exampleSentence: "Fluffy white clouds.", category: "colour" },
  { term: "black", translation: "schwarz", exampleSentence: "A sleek black cat.", category: "colour" },
  { term: "grey", translation: "grau", exampleSentence: "A strong grey elephant.", category: "colour" },
];

export const toExtractedMaterial = (
  vocabList: VocabularyItem[],
  batchTitle: string
): ExtractedMaterial & { batchTitle: string; extractedSummary: string } => {
  const numberMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21, 'twenty-two': 22,
    'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
  };

  const colorMap: Record<string, string> = {
    red: '#ef4444', yellow: '#eab308', blue: '#3b82f6', green: '#22c55e', orange: '#f97316',
    brown: '#854d0e', pink: '#ec4899', white: '#ffffff', black: '#0f172a', grey: '#64748b',
  };

  const emojiMap: Record<string, string> = {
    apple: '🍎', ball: '⚽', cat: '🐱', dog: '🐶', bear: '🐻', fish: '🐟', frog: '🐸',
    crocodile: '🐊', gorilla: '🦍', insect: '🐜', honey: '🍯', 'T-shirt': '👕', boy: '👦',
    girl: '👧', school: '🏫', picture: '🖼️', child: '🧒',
  };

  const vocab: ExtractedVocab[] = vocabList.map((v) => {
    const isVerb = v.term.startsWith('to ') || v.category === 'verb';
    const isNumber = v.category === 'number';
    const isColour = v.category === 'colour';
    const cleanEn = v.term.replace(/^to /, '');

    return {
      en: isVerb ? v.term : cleanEn,
      de: v.translation,
      example: v.exampleSentence,
      exampleDe: undefined,
      category:
        v.category === 'animals'
          ? 'Tiere'
          : v.category === 'number'
          ? 'Zahlen'
          : v.category === 'colour'
          ? 'Farben'
          : v.category === 'verb'
          ? 'Verben'
          : 'Wörter',
      kind: isVerb
        ? 'verb'
        : isNumber
        ? 'number'
        : isColour
        ? 'colour'
        : v.category === 'phrase'
        ? 'phrase'
        : 'noun',
      numberValue: isNumber ? numberMap[cleanEn.toLowerCase()] ?? null : null,
      colorHex: isColour ? colorMap[cleanEn.toLowerCase()] ?? null : null,
      emoji: emojiMap[cleanEn.toLowerCase()] ?? null,
    };
  });

  return {
    batchTitle,
    extractedSummary: `Vollständige Vokabelliste mit ${vocab.length} Begriffen aus dem Schulbuch.`,
    vocab,
    dialogues: [
      {
        title: 'Klassenzimmer Begrüßung',
        lines: [
          { speaker: 'Teacher', text: 'Good morning, class! Please sit down.' },
          { speaker: 'Students', text: 'Good morning, teacher!' },
          { speaker: 'Teacher', text: 'Take out your English books, please.' },
        ],
      },
    ],
  };
};

export const SAMPLE_PAGE_1_MATERIAL = toExtractedMaterial(
  SAMPLE_PAGE_1_VOCAB,
  'More Words and Phrases - English Unit 1 (IMG_5026)'
);

export const SAMPLE_PAGE_2_MATERIAL = toExtractedMaterial(
  SAMPLE_PAGE_2_VOCAB,
  'English Textbook Unit 1 - Numbers & Colours (IMG_5027)'
);

// Helper: Scramble letters for anagram puzzle
export function scrambleLetters(text: string): string[] {
  const letters = text.toLowerCase().replace(/[^a-z0-9]/gi, '').split('');
  if (letters.length <= 1) return letters;
  
  // Deterministic shuffle that ensures letters != original order
  const shuffled = [...letters];
  let attempts = 0;
  while (attempts < 10) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.join('') !== letters.join('')) break;
    attempts++;
  }
  return shuffled;
}

// Helper: Clean base word from infinitive "to ..."
export function getCleanWord(term: string): string {
  return term.replace(/^to\s+/i, '').trim();
}

// Generate creative distractors drawn from the same vocabulary list
export function getDistractors(
  correctWord: string,
  allVocab: VocabularyItem[],
  preferredCategory?: string,
  count = 3
): string[] {
  const normalizedCorrect = correctWord.trim().toLowerCase();
  
  // 1. Try words in same category first
  const sameCat = allVocab
    .filter((v) => {
      const clean = getCleanWord(v.term).toLowerCase();
      return clean !== normalizedCorrect && (!preferredCategory || v.category === preferredCategory);
    })
    .map((v) => getCleanWord(v.term));

  // 2. Other words
  const otherWords = allVocab
    .filter((v) => {
      const clean = getCleanWord(v.term).toLowerCase();
      return clean !== normalizedCorrect && !sameCat.includes(clean);
    })
    .map((v) => getCleanWord(v.term));

  const pool = Array.from(new Set([...sameCat, ...otherWords]));
  
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, count);
  // Pad if needed
  const fallbackWords = ['school', 'pencil', 'happy', 'friend', 'listen', 'number'];
  while (selected.length < count) {
    const fb = fallbackWords.find((w) => w !== normalizedCorrect && !selected.includes(w)) || `word-${selected.length}`;
    selected.push(fb);
  }
  return selected;
}

// Generate German translation distractors
export function getGermanDistractors(
  correctTrans: string,
  allVocab: VocabularyItem[],
  count = 3
): string[] {
  const normalizedCorrect = correctTrans.trim().toLowerCase();
  const pool = Array.from(
    new Set(
      allVocab
        .map((v) => v.translation)
        .filter((t) => t.trim().toLowerCase() !== normalizedCorrect)
    )
  );

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, count);
  const fallbacks = ['verstehen', 'schreiben', 'lesen', 'sehen', 'sagen', 'öffnen'];
  while (selected.length < count) {
    const fb = fallbacks.find((w) => w !== normalizedCorrect && !selected.includes(w)) || `Bedeutung ${selected.length + 1}`;
    selected.push(fb);
  }
  return selected;
}

// Create a blank sentence for Drag & Drop
export function createSentenceBlank(
  term: string,
  exampleSentence?: string
): { blankSentence: string; targetWord: string; sentenceBefore: string; sentenceAfter: string } {
  const cleanWord = getCleanWord(term);
  
  if (exampleSentence && exampleSentence.length > 5) {
    // Look for cleanWord or term inside exampleSentence
    const regex = new RegExp(`\\b${cleanWord}\\b`, 'i');
    if (regex.test(exampleSentence)) {
      const parts = exampleSentence.split(regex);
      return {
        blankSentence: `${parts[0] || ''}[____]${parts[1] || ''}`.trim(),
        targetWord: cleanWord,
        sentenceBefore: parts[0] || '',
        sentenceAfter: parts[1] || '',
      };
    }
  }

  // Fallback sentence templates
  return {
    blankSentence: `Look! This is my [____].`,
    targetWord: cleanWord,
    sentenceBefore: 'Look! This is my ',
    sentenceAfter: '.',
  };
}

// Mask letters for Spelling Bee / Missing Letters Puzzle
export function maskWordLetters(word: string): { maskedWord: string; missingLetters: string; distractorMissing: string[] } {
  const clean = word.toLowerCase().trim();
  if (clean.length <= 3) {
    return {
      maskedWord: `${clean[0]} _ ${clean.slice(2)}`,
      missingLetters: clean[1] || 'a',
      distractorMissing: ['e', 'o', 'i'],
    };
  }

  // Pick 1 or 2 vowels or middle letters
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  let vowelIdx = -1;
  for (let i = 1; i < clean.length - 1; i++) {
    if (vowels.includes(clean[i])) {
      vowelIdx = i;
      break;
    }
  }
  if (vowelIdx === -1) vowelIdx = Math.floor(clean.length / 2);

  const missing = clean[vowelIdx];
  const masked = clean.substring(0, vowelIdx) + ' _ ' + clean.substring(vowelIdx + 1);
  const otherVowels = vowels.filter((v) => v !== missing);

  return {
    maskedWord: masked,
    missingLetters: missing,
    distractorMissing: otherVowels.slice(0, 3),
  };
}

// Master Function: Ensure 100% vocabulary coverage with at least 2 creative quizzes per word
export function ensureCompleteVocabularyQuizzes(
  vocabularyList: VocabularyItem[],
  existingQuestions: any[] = [],
  context: {
    batchId: string;
    batchTitle: string;
    targetSchoolGrade: number;
    detectedGradeLevel: string;
    effectiveSubject: string;
    isGerman: boolean;
    assignedKidId: string;
  }
): any[] {
  const finalQuestions: any[] = [];
  const assignedWords = new Map<string, any[]>();

  // Map existing questions to their vocabulary term if matched
  existingQuestions.forEach((q) => {
    const vocabTerm = q.vocabularyItem?.term || q.visual?.pronounceText || q.correctAnswer;
    const cleanTerm = typeof vocabTerm === 'string' ? getCleanWord(vocabTerm).toLowerCase() : '';
    if (cleanTerm) {
      if (!assignedWords.has(cleanTerm)) assignedWords.set(cleanTerm, []);
      assignedWords.get(cleanTerm)!.push(q);
      finalQuestions.push(q);
    } else {
      finalQuestions.push(q);
    }
  });

  // Cycle through all vocabulary items and ensure AT LEAST 2 creative quizzes per word!
  vocabularyList.forEach((vocab, vocabIdx) => {
    const cleanWord = getCleanWord(vocab.term);
    const key = cleanWord.toLowerCase();
    const existing = assignedWords.get(key) || [];

    const neededQuizzes = Math.max(0, 2 - existing.length);
    if (neededQuizzes === 0) return;

    // Gamification Quiz 1: Anagram Letter Scramble Puzzle ('puzzle_scramble')
    if (neededQuizzes >= 1) {
      const scrambled = scrambleLetters(cleanWord);
      const distractors = getDistractors(cleanWord, vocabularyList, vocab.category, 3);
      const options = [cleanWord, ...distractors].sort(() => Math.random() - 0.5);

      const scrambleQuiz = {
        id: `scan-q-${context.batchId}-scramble-${vocabIdx + 1}`,
        subject: context.effectiveSubject,
        topic: context.batchTitle,
        gradeLevel: context.detectedGradeLevel,
        schoolGrade: context.targetSchoolGrade,
        difficulty: cleanWord.length > 7 ? 3 : 2,
        questionType: 'puzzle_scramble',
        question: context.isGerman
          ? `🧩 Buchstaben-Puzzle: Bringe die Buchstaben in die richtige Reihenfolge für „${vocab.translation}“!`
          : `🧩 Letter Puzzle: Unscramble the letters to spell "${cleanWord}" (${vocab.translation})!`,
        subtext: context.isGerman
          ? `Buchstaben-Rätsel (${cleanWord.length} Buchstaben)`
          : `Letter Puzzle (${cleanWord.length} letters)`,
        puzzleData: {
          scrambledLetters: scrambled,
          targetWord: cleanWord,
          blankSentence: vocab.exampleSentence,
        },
        vocabularyItem: vocab,
        options,
        correctAnswer: cleanWord,
        explanation: context.isGerman
          ? `Hervorragend! Auf Englisch heißt „${vocab.translation}“: ${cleanWord}. Buchstabiert: ${cleanWord.toUpperCase().split('').join('-')}.`
          : `Great job! "${vocab.translation}" in English is ${cleanWord}.`,
        hint: context.isGerman
          ? `Tipp: Das Wort beginnt mit dem Buchstaben ‚${cleanWord[0].toUpperCase()}‘ und hat ${cleanWord.length} Buchstaben.`
          : `Hint: Starts with '${cleanWord[0].toUpperCase()}'.`,
        visual: {
          pronounceText: vocab.term,
          pronounceLang: 'en-US',
          imagePrompt: `A vibrant cartoon illustration representing the word "${cleanWord}" (${vocab.translation})`,
        },
        xp: 35,
        coins: 18,
        source: 'schoolbook_scan',
        scanBatchId: context.batchId,
        scanBatchTitle: context.batchTitle,
        assignedKidId: context.assignedKidId,
      };

      finalQuestions.push(scrambleQuiz);
      if (!assignedWords.has(key)) assignedWords.set(key, []);
      assignedWords.get(key)!.push(scrambleQuiz);
    }

    // Gamification Quiz 2: Drag & Drop Sentence Completion or Audio Challenge or Dialogue
    if (neededQuizzes >= 2) {
      const isPhrase = vocab.category === 'phrase' || vocab.term.includes('?') || vocab.term.includes('!');
      
      if (isPhrase) {
        // Dialogue Context Quiz
        const germanDistractors = getGermanDistractors(vocab.translation, vocabularyList, 3);
        const options = [vocab.translation, ...germanDistractors].sort(() => Math.random() - 0.5);

        const dialogueQuiz = {
          id: `scan-q-${context.batchId}-dialogue-${vocabIdx + 1}`,
          subject: context.effectiveSubject,
          topic: context.batchTitle,
          gradeLevel: context.detectedGradeLevel,
          schoolGrade: context.targetSchoolGrade,
          difficulty: 2,
          questionType: 'dialogue_context',
          question: context.isGerman
            ? `💬 Dialog & Sprach-Szene: Im Klassenzimmer hörst du: ‚${vocab.term}‘. Was bedeutet das auf Deutsch?`
            : `💬 Dialogue: In the classroom someone says: "${vocab.term}". What does it mean?`,
          subtext: context.isGerman ? `Englische Konversation & Phrasen` : `English Conversation`,
          puzzleData: {
            dialogueSpeaker: 'Teacher / Classmate',
            targetWord: vocab.term,
          },
          vocabularyItem: vocab,
          options,
          correctAnswer: vocab.translation,
          explanation: context.isGerman
            ? `Richtig! ‚${vocab.term}‘ bedeutet auf Deutsch: „${vocab.translation}“. Typischer Satz: ${vocab.exampleSentence || vocab.term}`
            : `Correct! "${vocab.term}" means "${vocab.translation}".`,
          hint: context.isGerman ? `Höre dir die englische Phrase mit dem Lautsprecher-Symbol an!` : `Listen to the audio!`,
          visual: {
            pronounceText: vocab.term,
            pronounceLang: 'en-US',
            imagePrompt: `Two cheerful school students talking happily in a bright classroom`,
          },
          xp: 30,
          coins: 15,
          source: 'schoolbook_scan',
          scanBatchId: context.batchId,
          scanBatchTitle: context.batchTitle,
          assignedKidId: context.assignedKidId,
        };

        finalQuestions.push(dialogueQuiz);
        assignedWords.get(key)!.push(dialogueQuiz);
      } else {
        // Drag & Drop Sentence Blank Quiz
        const sentenceData = createSentenceBlank(cleanWord, vocab.exampleSentence);
        const distractors = getDistractors(cleanWord, vocabularyList, vocab.category, 3);
        const options = [cleanWord, ...distractors].sort(() => Math.random() - 0.5);

        const dragDropQuiz = {
          id: `scan-q-${context.batchId}-dragdrop-${vocabIdx + 1}`,
          subject: context.effectiveSubject,
          topic: context.batchTitle,
          gradeLevel: context.detectedGradeLevel,
          schoolGrade: context.targetSchoolGrade,
          difficulty: 2,
          questionType: 'drag_drop_sentence',
          question: context.isGerman
            ? `🎯 Drag & Drop Lückentext: Welches Wort gehört in die Lücke? ‚${sentenceData.blankSentence}‘`
            : `🎯 Drag & Drop: Complete the sentence: "${sentenceData.blankSentence}"`,
          subtext: context.isGerman ? `Setze das passende Wort aus dem Schulbuch ein` : `Select the correct textbook word`,
          puzzleData: {
            blankSentence: sentenceData.blankSentence,
            targetWord: cleanWord,
            sentenceBefore: sentenceData.sentenceBefore,
            sentenceAfter: sentenceData.sentenceAfter,
          },
          vocabularyItem: vocab,
          options,
          correctAnswer: cleanWord,
          explanation: context.isGerman
            ? `Perfekt eingesetzt! Der vollständige Satz lautet: „${sentenceData.sentenceBefore}${cleanWord}${sentenceData.sentenceAfter}“ (Bedeutung von ${cleanWord}: ${vocab.translation}).`
            : `Well done! The complete sentence is: "${sentenceData.sentenceBefore}${cleanWord}${sentenceData.sentenceAfter}".`,
          hint: context.isGerman
            ? `Gesucht ist das englische Wort für „${vocab.translation}“.`
            : `Looking for the word meaning "${vocab.translation}".`,
          visual: {
            pronounceText: `${sentenceData.sentenceBefore} ${cleanWord} ${sentenceData.sentenceAfter}`.trim(),
            pronounceLang: 'en-US',
            imagePrompt: `A colourful schoolbook page illustration showing: ${vocab.exampleSentence || cleanWord}`,
          },
          xp: 35,
          coins: 18,
          source: 'schoolbook_scan',
          scanBatchId: context.batchId,
          scanBatchTitle: context.batchTitle,
          assignedKidId: context.assignedKidId,
        };

        finalQuestions.push(dragDropQuiz);
        assignedWords.get(key)!.push(dragDropQuiz);
      }
    }
  });

  return finalQuestions;
}
