import { GradeLevel, Language, MathProblem, MathTopic, VisualMathData } from '../types';
import { loadCustomQuestions } from './storage';

// Helper: random integer between min and max inclusive
const randInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper: shuffle array
const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper: generate 4 unique options including correct answer
const makeDistractors = (correct: number, range: number = 5, allowNegative: boolean = false): number[] => {
  const set = new Set<number>([correct]);
  let attempts = 0;
  while (set.size < 4 && attempts < 40) {
    attempts++;
    const delta = randInt(1, Math.max(3, range)) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = correct + delta;
    if (!allowNegative && candidate < 0) continue;
    set.add(candidate);
  }
  // Fill fallback if needed
  let fallback = 1;
  while (set.size < 4) {
    set.add(correct + fallback);
    fallback++;
  }
  return shuffle(Array.from(set));
};

// Generate Primary School Problems (Grades 1-5)
export const generatePrimaryProblem = (
  topic: MathTopic = 'all',
  difficulty = 1,
  lang: Language = 'de'
): MathProblem => {
  const isDe = lang === 'de';
  const validTopics = [
    'addition_subtraction',
    'multiplication_division',
    'missing_number',
    'fractions_visual',
    'number_comparison',
    'number_patterns',
  ];

  const chosenTopic = topic === 'all'
    ? validTopics[randInt(0, validTopics.length - 1)]
    : topic;

  const id = `prim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  switch (chosenTopic) {
    case 'addition_subtraction': {
      const isAddition = Math.random() > 0.5;
      if (difficulty <= 2) {
        // Single digit / up to 20 with block visuals
        const a = randInt(2, 9);
        const b = randInt(1, 9);
        if (isAddition) {
          const ans = a + b;
          const visual: VisualMathData = {
            type: 'blocks',
            countA: a,
            countB: b,
            symbol: '+',
          };
          return {
            id,
            topic: 'addition_subtraction',
            gradeLevel: 'primary',
            difficulty,
            question: `${a} + ${b} = ?`,
            subtext: isDe
              ? 'Zähle die leuchtenden Blöcke oder rechne sie zusammen!'
              : 'Count the glowing blocks or add them together!',
            visual,
            options: makeDistractors(ans, 4),
            correctAnswer: ans,
            explanation: isDe
              ? `Starte bei ${a} und zähle ${b} Blöcke dazu: ${a} + ${b} = ${ans}.`
              : `Start at ${a} and count ${b} more blocks to reach ${ans}.`,
            hint: isDe
              ? 'Zähle alle Blöcke auf der visuellen Karte oben!'
              : 'Count all the blocks shown in the visual card above!',
            xp: 20 + difficulty * 5,
            coins: 10 + difficulty * 2,
          };
        } else {
          const total = a + b;
          const visual: VisualMathData = {
            type: 'blocks',
            countA: total,
            countB: b,
            symbol: '-',
          };
          return {
            id,
            topic: 'addition_subtraction',
            gradeLevel: 'primary',
            difficulty,
            question: `${total} - ${b} = ?`,
            subtext: isDe ? `Ziehe ${b} von ${total} ab!` : `Take away ${b} from ${total}!`,
            visual,
            options: makeDistractors(a, 4),
            correctAnswer: a,
            explanation: isDe
              ? `Wenn du von ${total} genau ${b} wegnimmst, bleiben ${a} übrig.`
              : `If you have ${total} and take away ${b}, you are left with ${a}.`,
            hint: isDe
              ? `Überlege: Welche Zahl plus ${b} ergibt ${total}?`
              : `Think: What plus ${b} makes ${total}?`,
            xp: 20 + difficulty * 5,
            coins: 10 + difficulty * 2,
          };
        }
      } else {
        // 2-digit arithmetic
        const a = randInt(15, 55 + difficulty * 10);
        const b = randInt(12, 45 + difficulty * 10);
        if (isAddition) {
          const ans = a + b;
          return {
            id,
            topic: 'addition_subtraction',
            gradeLevel: 'primary',
            difficulty,
            question: `${a} + ${b} = ?`,
            subtext: isDe ? 'Addiere zuerst die Einer, dann die Zehner!' : 'Add the ones place, then the tens place!',
            options: makeDistractors(ans, 8),
            correctAnswer: ans,
            explanation: isDe
              ? `Einer: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Zehner: ${Math.floor(a / 10)}0 + ${Math.floor(b / 10)}0 = ${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}. Gesamtsumme ist ${ans}.`
              : `Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Tens: ${Math.floor(a / 10)}0 + ${Math.floor(b / 10)}0 = ${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}. Total is ${ans}.`,
            hint: isDe
              ? `Runde ${b} zuerst auf den nächsten Zehner, um schneller im Kopf zu rechnen!`
              : `Try rounding ${b} to the nearest 10 first to make mental math easy!`,
            xp: 30 + difficulty * 5,
            coins: 15 + difficulty * 3,
          };
        } else {
          const total = a + b;
          return {
            id,
            topic: 'addition_subtraction',
            gradeLevel: 'primary',
            difficulty,
            question: `${total} - ${a} = ?`,
            subtext: isDe ? `Subtrahiere ${a} von ${total}` : `Subtract ${a} from ${total}`,
            options: makeDistractors(b, 8),
            correctAnswer: b,
            explanation: isDe
              ? `${total} minus ${a} ergibt ${b}. Probe: ${b} + ${a} = ${total}.`
              : `${total} minus ${a} leaves ${b}. Check: ${b} + ${a} = ${total}.`,
            hint: isDe
              ? `Ziehe zuerst die Zehner ab: ${total} - ${Math.floor(a / 10) * 10}, dann die restlichen Einer!`
              : `Subtract the tens first: ${total} - ${Math.floor(a / 10) * 10}, then subtract the remaining ones!`,
            xp: 30 + difficulty * 5,
            coins: 15 + difficulty * 3,
          };
        }
      }
    }

    case 'multiplication_division': {
      const isMult = Math.random() > 0.45;
      const maxTable = difficulty === 1 ? 5 : difficulty === 2 ? 8 : 12;
      const a = randInt(2, maxTable);
      const b = randInt(2, 10);

      if (isMult) {
        const ans = a * b;
        return {
          id,
          topic: 'multiplication_division',
          gradeLevel: 'primary',
          difficulty,
          question: `${a} × ${b} = ?`,
          subtext: isDe ? `${a} Gruppen zu je ${b}` : `${a} groups of ${b}`,
          visual: difficulty <= 2 ? { type: 'grid', countA: a, countB: b, symbol: '×' } : undefined,
          options: makeDistractors(ans, 6),
          correctAnswer: ans,
          explanation: isDe
            ? `${a} mal ${b} bedeutet, dass ${b} genau ${a}-mal addiert wird = ${ans}.`
            : `${a} multiplied by ${b} is equal to adding ${b}, ${a} times (${ans}).`,
          hint: isDe ? `Zähle in ${a}er-Schritten ${b} Mal vorwärts!` : `Skip count by ${a} for ${b} steps!`,
          xp: 25 + difficulty * 6,
          coins: 12 + difficulty * 3,
        };
      } else {
        const total = a * b;
        return {
          id,
          topic: 'multiplication_division',
          gradeLevel: 'primary',
          difficulty,
          question: `${total} ÷ ${a} = ?`,
          subtext: isDe ? `Teile ${total} gleichmäßig in ${a} Gruppen auf` : `Split ${total} equally into ${a} groups`,
          options: makeDistractors(b, 4),
          correctAnswer: b,
          explanation: isDe
            ? `Da ${a} × ${b} = ${total} ist, ergibt ${total} geteilt durch ${a} genau ${b}.`
            : `Since ${a} × ${b} = ${total}, ${total} divided by ${a} is ${b}.`,
          hint: isDe ? `Überlege: Welche Zahl mal ${a} ergibt ${total}?` : `Think: What number multiplied by ${a} equals ${total}?`,
          xp: 25 + difficulty * 6,
          coins: 12 + difficulty * 3,
        };
      }
    }

    case 'missing_number': {
      const a = randInt(3, 15 + difficulty * 5);
      const b = randInt(4, 18 + difficulty * 5);
      const isAdd = Math.random() > 0.5;

      if (isAdd) {
        const sum = a + b;
        return {
          id,
          topic: 'missing_number',
          gradeLevel: 'primary',
          difficulty,
          question: `${a} + ❓ = ${sum}`,
          subtext: isDe ? 'Finde die fehlende Zahl im ❓' : 'Find the mystery number inside ❓',
          visual: { type: 'balance', countA: a, countB: sum, symbol: '=' },
          options: makeDistractors(b, 5),
          correctAnswer: b,
          explanation: isDe
            ? `Um die fehlende Zahl zu finden, ziehe ${a} von ${sum} ab: ${sum} - ${a} = ${b}.`
            : `To find the missing number, subtract ${a} from ${sum}: ${sum} - ${a} = ${b}.`,
          hint: isDe ? `Wie viel fehlt von ${a} bis ${sum}?` : `How many more do you need to add to ${a} to reach ${sum}?`,
          xp: 25 + difficulty * 5,
          coins: 12 + difficulty * 3,
        };
      } else {
        const ans = a;
        const total = a + b;
        return {
          id,
          topic: 'missing_number',
          gradeLevel: 'primary',
          difficulty,
          question: `❓ - ${b} = ${ans}`,
          subtext: isDe ? 'Welche Startzahl wurde verringert?' : 'What starting number was reduced?',
          options: makeDistractors(total, 6),
          correctAnswer: total,
          explanation: isDe
            ? `Rechne ${ans} + ${b}, um die Ausgangszahl zu ermitteln: ${total}.`
            : `Add ${ans} + ${b} to find the initial number: ${total}.`,
          hint: isDe ? `Addiere die beiden bekannten Zahlen: ${ans} + ${b}!` : `Add the two known numbers together: ${ans} + ${b}!`,
          xp: 25 + difficulty * 5,
          coins: 12 + difficulty * 3,
        };
      }
    }

    case 'fractions_visual': {
      const denominators = [2, 3, 4, 6, 8];
      const denom = denominators[randInt(0, denominators.length - 1)];
      const num = randInt(1, denom - 1);
      const fractionStr = `${num}/${denom}`;

      const options = shuffle([
        fractionStr,
        `${Math.min(denom, num + 1)}/${denom}`,
        `${Math.max(1, num - 1)}/${denom}`,
        `${denom - num}/${denom === 2 ? 4 : denom}`,
      ]);

      const visual: VisualMathData = {
        type: 'pie',
        fractionA: [num, denom],
      };

      return {
        id,
        topic: 'fractions_visual',
        gradeLevel: 'primary',
        difficulty,
        question: isDe ? 'Welcher Bruchteil des Kreises ist markiert?' : 'What fraction of the circle is highlighted?',
        subtext: isDe ? `${num} von ${denom} gleichen Teilen` : `${num} out of ${denom} equal parts`,
        visual,
        options: Array.from(new Set(options)).slice(0, 4),
        correctAnswer: fractionStr,
        explanation: isDe
          ? `Der Kreis ist in ${denom} gleiche Teile unterteilt, und ${num} davon sind farbig markiert (${fractionStr}).`
          : `There are ${denom} equal slices in total, and ${num} of them are shaded, representing ${fractionStr}.`,
        hint: isDe
          ? 'Zähle die gefärbten Teile (oben/Zähler) und alle Teile zusammen (unten/Nenner)!'
          : 'Count the colored slices (top number) and total slices (bottom number)!',
        xp: 30 + difficulty * 5,
        coins: 15 + difficulty * 3,
      };
    }

    case 'number_comparison': {
      const a = randInt(10, 50 + difficulty * 20);
      const diff = randInt(0, 10);
      const b = Math.random() > 0.3 ? a + (Math.random() > 0.5 ? diff : -diff) : a;

      const symbol = a > b ? '>' : a < b ? '<' : '=';
      return {
        id,
        topic: 'number_comparison',
        gradeLevel: 'primary',
        difficulty,
        question: `Compare: ${a}  ❓  ${b}`,
        subtext: isDe ? 'Wähle das richtige Vergleichszeichen (<, >, =)' : 'Choose the correct comparison symbol',
        visual: { type: 'comparison', countA: a, countB: b, symbol: '?' },
        options: ['<', '>', '='],
        correctAnswer: symbol,
        explanation: isDe
          ? `${a} ist ${a > b ? 'größer als (>)' : a < b ? 'kleiner als (<)' : 'gleich (=)'} ${b}. Die Öffnung des Zeichens zeigt immer zur größeren Zahl!`
          : `${a} is ${a > b ? 'greater than (>)' : a < b ? 'less than (<)' : 'equal to (=)'} ${b}. Remember the alligator mouth opens toward the bigger number!`,
        hint: isDe
          ? 'Das Zeichen > oder < öffnet sich immer zur größeren Zahl hin!'
          : 'The symbol > or < always points its open mouth to the larger number!',
        xp: 20 + difficulty * 5,
        coins: 10 + difficulty * 2,
      };
    }

    case 'number_patterns':
    default: {
      const step = randInt(2, 6 + difficulty);
      const start = randInt(2, 15);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const ans = start + step * 4;

      return {
        id,
        topic: 'number_patterns',
        gradeLevel: 'primary',
        difficulty,
        question: isDe ? `Setze das Muster fort: ${seq.join(', ')},  ❓` : `Find the next number: ${seq.join(', ')},  ❓`,
        subtext: isDe ? 'Finde den regelmäßigen Schritt zwischen den Zahlen!' : 'Look for the jumping pattern between each number!',
        options: makeDistractors(ans, step * 2),
        correctAnswer: ans,
        explanation: isDe
          ? `Jede Zahl erhöht sich um +${step}. Also ${seq[seq.length - 1]} + ${step} = ${ans}.`
          : `Each number jumps forward by adding +${step}. So ${seq[seq.length - 1]} + ${step} = ${ans}.`,
        hint: isDe ? `Ziehe die erste Zahl von der zweiten ab, um die Schrittweite zu finden!` : `Subtract the first number from the second number to find the jump amount!`,
        xp: 25 + difficulty * 5,
        coins: 12 + difficulty * 3,
      };
    }
  }
};

// Generate High School Problems (Grades 6-12)
export const generateHighSchoolProblem = (
  topic: MathTopic = 'all',
  difficulty = 1,
  lang: Language = 'de'
): MathProblem => {
  const isDe = lang === 'de';
  const validTopics = [
    'algebra_linear',
    'order_of_operations',
    'exponents_roots',
    'percentages_ratios',
    'quick_quadratics',
    'estimation_duel',
  ];

  const chosenTopic = topic === 'all'
    ? validTopics[randInt(0, validTopics.length - 1)]
    : topic;

  const id = `hs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  switch (chosenTopic) {
    case 'algebra_linear': {
      // Linear: ax + b = c
      const a = randInt(2, 6 + difficulty);
      const x = randInt(-8, 12);
      const b = randInt(-15, 20);
      const c = a * x + b;

      const opSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      return {
        id,
        topic: 'algebra_linear',
        gradeLevel: 'high_school',
        difficulty,
        question: isDe ? `Bestimme x:  ${a}x ${opSign} = ${c}` : `Solve for x:  ${a}x ${opSign} = ${c}`,
        subtext: isDe ? 'Isoliere x auf einer Seite der Gleichung' : 'Isolate x on one side of the equation',
        options: makeDistractors(x, 5, true),
        correctAnswer: x,
        explanation: isDe
          ? `Schritt 1: ${a}x = ${c} - (${b}) => ${a}x = ${c - b}. Schritt 2: Geteilt durch ${a} => x = ${x}.`
          : `Step 1: ${a}x = ${c} - (${b}) => ${a}x = ${c - b}. Step 2: Divide by ${a} => x = ${x}.`,
        hint: isDe
          ? `Subtrahiere zuerst ${b >= 0 ? b : `(${b})`} auf beiden Seiten und teile dann durch ${a}!`
          : `First subtract ${b >= 0 ? b : `(${b})`} from both sides, then divide by ${a}!`,
        xp: 35 + difficulty * 8,
        coins: 18 + difficulty * 4,
      };
    }

    case 'order_of_operations': {
      // PEMDAS / Punkt- vor Strichrechnung
      const a = randInt(3, 8);
      const b = randInt(2, 6);
      const c = randInt(2, 5);
      const d = randInt(1, 10);

      const isVariant2 = Math.random() > 0.5;
      if (!isVariant2) {
        // a + b * c - d
        const ans = a + b * c - d;
        return {
          id,
          topic: 'order_of_operations',
          gradeLevel: 'high_school',
          difficulty,
          question: isDe ? `Berechne:  ${a} + ${b} × ${c} - ${d}` : `Evaluate:  ${a} + ${b} × ${c} - ${d}`,
          subtext: isDe ? 'Beachte Punkt- vor Strichrechnung!' : 'Follow PEMDAS / Order of Operations',
          options: makeDistractors(ans, 6, true),
          correctAnswer: ans,
          explanation: isDe
            ? `Multiplikation zuerst: ${b} × ${c} = ${b * c}. Danach: ${a} + ${b * c} - ${d} = ${ans}.`
            : `Multiplication first: ${b} × ${c} = ${b * c}. Then: ${a} + ${b * c} - ${d} = ${ans}.`,
          hint: isDe ? `Rechne ${b} × ${c} zuerst aus, bevor du addierst oder subtrahierst!` : `Multiply ${b} × ${c} first before doing any addition or subtraction!`,
          xp: 35 + difficulty * 8,
          coins: 18 + difficulty * 4,
        };
      } else {
        // (a + b) * c - d
        const ans = (a + b) * c - d;
        return {
          id,
          topic: 'order_of_operations',
          gradeLevel: 'high_school',
          difficulty,
          question: isDe ? `Berechne:  (${a} + ${b}) × ${c} - ${d}` : `Evaluate:  (${a} + ${b}) × ${c} - ${d}`,
          subtext: isDe ? 'Klammern haben immer Vorrang!' : 'Parentheses first!',
          options: makeDistractors(ans, 8, true),
          correctAnswer: ans,
          explanation: isDe
            ? `Zuerst die Klammer: (${a} + ${b}) = ${a + b}. Dann multiplizieren mit ${c}: ${(a + b) * c}. Zuletzt minus ${d}: ${ans}.`
            : `Inside parentheses first: (${a} + ${b}) = ${a + b}. Next multiply by ${c}: ${(a + b) * c}. Finally subtract ${d}: ${ans}.`,
          hint: isDe ? `Berechne zuerst den Term in der Klammer (${a} + ${b})!` : `Calculate what is inside parentheses (${a} + ${b}) first!`,
          xp: 40 + difficulty * 8,
          coins: 20 + difficulty * 4,
        };
      }
    }

    case 'exponents_roots': {
      const isRoot = Math.random() > 0.45;
      if (isRoot) {
        const rootBases = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
        const base = rootBases[randInt(0, Math.min(rootBases.length - 1, 4 + difficulty * 2))];
        const sq = base * base;
        return {
          id,
          topic: 'exponents_roots',
          gradeLevel: 'high_school',
          difficulty,
          question: isDe ? `Berechne die Wurzel:  √${sq} = ?` : `Evaluate:  √${sq} = ?`,
          subtext: isDe ? 'Bestimme die Quadratwurzel' : 'Find the principal square root',
          options: makeDistractors(base, 4),
          correctAnswer: base,
          explanation: isDe
            ? `Die Quadratwurzel aus ${sq} ist ${base}, da ${base}² = ${base} × ${base} = ${sq}.`
            : `The square root of ${sq} is ${base}, because ${base}² = ${base} × ${base} = ${sq}.`,
          hint: isDe ? `Welche Zahl mit sich selbst multipliziert ergibt ${sq}?` : `What number multiplied by itself equals ${sq}?`,
          xp: 30 + difficulty * 6,
          coins: 15 + difficulty * 3,
        };
      } else {
        const base = randInt(2, 5);
        const exp = randInt(2, difficulty <= 2 ? 3 : 4);
        const ans = Math.pow(base, exp);
        return {
          id,
          topic: 'exponents_roots',
          gradeLevel: 'high_school',
          difficulty,
          question: isDe ? `Berechne:  ${base}^${exp} = ?` : `Calculate:  ${base}^${exp} = ?`,
          subtext: isDe ? `${base} hoch ${exp}` : `${base} raised to the power of ${exp}`,
          options: makeDistractors(ans, 10),
          correctAnswer: ans,
          explanation: isDe
            ? `${base}^${exp} bedeutet, dass ${base} insgesamt ${exp}-mal mit sich selbst multipliziert wird = ${ans}.`
            : `${base}^${exp} means multiplying ${base} by itself ${exp} times = ${ans}.`,
          hint: isDe ? `Rechne: ${Array(exp).fill(base).join(' × ')}` : `Multiply: ${Array(exp).fill(base).join(' × ')}`,
          xp: 35 + difficulty * 6,
          coins: 18 + difficulty * 3,
        };
      }
    }

    case 'percentages_ratios': {
      const pcts = [10, 20, 25, 30, 50, 75];
      const pct = pcts[randInt(0, pcts.length - 1)];
      const base = randInt(2, 15) * (pct === 25 || pct === 75 ? 4 : 10);
      const ans = Math.round((pct / 100) * base);

      return {
        id,
        topic: 'percentages_ratios',
        gradeLevel: 'high_school',
        difficulty,
        question: isDe ? `Wie viel sind ${pct}% von ${base}?` : `What is ${pct}% of ${base}?`,
        subtext: isDe ? 'Berechne den Prozentwert' : 'Calculate the percentage',
        options: makeDistractors(ans, 8),
        correctAnswer: ans,
        explanation: isDe
          ? `${pct}% entspricht (${pct}/100) = ${pct / 100}. Multipliziere: ${pct / 100} × ${base} = ${ans}.`
          : `${pct}% is (${pct}/100) = ${pct / 100}. Multiply: ${pct / 100} × ${base} = ${ans}.`,
        hint: isDe
          ? `Ermittle zuerst 10% durch Verschieben des Kommas und multipliziere auf ${pct}% hoch!`
          : `Find 10% first by moving the decimal, then multiply to get ${pct}%!`,
        xp: 35 + difficulty * 7,
        coins: 18 + difficulty * 3,
      };
    }

    case 'quick_quadratics': {
      // (x - r1)(x - r2) = 0 => x^2 - (r1+r2)x + r1*r2 = 0
      const r1 = randInt(1, 6);
      const r2 = randInt(2, 7);
      const b = -(r1 + r2);
      const c = r1 * r2;

      return {
        id,
        topic: 'quick_quadratics',
        gradeLevel: 'high_school',
        difficulty,
        question: isDe ? `Wenn x² ${b}x + ${c} = 0, finde eine positive Nullstelle:` : `If x² ${b}x + ${c} = 0, find a positive root:`,
        subtext: isDe ? 'Faktorisiere zu (x - a)(x - b) = 0' : 'Factor into (x - a)(x - b) = 0',
        options: shuffle([r1, r1 + 3, Math.max(1, r1 - 2), r1 * 2 + 1]),
        correctAnswer: r1,
        explanation: isDe
          ? `Faktorisiere als (x - ${r1})(x - ${r2}) = 0. Die Lösungen sind x = ${r1} oder x = ${r2}.`
          : `Factor as (x - ${r1})(x - ${r2}) = 0. The solutions are x = ${r1} or x = ${r2}.`,
        hint: isDe ? `Finde zwei Zahlen, deren Produkt ${c} und deren Summe ${r1 + r2} ist!` : `Find two numbers that multiply to ${c} and add up to ${r1 + r2}!`,
        xp: 45 + difficulty * 10,
        coins: 25 + difficulty * 5,
      };
    }

    case 'estimation_duel':
    default: {
      const a = randInt(18, 92);
      const b = randInt(21, 89);
      const ans = a * b;
      // Close estimation distractors
      const roundedA = Math.round(a / 10) * 10;
      const roundedB = Math.round(b / 10) * 10;
      const est = roundedA * roundedB;

      return {
        id,
        topic: 'estimation_duel',
        gradeLevel: 'high_school',
        difficulty,
        question: isDe ? `Kopfrechnen / Überschlag:  ${a} × ${b} = ?` : `Calculate or fast-estimate:  ${a} × ${b} = ?`,
        subtext: isDe ? `Überschlag mit ${roundedA} × ${roundedB} ≈ ${est}` : `Estimate with ${roundedA} × ${roundedB} ≈ ${est}`,
        options: shuffle([
          ans,
          ans + randInt(80, 150),
          ans - randInt(80, 150),
          ans + randInt(200, 350),
        ]),
        correctAnswer: ans,
        explanation: isDe
          ? `Der exakte Wert ist ${a} × ${b} = ${ans}. ${roundedA} × ${roundedB} = ${est} dient als genaue Schätzung.`
          : `Exact value is ${a} × ${b} = ${ans}. Note that ${roundedA} × ${roundedB} = ${est} gives a close estimate.`,
        hint: isDe ? `Runde ${a} auf ${roundedA} und ${b} auf ${roundedB} für einen schnellen Überschlag nahe ${est}!` : `Round ${a} to ${roundedA} and ${b} to ${roundedB} to get a quick estimate near ${est}!`,
        xp: 40 + difficulty * 8,
        coins: 20 + difficulty * 4,
      };
    }
  }
};

