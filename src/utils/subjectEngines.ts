import { CustomQuestion, GradeLevel, Language, ProblemItem, TargetLearnLanguage, VisualProblemData } from '../types';
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

// Pronunciation audio helper using Web Speech API
export const speakWord = (text: string, langCode: string = 'en-US') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
};

// Map target language to ISO code
export const getLangLocale = (target: TargetLearnLanguage): string => {
  switch (target) {
    case 'fr': return 'fr-FR';
    case 'es': return 'es-ES';
    case 'it': return 'it-IT';
    case 'de': return 'de-DE';
    case 'en': default: return 'en-US';
  }
};

export const getLanguageDisplayName = (target: TargetLearnLanguage, lang: Language = 'de'): string => {
  const names: Record<TargetLearnLanguage, { de: string; en: string }> = {
    en: { de: 'Englisch', en: 'English' },
    fr: { de: 'Französisch', en: 'French' },
    es: { de: 'Spanisch', en: 'Spanish' },
    it: { de: 'Italienisch', en: 'Italian' },
    de: { de: 'Deutsch', en: 'German' },
  };
  return names[target] ? (lang === 'de' ? names[target].de : names[target].en) : target;
};

export const getLanguageFlag = (target: TargetLearnLanguage): string => {
  switch (target) {
    case 'fr': return '🇫🇷';
    case 'es': return '🇪🇸';
    case 'it': return '🇮🇹';
    case 'de': return '🇩🇪';
    case 'en': default: return '🇬🇧';
  }
};

// -------------------------------------------------------------
// 1. NATURE & SCIENCE ENGINE
// -------------------------------------------------------------

interface SubjectItemDef {
  id?: string;
  topic: string;
  grade: GradeLevel;
  difficulty?: number; // 1 to 5
  qDe: string;
  qEn: string;
  subDe?: string;
  subEn?: string;
  correctDe: string;
  correctEn: string;
  optionsDe: string[];
  optionsEn: string[];
  expDe: string;
  expEn: string;
  hintDe: string;
  hintEn: string;
  visual?: VisualProblemData;
}

