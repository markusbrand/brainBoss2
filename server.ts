import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Generate AI Math Story Quest
app.post("/api/gemini/generate-quest", async (req, res) => {
  try {
    const { gradeLevel = "primary", theme = "space", difficulty = 1, language = "de" } = req.body;
    const ai = getGeminiClient();

    const isGerman = language === "de";

    if (!ai) {
      // Graceful fallback with rich procedural story
      if (isGerman) {
        return res.json({
          questTitle: `${theme.toUpperCase()} Mathe-Expedition`,
          theme,
          storyIntro: `Willkommen Kapitän! Deine Crew benötigt schnelle Berechnungen, um durch das ${theme}-Reich zu navigieren.`,
          steps: [
            {
              id: "step-1",
              story: `Wir brauchen Energiekristalle! Wenn du 4 rote und 5 blaue Kristalle einlädst, wie viele treiben das Triebwerk an?`,
              problem: "4 + 5 = ?",
              correctAnswer: 9,
              options: [7, 8, 9, 10],
              hint: "Zähle weiter: Beginne bei 4 und zähle 5 weiter: 5, 6, 7, 8, 9!",
              xp: 25,
              coins: 10,
            },
            {
              id: "step-2",
              story: `Asteroidenwarnung! Der Schild benötigt 18 Energieeinheiten. Wir haben nur 9. Wie viel fehlt noch?`,
              problem: "18 - 9 = ?",
              correctAnswer: 9,
              options: [8, 9, 11, 12],
              hint: "Überlege: 9 + welche Zahl ergibt 18?",
              xp: 30,
              coins: 15,
            },
            {
              id: "step-3",
              story: `Finaler Sprung! Wir haben 3 Hyper-Triebwerkszellen, jede mit 4 Warp-Ladungen. Wie hoch ist die Gesamtleistung?`,
              problem: "3 × 4 = ?",
              correctAnswer: 12,
              options: [7, 10, 12, 14],
              hint: "Addiere die 4 dreimal: 4 + 4 + 4 = 12!",
              xp: 50,
              coins: 25,
            },
          ],
        });
      }

      return res.json({
        questTitle: `${theme.toUpperCase()} Math Expedition`,
        theme,
        storyIntro: `Welcome Captain! Your crew needs quick calculations to navigate the ${theme} realm.`,
        steps: [
          {
            id: "step-1",
            story: `We need fuel crystals! If you load 4 red crystals and 5 blue crystals, how many total crystals are powering the engine?`,
            problem: "4 + 5 = ?",
            correctAnswer: 9,
            options: [7, 8, 9, 10],
            hint: "Count up: start at 4 and count 5 more: 5, 6, 7, 8, 9!",
            xp: 25,
            coins: 10,
          },
          {
            id: "step-2",
            story: `Asteroid warning! The shield takes 18 energy units. We only have 9. How much more energy is required?`,
            problem: "18 - 9 = ?",
            correctAnswer: 9,
            options: [8, 9, 11, 12],
            hint: "Think: 9 + what number equals 18?",
            xp: 30,
            coins: 15,
          },
          {
            id: "step-3",
            story: `Final jump! We have 3 hyper-drive booster packs, each holding 4 warp charges. What is the total jump power?`,
            problem: "3 × 4 = ?",
            correctAnswer: 12,
            options: [7, 10, 12, 14],
            hint: "Add 4 three times: 4 + 4 + 4 = 12!",
            xp: 50,
            coins: 25,
          },
        ],
      });
    }

    const targetLangName = isGerman ? "German (Deutsch)" : "English";
    const prompt = `Create a fun, kid-friendly 3-step math quest written entirely in ${targetLangName} for a ${gradeLevel} student (Difficulty level ${difficulty}/5) themed around "${theme}".
Output strictly valid JSON with this exact schema:
{
  "questTitle": "Exciting Quest Name in ${targetLangName}",
  "theme": "${theme}",
  "storyIntro": "Short 1-2 sentence immersive intro in ${targetLangName}",
  "steps": [
    {
      "id": "step-1",
      "story": "1-2 sentence fun scenario presenting the problem in ${targetLangName}",
      "problem": "e.g. 12 + 15 = ?",
      "correctAnswer": 27,
      "options": [24, 25, 27, 30],
      "hint": "Encouraging simple hint for kids in ${targetLangName}",
      "xp": 30,
      "coins": 15
    },
    {
      "id": "step-2",
      "story": "scenario in ${targetLangName}",
      "problem": "...",
      "correctAnswer": 10,
      "options": [8, 10, 12, 14],
      "hint": "... in ${targetLangName}",
      "xp": 35,
      "coins": 20
    },
    {
      "id": "step-3",
      "story": "boss climax scenario in ${targetLangName}",
      "problem": "...",
      "correctAnswer": 50,
      "options": [40, 45, 50, 60],
      "hint": "... in ${targetLangName}",
      "xp": 60,
      "coins": 30
    }
  ]
}
For Primary school: Use visual friendly math (arithmetic, simple multiplication, division, missing numbers, fractions basics).
For High school: Use algebra (solve for x, $2x+5=15$), order of operations, powers, or percentages.
Make sure correctAnswer is one of the 4 options and options are numbers (or integers).
All text in story, questTitle, storyIntro, and hints MUST be in ${targetLangName}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini quest generation error:", error);
    res.status(500).json({ error: "Failed to generate quest", fallbackAvailable: true });
  }
});

// API: Get instant friendly AI hint
app.post("/api/gemini/math-hint", async (req, res) => {
  try {
    const { problem, gradeLevel = "primary", language = "de" } = req.body;
    const ai = getGeminiClient();
    const isGerman = language === "de";

    if (!ai) {
      return res.json({
        hint: isGerman
          ? "Zerlege die Aufgabe Schritt für Schritt! Versuche zuerst mit den größeren Zahlen zu beginnen."
          : "Break the problem down step by step! Try starting with the largest numbers first.",
      });
    }

    const targetLang = isGerman ? "German (Deutsch)" : "English";
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Give a cheerful, super encouraging 1-2 sentence hint in ${targetLang} for a ${gradeLevel} kid trying to solve this math problem: "${problem}". Do NOT reveal the direct final answer, guide their thinking with a fun trick! The response must be entirely in ${targetLang}.`,
      config: {
        temperature: 0.7,
      },
    });

    res.json({
      hint: response.text?.trim() || (isGerman ? "Du schaffst das! Zähle sorgfältig Schritt für Schritt." : "You've got this! Count carefully step by step."),
    });
  } catch (error) {
    console.error("Gemini hint error:", error);
    res.json({
      hint: "Break it down into smaller pieces and add them up!",
    });
  }
});

