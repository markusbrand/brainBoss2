import * as fs from 'fs';
const file = 'src/components/MathGame/MathPlayScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { isInteractiveExercise, isAnswerCorrect }")) {
  code = code.replace(
    "import { VisualProblemRenderer } from './VisualProblemRenderer';",
    "import { VisualProblemRenderer } from './VisualProblemRenderer';\nimport { isInteractiveExercise, isAnswerCorrect } from '../../utils/exerciseAnswers';\nimport { InteractiveExerciseRenderer } from './InteractiveExerciseRenderer';"
  );
}

fs.writeFileSync(file, code);
