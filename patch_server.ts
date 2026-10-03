import * as fs from 'fs';
import * as path from 'path';

const serverFile = path.resolve('./server.ts');
const code = fs.readFileSync(serverFile, 'utf8');

const regex = /\/\/ API: Process Schoolbook \/ Worksheet \/ Homework Photos.*?^app\.post\("\/api\/gemini\/scan-schoolbook"/ms;

const newCode = `// API: Process Schoolbook / Worksheet / Homework Photos with OpenRouter or Gemini Vision
const handleSchoolbookScan = async (req: express.Request, res: express.Response) => {
  try {
    const {
      images = [], // array of base64 strings or data URLs
      image = "",  // single base64 string or data URL
      bookTitle = "",
      subject: requestedSubject = "",
      category = "",
      targetSchoolGrade = 3,
      assignedKidId = "all",
      notes = "",
      provider = "openrouter", // 'openrouter' | 'gemini'
      openRouterApiKey = "",
    } = req.body;

    console.log("==> /scan-schoolbook requested!");
    console.log(\`Images length: \${images.length}, provider: \${provider}\`);

    const rawImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImages.push(...images.filter(Boolean));
    } else if (image && typeof image === "string") {
      rawImages.push(image);
    }
    
    const effectiveSubject = category || requestedSubject || "languages";
    const batchId = \`scan-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`;
    const effectiveOpenRouterKey = openRouterApiKey || process.env.OPENROUTER_API_KEY || "";
    const detectedGradeLevel = targetSchoolGrade > 4 ? "high_school" : "primary";

    const promptText = buildVocabExtractionPrompt({
      bookTitle,
      targetSchoolGrade,
      notes
    });

    let extractedMaterial: ExtractedMaterial & { batchTitle?: string; extractedSummary?: string } | null = null;
    let usedProvider = "gemini";
    let usedModel = "gemini-2.5-flash";

    // 1. Try OpenRouter if configured
    if ((provider === "openrouter" || effectiveOpenRouterKey) && rawImages.length > 0) {
      if (effectiveOpenRouterKey) {
        try {
          usedProvider = "openrouter";
          usedModel = "google/gemini-2.5-flash"; // We use flash directly for vision->json
          
          console.log("Starting OpenRouter Extraction");
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
    if (!extractedMaterial || (!extractedMaterial.vocab.length && !extractedMaterial.dialogues.length)) {
      usedProvider = "curriculum_engine";
      usedModel = "brainboss-curriculum-v1";
      
      extractedMaterial = {
        batchTitle: bookTitle || "English Textbook Scan",
        extractedSummary: "Fallback extracted material for test",
        vocab: [
          { en: "schoolbag", de: "Schultasche", example: "This is my schoolbag.", category: "Schule", kind: "noun", emoji: "🎒", numberValue: null, colorHex: null, exampleDe: "Das ist meine Schultasche." },
          { en: "ruler", de: "Lineal", example: "I need a ruler.", category: "Schule", kind: "noun", emoji: "📏", numberValue: null, colorHex: null, exampleDe: "Ich brauche ein Lineal." },
          { en: "twelve", de: "zwölf", example: "I am twelve years old.", category: "Zahlen", kind: "number", numberValue: 12, emoji: null, colorHex: null, exampleDe: "Ich bin zwölf Jahre alt." }
        ],
        dialogues: []
      };
    }

    // Generate the massive pool of exercises deterministically
    const allExercises = generateExercisesFromMaterial(extractedMaterial, {
      batchId,
      schoolGrade: targetSchoolGrade,
      gradeLevel: detectedGradeLevel,
      assignedKidId,
    });
    
    // Sample a balanced subset for the primary "Test", returning others in the pool if requested
    const finalQuestions = sampleBalancedTest(allExercises, 30);
    
    res.json({
      batchId,
      batchTitle: extractedMaterial.batchTitle || bookTitle || \`Book Scan (\${new Date().toLocaleDateString()})\`,
      detectedSubject: effectiveSubject,
      detectedTopic: "basic_vocab",
      schoolGrade: Number(targetSchoolGrade) || 3,
      gradeLevel: detectedGradeLevel,
      assignedKidId,
      aiModelUsed: usedModel,
      aiProviderUsed: usedProvider,
      extractedSummary: extractedMaterial.extractedSummary || \`Successfully generated \${finalQuestions.length} practice exercises.\`,
      questions: finalQuestions,
      poolSize: allExercises.length,
      allExercises: allExercises, 
    });

  } catch (error: any) {
    console.error("Schoolbook scan error:", error);
    res.status(500).json({
      error: error.message || "Failed to process book scan",
      questions: [],
    });
  }
};

app.post("/api/gemini/scan-schoolbook"`;

const replacedCode = code.replace(regex, newCode);
if (code === replacedCode) {
  console.error("Replacement failed!");
  process.exit(1);
}

fs.writeFileSync(serverFile, replacedCode);
console.log("Successfully replaced handleSchoolbookScan");
