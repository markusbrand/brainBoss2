import * as fs from 'fs';
import * as path from 'path';

const file = path.resolve('./src/components/MathGame/MathPlayScreen.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add imports
code = code.replace(
  "import { Brain, Star, Clock, Trophy, Heart, ShieldCheck, Zap, Lightbulb, Target, Crown, Flame, Settings } from 'lucide-react';",
  `import { Brain, Star, Clock, Trophy, Heart, ShieldCheck, Zap, Lightbulb, Target, Crown, Flame, Settings } from 'lucide-react';\nimport { isInteractiveExercise, isAnswerCorrect } from '../../utils/exerciseAnswers';\nimport { InteractiveExerciseRenderer } from './InteractiveExerciseRenderer';`
);

// 2. Replace handleOptionClick answer check
code = code.replace(
  "const isCorrect = String(option).trim().toLowerCase() === String(currentProblem.correctAnswer).trim().toLowerCase();",
  "const isCorrect = isAnswerCorrect(currentProblem, option);"
);

// 3. Conditional render for options grid vs interactive
const oldGrid = "{/* Options Grid (4 Tactile Buttons) */}\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4\">";

const newGrid = `{/* Interactive Renderer or Options Grid */}
        {isInteractiveExercise(currentProblem) ? (
          <InteractiveExerciseRenderer 
            problem={currentProblem}
            skin={skin}
            onAnswerSubmit={handleOptionClick}
            disabled={feedbackState !== 'idle'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">`;

code = code.replace(oldGrid, newGrid);

// Close the tag for options grid if not interactive
const oldGridEnd = "          })}\n        </div>\n\n        {/* Step-by-Step Hint";
const newGridEnd = "          })}\n        </div>\n        )}\n\n        {/* Step-by-Step Hint";
code = code.replace(oldGridEnd, newGridEnd);

fs.writeFileSync(file, code);
console.log("Patched MathPlayScreen.tsx");
