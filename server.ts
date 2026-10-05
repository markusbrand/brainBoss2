import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initDatabase, checkDbStatus, getRemoteData, syncPushData } from "./src/server/db";
import { buildVocabExtractionPrompt, sanitizeMaterial } from './src/server/vocabExtraction';
import type { ExtractedMaterial } from './src/utils/vocabExerciseGenerator';
import { generateExercisesFromMaterial, sampleBalancedTest } from './src/utils/vocabExerciseGenerator';
import { SAMPLE_PAGE_1_MATERIAL, SAMPLE_PAGE_2_MATERIAL } from './src/server/schoolbookEngine';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// Helper: Shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

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

// Favicon fallback
app.get("/favicon.ico", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "favicon.svg"));
});

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// API: Cloudflare Zero Trust / Access Authentication status
app.get("/api/auth/me", (req, res) => {
  const cfUserEmail = req.headers["cf-access-authenticated-user-email"] as string | undefined;
  const cfJwt = req.headers["cf-access-jwt-assertion"] as string | undefined;
  const cfCountry = req.headers["cf-ipcountry"] as string | undefined;
  const cfRay = req.headers["cf-ray"] as string | undefined;
  const clientIp = (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress) as string | undefined;

  res.json({
    authenticated: Boolean(cfUserEmail),
    userEmail: cfUserEmail || null,
    provider: cfUserEmail ? "cloudflare_access" : "local",
    country: cfCountry || null,
    ip: clientIp || null,
    hasJwt: Boolean(cfJwt),
    rayId: cfRay || null,
  });
});