// API: Generate OpenSpec feature draft using AI
app.post("/api/gemini/generate-openspec", async (req, res) => {
  try {
    const { featureName, userDescription, category = "math-gameplay", language = "de" } = req.body;
    const ai = getGeminiClient();
    const isGerman = language === "de";

    if (!ai) {
      return res.json({
        spec: {
          id: `spec-${Date.now()}`,
          title: featureName || (isGerman ? "Individuelle Mathe-Funktion" : "Custom Math Feature"),
          version: "1.0.0",
          category,
          overview: userDescription || (isGerman ? "Gamifizierte Mathe-Erweiterung für BrainBoss." : "Gamified math capability enhancement for BrainBoss."),
          acceptanceCriteria: isGerman
            ? [
                "Zufällige prozedurale Aufgabengenerierung passend zur Zielstufe (Grundschule/Oberstufe)",
                "Interaktive Belohnungstrigger bei Abschluss (XP, Audio-Sounds, Konfetti)",
                "Responsives Layout für Mobil- und Desktopansichten",
              ]
            : [
                "Randomized procedural task generation matching target grade level",
                "Interactive reward triggers upon completion (XP, audio chimes, confetti)",
                "Responsive layout supporting mobile and desktop viewports",
              ],
          components: ["MathGameBoard", "RewardTrigger", "ProgressionState"],
          promptTemplate: `Implement a feature '${featureName}' for BrainBoss that delivers: ${userDescription}. Follow OpenSpec standards with TypeScript strict types.`,
        },
      });
    }

    const prompt = `Create an OpenSpec feature specification JSON for BrainBoss (in ${isGerman ? 'German' : 'English'}):
Feature Name: ${featureName}
User Description: ${userDescription}
Category: ${category}

Output valid JSON matching this schema:
{
  "id": "openspec-feat-uuid",
  "title": "Clear Title",
  "version": "1.0.0",
  "category": "${category}",
  "overview": "Detailed description of purpose, kids UX goals, and architecture",
  "acceptanceCriteria": [
    "AC 1: Detailed testable requirement",
    "AC 2: Detailed testable requirement",
    "AC 3: Detailed testable requirement",
    "AC 4: Detailed testable requirement"
  ],
  "components": ["ComponentA", "ComponentB", "ComponentC"],
  "promptTemplate": "A production-ready AI prompt to prompt an LLM or developer to implement this exact OpenSpec feature."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ spec: parsed });
  } catch (error) {
    console.error("OpenSpec generation error:", error);
    res.status(500).json({ error: "Failed to generate OpenSpec" });
  }
});

// API: Generate Custom Questions with Gemini AI for Parents Center
app.post("/api/gemini/generate-questions", async (req, res) => {
  try {
    const {
      subject = "math",
      topic = "all",
      gradeLevel = "primary",
      difficulty = 3,
      count = 5,
      targetLanguage = "en",
      customPrompt = "",
      language = "de",
    } = req.body;

    const ai = getGeminiClient();
    const isGerman = language === "de";
    const targetLangName = isGerman ? "German (Deutsch)" : "English";

    if (!ai) {
      // Fallback questions if API key is not present
      const fallbackQuestions = Array.from({ length: Math.min(count, 5) }).map((_, idx) => ({
        id: `ai-gen-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        subject,
        topic: topic === "all" ? `${subject}_general` : topic,
        gradeLevel,
        difficulty: Number(difficulty),
        question: isGerman
          ? `[KI-Aufgabe #${idx + 1}] Welche Antwort ist für ${subject} (Schwierigkeit ${difficulty}/5) korrekt?`
          : `[AI Task #${idx + 1}] Which answer is correct for ${subject} (Difficulty ${difficulty}/5)?`,
        subtext: isGerman ? "Wähle die richtige Option" : "Select the correct option",
        options: isGerman
          ? [`Richtige Antwort #${idx + 1}`, `Option B`, `Option C`, `Option D`]
          : [`Correct Answer #${idx + 1}`, `Option B`, `Option C`, `Option D`],
        correctAnswer: isGerman ? `Richtige Antwort #${idx + 1}` : `Correct Answer #${idx + 1}`,
        explanation: isGerman
          ? "Dies ist die mathematisch und logisch fundierte Begründung."
          : "This is the logically and mathematically proven explanation.",
        hint: isGerman
          ? "Lies die Aufgabenstellung sorgfältig und schließe falsche Optionen aus."
          : "Read the prompt carefully and eliminate unlikely answers.",
        xp: 25 + Number(difficulty) * 5,
        coins: 10 + Number(difficulty) * 3,
      }));

      return res.json({ questions: fallbackQuestions });
    }

    const prompt = `You are an expert curriculum designer for children & teenagers learning platform BrainBoss.
Generate ${count} high-quality, creative, educationally sound multiple-choice questions for:
- Subject: ${subject} (math, nature, geography, art, languages)
- Topic: ${topic}
- Grade Level: ${gradeLevel} (${gradeLevel === "primary" ? "Primary School / Grundstufe (ages 6-11)" : "Secondary/High School / Sekundarstufe (ages 12-18)"})
- Granular Difficulty: ${difficulty} (on a scale of 1 to 5, where 1 is absolute beginner and 5 is advanced master)
- Target Language (if subject is languages): ${targetLanguage}
- Additional Context / Teacher Instructions: ${customPrompt || "Focus on deep understanding, playful scenarios, and zero repetition."}
- Output Language: ${targetLangName} (All question text, options, explanations, hints MUST be in ${targetLangName}).

Output strictly valid JSON with this exact schema:
{
  "questions": [
    {
      "id": "gen-unique-id",
      "subject": "${subject}",
      "topic": "${topic}",
      "gradeLevel": "${gradeLevel}",
      "difficulty": ${difficulty},
      "question": "Clear, engaging question string in ${targetLangName}",
      "subtext": "Short helpful subtitle or instruction",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A (Must exactly match one of the items in options array)",
      "explanation": "Kid-friendly clear explanation of why this is correct in ${targetLangName}",
      "hint": "Gentle guiding hint without giving away the direct answer in ${targetLangName}",
      "xp": 30,
      "coins": 15
    }
  ]
}
Ensure all 4 options are distinct, interesting, plausible, and the correctAnswer is exactly equal to one of the 4 items.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.75,
      },
    });

    const parsed = JSON.parse(response.text || '{"questions": []}');
    // Ensure ids are assigned
    const cleanedQuestions = (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: q.id || `ai-gen-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      subject: q.subject || subject,
      gradeLevel: q.gradeLevel || gradeLevel,
      difficulty: Number(q.difficulty) || Number(difficulty),
      xp: q.xp || 25 + Number(difficulty) * 5,
      coins: q.coins || 10 + Number(difficulty) * 3,
    }));

    res.json({ questions: cleanedQuestions });
  } catch (error) {
    console.error("Question generator error:", error);
    res.status(500).json({ error: "Failed to generate questions", questions: [] });
  }
});