export const NATURE_BANK: SubjectItemDef[] = [
  // Animals & Ecosystems
  {
    topic: 'animals_ecosystems',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welches Tier ist ein Säugetier und legt trotzdem Eier?',
    qEn: 'Which animal is a mammal that lays eggs?',
    correctDe: 'Schnabeltier',
    correctEn: 'Platypus',
    optionsDe: ['Schnabeltier', 'Känguru', 'Fledermaus', 'Pinguin'],
    optionsEn: ['Platypus', 'Kangaroo', 'Bat', 'Penguin'],
    expDe: 'Das australische Schnabeltier gehört zu den wenigen eierlegenden Säugetieren (Kloakentiere).',
    expEn: 'The Australian platypus is one of the rare egg-laying monotreme mammals.',
    hintDe: 'Es lebt in Australien und hat einen Entenschnabel.',
    hintEn: 'It lives in Australia and has a duck-like bill.',
    visual: { type: 'science_badge', symbol: '🦆' },
  },
  {
    topic: 'animals_ecosystems',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Wie atmen Fische unter Wasser?',
    qEn: 'How do fish breathe underwater?',
    correctDe: 'Mit Kiemen',
    correctEn: 'With Gills',
    optionsDe: ['Mit Kiemen', 'Mit Lungen', 'Über die Haut', 'Mit den Flossen'],
    optionsEn: ['With Gills', 'With Lungs', 'Through their Skin', 'With their Fins'],
    expDe: 'Kiemen entziehen dem vorbeiströmenden Wasser den gelösten Sauerstoff.',
    expEn: 'Gills extract dissolved oxygen directly from water passing through them.',
    hintDe: 'Sie befinden sich seitlich am Kopf des Fisches.',
    hintEn: 'They are located on the sides of the fish’s head.',
    visual: { type: 'science_badge', symbol: '🐟' },
  },
  {
    topic: 'animals_ecosystems',
    grade: 'primary',
    difficulty: 3,
    qDe: 'Welches Tier ist das schnellste Landtier der Erde?',
    qEn: 'Which animal is the fastest land mammal on Earth?',
    correctDe: 'Gepard',
    correctEn: 'Cheetah',
    optionsDe: ['Gepard', 'Löwe', 'Springbock', 'Pferd'],
    optionsEn: ['Cheetah', 'Lion', 'Springbok', 'Horse'],
    expDe: 'Ein Gepard kann beim Sprint Geschwindigkeiten von über 100 km/h erreichen.',
    expEn: 'A cheetah can reach burst sprint speeds exceeding 100 km/h (62 mph).',
    hintDe: 'Er hat schwarze Punkte und lebt in der afrikanischen Savanne.',
    hintEn: 'It has black spots and inhabits the African savanna.',
    visual: { type: 'science_badge', symbol: '🐆' },
  },
  {
    topic: 'animals_ecosystems',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Was versteht man in der Ökologie unter einer „Symbiose“?',
    qEn: 'What does "symbiosis" mean in ecological biology?',
    correctDe: 'Zusammenleben zweier Arten zum gegenseitigen Vorteil',
    correctEn: 'Coexistence of two species for mutual benefit',
    optionsDe: [
      'Zusammenleben zweier Arten zum gegenseitigen Vorteil',
      'Ein Räuber-Beute-Verhältnis',
      'Der Kampf um denselben Lebensraum',
      'Das Aussterben einer Spezies',
    ],
    optionsEn: [
      'Coexistence of two species for mutual benefit',
      'A predator-prey relationship',
      'Competition for the exact same niche',
      'The gradual extinction of a species',
    ],
    expDe: 'Symbiose beschreibt eine enge Lebensgemeinschaft, von der beide Partner profitieren (z.B. Clownfisch und Seeanemone).',
    expEn: 'Symbiosis describes an interaction where both organism species benefit from each other.',
    hintDe: 'Denke an Bienen und Blumen, die sich gegenseitig helfen.',
    hintEn: 'Think of bees and flowers helping one another.',
    visual: { type: 'science_badge', symbol: '🐝' },
  },
  {
    topic: 'animals_ecosystems',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Welche trophische Ebene nehmen Pflanzen in einer Nahrungskette ein?',
    qEn: 'Which trophic level do autotrophic plants occupy in an ecological food chain?',
    correctDe: 'Primärproduzenten',
    correctEn: 'Primary Producers',
    optionsDe: ['Primärproduzenten', 'Primärkonsumenten', 'Destruenten', 'Sekundärkonsumenten'],
    optionsEn: ['Primary Producers', 'Primary Consumers', 'Decomposers', 'Secondary Consumers'],
    expDe: 'Pflanzen stellen durch Photosynthese organische Biomasse her und sind daher Primärproduzenten.',
    expEn: 'Plants produce organic biomass from sunlight and inorganic carbon, forming the producer base.',
    hintDe: 'Sie produzieren Energie für alle folgenden Lebewesen.',
    hintEn: 'They produce the primary energy supply via photosynthesis.',
    visual: { type: 'science_badge', symbol: '🌲' },
  },
  {
    topic: 'animals_ecosystems',
    grade: 'high_school',
    difficulty: 5,
    qDe: 'Welches Phänomen beschreibt die Anreicherung von Schadstoffen entlang der Nahrungskette?',
    qEn: 'Which term describes the increasing concentration of toxic substances up the food chain?',
    correctDe: 'Biomagnifikation',
    correctEn: 'Biomagnification',
    optionsDe: ['Biomagnifikation', 'Eutrophierung', 'Biodiversität', 'Photosynthese-Index'],
    optionsEn: ['Biomagnification', 'Eutrophication', 'Biodiversity', 'Bio-fixation'],
    expDe: 'Schadstoffe (wie Quecksilber oder Mikroplastik) reichern sich in höheren Trophiestufen immer stärker an.',
    expEn: 'Biomagnification is the accumulation of toxins at higher levels of the food chain.',
    hintDe: 'Das Wort enthält "Magni" wie in Vergrößerung.',
    hintEn: 'It shares the root with "magnify" or amplify.',
    visual: { type: 'science_badge', symbol: '🔬' },
  },

  // Plants & Botany
  {
    topic: 'plants_botany',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Pflanzenteil nimmt Wasser und Mineralien aus dem Boden auf?',
    qEn: 'Which part of a plant absorbs water and minerals from the soil?',
    correctDe: 'Die Wurzeln',
    correctEn: 'The Roots',
    optionsDe: ['Die Wurzeln', 'Die Blätter', 'Die Blüte', 'Der Stängel'],
    optionsEn: ['The Roots', 'The Leaves', 'The Flower', 'The Stem'],
    expDe: 'Wurzeln verankern die Pflanze im Boden und saugen Wasser und Nährstoffe auf.',
    expEn: 'Roots anchor the plant firmly in the ground and absorb water and nutrients.',
    hintDe: 'Sie befinden sich unter der Erde.',
    hintEn: 'They are located underground.',
    visual: { type: 'science_badge', symbol: '🌱' },
  },
  {
    topic: 'plants_botany',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welches Gas geben grüne Pflanzen bei der Photosynthese an die Luft ab?',
    qEn: 'Which essential gas do green plants release during photosynthesis?',
    correctDe: 'Sauerstoff',
    correctEn: 'Oxygen',
    optionsDe: ['Sauerstoff', 'Kohlendioxid', 'Stickstoff', 'Helium'],
    optionsEn: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
    expDe: 'Pflanzen wandeln Kohlendioxid und Wasser mit Sonnenlicht in Glukose und lebenswichtigen Sauerstoff (O₂) um.',
    expEn: 'Plants convert CO2 and water into glucose and release vital oxygen into the atmosphere.',
    hintDe: 'Dieses Gas brauchen Menschen und Tiere zum Atmen.',
    hintEn: 'This is the gas humans and animals inhale to survive.',
    visual: { type: 'science_badge', symbol: '🍃' },
  },
  {
    topic: 'plants_botany',
    grade: 'primary',
    difficulty: 3,
    qDe: 'Welcher grüne Farbstoff in den Blättern fängt das Sonnenlicht ein?',
    qEn: 'Which green pigment in leaves captures solar photon energy for photosynthesis?',
    correctDe: 'Chlorophyll',
    correctEn: 'Chlorophyll',
    optionsDe: ['Chlorophyll', 'Melanin', 'Hämoglobin', 'Carotin'],
    optionsEn: ['Chlorophyll', 'Melanin', 'Hemoglobin', 'Carotene'],
    expDe: 'Chlorophyll verleiht den Blättern ihre grüne Farbe und ermöglicht die Lichtabsorption.',
    expEn: 'Chlorophyll gives leaves their green hue and absorbs sunlight for energy conversion.',
    hintDe: 'Es beginnt mit "Chloro-".',
    hintEn: 'It starts with "Chloro-".',
    visual: { type: 'science_badge', symbol: '🌿' },
  },
  {
    topic: 'plants_botany',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Welches Leitgewebe transportiert Wasser und Mineralstoffe von den Wurzeln nach oben?',
    qEn: 'Which plant vascular tissue transports water and inorganic nutrients upward from roots?',
    correctDe: 'Xylem',
    correctEn: 'Xylem',
    optionsDe: ['Xylem', 'Phloem', 'Kambium', 'Epidermis'],
    optionsEn: ['Xylem', 'Phloem', 'Cambium', 'Epidermis'],
    expDe: 'Das Xylem transportiert Wasser von den Wurzeln in die Krone; das Phloem transportiert Nährstoffe (Zucker).',
    expEn: 'Xylem transports water and minerals upward; phloem transports organic sugars downward and around.',
    hintDe: 'Es beginnt mit einem X.',
    hintEn: 'It begins with the letter X.',
    visual: { type: 'science_badge', symbol: '🔬' },
  },

  // Solar System & Space
  {
    topic: 'solar_system_space',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Planet unseres Sonnensystems ist der Sonne am nächsten?',
    qEn: 'Which planet is closest to the Sun in our Solar System?',
    correctDe: 'Merkur',
    correctEn: 'Mercury',
    optionsDe: ['Merkur', 'Venus', 'Erde', 'Mars'],
    optionsEn: ['Mercury', 'Venus', 'Earth', 'Mars'],
    expDe: 'Merkur ist der innerste und kleinste Planet unseres Sonnensystems.',
    expEn: 'Mercury is the innermost and smallest rocky planet orbiting the Sun.',
    hintDe: 'Er beginnt mit dem Buchstaben M.',
    hintEn: 'It begins with the letter M.',
    visual: { type: 'science_badge', symbol: '☀️' },
  },
  {
    topic: 'solar_system_space',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welcher Planet wird wegen seines roten Eisenoxid-Staubs oft als „Roter Planet“ bezeichnet?',
    qEn: 'Which planet is famous as the "Red Planet" due to iron oxide rust on its surface?',
    correctDe: 'Mars',
    correctEn: 'Mars',
    optionsDe: ['Mars', 'Jupiter', 'Saturn', 'Neptun'],
    optionsEn: ['Mars', 'Jupiter', 'Saturn', 'Neptune'],
    expDe: 'Der Mars hat eine rostrote Oberfläche und ist der vierte Planet von der Sonne.',
    expEn: 'Mars has iron-rich rusty soil that reflects reddish light.',
    hintDe: 'Hier landen berühmte Rover wie Curiosity und Perseverance.',
    hintEn: 'NASA rovers like Perseverance explore its surface.',
    visual: { type: 'science_badge', symbol: '🔴' },
  },
  {
    topic: 'solar_system_space',
    grade: 'primary',
    difficulty: 3,
    qDe: 'Welcher Planet ist der größte in unserem gesamten Sonnensystem?',
    qEn: 'Which planet is the largest in our entire Solar System?',
    correctDe: 'Jupiter',
    correctEn: 'Jupiter',
    optionsDe: ['Jupiter', 'Saturn', 'Uranus', 'Erde'],
    optionsEn: ['Jupiter', 'Saturn', 'Uranus', 'Earth'],
    expDe: 'Jupiter ist ein riesiger Gasplanet und mehr als 11-mal so breit wie die Erde.',
    expEn: 'Jupiter is a massive gas giant with more than 11 times Earth’s diameter.',
    hintDe: 'Er besitzt den berühmten „Großen Roten Fleck“ (einen Riesensturm).',
    hintEn: 'It features the famous Great Red Spot storm.',
    visual: { type: 'science_badge', symbol: '🪐' },
  },
  {
    topic: 'solar_system_space',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Wie lange braucht das Licht der Sonne ungefähr, um die Erde zu erreichen?',
    qEn: 'Approximately how long does sunlight take to travel from the Sun to Earth?',
    correctDe: 'Ca. 8 Minuten und 20 Sekunden',
    correctEn: 'Around 8 minutes and 20 seconds',
    optionsDe: [
      'Ca. 8 Minuten und 20 Sekunden',
      'Sofort (unter 1 Sekunde)',
      'Ca. 1 Stunde',
      'Ca. 24 Stunden',
    ],
    optionsEn: [
      'Around 8 minutes and 20 seconds',
      'Instantaneous (<1 second)',
      'Around 1 hour',
      'Around 24 hours',
    ],
    expDe: 'Bei einer Lichtgeschwindigkeit von ca. 300.000 km/s und ~150 Mio. km Entfernung dauert der Weg ca. 500 Sekunden (8 min 20 s).',
    expEn: 'With light speed at 300,000 km/s across 150M kilometers, the journey takes about 500 seconds.',
    hintDe: 'Etwas mehr als 8 Minuten.',
    hintEn: 'A bit over 8 minutes.',
    visual: { type: 'science_badge', symbol: '✨' },
  },
  {
    topic: 'solar_system_space',
    grade: 'high_school',
    difficulty: 5,
    qDe: 'Was ist die theoretische Grenze um ein Schwarzes Loch, ab der nicht einmal Licht entkommen kann?',
    qEn: 'What is the boundary around a black hole beyond which even light cannot escape?',
    correctDe: 'Ereignishorizont',
    correctEn: 'Event Horizon',
    optionsDe: ['Ereignishorizont', 'Akkretionsscheibe', 'Singularität', 'Schwarzschild-Kern'],
    optionsEn: ['Event Horizon', 'Accretion Disk', 'Singularity', 'Photon Sphere'],
    expDe: 'Der Ereignishorizont ist die Grenzfläche in der Raumzeit, an der die Fluchtgeschwindigkeit die Lichtgeschwindigkeit übersteigt.',
    expEn: 'The event horizon is the threshold where escape velocity surpasses the speed of light in vacuum.',
    hintDe: 'Es ist der "Horizont" aller physikalischen Ereignisse.',
    hintEn: 'It marks the threshold or "horizon" of observable events.',
    visual: { type: 'science_badge', symbol: '🌌' },
  },

  // Weather & Climate
  {
    topic: 'weather_climate',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Prozess wandelt flüssiges Wasser in der Sonne in unsichtbaren Wasserdampf um?',
    qEn: 'Which process turns liquid water on Earth into water vapor when heated?',
    correctDe: 'Verdunstung',
    correctEn: 'Evaporation',
    optionsDe: ['Verdunstung', 'Kondensation', 'Niederschlag', 'Gefrieren'],
    optionsEn: ['Evaporation', 'Condensation', 'Precipitation', 'Freezing'],
    expDe: 'Durch Sonnenwärme verdunstet Wasser aus Meeren und Seen und steigt in den Himmel auf.',
    expEn: 'Evaporation occurs when heat converts liquid water into gaseous moisture.',
    hintDe: 'Wasser steigt als Dampf nach oben.',
    hintEn: 'Water rises upward as thermal vapor.',
    visual: { type: 'science_badge', symbol: '💧' },
  },
  {
    topic: 'weather_climate',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Wie nennt man dicke, dunkle Wolken, die starke Gewitter und Blitze bringen?',
    qEn: 'What is the meteorological name for massive thunderclouds causing lightning and storms?',
    correctDe: 'Cumulonimbus',
    correctEn: 'Cumulonimbus',
    optionsDe: ['Cumulonimbus', 'Cirrus', 'Stratus', 'Altocumulus'],
    optionsEn: ['Cumulonimbus', 'Cirrus', 'Stratus', 'Altocumulus'],
    expDe: 'Cumulonimbus-Wolken sind gewaltige Gewitterwolken, die wie Ambosse aussehen können.',
    expEn: 'Cumulonimbus clouds are towering anvil-shaped storm clouds generating thunder, rain, and lightning.',
    hintDe: 'Sie beginnen mit Cumu- und enden auf -nimbus.',
    hintEn: 'They start with Cumulo- and end with -nimbus.',
    visual: { type: 'science_badge', symbol: '⛈️' },
  },
  {
    topic: 'weather_climate',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welches Messgerät misst den atmosphärischen Luftdruck?',
    qEn: 'Which instrument measures atmospheric air pressure?',
    correctDe: 'Barometer',
    correctEn: 'Barometer',
    optionsDe: ['Barometer', 'Hygrometer', 'Anemometer', 'Thermometer'],
    optionsEn: ['Barometer', 'Hygrometer', 'Anemometer', 'Thermometer'],
    expDe: 'Ein Barometer misst Luftdruck in Hektopascal (hPa); ein Hygrometer misst Luftfeuchtigkeit.',
    expEn: 'A barometer measures atmospheric pressure (in hPa or mmHg); hygrometers measure humidity.',
    hintDe: 'Das Wort beginnt mit Baro- (Druck).',
    hintEn: 'The prefix "baro-" refers to pressure/weight.',
    visual: { type: 'science_badge', symbol: '🌡️' },
  },

  // Human Body & Biology
  {
    topic: 'human_body_biology',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welches Organ pumpt Blut ununterbrochen durch den gesamten menschlichen Körper?',
    qEn: 'Which organ continuously pumps blood throughout the entire human body?',
    correctDe: 'Das Herz',
    correctEn: 'The Heart',
    optionsDe: ['Das Herz', 'Die Lunge', 'Der Magen', 'Die Leber'],
    optionsEn: ['The Heart', 'The Lungs', 'The Stomach', 'The Liver'],
    expDe: 'Das Herz ist ein kräftiger Muskel, der Sauerstoff und Nährstoffe über den Blutkreislauf transportiert.',
    expEn: 'The heart acts as an incredible muscular pump supplying oxygenated blood to all organs.',
    hintDe: 'Es schlägt etwa 70–100 Mal pro Minute in deiner Brust.',
    hintEn: 'It beats continuously in your chest.',
    visual: { type: 'science_badge', symbol: '❤️' },
  },
  {
    topic: 'human_body_biology',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Aus wie vielen Knochen besteht das Skelett eines erwachsenen Menschen ungefähr?',
    qEn: 'Approximately how many bones comprise the adult human skeleton?',
    correctDe: 'Etwa 206',
    correctEn: 'Around 206',
    optionsDe: ['Etwa 206', 'Etwa 50', 'Etwa 500', 'Etwa 1000'],
    optionsEn: ['Around 206', 'Around 50', 'Around 500', 'Around 1000'],
    expDe: 'Ein Erwachsener hat etwa 206 Knochen; Babys haben anfangs mehr Knochen, die später zusammenwachsen.',
    expEn: 'Adult humans have 206 bones; infants start with ~270, which fuse over development.',
    hintDe: 'Etwas mehr als 200 Knochen.',
    hintEn: 'A little over 200 bones.',
    visual: { type: 'science_badge', symbol: '🦴' },
  },
  {
    topic: 'human_body_biology',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Welche Blutkörperchen sind primär für die Abwehr von Krankheitserregern zuständig?',
    qEn: 'Which type of blood cells are primarily responsible for fighting infections and pathogens?',
    correctDe: 'Weiße Blutkörperchen (Leukozyten)',
    correctEn: 'White Blood Cells (Leukocytes)',
    optionsDe: [
      'Weiße Blutkörperchen (Leukozyten)',
      'Rote Blutkörperchen (Erythrozyten)',
      'Blutplättchen (Thrombozyten)',
      'Blutplasma',
    ],
    optionsEn: [
      'White Blood Cells (Leukocytes)',
      'Red Blood Cells (Erythrocytes)',
      'Platelets (Thrombocytes)',
      'Blood Plasma',
    ],
    expDe: 'Leukozyten (weiße Blutkörperchen) bilden das Immunsystem und bekämpfen Viren und Bakterien.',
    expEn: 'Leukocytes (white blood cells) are the body’s defenders against bacteria, viruses, and pathogens.',
    hintDe: 'Sie sind "weiß" und verteidigen den Körper wie eine Armee.',
    hintEn: 'They are the "white" immune defenders.',
    visual: { type: 'science_badge', symbol: '🛡️' },
  },

  // Physics & Inventions
  {
    topic: 'physics_inventions',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welche unsichtbare Kraft zieht Gegenstände zur Erde und lässt Äpfel vom Baum fallen?',
    qEn: 'Which invisible force pulls objects toward the center of the Earth?',
    correctDe: 'Schwerkraft (Gravitation)',
    correctEn: 'Gravity',
    optionsDe: ['Schwerkraft (Gravitation)', 'Magnetismus', 'Windkraft', 'Reibung'],
    optionsEn: ['Gravity', 'Magnetism', 'Wind Power', 'Friction'],
    expDe: 'Die Schwerkraft sorgt dafür, dass wir fest auf dem Boden stehen und Gegenstände nach unten fallen.',
    expEn: 'Gravity is the fundamental force pulling mass toward Earth’s center.',
    hintDe: 'Isaac Newton dachte darüber nach, als ein Apfel herunterfiel.',
    hintEn: 'Isaac Newton famously studied it after an apple fell from a tree.',
    visual: { type: 'science_badge', symbol: '🍎' },
  },
  {
    topic: 'physics_inventions',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'In welchem Medium breitet sich Schall am schnellsten aus?',
    qEn: 'Through which medium does acoustic sound travel fastest?',
    correctDe: 'Festkörper (z.B. Stahl / Eisen)',
    correctEn: 'Solids (e.g. steel / iron)',
    optionsDe: ['Festkörper (z.B. Stahl / Eisen)', 'Wasser (Flüssigkeit)', 'Luft (Gas)', 'Vakuum'],
    optionsEn: ['Solids (e.g. steel / iron)', 'Water (liquid)', 'Air (gas)', 'Vacuum'],
    expDe: 'Schall benötigt Teilchen: Je dichter gepackt (Festkörper ~5000 m/s), desto schneller die Schallwelle. Im Vakuum gibt es keinen Schall.',
    expEn: 'Sound travels fastest in dense solids (~5,000 m/s in steel) because closely packed atoms transmit vibrations rapidly.',
    hintDe: 'Dichte Moleküle übertragen Schwingungen am schnellsten.',
    hintEn: 'Tightly bound atomic lattices transmit vibrations quickest.',
    visual: { type: 'science_badge', symbol: '🔊' },
  },
];

