import * as fs from 'fs';
import * as path from 'path';

const file = path.resolve('./src/components/ChildPortal/ChildTestModal.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add imports
code = code.replace(
  "import { soundFx } from '../../utils/audio';",
  `import { soundFx } from '../../utils/audio';\nimport { isInteractiveExercise, isAnswerCorrect } from '../../utils/exerciseAnswers';\nimport { InteractiveExerciseRenderer } from '../MathGame/InteractiveExerciseRenderer';`
);

// 2. Replace isCorrect
code = code.replace(
  "const isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();",
  "const isCorrect = isAnswerCorrect(q, selected);"
);

// 3. Conditional render for options
const oldOptionsGrid = "{/* Options */}\n                <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\">";
const newOptionsGrid = `{/* Interactive Renderer or Options Grid */}
                {isInteractiveExercise(currentQuestion) ? (
                  <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <InteractiveExerciseRenderer
                      problem={currentQuestion}
                      skin={{
                        primaryButtonGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        primaryButtonGlow: 'rgba(99, 102, 241, 0.4)',
                        modeCardBg: '#0f172a',
                        modeCardBorder: '#1e293b',
                        cardBorder: '#334155',
                        textAccent: '#e2e8f0',
                      } as any}
                      onAnswerSubmit={handleSelectOption}
                      disabled={false}
                    />
                    {userAnswers[currentQuestion.id] && (
                       <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm bg-cyan-950/40 p-3 rounded-xl border border-cyan-800">
                         <CheckCircle2 className="w-5 h-5" />
                         Antwort gespeichert
                       </div>
                    )}
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">`;

code = code.replace(oldOptionsGrid, newOptionsGrid);

const oldOptionsGridEnd = "                  })}\n                </div>\n              </div>\n\n              {/* Controls */}";
const newOptionsGridEnd = "                  })}\n                </div>\n                )}\n              </div>\n\n              {/* Controls */}";
code = code.replace(oldOptionsGridEnd, newOptionsGridEnd);

fs.writeFileSync(file, code);
console.log("Patched ChildTestModal.tsx");
