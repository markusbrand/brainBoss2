import * as fs from 'fs';
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { buildVocabExtractionPrompt, sanitizeMaterial, ExtractedMaterial } from './src/server/vocabExtraction';",
  "import { buildVocabExtractionPrompt, sanitizeMaterial } from './src/server/vocabExtraction';\nimport type { ExtractedMaterial } from './src/utils/vocabExerciseGenerator';"
);

code = code.replace(
  /const allExercises = generateExercisesFromMaterial\(extractedMaterial, \{[\s\S]*?assignedKidId,\n    \}\);/,
  `const generated = generateExercisesFromMaterial(extractedMaterial, {
      schoolGrade: targetSchoolGrade
    });
    
    // Apply batch properties
    const allExercises = generated.map((q, idx) => ({
      ...q,
      id: \`scan-q-\${batchId}-\${idx + 1}\`,
      scanBatchId: batchId,
      scanBatchTitle: extractedMaterial?.batchTitle || bookTitle || 'Scan',
      gradeLevel: detectedGradeLevel,
      assignedKidId,
      difficulty: q.difficulty || 2,
    }));`
);

fs.writeFileSync(file, code);