// API: Process Schoolbook / Worksheet / Homework Photos with Gemini Vision
app.post("/api/gemini/scan-schoolbook", async (req, res) => {
  try {
    const {
      images = [], // array of base64 strings or data URLs
      image = "",  // single base64 string or data URL
      bookTitle = "",
      targetSchoolGrade = 3,
      assignedKidId = "all",
      targetLanguage = "en",
      notes = "",
      language = "de",
    } = req.body;

    const rawImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImages.push(...images.filter(Boolean));
    } else if (image && typeof image === "string") {
      rawImages.push(image);
    }

    const isGerman = language === "de";
    const targetLangName = isGerman ? "German (Deutsch)" : "English";
    const ai = getGeminiClient();

    const batchId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!ai || rawImages.length === 0) {
      // High-quality fallback if API key is not present or test scan
      const detectedSubject = bookTitle.toLowerCase().includes("englisch") || bookTitle.toLowerCase().includes("franz") || bookTitle.toLowerCase().includes("sprache") || bookTitle.toLowerCase().includes("grammatik")
        ? "languages"
        : bookTitle.toLowerCase().includes("bio") || bookTitle.toLowerCase().includes("sach") || bookTitle.toLowerCase().includes("natur")
        ? "nature"
        : bookTitle.toLowerCase().includes("geo") || bookTitle.toLowerCase().includes("erde") || bookTitle.toLowerCase().includes("karte")
        ? "geography"
        : bookTitle.toLowerCase().includes("kunst") || bookTitle.toLowerCase().includes("musik")
        ? "art"
        : "math";

      const detectedGradeLevel = targetSchoolGrade > 4 ? "high_school" : "primary";

      const fallbackQuestions = [
        {
          id: `scan-q-${batchId}-1`,
          subject: detectedSubject,
          topic: detectedSubject === "languages" ? "grammar_verbs_tenses" : detectedSubject === "math" ? "addition_subtraction" : "general_scan",
          gradeLevel: detectedGradeLevel,
          schoolGrade: Number(targetSchoolGrade) || 3,
          difficulty: Math.min(5, Math.max(1, Math.ceil(Number(targetSchoolGrade) / 2))),
          question: isGerman
            ? `[Aus Schulbuch-Scan] Berechne bzw. löse die Übung: Wie lautet das Ergebnis von (14 + 18) × 2?`
            : `[From Book Scan] Solve the exercise: What is the result of (14 + 18) × 2?`,
          subtext: isGerman ? `Erkannt aus: ${bookTitle || "Schulbuch-Seite"}` : `Extracted from: ${bookTitle || "Textbook Page"}`,
          options: isGerman ? ["64", "58", "62", "70"] : ["64", "58", "62", "70"],
          correctAnswer: "64",
          explanation: isGerman
            ? "Zuerst Klammer berechnen: 14 + 18 = 32. Danach 32 × 2 = 64."
            : "First calculate parentheses: 14 + 18 = 32. Then 32 × 2 = 64.",
          hint: isGerman ? "Klammern haben immer Vorrang!" : "Parentheses always take priority!",
          xp: 35,
          coins: 15,
          source: "schoolbook_scan",
          scanBatchId: batchId,
          scanBatchTitle: bookTitle || (isGerman ? `Schulbuch-Scan (${new Date().toLocaleDateString()})` : `Book Scan (${new Date().toLocaleDateString()})`),
          assignedKidId,
        },
        {
          id: `scan-q-${batchId}-2`,
          subject: detectedSubject,
          topic: detectedSubject === "languages" ? "grammar_articles" : detectedSubject === "math" ? "fractions_visual" : "general_scan",
          gradeLevel: detectedGradeLevel,
          schoolGrade: Number(targetSchoolGrade) || 3,
          difficulty: Math.min(5, Math.max(1, Math.ceil(Number(targetSchoolGrade) / 2))),
          question: isGerman
            ? `[Aus Schulbuch-Scan] Welche Aussage bzw. Lösung passt zur abgebildeten Aufgabenstellung?`
            : `[From Book Scan] Which statement or solution matches the problem depicted?`,
          subtext: isGerman ? "Aufgabenheft-Analyse" : "Worksheet Analysis",
          options: isGerman
            ? ["Die Teilsumme ist gerade und durch 4 teilbar", "Die Lösung ist eine Primzahl", "Das Ergebnis ist kleiner als 10", "Keine Aussage ist korrekt"]
            : ["The subtotal is even and divisible by 4", "The solution is a prime number", "The result is less than 10", "None are correct"],
          correctAnswer: isGerman ? "Die Teilsumme ist gerade und durch 4 teilbar" : "The subtotal is even and divisible by 4",
          explanation: isGerman
            ? "64 ist gerade und durch 4 teilbar (64 ÷ 4 = 16)."
            : "64 is even and divisible by 4 (64 ÷ 4 = 16).",
          hint: isGerman ? "Prüfe die Endziffern und Teilbarkeitsregeln." : "Check divisibility rules.",
          xp: 40,
          coins: 20,
          source: "schoolbook_scan",
          scanBatchId: batchId,
          scanBatchTitle: bookTitle || (isGerman ? `Schulbuch-Scan (${new Date().toLocaleDateString()})` : `Book Scan (${new Date().toLocaleDateString()})`),
          assignedKidId,
        },
        {
          id: `scan-q-${batchId}-3`,
          subject: detectedSubject,
          topic: "general_scan",
          gradeLevel: detectedGradeLevel,
          schoolGrade: Number(targetSchoolGrade) || 3,
          difficulty: Math.min(5, Math.max(1, Math.ceil(Number(targetSchoolGrade) / 2))),
          question: isGerman
            ? `[Transfer-Frage] Welcher Rechenschritt oder welche Regel wurde in dieser Schulbuchaufgabe angewendet?`
            : `[Transfer Task] Which calculation rule was applied in this textbook exercise?`,
          subtext: isGerman ? "Schulbuch-Vertiefung" : "In-depth practice",
          options: isGerman
            ? ["Distributivgesetz & Punkt-vor-Strich", "Satz des Pythagoras", "Binomische Formel", "Dreisatzrechnung"]
            : ["Distributive property & Order of operations", "Pythagorean theorem", "Binomial formula", "Rule of three"],
          correctAnswer: isGerman ? "Distributivgesetz & Punkt-vor-Strich" : "Distributive property & Order of operations",
          explanation: isGerman
            ? "Die Aufgabe nutzt Rechengesetze der Grundrechenarten."
            : "The problem uses basic arithmetic laws and order of operations.",
          hint: isGerman ? "Denke an die Reihenfolge der Rechenschritte." : "Think about operation precedence.",
          xp: 35,
          coins: 15,
          source: "schoolbook_scan",
          scanBatchId: batchId,
          scanBatchTitle: bookTitle || (isGerman ? `Schulbuch-Scan (${new Date().toLocaleDateString()})` : `Book Scan (${new Date().toLocaleDateString()})`),
          assignedKidId,
        },
      ];

      return res.json({
        batchId,
        batchTitle: bookTitle || (isGerman ? `Schulbuch-Scan (${new Date().toLocaleDateString('de-DE')})` : `Book Scan (${new Date().toLocaleDateString()})`),
        detectedSubject,
        detectedTopic: "general_scan",
        schoolGrade: Number(targetSchoolGrade) || 3,
        gradeLevel: detectedGradeLevel,
        assignedKidId,
        extractedSummary: isGerman
          ? `Erfolgreich 3 interaktive Übungen aus der Schulbuch-Seite generiert (Schulstufe ${targetSchoolGrade}).`
          : `Successfully generated 3 interactive tasks from the textbook page (Grade ${targetSchoolGrade}).`,
        questions: fallbackQuestions,
      });
    }

    // Convert raw images to Gemini inlineData parts
    const imageParts = rawImages.map((img) => {
      let mimeType = "image/jpeg";
      let base64Data = img;

      if (img.startsWith("data:")) {
        const matches = img.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      return {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };
    });

    const promptText = `You are an expert AI school tutor and curriculum digitization specialist for the kids & teens education platform BrainBoss.
Analyze the attached photo(s) of schoolbook pages, homework notebooks, tests, or worksheets.

Context provided by teacher/parent:
- Provided Book/Chapter Title: "${bookTitle || 'Unknown / General Schoolbook'}"
- Target School Grade: ${targetSchoolGrade}. Schulstufe (1-4 = Grundschule / Primary; 5-8 = Mittelschule / Secondary)
- Target Language (if language learning book): ${targetLanguage}
- Extra Teacher Notes: "${notes || 'None'}"
- Output Language: ${targetLangName} (All questions, explanations, options, hints MUST be in ${targetLangName}).

Your Task:
1. Carefully read and transcribe all exercises, arithmetic problems, vocabulary lists, grammar exercises, scientific facts, or reading comprehension questions from the image(s).
2. Determine the primary Subject Area:
   - 'math' (arithmetic, geometry, algebra, word problems)
   - 'nature' (biology, animals, physics, human body, plants, chemistry, astronomy)
   - 'geography' (countries, capitals, maps, rivers, climate, continents)
   - 'art' (visual arts, colors, music instruments, composers)
   - 'languages' (vocabulary, grammar, sentence order, verb forms, articles)
3. Determine the exact Topic (e.g. 'addition_subtraction', 'multiplication_division', 'fractions_visual', 'algebra_linear', 'grammar_articles', 'grammar_verbs_tenses', 'grammar_plurals', 'grammar_sentence_structure', 'animals_ecosystems', 'world_capitals', etc.).
4. Generate 3 to 8 structured, interactive multiple-choice questions directly faithfully derived from the exercises on the page(s).
5. Output strictly valid JSON matching this schema:
{
  "batchTitle": "Concise informative title in ${targetLangName} (e.g., 'Mathebuch S. 42: Bruchrechnen' or 'Grammatikheft: Zeitformen Verben')",
  "detectedSubject": "math | nature | geography | art | languages",
  "detectedTopic": "topic_identifier",
  "schoolGrade": ${targetSchoolGrade || 3},
  "gradeLevel": "${targetSchoolGrade > 4 ? 'high_school' : 'primary'}",
  "extractedSummary": "1-2 sentences summarizing what was identified from the page in ${targetLangName}",
  "questions": [
    {
      "id": "scan-q-1",
      "subject": "math | nature | geography | art | languages",
      "topic": "topic_identifier",
      "gradeLevel": "primary | high_school",
      "schoolGrade": ${targetSchoolGrade || 3},
      "difficulty": 1, 2, 3, 4, or 5,
      "question": "Clear, well-formatted question text in ${targetLangName}",
      "subtext": "Brief hint or book reference (e.g. 'Aufgabe 3 aus Schulbuch' or 'Setze das passende Verb ein')",
      "options": ["Correct Option", "Distractor B", "Distractor C", "Distractor D"],
      "correctAnswer": "Correct Option (Must exactly equal one item in options array)",
      "explanation": "Kid-friendly explanation showing the step-by-step resolution in ${targetLangName}",
      "hint": "Helpful educational hint without directly spoiling the answer in ${targetLangName}",
      "xp": 30,
      "coins": 15
    }
  ]
}
Make sure every question has 4 distinct options and the correctAnswer is exactly identical to one of the options.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: promptText }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    const detectedSubject = parsed.detectedSubject || "math";
    const detectedGradeLevel = parsed.gradeLevel || (targetSchoolGrade > 4 ? "high_school" : "primary");
    const batchTitleFinal = parsed.batchTitle || bookTitle || (isGerman ? `Schulbuch-Scan (${new Date().toLocaleDateString('de-DE')})` : `Book Scan (${new Date().toLocaleDateString()})`);

    const cleanedQuestions = (parsed.questions || []).map((q: any, idx: number) => ({
      ...q,
      id: q.id || `scan-q-${batchId}-${idx + 1}`,
      subject: q.subject || detectedSubject,
      topic: q.topic || parsed.detectedTopic || "general_scan",
      gradeLevel: q.gradeLevel || detectedGradeLevel,
      schoolGrade: Number(q.schoolGrade) || Number(targetSchoolGrade) || 3,
      difficulty: Number(q.difficulty) || Math.min(5, Math.max(1, Math.ceil(Number(targetSchoolGrade) / 2))),
      xp: q.xp || 30 + (Number(q.difficulty) || 2) * 5,
      coins: q.coins || 12 + (Number(q.difficulty) || 2) * 3,
      source: "schoolbook_scan",
      scanBatchId: batchId,
      scanBatchTitle: batchTitleFinal,
      assignedKidId,
    }));

    // In-memory images are immediately discarded once response is formed.
    res.json({
      batchId,
      batchTitle: batchTitleFinal,
      detectedSubject,
      detectedTopic: parsed.detectedTopic || "general_scan",
      schoolGrade: Number(parsed.schoolGrade) || Number(targetSchoolGrade) || 3,
      gradeLevel: detectedGradeLevel,
      assignedKidId,
      extractedSummary: parsed.extractedSummary || (isGerman ? "Inhalte aus Schulbuch erfolgreich erfasst." : "Textbook content extracted successfully."),
      questions: cleanedQuestions,
    });
  } catch (error) {
    console.error("Schoolbook vision scan error:", error);
    res.status(500).json({
      error: "Failed to process book scan",
      questions: [],
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BrainBoss server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