// -------------------------------------------------------------
// 2. GEOGRAPHY & WORLD ENGINE
// -------------------------------------------------------------

export const GEOGRAPHY_BANK: SubjectItemDef[] = [
  // World Capitals
  {
    topic: 'world_capitals',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Was ist die Hauptstadt von Frankreich?',
    qEn: 'What is the capital city of France?',
    correctDe: 'Paris',
    correctEn: 'Paris',
    optionsDe: ['Paris', 'Lyon', 'Marseille', 'Nizza'],
    optionsEn: ['Paris', 'Lyon', 'Marseille', 'Nice'],
    expDe: 'Paris ist die Hauptstadt Frankreichs und berühmt für den Eiffelturm.',
    expEn: 'Paris is the capital of France, home of the Eiffel Tower and the Louvre.',
    hintDe: 'Hier steht der weltberühmte Eiffelturm.',
    hintEn: 'The city of the Eiffel Tower and the Seine River.',
    visual: { type: 'flag', flagEmoji: '🇫🇷' },
  },
  {
    topic: 'world_capitals',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Was ist die Hauptstadt von Deutschland?',
    qEn: 'What is the capital city of Germany?',
    correctDe: 'Berlin',
    correctEn: 'Berlin',
    optionsDe: ['Berlin', 'München', 'Hamburg', 'Frankfurt'],
    optionsEn: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
    expDe: 'Berlin ist die bevölkerungsreichste Stadt und Hauptstadt Deutschlands.',
    expEn: 'Berlin is the historic capital and largest city in Germany.',
    hintDe: 'Hier steht das Brandenburger Tor.',
    hintEn: 'Home to the Brandenburg Gate and Reichstag.',
    visual: { type: 'flag', flagEmoji: '🇩🇪' },
  },
  {
    topic: 'world_capitals',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Was ist die Hauptstadt von Japan?',
    qEn: 'What is the capital city of Japan?',
    correctDe: 'Tokio',
    correctEn: 'Tokyo',
    optionsDe: ['Tokio', 'Kyoto', 'Osaka', 'Sapporo'],
    optionsEn: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'],
    expDe: 'Tokio ist die hochmoderne Metropole und Hauptstadt Japans.',
    expEn: 'Tokyo is the bustling capital and largest metropolitan region in Japan.',
    hintDe: 'Eine riesige Metropole auf der Insel Honshu.',
    hintEn: 'The largest metropolis in the world located on Honshu island.',
    visual: { type: 'flag', flagEmoji: '🇯🇵' },
  },
  {
    topic: 'world_capitals',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Was ist die Hauptstadt von Italien?',
    qEn: 'What is the capital city of Italy?',
    correctDe: 'Rom',
    correctEn: 'Rome',
    optionsDe: ['Rom', 'Mailand', 'Venedig', 'Florenz'],
    optionsEn: ['Rome', 'Milan', 'Venice', 'Florence'],
    expDe: 'Rom, die „Ewige Stadt“, ist die Hauptstadt Italiens mit dem Kolosseum.',
    expEn: 'Rome, the Eternal City, is the capital of Italy and ancient Roman history.',
    hintDe: 'Hier findest du das Kolosseum und den Vatikan.',
    hintEn: 'Home to the Colosseum and Vatican City.',
    visual: { type: 'flag', flagEmoji: '🇮🇹' },
  },
  {
    topic: 'world_capitals',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Was ist die offizielle Hauptstadt von Australien?',
    qEn: 'What is the official federal capital city of Australia?',
    correctDe: 'Canberra',
    correctEn: 'Canberra',
    optionsDe: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
    optionsEn: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
    expDe: 'Viele verwechseln Sydney mit der Hauptstadt, aber Canberra ist die offizielle Bundeshauptstadt Australiens.',
    expEn: 'While Sydney and Melbourne are larger, Canberra was purpose-built as the federal capital.',
    hintDe: 'Es ist weder Sydney noch Melbourne, sondern ein geplanter Regierungssitz.',
    hintEn: 'Neither Sydney nor Melbourne; a planned bush capital.',
    visual: { type: 'flag', flagEmoji: '🇦🇺' },
  },
  {
    topic: 'world_capitals',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Was ist die Hauptstadt von Kanada?',
    qEn: 'What is the capital city of Canada?',
    correctDe: 'Ottawa',
    correctEn: 'Ottawa',
    optionsDe: ['Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    optionsEn: ['Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    expDe: 'Ottawa in der Provinz Ontario ist die Bundeshauptstadt von Kanada.',
    expEn: 'Ottawa, located on the Ottawa River in Ontario, is Canada’s federal capital.',
    hintDe: 'Sie liegt in Ontario nahe der Grenze zu Québec.',
    hintEn: 'Located along the Rideau Canal in Ontario.',
    visual: { type: 'flag', flagEmoji: '🇨🇦' },
  },
  {
    topic: 'world_capitals',
    grade: 'high_school',
    difficulty: 5,
    qDe: 'Was ist die Hauptstadt von Neuseeland?',
    qEn: 'What is the capital city of New Zealand?',
    correctDe: 'Wellington',
    correctEn: 'Wellington',
    optionsDe: ['Wellington', 'Auckland', 'Christchurch', 'Queenstown'],
    optionsEn: ['Wellington', 'Auckland', 'Christchurch', 'Queenstown'],
    expDe: 'Wellington an der Südspitze der Nordinsel ist die südlichste Hauptstadt der Welt.',
    expEn: 'Wellington, on the south tip of the North Island, is the world’s southernmost capital.',
    hintDe: 'Es ist nicht Auckland, sondern die windige Stadt Wellington.',
    hintEn: 'Famous for its wind and harbour at the Cook Strait.',
    visual: { type: 'flag', flagEmoji: '🇳🇿' },
  },

  // Flags & Countries
  {
    topic: 'flags_countries',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welches Land hat eine rote Flagge mit einem weißen Kreuz in der Mitte?',
    qEn: 'Which European country has a red flag featuring a bold white cross in the center?',
    correctDe: 'Schweiz',
    correctEn: 'Switzerland',
    optionsDe: ['Schweiz', 'Österreich', 'Schweden', 'Dänemark'],
    optionsEn: ['Switzerland', 'Austria', 'Sweden', 'Denmark'],
    expDe: 'Die Schweizer Flagge ist quadratisch mit einem weißen Kreuz auf rotem Grund.',
    expEn: 'The Swiss flag is famously square-shaped with a white cross on red background.',
    hintDe: 'Bekannt für die Alpen, Schokolade und Käse.',
    hintEn: 'Famous for the Alps, watches, and chocolate.',
    visual: { type: 'flag', flagEmoji: '🇨🇭' },
  },
  {
    topic: 'flags_countries',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welches Land hat die Ahornblatt-Flagge (Maple Leaf)?',
    qEn: 'Which country features a stylized red maple leaf on its national flag?',
    correctDe: 'Kanada',
    correctEn: 'Canada',
    optionsDe: ['Kanada', 'USA', 'Australien', 'Norwegen'],
    optionsEn: ['Canada', 'USA', 'Australia', 'Norway'],
    expDe: 'Das rote Ahornblatt ist das weltberühmte Staatssymbol Kanadas.',
    expEn: 'The red maple leaf is the iconic symbol of Canada.',
    hintDe: 'Das Land liegt nördlich der USA.',
    hintEn: 'It borders the United States to the north.',
    visual: { type: 'flag', flagEmoji: '🇨🇦' },
  },
  {
    topic: 'flags_countries',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welche Farben hat die Trikolore der Republik Irland?',
    qEn: 'Which three colors form the tricolor flag of the Republic of Ireland?',
    correctDe: 'Grün, Weiß, Orange',
    correctEn: 'Green, White, Orange',
    optionsDe: ['Grün, Weiß, Orange', 'Grün, Weiß, Rot', 'Blau, Weiß, Rot', 'Schwarz, Gelb, Rot'],
    optionsEn: ['Green, White, Orange', 'Green, White, Red', 'Blue, White, Red', 'Black, Yellow, Red'],
    expDe: 'Grün steht für die gälische Tradition, Orange für die Protestanten und Weiß für den Frieden.',
    expEn: 'Green represents tradition, orange represents the Williamite community, and white represents lasting peace.',
    hintDe: 'Grün steht links, Orange rechts.',
    hintEn: 'Green is on the hoist, orange on the fly.',
    visual: { type: 'flag', flagEmoji: '🇮🇪' },
  },

  // Continents & Oceans
  {
    topic: 'continents_oceans',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Ozean ist der flächenmäßig größte und tiefste der Erde?',
    qEn: 'Which ocean is the largest and deepest on planet Earth?',
    correctDe: 'Pazifischer Ozean (Pazifik)',
    correctEn: 'Pacific Ocean',
    optionsDe: ['Pazifischer Ozean (Pazifik)', 'Atlantischer Ozean', 'Indischer Ozean', 'Arktischer Ozean'],
    optionsEn: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
    expDe: 'Der Pazifik bedeckt mehr als 30% der Erdoberfläche und beherbergt den Marianengraben.',
    expEn: 'The Pacific Ocean covers over 30% of Earth and contains the Mariana Trench.',
    hintDe: 'Er wird auch „Stiller Ozean“ genannt.',
    hintEn: 'Also known historically as the Peaceful or Quiet Ocean.',
    visual: { type: 'science_badge', symbol: '🌊' },
  },
  {
    topic: 'continents_oceans',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Auf welchem Breitengrad liegt der Äquator?',
    qEn: 'At what latitude is the Earth’s equator located?',
    correctDe: '0°',
    correctEn: '0°',
    optionsDe: ['0°', '90° Nord', '23,5°', '180°'],
    optionsEn: ['0°', '90° North', '23.5°', '180°'],
    expDe: 'Der Äquator teilt die Erde genau bei 0° Breite in die Nord- und Südhalbkugel.',
    expEn: 'The Equator is the zero-degree latitude line dividing the Northern and Southern hemispheres.',
    hintDe: 'Es ist die genaue Null-Linie.',
    hintEn: 'The baseline zero mark.',
    visual: { type: 'science_badge', symbol: '🌍' },
  },

  // Famous Landmarks
  {
    topic: 'famous_landmarks',
    grade: 'primary',
    difficulty: 1,
    qDe: 'In welcher Stadt steht das antike Kolosseum?',
    qEn: 'In which historic European city is the ancient Colosseum amphitheater located?',
    correctDe: 'Rom (Italien)',
    correctEn: 'Rome (Italy)',
    optionsDe: ['Rom (Italien)', 'Athen (Griechenland)', 'Madrid (Spanien)', 'Kairo (Ägypten)'],
    optionsEn: ['Rome (Italy)', 'Athens (Greece)', 'Madrid (Spain)', 'Cairo (Egypt)'],
    expDe: 'Das Kolosseum in Rom wurde im 1. Jahrhundert n. Chr. als gigantisches Amphitheater für Gladiatorenkämpfe erbaut.',
    expEn: 'The Colosseum was built in ancient Rome for theatrical and gladiatorial events.',
    hintDe: 'Die Hauptstadt von Italien.',
    hintEn: 'The capital of Italy.',
    visual: { type: 'landmark', symbol: '🏛️' },
  },
  {
    topic: 'famous_landmarks',
    grade: 'primary',
    difficulty: 2,
    qDe: 'In welchem Land befindet sich das weltberühmte Mausoleum Taj Mahal?',
    qEn: 'In which country is the iconic white marble Taj Mahal mausoleum situated?',
    correctDe: 'Indien',
    correctEn: 'India',
    optionsDe: ['Indien', 'Ägypten', 'Türkei', 'China'],
    optionsEn: ['India', 'Egypt', 'Turkey', 'China'],
    expDe: 'Das Taj Mahal in Agra (Indien) wurde im 17. Jahrhundert von Großmogul Shah Jahan für seine Frau erbaut.',
    expEn: 'The Taj Mahal in Agra, India, was built by Mughal emperor Shah Jahan out of gleaming white marble.',
    hintDe: 'Es steht in der indischen Stadt Agra.',
    hintEn: 'Located along the Yamuna river in Agra.',
    visual: { type: 'landmark', symbol: '🕌' },
  },
  {
    topic: 'famous_landmarks',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Auf welchem Kontinent und in welchem Land liegt die Ruinenstadt Machu Picchu?',
    qEn: 'In which South American country is the 15th-century Inca citadel Machu Picchu located?',
    correctDe: 'Peru (Südamerika)',
    correctEn: 'Peru (South America)',
    optionsDe: ['Peru (Südamerika)', 'Chile (Südamerika)', 'Mexiko (Nordamerika)', 'Kolumbien (Südamerika)'],
    optionsEn: ['Peru (South America)', 'Chile (South America)', 'Mexico (North America)', 'Colombia (South America)'],
    expDe: 'Machu Picchu wurde im 15. Jahrhundert von den Inka hoch in den peruanischen Anden erbaut.',
    expEn: 'Machu Picchu is an iconic 15th-century Inca citadel set high in the Peruvian Andes mountains.',
    hintDe: 'Die alte Hochkultur der Inka in den Anden.',
    hintEn: 'The ancient mountain citadel of the Inca empire.',
    visual: { type: 'landmark', symbol: '⛰️' },
  },

  // Mountains & Rivers
  {
    topic: 'mountains_rivers',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Was ist der höchste Berg der Erde über dem Meeresspiegel?',
    qEn: 'What is the highest mountain peak above sea level on Earth?',
    correctDe: 'Mount Everest (8.848 m)',
    correctEn: 'Mount Everest (8,848 m)',
    optionsDe: ['Mount Everest (8.848 m)', 'K2 (8.611 m)', 'Mont Blanc (4.808 m)', 'Kilimandscharo (5.895 m)'],
    optionsEn: ['Mount Everest (8,848 m)', 'K2 (8,611 m)', 'Mont Blanc (4,808 m)', 'Kilimanjaro (5,895 m)'],
    expDe: 'Der Mount Everest im Himalaja-Gebirge zwischen Nepal und China ist mit 8.848 m der höchste Gipfel.',
    expEn: 'Mount Everest in the Himalayas on the Nepal-China border stands at 8,848 meters.',
    hintDe: 'Er liegt im Himalaja-Gebirge.',
    hintEn: 'Situated in the majestic Himalayan range.',
    visual: { type: 'science_badge', symbol: '🏔️' },
  },
  {
    topic: 'mountains_rivers',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welcher Fluss ist der wasserreichste Fluss der Erde und fließt durch den größten Regenwald?',
    qEn: 'Which river carries the greatest water discharge volume on Earth and flows through a giant rainforest?',
    correctDe: 'Amazonas',
    correctEn: 'Amazon River',
    optionsDe: ['Amazonas', 'Nil', 'Mississippi', 'Jangtsekiang'],
    optionsEn: ['Amazon River', 'Nile River', 'Mississippi River', 'Yangtze River'],
    expDe: 'Der Amazonas in Südamerika führt mehr Wasser als die nächsten sieben größten Flüsse zusammen.',
    expEn: 'The Amazon River in South America discharges more water volume than the next seven rivers combined.',
    hintDe: 'Er fließt durch Brasilien und den südamerikanischen Regenwald.',
    hintEn: 'Flows through Brazil and the massive South American jungle.',
    visual: { type: 'science_badge', symbol: '🌊' },
  },
];

// -------------------------------------------------------------
// 3. ART & MUSIC ENGINE
// -------------------------------------------------------------

export const ART_BANK: SubjectItemDef[] = [
  // Masterpieces
  {
    topic: 'famous_masterpieces',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Wer malte das weltberühmte Porträt der „Mona Lisa“ mit ihrem geheimnisvollen Lächeln?',
    qEn: 'Which Italian polymath painted the masterpiece "Mona Lisa" displayed in the Louvre?',
    correctDe: 'Leonardo da Vinci',
    correctEn: 'Leonardo da Vinci',
    optionsDe: ['Leonardo da Vinci', 'Vincent van Gogh', 'Pablo Picasso', 'Claude Monet'],
    optionsEn: ['Leonardo da Vinci', 'Vincent van Gogh', 'Pablo Picasso', 'Claude Monet'],
    expDe: 'Leonardo da Vinci schuf das Gemälde der Mona Lisa um das Jahr 1503 in der italienischen Renaissance.',
    expEn: 'Leonardo da Vinci painted the Mona Lisa in early 16th-century Italy.',
    hintDe: 'Ein berühmter italienischer Universalgelehrter und Erfinder.',
    hintEn: 'Famous Italian polymath, engineer, and artist of the Renaissance.',
    visual: { type: 'landmark', symbol: '🖼️' },
  },
  {
    topic: 'famous_masterpieces',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welcher niederländische Künstler malte das wirbelnde Meisterwerk „Sternennacht“ (The Starry Night)?',
    qEn: 'Which Dutch post-impressionist master painted "The Starry Night" with swirling skies?',
    correctDe: 'Vincent van Gogh',
    correctEn: 'Vincent van Gogh',
    optionsDe: ['Vincent van Gogh', 'Rembrandt', 'Salvador Dalí', 'Michelangelo'],
    optionsEn: ['Vincent van Gogh', 'Rembrandt', 'Salvador Dalí', 'Michelangelo'],
    expDe: 'Vincent van Gogh malte 1889 „Sternennacht“ mit leuchtendem Gelb und tiefem Blau.',
    expEn: 'Vincent van Gogh painted The Starry Night in June 1889, capturing turbulent celestial motion.',
    hintDe: 'Er malte auch die berühmten „Sonnenblumen“.',
    hintEn: 'He also painted famous vibrant Sunflowers in Arles.',
    visual: { type: 'landmark', symbol: '🌌' },
  },
  {
    topic: 'famous_masterpieces',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Welcher surrealistische Künstler malte die schmelzenden Uhren in „Die Beständigkeit der Erinnerung“?',
    qEn: 'Which Spanish surrealist painted the iconic melting pocket watches in "The Persistence of Memory"?',
    correctDe: 'Salvador Dalí',
    correctEn: 'Salvador Dalí',
    optionsDe: ['Salvador Dalí', 'Pablo Picasso', 'René Magritte', 'Henri Matisse'],
    optionsEn: ['Salvador Dalí', 'Pablo Picasso', 'René Magritte', 'Henri Matisse'],
    expDe: 'Salvador Dalí schuf die traumhaften schmelzenden Uhren 1931 als Meisterwerk des Surrealismus.',
    expEn: 'Salvador Dalí completed The Persistence of Memory in 1931, cementing surrealist iconism.',
    hintDe: 'Berühmt für seinen markanten nach oben gezwirbelten Schnurrbart.',
    hintEn: 'Famous for his iconic upturned mustache and dreamscapes.',
    visual: { type: 'landmark', symbol: '⏳' },
  },

  // Color Theory
  {
    topic: 'color_theory',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welche neue Farbe entsteht, wenn man Gelb und Blau miteinander mischt?',
    qEn: 'Which secondary color is produced by mixing yellow and blue pigment?',
    correctDe: 'Grün',
    correctEn: 'Green',
    optionsDe: ['Grün', 'Lila / Violett', 'Orange', 'Braun'],
    optionsEn: ['Green', 'Purple / Violet', 'Orange', 'Brown'],
    expDe: 'Gelb und Blau sind Grundfarben; gemischt ergeben sie die Sekundärfarbe Grün.',
    expEn: 'Combining primary yellow with primary blue produces green in subtractive color mixing.',
    hintDe: 'Die Farbe von Gras und Baumblättern.',
    hintEn: 'The color of grass and lush forest leaves.',
    visual: { type: 'color_palette', colorHex: '#10b981', secondaryHex: '#3b82f6' },
  },
  {
    topic: 'color_theory',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welche Farbe liegt im Farbkreis der Farbe Rot direkt gegenüber (Komplementärfarbe)?',
    qEn: 'Which complementary color sits directly opposite Red on the traditional artistic color wheel?',
    correctDe: 'Grün',
    correctEn: 'Green',
    optionsDe: ['Grün', 'Blau', 'Gelb', 'Schwarz'],
    optionsEn: ['Green', 'Blue', 'Yellow', 'Black'],
    expDe: 'Rot und Grün liegen sich im Farbkreis gegenüber und erzeugen maximalen Kontrast.',
    expEn: 'Red and Green are exact complementary opposites on the standard color wheel.',
    hintDe: 'Denke an eine rote Erdbeere mit ihren grünen Blättern.',
    hintEn: 'Think of Christmas pairings: Red and ...',
    visual: { type: 'color_palette', colorHex: '#ef4444', secondaryHex: '#22c55e' },
  },
  {
    topic: 'color_theory',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wofür steht das Farbmodell „RGB“, das in Computermonitoren und Smartphones verwendet wird?',
    qEn: 'What does the additive color model "RGB" used in digital screens stand for?',
    correctDe: 'Rot, Grün, Blau (Red, Green, Blue)',
    correctEn: 'Red, Green, Blue',
    optionsDe: [
      'Rot, Grün, Blau (Red, Green, Blue)',
      'Rot, Gelb, Braun (Red, Gold, Brown)',
      'Radiant, Glow, Brightness',
      'Raster, Gradient, Bitmap',
    ],
    optionsEn: [
      'Red, Green, Blue',
      'Red, Gold, Brown',
      'Radiant, Glow, Brightness',
      'Raster, Gradient, Bitmap',
    ],
    expDe: 'RGB ist ein additives Farbmodell aus den Licht-Grundfarben Rot, Grün und Blau.',
    expEn: 'RGB is the additive color system where light beams combine to produce millions of colors.',
    hintDe: 'Drei Licht-Grundfarben.',
    hintEn: 'Three primary light channels.',
    visual: { type: 'color_palette', colorHex: '#3b82f6' },
  },

  // Musical Instruments & Composers
  {
    topic: 'musical_instruments',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Zu welcher Instrumentenfamilie gehört die Geige (Violine)?',
    qEn: 'Which instrument family does the violin belong to in an orchestra?',
    correctDe: 'Streichinstrumente',
    correctEn: 'String Instruments',
    optionsDe: ['Streichinstrumente', 'Blasinstrumente', 'Schlaginstrumente', 'Tasteninstrumente'],
    optionsEn: ['String Instruments', 'Wind Instruments', 'Percussion Instruments', 'Keyboards'],
    expDe: 'Die Geige besitzt vier Saiten und wird typischerweise mit einem Rosshaar-Bogen gestrichen.',
    expEn: 'The violin has four strings tuned in fifths, sounded with a horsehair bow.',
    hintDe: 'Sie hat Saiten und wird mit einem Bogen gestrichen.',
    hintEn: 'Played with a bow across four strings.',
    visual: { type: 'science_badge', symbol: '🎻' },
  },
  {
    topic: 'classical_composers',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welcher geniale Komponist schrieb seine weltberühmte 9. Sinfonie („Ode an die Freude“), als er fast vollständig taub war?',
    qEn: 'Which legendary composer composed the monumental 9th Symphony ("Ode to Joy") while completely deaf?',
    correctDe: 'Ludwig van Beethoven',
    correctEn: 'Ludwig van Beethoven',
    optionsDe: ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Frédéric Chopin'],
    optionsEn: ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Frédéric Chopin'],
    expDe: 'Beethoven vollendete seine epochale 9. Sinfonie im Jahr 1824 trotz vollständigen Gehörverlusts.',
    expEn: 'Ludwig van Beethoven premiered his 9th Symphony in 1824 despite profound hearing loss.',
    hintDe: 'Geboren in Bonn, schuf er die weltberühmte 5. und 9. Sinfonie.',
    hintEn: 'Born in Bonn, Germany; author of Fur Elise and Symphony No. 5.',
    visual: { type: 'science_badge', symbol: '🎼' },
  },
];

// -------------------------------------------------------------
// 4. LANGUAGES ACADEMY ENGINE
// -------------------------------------------------------------

interface VocabWordDef {
  category: string;
  en: string;
  de: string;
  fr: string;
  es: string;
  it: string;
  pronounce: string;
  icon: string;
  difficulty?: number; // 1 to 5
}

export const VOCAB_DATABASE: VocabWordDef[] = [
  // Numbers & Colors
  { category: 'numbers_colors', en: 'Blue', de: 'Blau', fr: 'Bleu', es: 'Azul', it: 'Blu', pronounce: 'blue', icon: '🔵', difficulty: 1 },
  { category: 'numbers_colors', en: 'Red', de: 'Rot', fr: 'Rouge', es: 'Rojo', it: 'Rosso', pronounce: 'red', icon: '🔴', difficulty: 1 },
  { category: 'numbers_colors', en: 'Green', de: 'Grün', fr: 'Vert', es: 'Verde', it: 'Verde', pronounce: 'green', icon: '🟢', difficulty: 1 },
  { category: 'numbers_colors', en: 'Yellow', de: 'Gelb', fr: 'Jaune', es: 'Amarillo', it: 'Giallo', pronounce: 'yellow', icon: '🟡', difficulty: 1 },
  { category: 'numbers_colors', en: 'Seven', de: 'Sieben', fr: 'Sept', es: 'Siete', it: 'Sette', pronounce: 'seven', icon: '7️⃣', difficulty: 1 },
  { category: 'numbers_colors', en: 'Twelve', de: 'Zwölf', fr: 'Douze', es: 'Doce', it: 'Dodici', pronounce: 'twelve', icon: '🔢', difficulty: 2 },
  { category: 'numbers_colors', en: 'Hundred', de: 'Hundert', fr: 'Cent', es: 'Cien', it: 'Cento', pronounce: 'hundred', icon: '💯', difficulty: 2 },

  // Animals & Nature
  { category: 'animals_nature', en: 'Cat', de: 'Katze', fr: 'Chat', es: 'Gato', it: 'Gatto', pronounce: 'cat', icon: '🐱', difficulty: 1 },
  { category: 'animals_nature', en: 'Dog', de: 'Hund', fr: 'Chien', es: 'Perro', it: 'Cane', pronounce: 'dog', icon: '🐶', difficulty: 1 },
  { category: 'animals_nature', en: 'Horse', de: 'Pferd', fr: 'Cheval', es: 'Caballo', it: 'Cavallo', pronounce: 'horse', icon: '🐴', difficulty: 2 },
  { category: 'animals_nature', en: 'Bird', de: 'Vogel', fr: 'Oiseau', es: 'Pájaro', it: 'Uccello', pronounce: 'bird', icon: '🐦', difficulty: 2 },
  { category: 'animals_nature', en: 'Sun', de: 'Sonne', fr: 'Soleil', es: 'Sol', it: 'Sole', pronounce: 'sun', icon: '☀️', difficulty: 1 },
  { category: 'animals_nature', en: 'Moon', de: 'Mond', fr: 'Lune', es: 'Luna', it: 'Luna', pronounce: 'moon', icon: '🌙', difficulty: 1 },
  { category: 'animals_nature', en: 'Forest', de: 'Wald', fr: 'Forêt', es: 'Bosque', it: 'Foresta', pronounce: 'forest', icon: '🌲', difficulty: 3 },
  { category: 'animals_nature', en: 'Butterfly', de: 'Schmetterling', fr: 'Papillon', es: 'Mariposa', it: 'Farfalla', pronounce: 'butterfly', icon: '🦋', difficulty: 3 },

  // Food & Dining
  { category: 'food_dining', en: 'Apple', de: 'Apfel', fr: 'Pomme', es: 'Manzana', it: 'Mela', pronounce: 'apple', icon: '🍎', difficulty: 1 },
  { category: 'food_dining', en: 'Water', de: 'Wasser', fr: 'Eau', es: 'Agua', it: 'Acqua', pronounce: 'water', icon: '💧', difficulty: 1 },
  { category: 'food_dining', en: 'Bread', de: 'Brot', fr: 'Pain', es: 'Pan', it: 'Pane', pronounce: 'bread', icon: '🥖', difficulty: 1 },
  { category: 'food_dining', en: 'Cheese', de: 'Käse', fr: 'Fromage', es: 'Queso', it: 'Formaggio', pronounce: 'cheese', icon: '🧀', difficulty: 2 },
  { category: 'food_dining', en: 'Breakfast', de: 'Frühstück', fr: 'Petit-déjeuner', es: 'Desayuno', it: 'Colazione', pronounce: 'breakfast', icon: '🍳', difficulty: 3 },

  // Travel & City
  { category: 'travel_city', en: 'Airport', de: 'Flughafen', fr: 'Aéroport', es: 'Aeropuerto', it: 'Aeroporto', pronounce: 'airport', icon: '✈️', difficulty: 2 },
  { category: 'travel_city', en: 'Train', de: 'Zug', fr: 'Train', es: 'Tren', it: 'Treno', pronounce: 'train', icon: '🚆', difficulty: 1 },
  { category: 'travel_city', en: 'Bicycle', de: 'Fahrrad', fr: 'Vélo', es: 'Bicicleta', it: 'Bicicletta', pronounce: 'bicycle', icon: '🚲', difficulty: 2 },
  { category: 'travel_city', en: 'Bridge', de: 'Brücke', fr: 'Pont', es: 'Puente', it: 'Ponte', pronounce: 'bridge', icon: '🌉', difficulty: 3 },

  // Common Phrases
  { category: 'common_phrases', en: 'Thank you', de: 'Danke', fr: 'Merci', es: 'Gracias', it: 'Grazie', pronounce: 'thank you', icon: '🙏', difficulty: 1 },
  { category: 'common_phrases', en: 'Good morning', de: 'Guten Morgen', fr: 'Bonjour', es: 'Buenos días', it: 'Buongiorno', pronounce: 'good morning', icon: '🌅', difficulty: 1 },
  { category: 'common_phrases', en: 'Good night', de: 'Gute Nacht', fr: 'Bonne nuit', es: 'Buenas noches', it: 'Buonanotte', pronounce: 'good night', icon: '🌙', difficulty: 1 },
  { category: 'common_phrases', en: 'Please', de: 'Bitte', fr: "S'il vous plaît", es: 'Por favor', it: 'Per favore', pronounce: 'please', icon: '✨', difficulty: 2 },
  { category: 'common_phrases', en: 'See you soon', de: 'Bis bald', fr: 'À bientôt', es: 'Hasta pronto', it: 'A presto', pronounce: 'see you soon', icon: '👋', difficulty: 3 },
];

export interface GrammarItemDef {
  id?: string;
  topic: 'grammar_articles' | 'grammar_verbs_tenses' | 'grammar_plurals' | 'grammar_pronouns' | 'grammar_sentence_structure';
  targetLang: TargetLearnLanguage;
  grade: GradeLevel;
  difficulty: number; // 1 to 5
  qDe: string;
  qEn: string;
  subDe: string;
  subEn: string;
  correctAnswer: string;
  options: string[];
  expDe: string;
  expEn: string;
  hintDe: string;
  hintEn: string;
  icon: string;
  pronounceText?: string;
}

export const GRAMMAR_DATABASE: GrammarItemDef[] = [
  // --- ENGLISH GRAMMAR ---
  // Articles
  {
    topic: 'grammar_articles',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher unbestimmte Artikel gehört vor das Wort „apple“?',
    qEn: 'Which indefinite article belongs before the word "apple"?',
    subDe: 'Englische Grammatik: a vs. an',
    subEn: 'English Grammar: a vs. an',
    correctAnswer: 'an',
    options: ['an', 'a', 'the', 'some'],
    expDe: 'Vor Wörtern, die mit einem Vokal-Laut (a, e, i, o, u) beginnen, verwenden wir „an“: an apple.',
    expEn: 'Before words starting with a vowel sound (a, e, i, o, u), we use "an": an apple.',
    hintDe: 'Beginnt das Wort mit einem Vokal (a, e, i, o, u)?',
    hintEn: 'Does the word start with a vowel sound?',
    icon: '🍎',
    pronounceText: 'an apple',
  },
  {
    topic: 'grammar_articles',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Artikel gehört vor das Wort „book“?',
    qEn: 'Which article belongs before the word "book"?',
    subDe: 'Englische Grammatik: a vs. an',
    subEn: 'English Grammar: a vs. an',
    correctAnswer: 'a',
    options: ['a', 'an', 'at', 'in'],
    expDe: 'Vor Konsonantenlauten (b, c, d, ...) steht im Englischen „a“: a book.',
    expEn: 'Before consonant sounds, we use "a": a book.',
    hintDe: '„B“ ist ein Konsonant.',
    hintEn: '"B" is a consonant.',
    icon: '📖',
    pronounceText: 'a book',
  },
  {
    topic: 'grammar_articles',
    targetLang: 'en',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welcher Artikel gehört vor „___ hour“ (Stunde)?',
    qEn: 'Which article belongs before "___ hour"?',
    subDe: 'Englische Grammatik: Stummes H',
    subEn: 'English Grammar: Silent H',
    correctAnswer: 'an',
    options: ['an', 'a', 'the', 'one'],
    expDe: 'Bei „hour“ ist das „h“ stumm, man spricht es wie einen Vokal aus (our), daher: „an hour“.',
    expEn: 'In "hour" the "h" is silent, so it starts with a vowel sound: "an hour".',
    hintDe: 'Achte auf die Aussprache: Das h wird nicht gesprochen!',
    hintEn: 'The "h" is silent, so it begins with a vowel sound!',
    icon: '⏳',
    pronounceText: 'an hour',
  },

  // Verbs & Tenses (English)
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Setze die richtige Form von „to be“ ein: „She ___ my best friend.“',
    qEn: 'Insert the correct form of "to be": "She ___ my best friend."',
    subDe: 'Englische Grammatik: Verbformen im Präsens',
    subEn: 'English Grammar: Present tense forms',
    correctAnswer: 'is',
    options: ['is', 'are', 'am', 'be'],
    expDe: '3. Person Einzahl (He/She/It) verlangt im Präsens „is“: She is.',
    expEn: 'Third person singular (he/she/it) takes "is": She is.',
    hintDe: 'He, she, it – das „s“ muss mit!',
    hintEn: 'Remember 3rd person singular takes "is".',
    icon: '👫',
    pronounceText: 'She is my best friend.',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Setze die richtige Form ein: „They ___ playing in the garden.“',
    qEn: 'Choose the correct form: "They ___ playing in the garden."',
    subDe: 'Englische Grammatik: Present Continuous',
    subEn: 'English Grammar: Present Continuous',
    correctAnswer: 'are',
    options: ['are', 'is', 'am', 'was'],
    expDe: 'Für die Mehrzahl „they“ verwendet man „are“: They are playing.',
    expEn: 'For the plural pronoun "they", the form is "are": They are playing.',
    hintDe: 'Mehrzahl (sie / they).',
    hintEn: 'Plural subject takes "are".',
    icon: '🌳',
    pronounceText: 'They are playing in the garden.',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'en',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wie lautet die Past-Simple-Form (Vergangenheit) von „go“ (gehen)?',
    qEn: 'What is the past simple form of the irregular verb "go"?',
    subDe: 'Englische Grammatik: Unregelmäßige Verben',
    subEn: 'English Grammar: Irregular verbs',
    correctAnswer: 'went',
    options: ['went', 'goed', 'gone', 'going'],
    expDe: '„Go“ ist ein unregelmäßiges Verb: go → went → gone.',
    expEn: '"Go" is irregular: go → went → gone.',
    hintDe: 'Ein starkes/unregelmäßiges Verb, das mit „w“ beginnt.',
    hintEn: 'An irregular verb starting with "w".',
    icon: '🚶',
    pronounceText: 'went',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'en',
    grade: 'high_school',
    difficulty: 4,
    qDe: 'Wie lautet das Past Participle von „see“ (sehen)?',
    qEn: 'What is the past participle (3rd form) of "see"?',
    subDe: 'Englische Grammatik: Present Perfect Formen',
    subEn: 'English Grammar: Past Participles',
    correctAnswer: 'seen',
    options: ['seen', 'saw', 'seed', 'seeing'],
    expDe: 'Die Formen von „see“ lauten: see (Infinitive) → saw (Past Simple) → seen (Past Participle).',
    expEn: 'The forms of "see" are: see → saw → seen.',
    hintDe: 'Beispiel: I have ___ this movie before.',
    hintEn: 'Example: I have ___ that before.',
    icon: '👁️',
    pronounceText: 'seen',
  },

  // Plural Forms (English)
  {
    topic: 'grammar_plurals',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Wie lautet die Mehrzahl (Plural) von „child“ (Kind)?',
    qEn: 'What is the irregular plural form of "child"?',
    subDe: 'Englische Grammatik: Pluralbildung',
    subEn: 'English Grammar: Plural forms',
    correctAnswer: 'children',
    options: ['children', 'childs', 'childes', 'childer'],
    expDe: '„Child“ hat einen unregelmäßigen Plural: 1 child → 2 children.',
    expEn: '"Child" has an irregular plural: one child → two children.',
    hintDe: 'Endet auf „-ren“.',
    hintEn: 'Ends with "-ren".',
    icon: '👧👦',
    pronounceText: 'children',
  },
  {
    topic: 'grammar_plurals',
    targetLang: 'en',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wie lautet die Mehrzahl von „mouse“ (Maus)?',
    qEn: 'What is the plural of "mouse"?',
    subDe: 'Englische Grammatik: Unregelmäßiger Plural',
    subEn: 'English Grammar: Irregular Plurals',
    correctAnswer: 'mice',
    options: ['mice', 'mouses', 'meese', 'mices'],
    expDe: 'Der Plural von mouse ist „mice“ (eine Maus, viele Mäuse).',
    expEn: 'The plural form of mouse is "mice".',
    hintDe: 'Ändert den Vokal zu „-ice“.',
    hintEn: 'Changes vowel to "ice".',
    icon: '🐭',
    pronounceText: 'mice',
  },

  // Pronouns (English)
  {
    topic: 'grammar_pronouns',
    targetLang: 'en',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welches Pronomen ersetzt „Peter“ in: „___ is playing football.“?',
    qEn: 'Which pronoun replaces "Peter" in: "___ is playing football."?',
    subDe: 'Englische Grammatik: Personalpronomen',
    subEn: 'English Grammar: Personal Pronouns',
    correctAnswer: 'He',
    options: ['He', 'She', 'It', 'They'],
    expDe: 'Peter ist männlich (Einzahl), daher verwenden wir „He“ (Er).',
    expEn: 'Peter is male singular, so we replace it with "He".',
    hintDe: 'Männliche Einzahl (er).',
    hintEn: 'Third person male singular.',
    icon: '⚽',
    pronounceText: 'He is playing football.',
  },

  // Sentence Structure (English)
  {
    topic: 'grammar_sentence_structure',
    targetLang: 'en',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Welche Frage ist im Englischen grammatikalisch korrekt gebaut?',
    qEn: 'Which English question is grammatically correct?',
    subDe: 'Englische Grammatik: Satzbau & Fragen',
    subEn: 'English Grammar: Question Formation',
    correctAnswer: 'Where do you live?',
    options: ['Where do you live?', 'Where you live?', 'Where live you?', 'Where does you live?'],
    expDe: 'Im Englischen bildet man Fragen im Present Simple mit dem Hilfsverb „do“: Fragewort + do + Subjekt + Verb.',
    expEn: 'Questions in Present Simple follow: Question word + auxiliary do + subject + base verb.',
    hintDe: 'Benötigt das Hilfsverb „do“ vor dem Subjekt „you“.',
    hintEn: 'Requires auxiliary "do" before "you".',
    icon: '❓',
    pronounceText: 'Where do you live?',
  },

  // --- FRENCH GRAMMAR ---
  {
    topic: 'grammar_articles',
    targetLang: 'fr',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher bestimmte Artikel gehört im Französischen vor „soleil“ (männlich, Sonne)?',
    qEn: 'Which definite article belongs before "soleil" (masculine, sun)?',
    subDe: 'Französische Grammatik: Artikel le/la/les',
    subEn: 'French Grammar: Articles le/la/les',
    correctAnswer: 'le',
    options: ['le', 'la', 'les', "l'"],
    expDe: '„Soleil“ ist männlich im Französischen, daher heißt es „le soleil“.',
    expEn: '"Soleil" is masculine singular, so it uses "le": le soleil.',
    hintDe: 'Männlicher Artikel (le).',
    hintEn: 'Masculine article.',
    icon: '☀️',
    pronounceText: 'le soleil',
  },
  {
    topic: 'grammar_articles',
    targetLang: 'fr',
    grade: 'primary',
    difficulty: 2,
    qDe: 'Welcher Artikel gehört vor „pomme“ (weiblich, Apfel)?',
    qEn: 'Which article belongs before "pomme" (feminine, apple)?',
    subDe: 'Französische Grammatik: Weiblicher Artikel',
    subEn: 'French Grammar: Feminine article',
    correctAnswer: 'la',
    options: ['la', 'le', 'les', 'des'],
    expDe: '„Pomme“ ist weiblich, daher heißt es „la pomme“ (die Apfel / der Apfel).',
    expEn: '"Pomme" is feminine singular, so it uses "la": la pomme.',
    hintDe: 'Weiblicher bestimmter Artikel (la).',
    hintEn: 'Feminine definite article.',
    icon: '🍏',
    pronounceText: 'la pomme',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'fr',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wie konjugiert man das Verb „être“ (sein) für „nous“ (wir)?',
    qEn: 'How do you conjugate the verb "être" (to be) for "nous" (we)?',
    subDe: 'Französische Grammatik: Konjugation von être',
    subEn: 'French Grammar: Conjugation of être',
    correctAnswer: 'sommes',
    options: ['sommes', 'êtes', 'sont', 'suis'],
    expDe: '„Nous sommes“ bedeutet „wir sind“ (je suis, tu es, il est, nous sommes, vous êtes, ils sont).',
    expEn: '"Nous sommes" means "we are".',
    hintDe: 'Nous ...',
    hintEn: 'Je suis, tu es, il est, nous ...',
    icon: '🇫🇷',
    pronounceText: 'nous sommes',
  },

  // --- SPANISH GRAMMAR ---
  {
    topic: 'grammar_articles',
    targetLang: 'es',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Artikel gehört im Spanischen vor „casa“ (weiblich, Haus)?',
    qEn: 'Which article belongs before "casa" (feminine, house)?',
    subDe: 'Spanische Grammatik: el / la',
    subEn: 'Spanish Grammar: el / la',
    correctAnswer: 'la',
    options: ['la', 'el', 'los', 'las'],
    expDe: 'Nomen auf „-a“ sind im Spanischen meist weiblich: la casa (das Haus).',
    expEn: 'Nouns ending in -a are typically feminine: la casa.',
    hintDe: 'Weiblicher Artikel (la).',
    hintEn: 'Feminine article (la).',
    icon: '🏠',
    pronounceText: 'la casa',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'es',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wie lautet die 1. Person Einzahl (yo) des Verbs „tener“ (haben) im Spanischen?',
    qEn: 'What is the 1st person singular (yo) of "tener" (to have) in Spanish?',
    subDe: 'Spanische Grammatik: Unregelmäßige Verben',
    subEn: 'Spanish Grammar: Irregular verbs',
    correctAnswer: 'tengo',
    options: ['tengo', 'tienes', 'tiene', 'tenemos'],
    expDe: '„Yo tengo“ bedeutet „ich habe“ (yo tengo, tú tienes, él tiene).',
    expEn: '"Yo tengo" means "I have" in Spanish.',
    hintDe: 'Yo ...',
    hintEn: 'Yo teng...',
    icon: '🇪🇸',
    pronounceText: 'yo tengo',
  },

  // --- ITALIAN GRAMMAR ---
  {
    topic: 'grammar_articles',
    targetLang: 'it',
    grade: 'primary',
    difficulty: 1,
    qDe: 'Welcher Artikel steht im Italienischen vor „pizza“ (weiblich)?',
    qEn: 'Which article stands before "pizza" in Italian?',
    subDe: 'Italienische Grammatik: il / la',
    subEn: 'Italian Grammar: il / la',
    correctAnswer: 'la',
    options: ['la', 'il', 'lo', 'le'],
    expDe: 'Pizza ist weiblich (la pizza).',
    expEn: 'Pizza is feminine (la pizza).',
    hintDe: 'Weiblicher Artikel (la).',
    hintEn: 'Feminine article.',
    icon: '🍕',
    pronounceText: 'la pizza',
  },
  {
    topic: 'grammar_verbs_tenses',
    targetLang: 'it',
    grade: 'high_school',
    difficulty: 3,
    qDe: 'Wie sagt man im Italienischen „Ich bin“ (Verb essere)?',
    qEn: 'How do you say "I am" in Italian (verb essere)?',
    subDe: 'Italienische Grammatik: Verb essere',
    subEn: 'Italian Grammar: Verb essere',
    correctAnswer: 'Io sono',
    options: ['Io sono', 'Tu sei', 'Lui è', 'Noi siamo'],
    expDe: '„Io sono“ bedeutet „Ich bin“ auf Italienisch.',
    expEn: '"Io sono" translates to "I am" in Italian.',
    hintDe: 'Io s...',
    hintEn: 'Starts with s...',
    icon: '🇮🇹',
    pronounceText: 'io sono',
  },
];