// Top-level task generator
export const generateTask = (
  gradeLevel: GradeLevel,
  topic: MathTopic = 'all',
  difficulty = 1,
  lang: Language = 'de',
  activeKidId?: string
): MathProblem => {
  const customList = loadCustomQuestions();
  const mathCustom = customList.filter(
    (q) =>
      (!q.subject || q.subject === 'math') &&
      (!q.gradeLevel || q.gradeLevel === gradeLevel) &&
      (topic === 'all' || !q.topic || q.topic === topic || q.topic.includes('scan')) &&
      (!activeKidId || !q.assignedKidId || q.assignedKidId === 'all' || q.assignedKidId === activeKidId)
  );

  const scannedMath = mathCustom.filter((q) => q.source === 'schoolbook_scan');
  if (scannedMath.length > 0 && Math.random() < 0.7) {
    const picked = scannedMath[randInt(0, scannedMath.length - 1)];
    return picked as MathProblem;
  }

  if (mathCustom.length > 0 && Math.random() < 0.45) {
    const picked = mathCustom[randInt(0, mathCustom.length - 1)];
    return picked as MathProblem;
  }

  if (gradeLevel === 'primary') {
    return generatePrimaryProblem(topic, difficulty, lang);
  } else {
    return generateHighSchoolProblem(topic, difficulty, lang);
  }
};
