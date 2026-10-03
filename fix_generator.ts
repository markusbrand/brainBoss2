import * as fs from 'fs';
const file = 'src/utils/vocabExerciseGenerator.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "type Draft = Omit<CustomQuestion, 'id' | 'gradeLevel' | 'schoolGrade' | 'xp' | 'coins' | 'subject' | 'topic'> & {",
  "type Draft = Omit<CustomQuestion, 'id' | 'gradeLevel' | 'schoolGrade' | 'xp' | 'coins' | 'subject' | 'topic' | 'difficulty'> & {"
);

fs.writeFileSync(file, code);