// Helper: check custom & scanned questions for active kid
const findMatchingCustomQuestion = (
  subject: string,
  topic: string,
  grade: GradeLevel,
  difficulty: number,
  targetLang?: TargetLearnLanguage,
  activeKidId?: string
): CustomQuestion | null => {
  const custom = loadCustomQuestions();
  if (custom.length === 0) return null;

  const matches = custom.filter((q) => {
    // Subject matching
    if (q.subject && q.subject !== subject) return false;
    // GradeLevel matching
    if (q.gradeLevel && q.gradeLevel !== grade) return false;
    // Target language matching
    if (targetLang && q.targetLanguage && q.targetLanguage !== targetLang) return false;
    // Topic matching (unless all)
    if (topic !== 'all' && q.topic && q.topic !== topic && !q.topic.includes('scan')) return false;
    // Child assignment matching: if question is assigned to a specific kid, only give it to that kid!
    if (activeKidId && q.assignedKidId && q.assignedKidId !== 'all' && q.assignedKidId !== activeKidId) {
      return false;
    }
    return true;
  });

  // Prioritize scanned homework & schoolbook questions if available!
  const scannedMatches = matches.filter((q) => q.source === 'schoolbook_scan');
  if (scannedMatches.length > 0 && Math.random() < 0.7) {
    return scannedMatches[randInt(0, scannedMatches.length - 1)];
  }

  if (matches.length > 0 && Math.random() < 0.5) {
    return matches[randInt(0, matches.length - 1)];
  }
  return null;
};