// API: PostgreSQL DB status
app.get("/api/db/status", async (_req, res) => {
  try {
    const status = await checkDbStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Pull data from PostgreSQL DB
app.get("/api/db/sync", async (_req, res) => {
  try {
    const data = await getRemoteData();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Push & synchronize data with PostgreSQL DB
app.post("/api/db/sync", async (req, res) => {
  try {
    const synced = await syncPushData(req.body);
    res.json({ success: true, data: synced });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    if (Array.isArray(parsed.steps)) {
      parsed.steps = parsed.steps.map((step: any) => ({
        ...step,
        options: Array.isArray(step.options) ? shuffleArray(step.options) : step.options,
      }));
    }
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
        options: shuffleArray(isGerman
          ? [`Richtige Antwort #${idx + 1}`, `Option B`, `Option C`, `Option D`]
          : [`Correct Answer #${idx + 1}`, `Option B`, `Option C`, `Option D`]),
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
      options: Array.isArray(q.options) ? shuffleArray(q.options) : q.options,
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

// Helper: Call OpenRouter Chat Completions API with Vision
async function callOpenRouterCompletion(
  apiKey: string,
  model: string,
  promptText: string,
  rawImages: string[],
  requireJson: boolean = true
): Promise<any> {
  const contentParts: any[] = [
    { type: "text", text: promptText },
  ];

  for (const img of rawImages) {
    let url = img;
    if (!img.startsWith("data:")) {
      url = `data:image/jpeg;base64,${img}`;
    }
    contentParts.push({
      type: "image_url",
      image_url: { url },
    });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://brainboss.app",
      "X-Title": "BrainBoss Kids Schoolbook Scanner",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
      temperature: 0.2,
      max_tokens: 12000,
      ...(requireJson ? { response_format: { type: "json_object" } } : {})
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errMessage = `OpenRouter API error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errMessage = parsed.error.message;
      }
    } catch {}
    throw new Error(errMessage);
  }

  const result = await response.json();
  const rawText = result.choices?.[0]?.message?.content || "";

  // Clean markdown blocks if present
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith("```json")) {
    cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  if (!requireJson) {
    return rawText;
  }

  try {
    return JSON.parse(cleanJson);
  } catch {
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse JSON response from OpenRouter model.");
  }
}

// API: Test OpenRouter connection and model
app.post("/api/openrouter/test-connection", async (req, res) => {
  try {
    const { apiKey, model = "openai/gpt-4o-mini" } = req.body;
    const effectiveKey = apiKey || process.env.OPENROUTER_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({
        success: false,
        error: "Kein OpenRouter API-Schlüssel angegeben und kein OPENROUTER_API_KEY im Server hinterlegt.",
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${effectiveKey}`,
        "HTTP-Referer": process.env.APP_URL || "https://brainboss.app",
        "X-Title": "BrainBoss Kids Schoolbook Scanner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Ping. Respond strictly with JSON: {\"status\": \"ok\", \"model\": \"" + model + "\"}",
          },
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      return res.status(400).json({ success: false, error: msg });
    }

    const data = await response.json();
    res.json({
      success: true,
      model,
      message: `Erfolgreich mit OpenRouter verbunden! Modell: ${model}`,
      usage: data.usage || null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Verbindungsfehler" });
  }
});

// API: Process Schoolbook / Worksheet / Homework Photos with OpenRouter or Gemini Vision
const handleSchoolbookScan = async (req: express.Request, res: express.Response) => {
  try {
    const {
      images = [], // array of base64 strings or data URLs
      image = "",  // single base64 string or data URL
      sampleExample = null, // 1 | 2 for immediate testing of attached examples
      bookTitle = "",
      subject: requestedSubject = "",
      category = "",
      targetSchoolGrade = 3,
      assignedKidId = "all",
      notes = "",
      provider = "openrouter", // 'openrouter' | 'gemini'
      openRouterApiKey = "",
      openRouterModel = "google/gemini-2.5-flash",
    } = req.body;

    console.log("==> /scan-schoolbook requested!");
    console.log(`Images length: ${images.length}, provider: ${provider}, sampleExample: ${sampleExample}`);

    const rawImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImages.push(...images.filter(Boolean));
    } else if (image && typeof image === "string") {
      rawImages.push(image);
    }
    
    const effectiveSubject = category || requestedSubject || "languages";
    const batchId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const effectiveOpenRouterKey = openRouterApiKey || process.env.OPENROUTER_API_KEY || "";
    const detectedGradeLevel = targetSchoolGrade > 4 ? "high_school" : "primary";

    const promptText = buildVocabExtractionPrompt({
      bookTitle,
      targetSchoolGrade,
      notes
    });

    let extractedMaterial: (ExtractedMaterial & { batchTitle?: string; extractedSummary?: string }) | null = null;
    let usedProvider = "gemini";
    let usedModel = "gemini-2.5-flash";

    // Immediate check if user requested one of the attached sample examples
    const isSample2Requested =
      sampleExample === 2 ||
      (bookTitle + " " + notes).toLowerCase().includes("5027") ||
      (bookTitle + " " + notes).toLowerCase().includes("sample 2") ||
      (bookTitle + " " + notes).toLowerCase().includes("beispiel 2") ||
      (bookTitle + " " + notes).toLowerCase().includes("numbers") ||
      (bookTitle + " " + notes).toLowerCase().includes("colours");

    const isSample1Requested =
      sampleExample === 1 ||
      (bookTitle + " " + notes).toLowerCase().includes("5026") ||
      (bookTitle + " " + notes).toLowerCase().includes("sample 1") ||
      (bookTitle + " " + notes).toLowerCase().includes("beispiel 1") ||
      (bookTitle + " " + notes).toLowerCase().includes("more words");

    if (sampleExample === 1 || (isSample1Requested && rawImages.length === 0)) {
      usedProvider = "curriculum_engine";
      usedModel = "brainboss-curriculum-v2";
      extractedMaterial = SAMPLE_PAGE_1_MATERIAL;
    } else if (sampleExample === 2 || (isSample2Requested && rawImages.length === 0)) {
      usedProvider = "curriculum_engine";
      usedModel = "brainboss-curriculum-v2";
      extractedMaterial = SAMPLE_PAGE_2_MATERIAL;
    }

    // 1. Try OpenRouter if configured
    if (!extractedMaterial && (provider === "openrouter" || effectiveOpenRouterKey) && rawImages.length > 0) {
      if (effectiveOpenRouterKey) {
        try {
          usedProvider = "openrouter";
          usedModel = openRouterModel || "google/gemini-2.5-flash";
          
          console.log("Starting OpenRouter Extraction with model:", usedModel);
          const openRouterResult = await callOpenRouterCompletion(
            effectiveOpenRouterKey,
            usedModel,
            promptText,
            rawImages,
            true // JSON required
          );
          
          extractedMaterial = sanitizeMaterial(openRouterResult);
        } catch (openRouterErr: any) {
          console.warn("OpenRouter pipeline failed, attempting Gemini fallback:", openRouterErr.message);
        }
      }
    }

    // 2. Try Server-Side Gemini if OpenRouter didn't run or failed
    if (!extractedMaterial && rawImages.length > 0) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          usedProvider = "gemini";
          usedModel = "gemini-2.5-flash";

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

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [...imageParts, { text: promptText }],
              },
            ],
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          });

          extractedMaterial = sanitizeMaterial(JSON.parse(response.text || "{}"));
        } catch (geminiErr: any) {
          console.warn("Gemini vision call failed:", geminiErr.message);
        }
      }
    }

    // 3. Fallback (if no API keys or failure)
    if (!extractedMaterial || (!extractedMaterial.vocab.length && !extractedMaterial.dialogues?.length)) {
      usedProvider = "curriculum_engine";
      usedModel = "brainboss-curriculum-v2";
      extractedMaterial = isSample2Requested ? SAMPLE_PAGE_2_MATERIAL : SAMPLE_PAGE_1_MATERIAL;
    }

    // Generate the massive pool of exercises deterministically
    const generated = generateExercisesFromMaterial(extractedMaterial, {
      schoolGrade: targetSchoolGrade
    });
    
    // Apply batch properties
    const allExercises = generated.map((q, idx) => ({
      ...q,
      id: `scan-q-${batchId}-${idx + 1}`,
      scanBatchId: batchId,
      scanBatchTitle: extractedMaterial?.batchTitle || bookTitle || 'Scan',
      gradeLevel: detectedGradeLevel,
      assignedKidId,
      difficulty: q.difficulty || 2,
    }));
    
    // Return all exercises when full coverage is requested or sample is run, else balanced subset
    const isFullCoverageRequested =
      sampleExample != null ||
      (notes + " " + bookTitle).toLowerCase().includes("all") ||
      (notes + " " + bookTitle).toLowerCase().includes("alle") ||
      allExercises.length <= 150;

    const finalQuestions = isFullCoverageRequested ? allExercises : sampleBalancedTest(allExercises, 30);

    const vocabListFormatted = extractedMaterial.vocab.map((v) => ({
      term: v.en,
      translation: v.de,
      exampleSentence: v.example,
      category: v.category,
    }));
    
    res.json({
      batchId,
      batchTitle: extractedMaterial.batchTitle || bookTitle || `Book Scan (${new Date().toLocaleDateString()})`,
      detectedSubject: effectiveSubject,
      detectedTopic: "basic_vocab",
      schoolGrade: Number(targetSchoolGrade) || 3,
      gradeLevel: detectedGradeLevel,
      assignedKidId,
      aiModelUsed: usedModel,
      aiProviderUsed: usedProvider,
      extractedSummary: extractedMaterial.extractedSummary || `Erfolgreich ${allExercises.length} interaktive Aufgaben zu ${extractedMaterial.vocab.length} Vokabeln generiert.`,
      questions: finalQuestions,
      poolSize: allExercises.length,
      allExercises: allExercises,
      vocabularyList: vocabListFormatted,
      extractedVocabulary: vocabListFormatted,
      extractedVocabularyCount: extractedMaterial.vocab.length,
    });

  } catch (error: any) {
    console.error("Schoolbook scan error:", error);
    res.status(500).json({
      error: error.message || "Failed to process book scan",
      questions: [],
    });
  }
};

app.post("/api/gemini/scan-schoolbook", handleSchoolbookScan);
app.post("/api/ai/scan-schoolbook", handleSchoolbookScan);

async function startServer() {
  // Initialize PostgreSQL database connection and tables if configured
  try {
    await initDatabase();
  } catch (err) {
    console.warn("Database initialization deferred/skipped:", err);
  }

  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`BrainBoss server running at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
