/**
 * Prompt + response sanitizing for the language scanner pipeline.
 *
 * Step ① of the pipeline: the vision model only extracts *structured learning
 * material* (vocabulary + dialogues). This keeps the output compact (~40
 * tokens per word) so even large workbook units fit into one call. The
 * exercises themselves are generated locally by `vocabExerciseGenerator`.
 */
import type { ExtractedDialogue, ExtractedMaterial, ExtractedVocab } from '../utils/vocabExerciseGenerator';

export const DEFAULT_VISION_MODEL = 'google/gemini-2.5-flash';

export interface VocabPromptOptions {
  bookTitle?: string;
  targetSchoolGrade?: number;
  notes?: string;
}

export const CATEGORY_SUGGESTIONS = [
  'Farben',
  'Zahlen',
  'Tiere',
  'Klassenzimmer',
  'Kleidung',
  'Begrüßung & Phrasen',
  'Verben',
  'Essen & Trinken',
  'Familie',
  'Wörter',
];

export const buildVocabExtractionPrompt = (opts: VocabPromptOptions = {}): string => `You are an expert English teacher digitizing workbook pages for German-speaking children (Austria/Germany) who learn English as a foreign language.
Book / chapter: "${opts.bookTitle || 'English workbook'}". School grade: ${opts.targetSchoolGrade || 5}.
${opts.notes ? `Notes from the parent: "${opts.notes}"\n` : ''}
TASK: Extract ALL learnable English vocabulary, phrases and dialogues from the attached photo(s) as structured JSON.
Do NOT create quiz questions. Only extract the learning material.

RULES
1. Extract EVERY vocabulary item, number, colour, classroom object, label in pictures, phrase and word-list entry. Do not skip or summarize. 100+ items are normal.
2. The same page may be photographed several times: list each item only once.
3. "de": use the German translation printed in the book if present; otherwise give the correct, child-friendly German translation (for nouns without article, e.g. "Schere").
4. "en": exactly as written in the book (keep "to" for verbs, keep phrases like "What's your name?").
5. "example": the English example sentence from the book if shown. If none is shown, write ONE very simple example sentence (A1 level, max 8 words) that contains the word exactly as written (for verbs without "to"). "exampleDe": its German translation.
   For numbers, colours and the very short function words (a, the, and, I, you) an example is still welcome.
6. "category": a short German group label. Prefer: ${CATEGORY_SUGGESTIONS.map((c) => `"${c}"`).join(', ')}. Use another short German label only if none fits.
7. "kind": one of "noun", "verb", "adjective", "phrase", "number", "colour", "function_word", "other".
8. "emoji": ONLY for concrete, picturable nouns with an unambiguous emoji (cat 🐱, scissors ✂️, apple 🍎). Otherwise null. Never for verbs, phrases, abstract words.
9. "numberValue": the integer value for numbers (e.g. "seventeen" → 17), else null.
10. "colorHex": a typical hex colour for colour words (e.g. "red" → "#e53935"), else null.
11. Ignore exercise instructions (e.g. "Höre dir die Wörter an", "Hake sie an") – they are not vocabulary.
12. "dialogues": every dialogue on the pages as ordered lines. Fill gaps with the correct words (use word boxes on the page or the obvious answer). Use the speaker names from the book; if there are none, use "A" and "B". Skip lines you cannot reconstruct (e.g. spelling exercises).

OUTPUT strictly valid JSON (no markdown):
{
  "batchTitle": "short German title, e.g. 'Englisch Unit 1: Schule, Zahlen & Farben'",
  "extractedSummary": "1-2 German sentences describing the content",
  "vocab": [
    { "en": "scissors", "de": "Schere", "example": "Where are my scissors?", "exampleDe": "Wo ist meine Schere?", "category": "Klassenzimmer", "kind": "noun", "emoji": "✂️", "numberValue": null, "colorHex": null }
  ],
  "dialogues": [
    { "title": "Dave & Jenny", "lines": [ { "speaker": "Jenny", "text": "Hi, Dave. How are you?" } ] }
  ]
}`;

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** Defensive parsing of the model output into `ExtractedMaterial`. */
export const sanitizeMaterial = (raw: any): ExtractedMaterial & { batchTitle?: string; extractedSummary?: string } => {
  const vocab: ExtractedVocab[] = (Array.isArray(raw?.vocab) ? raw.vocab : [])
    .filter((v: any) => v && str(v.en) && str(v.de))
    .map((v: any) => ({
      en: str(v.en)!,
      de: str(v.de)!,
      example: str(v.example),
      exampleDe: str(v.exampleDe),
      category: str(v.category),
      kind: str(v.kind),
      emoji: str(v.emoji) ?? null,
      numberValue: typeof v.numberValue === 'number' ? v.numberValue : Number.isFinite(Number(v.numberValue)) && v.numberValue !== null && v.numberValue !== '' ? Number(v.numberValue) : null,
      colorHex: str(v.colorHex) ?? null,
    }));
  const dialogues: ExtractedDialogue[] = (Array.isArray(raw?.dialogues) ? raw.dialogues : [])
    .filter((d: any) => d && Array.isArray(d.lines))
    .map((d: any) => ({
      title: str(d.title),
      lines: d.lines
        .filter((l: any) => l && str(l.text))
        .map((l: any) => ({ speaker: str(l.speaker) || '?', text: str(l.text)! })),
    }))
    .filter((d: ExtractedDialogue) => d.lines.length >= 2);
  return {
    batchTitle: str(raw?.batchTitle),
    extractedSummary: str(raw?.extractedSummary),
    vocab,
    dialogues,
  };
};