// -------------------------------------------------------------
// EXPORTED PROBLEM GENERATORS WITH GRANULAR DIFFICULTY
// -------------------------------------------------------------

export const generateNatureProblem = (
  topic: string = 'all',
  grade: GradeLevel = 'primary',
  lang: Language = 'de',
  difficulty: number = 2
): ProblemItem => {
  // Check custom question first
  const custom = findMatchingCustomQuestion('nature', topic, grade, difficulty);
  if (custom) return custom;

  const isDe = lang === 'de';
  const pool = NATURE_BANK.filter((item) => {
    const topicMatch = topic === 'all' || item.topic === topic;
    const gradeMatch = item.grade === grade;
    const diffMatch = item.difficulty ? Math.abs(item.difficulty - difficulty) <= 1 : true;
    return topicMatch && gradeMatch && diffMatch;
  });

  const finalPool = pool.length > 0
    ? pool
    : NATURE_BANK.filter((item) => item.grade === grade || topic === 'all' || item.topic === topic);

  const selected = finalPool[randInt(0, finalPool.length - 1)] || NATURE_BANK[0];
  const id = `nat-${Date.now()}-${randInt(100, 999)}`;

  const correct = isDe ? selected.correctDe : selected.correctEn;
  const options = shuffle(isDe ? [...selected.optionsDe] : [...selected.optionsEn]);

  return {
    id,
    subject: 'nature',
    topic: selected.topic,
    gradeLevel: grade,
    difficulty: selected.difficulty || difficulty,
    question: isDe ? selected.qDe : selected.qEn,
    subtext: isDe ? selected.subDe || 'Wähle die wissenschaftlich korrekte Antwort' : selected.subEn || 'Choose the scientifically accurate answer',
    visual: selected.visual,
    options,
    correctAnswer: correct,
    explanation: isDe ? selected.expDe : selected.expEn,
    hint: isDe ? selected.hintDe : selected.hintEn,
    xp: 25 + difficulty * 5,
    coins: 12 + difficulty * 3,
  };
};

export const generateGeographyProblem = (
  topic: string = 'all',
  grade: GradeLevel = 'primary',
  lang: Language = 'de',
  difficulty: number = 2
): ProblemItem => {
  const custom = findMatchingCustomQuestion('geography', topic, grade, difficulty);
  if (custom) return custom;

  const isDe = lang === 'de';
  const pool = GEOGRAPHY_BANK.filter((item) => {
    const topicMatch = topic === 'all' || item.topic === topic;
    const gradeMatch = item.grade === grade;
    const diffMatch = item.difficulty ? Math.abs(item.difficulty - difficulty) <= 1 : true;
    return topicMatch && gradeMatch && diffMatch;
  });

  const finalPool = pool.length > 0
    ? pool
    : GEOGRAPHY_BANK.filter((item) => item.grade === grade || topic === 'all' || item.topic === topic);

  const selected = finalPool[randInt(0, finalPool.length - 1)] || GEOGRAPHY_BANK[0];
  const id = `geo-${Date.now()}-${randInt(100, 999)}`;

  const correct = isDe ? selected.correctDe : selected.correctEn;
  const options = shuffle(isDe ? [...selected.optionsDe] : [...selected.optionsEn]);

  return {
    id,
    subject: 'geography',
    topic: selected.topic,
    gradeLevel: grade,
    difficulty: selected.difficulty || difficulty,
    question: isDe ? selected.qDe : selected.qEn,
    subtext: isDe ? selected.subDe || 'Geografie & Weltwissen' : selected.subEn || 'Geography & World Knowledge',
    visual: selected.visual,
    options,
    correctAnswer: correct,
    explanation: isDe ? selected.expDe : selected.expEn,
    hint: isDe ? selected.hintDe : selected.hintEn,
    xp: 25 + difficulty * 5,
    coins: 12 + difficulty * 3,
  };
};

export const generateArtProblem = (
  topic: string = 'all',
  grade: GradeLevel = 'primary',
  lang: Language = 'de',
  difficulty: number = 2
): ProblemItem => {
  const custom = findMatchingCustomQuestion('art', topic, grade, difficulty);
  if (custom) return custom;

  const isDe = lang === 'de';
  const pool = ART_BANK.filter((item) => {
    const topicMatch = topic === 'all' || item.topic === topic;
    const gradeMatch = item.grade === grade;
    const diffMatch = item.difficulty ? Math.abs(item.difficulty - difficulty) <= 1 : true;
    return topicMatch && gradeMatch && diffMatch;
  });

  const finalPool = pool.length > 0
    ? pool
    : ART_BANK.filter((item) => item.grade === grade || topic === 'all' || item.topic === topic);

  const selected = finalPool[randInt(0, finalPool.length - 1)] || ART_BANK[0];
  const id = `art-${Date.now()}-${randInt(100, 999)}`;

  const correct = isDe ? selected.correctDe : selected.correctEn;
  const options = shuffle(isDe ? [...selected.optionsDe] : [...selected.optionsEn]);

  return {
    id,
    subject: 'art',
    topic: selected.topic,
    gradeLevel: grade,
    difficulty: selected.difficulty || difficulty,
    question: isDe ? selected.qDe : selected.qEn,
    subtext: isDe ? selected.subDe || 'Kunst, Kultur & Klangwelt' : selected.subEn || 'Art, Culture & Sound World',
    visual: selected.visual,
    options,
    correctAnswer: correct,
    explanation: isDe ? selected.expDe : selected.expEn,
    hint: isDe ? selected.hintDe : selected.hintEn,
    xp: 25 + difficulty * 5,
    coins: 12 + difficulty * 3,
  };
};

export const generateLanguageProblem = (
  targetLang: TargetLearnLanguage = 'en',
  topic: string = 'all',
  grade: GradeLevel = 'primary',
  lang: Language = 'de',
  difficulty: number = 2,
  activeKidId?: string
): ProblemItem => {
  const custom = findMatchingCustomQuestion('languages', topic, grade, difficulty, targetLang, activeKidId);
  if (custom) return custom;

  const isDe = lang === 'de';
  const flag = getLanguageFlag(targetLang);
  const targetLangName = getLanguageDisplayName(targetLang, lang);

  // Check if topic is a grammar topic or if random pick includes grammar
  const isGrammarTopic = topic.startsWith('grammar_') || (topic === 'all' && Math.random() < 0.4);

  if (isGrammarTopic) {
    const grammarPool = GRAMMAR_DATABASE.filter((g) => {
      const langMatch = g.targetLang === targetLang;
      const topicMatch = topic === 'all' || !topic.startsWith('grammar_') || g.topic === topic;
      const diffMatch = Math.abs(g.difficulty - difficulty) <= 1;
      return langMatch && topicMatch && (diffMatch || g.grade === grade);
    });

    const finalGrammarPool = grammarPool.length > 0
      ? grammarPool
      : GRAMMAR_DATABASE.filter((g) => g.targetLang === targetLang);

    if (finalGrammarPool.length > 0) {
      const selected = finalGrammarPool[randInt(0, finalGrammarPool.length - 1)];
      const id = `gram-${Date.now()}-${randInt(100, 999)}`;

      return {
        id,
        subject: 'languages',
        topic: selected.topic,
        gradeLevel: grade,
        difficulty: selected.difficulty || difficulty,
        targetLanguage: targetLang,
        question: isDe ? selected.qDe : selected.qEn,
        subtext: isDe ? `${selected.subDe} ${flag}` : `${selected.subEn} ${flag}`,
        visual: {
          type: 'audio_phrase',
          symbol: selected.icon || '📝',
          pronounceText: selected.pronounceText || selected.correctAnswer,
          pronounceLang: getLangLocale(targetLang),
          audioHint: isDe ? 'Tippe zum Anhören' : 'Tap to listen',
        },
        options: shuffle([...selected.options]),
        correctAnswer: selected.correctAnswer,
        explanation: isDe ? selected.expDe : selected.expEn,
        hint: isDe ? selected.hintDe : selected.hintEn,
        xp: 25 + difficulty * 5,
        coins: 12 + difficulty * 3,
      };
    }
  }

  // Vocab Fallback / standard
  const pool = VOCAB_DATABASE.filter((w) => {
    const topicMatch = topic === 'all' || w.category === topic;
    const diffMatch = w.difficulty ? Math.abs(w.difficulty - difficulty) <= 1 : true;
    return topicMatch && diffMatch;
  });

  const finalPool = pool.length > 0 ? pool : VOCAB_DATABASE;
  const selected = finalPool[randInt(0, finalPool.length - 1)];

  const promptWordInNative = isDe ? selected.de : selected.en;
  const targetWord = selected[targetLang] || selected.en;

  // Generate 3 distractors in target language
  const distractorCandidates = VOCAB_DATABASE.filter((w) => w !== selected).map((w) => w[targetLang] || w.en);
  const uniqueDistractors = Array.from(new Set(distractorCandidates));
  const chosenDistractors = shuffle(uniqueDistractors).slice(0, 3);
  const options = shuffle([targetWord, ...chosenDistractors]);

  const id = `lang-${Date.now()}-${randInt(100, 999)}`;

  return {
    id,
    subject: 'languages',
    topic: selected.category,
    gradeLevel: grade,
    difficulty: selected.difficulty || difficulty,
    targetLanguage: targetLang,
    question: isDe
      ? `Wie heißt „${promptWordInNative}“ auf ${targetLangName}?`
      : `What is the ${targetLangName} translation for "${promptWordInNative}"?`,
    subtext: isDe ? `Sprachen-Akademie ${flag}` : `Language Academy ${flag}`,
    visual: {
      type: 'audio_phrase',
      symbol: selected.icon,
      pronounceText: targetWord,
      pronounceLang: getLangLocale(targetLang),
      audioHint: isDe ? 'Tippe zum Anhören der Aussprache' : 'Tap to hear pronunciation',
    },
    options,
    correctAnswer: targetWord,
    explanation: isDe
      ? `„${promptWordInNative}“ heißt auf ${targetLangName} „${targetWord}“.`
      : `"${promptWordInNative}" translates to "${targetWord}" in ${targetLangName}.`,
    hint: isDe
      ? `Klicke auf den Lautsprecher, um die Aussprache des Wortes zu hören!`
      : `Click the speaker icon above to listen to the target pronunciation!`,
    xp: 25 + difficulty * 5,
    coins: 12 + difficulty * 3,
  };
};
