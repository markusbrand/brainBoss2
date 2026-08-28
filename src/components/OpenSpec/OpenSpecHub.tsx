import React, { useState } from 'react';
import { FileCode, Copy, Check, Sparkles, Send, BookOpen, Terminal } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

export const OpenSpecHub: React.FC = () => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  const prebuiltSpecs = [
    {
      id: 'spec-math-engine',
      title: isGerman
        ? 'spec-01: Prozedurale Mathe-Engine & Gamification für Kinder'
        : 'spec-01: Procedural Kid Math Game Engine & Gamification',
      category: isGerman ? 'Spielmechanik & Kern-Engine' : 'Core Game Mechanics',
      summary: isGerman
        ? 'Spezifikation für adaptive Mathe-Generierung für Grundschule und Oberstufe.'
        : 'Complete spec for adaptive procedural math generation across Primary and High School levels.',
      content: isGerman
        ? `# OpenSpec: Prozedurale Mathe-Engine & Gamification-System
version: 1.0.0
target_module: /src/utils/mathEngine.ts, /src/components/MathGame/*

## 1. Kontext & Zusammenfassung
BrainBoss wird zu einer umfassenden Mathe-Lern-Quest für Grundschule und Oberstufe ausgebaut.
Ziel ist es, trockene Übungen durch prozedurale Aufgabengenerierung, visuelle Darstellungen (Bruch-Pizzen, Block-Einheiten, Waagen) und einen Arcade-Belohnungskreislauf mit Serien-Multiplikatoren, Herzen und Bosskämpfen zu ersetzen.

## 2. Zielgruppen & Bildungsstufen
- Stufe A: Grundschule (Alter 6-11)
  - Operationen: Addition, Subtraktion, Einmaleins (2-12), Division.
  - Formate: Lückentext-Algebra (z. B. 8 + ? = 15), visuelle Brüche (Pizza-Stücke), Block-Waagen (<, >, =), Zahlenfolgen.
- Stufe B: Oberstufe (Alter 12-18)
  - Operationen: Lineare Gleichungen (z. B. 3x - 7 = 14), Punkt-vor-Strich (PEMDAS), Potenzen & Wurzeln (√x), Prozentrechnung, Quadratische Gleichungen.

## 3. Akzeptanzkriterien
- [x] Generator liefert 4 eindeutige Optionen mit garantiert genau 1 korrekten Antwort.
- [x] Falsche Distraktoren sind mathematisch plausibel (häufige Rechenfehler).
- [x] Serien-Multiplikatoren skalieren von 1.0x bis 3.0x mit Schild-Schutz.
`
        : `# OpenSpec: Procedural Math Engine & Gamification System
version: 1.0.0
target_module: /src/utils/mathEngine.ts, /src/components/MathGame/*

## 1. Context & Executive Summary
BrainBoss is expanding into a comprehensive kid-friendly and high-school math learning quest.
The goal is to replace dry drills with procedural math generation, visual representations (fraction pies, visual block units, balance scales), and an arcade reward loop with combo streaks, hearts, and boss battles.

## 2. Target Audience & Educational Grade Tiers
- Tier A: Primary School (Ages 6-11)
  - Operations: Addition, Subtraction, Multiplication Tables (2-12), Division.
  - Formats: Missing number algebra (e.g. 8 + ? = 15), visual fractions (pizza slices / pie charts), block balances (<, >, =), and skip counting patterns.
- Tier B: High School (Ages 12-18)
  - Operations: Linear equations (e.g. 3x - 7 = 14), Order of Operations (PEMDAS), Exponents & Roots (√x), Percentages & Discounts, Quadratic factoring, and rapid mental estimation duels.

## 3. Acceptance Criteria
- [x] Generator yields 4 unique options with guaranteed 1 exact correct answer.
- [x] Incorrect distractors are mathematically plausible (common arithmetic pitfalls).
- [x] Streak multipliers scale from 1.0x to 3.0x with shield safeguards.
`,
    },
    {
      id: 'spec-brand-mascot',
      title: isGerman
        ? 'spec-02: Visuelle Identität, Roboter-Maskottchen & Design-System'
        : 'spec-02: Visual Identity, Mascot Robot, and Design System',
      category: isGerman ? 'Marke & UI/UX Design' : 'Brand & UI/UX Design',
      summary: isGerman
        ? 'Spezifikation für das BrainBoss-Maskottchen "Brainy Bot", animierte Emotionen und Design-Token.'
        : 'Spec for the BrainBoss mascot "Brainy Bot", animated emotions, and design tokens.',
      content: isGerman
        ? `# OpenSpec: Visuelle Identität, Maskottchen & Asset-Richtlinien
version: 1.0.0
target_module: /src/components/MascotBot.tsx, /src/components/VisualAssets/*

## 1. Markenidentität
- Markenname: BrainBoss
- Maskottchen: Brainy (Der holografische Mathe-Mentor-Roboter)
- Wesen: Freundlich, energiegeladen, ermutigend, modern und mathematisch präzise.

## 2. Maskottchen-Emotionszustände
1. Idle: Sanftes Schweben (translateY: -4px bis 4px, 2.5s Schleife), funkelnde Antenne.
2. Happy: Fröhliches Visier, lächelnder Mund, kleiner Sprung bei richtigen Antworten.
3. Thinking: Nachdenkliche Pose / rotierendes Visier bei Fehlern oder Denkpausen.
4. Celebrating: Konfetti-Explosion, Krone, energetischer Jubel bei Serien und Siegen.
`
        : `# OpenSpec: Visual Identity, Mascot & Asset Guidelines
version: 1.0.0
target_module: /src/components/MascotBot.tsx, /src/components/VisualAssets/*

## 1. Brand Identity Overview
- Brand Name: BrainBoss
- Mascot: Brainy (The Holographic Math Mentor Bot)
- Brand Essence: Friendly, energetic, encouraging, modern, and mathematically crisp.

## 2. Mascot Emotion States & Visual Triggers
1. Idle: Gentle floating sine-wave hover (translateY: -4px to 4px, 2.5s loop), sparkling antenna light.
2. Happy: Big joyful curved eye visor, smiling mouth, subtle upward hop on correct answers.
3. Thinking: Rotating magnifying visor / thoughtful tilted posture when player ponders or gets a question wrong.
4. Celebrating: Fireworks particle burst, victory crown, energetic celebration on streaks and boss wins.
`,
    },
    {
      id: 'spec-ai-quest',
      title: isGerman
        ? 'spec-03: Gemini KI Mathe-Geschichten Generator'
        : 'spec-03: Gemini AI Story Quest Generator',
      category: isGerman ? 'KI & Backend-Integration' : 'AI & Backend Integration',
      summary: isGerman
        ? 'Spezifikation für dynamische LLM-gestützte Mathe-Quests (Weltraum, Drachen, Cyberpunk, Dino).'
        : 'Spec for dynamic LLM story-driven math quests across Space, Dragon, Cyberpunk, and Dino realms.',
      content: isGerman
        ? `# OpenSpec: Gemini Story-Quest Generator
version: 1.0.0
target_module: /server.ts, /src/components/MathGame/AiStoryQuestScreen.tsx

## 1. Übersicht
Nutzt Google Gemini über Express-Server-Endpunkte zur dynamischen Generierung von 3-teiligen Mathe-Abenteuern.

## 2. Server-API-Spezifikation
- Endpunkt: POST /api/gemini/generate-quest
- Request Body:
  {
    "gradeLevel": "primary" | "high_school",
    "theme": "space" | "dragon" | "dino" | "cyber" | "ocean" | "wizard",
    "difficulty": 1..5,
    "language": "de" | "en"
  }
`
        : `# OpenSpec: Gemini Story Quest Generator
version: 1.0.0
target_module: /server.ts, /src/components/MathGame/AiStoryQuestScreen.tsx

## 1. Overview
Leverages Google Gemini via server-side Express routes to generate dynamic 3-chapter math adventures where every problem is embedded in a rich narrative world.

## 2. Server API Specification
- Endpoint: POST /api/gemini/generate-quest
- Request Body:
  {
    "gradeLevel": "primary" | "high_school",
    "theme": "space" | "dragon" | "dino" | "cyber" | "ocean" | "wizard",
    "difficulty": 1..5,
    "language": "de" | "en"
  }
`,
    },
  ];

  const [selectedSpecIndex, setSelectedSpecIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // AI Prompt Spec Generator state
  const [customFeaturePrompt, setCustomFeaturePrompt] = useState('');
  const [generatedSpec, setGeneratedSpec] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedSpec = prebuiltSpecs[selectedSpecIndex] || prebuiltSpecs[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    soundFx.playPop();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAiSpec = async () => {
    if (!customFeaturePrompt.trim()) return;
    setIsGenerating(true);
    soundFx.playPop();

    try {
      const res = await fetch('/api/gemini/generate-openspec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: customFeaturePrompt,
          userDescription: customFeaturePrompt,
          category: 'math-gameplay',
          language,
        }),
      });
      const data = await res.json();
      if (data.spec) {
        setGeneratedSpec(typeof data.spec === 'string' ? data.spec : JSON.stringify(data.spec, null, 2));
      } else {
        throw new Error('Failed');
      }
    } catch {
      setGeneratedSpec(`# OpenSpec: ${customFeaturePrompt}
version: 1.0.0
target_module: /src/components/NewFeature.tsx

## 1. ${isGerman ? 'Übersicht' : 'Overview'}
${isGerman ? 'Implementierungsvorschlag für' : 'Implementation proposal for'}: ${customFeaturePrompt}

## 2. ${isGerman ? 'Anforderungen' : 'Requirements'}
- ${isGerman ? 'Responsives Layout, Barrierefreiheit und Sound-Feedback.' : 'Responsive layout, accessible contrast, and Web Audio sound feedback.'}
- ${isGerman ? 'Klare Zustandsübergänge und Belohnungsmeilensteine.' : 'Clear state machines and kid-friendly gamification milestones.'}

## 3. ${isGerman ? 'Akzeptanzkriterien' : 'Acceptance Criteria'}
- [ ] ${isGerman ? 'Haupt-Spielloop verifiziert' : 'Core game loop verified'}
- [ ] ${isGerman ? 'Konfetti-Belohnungen bei Meilensteinen' : 'Confetti rewards triggered on milestone achievements'}
`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 text-white shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-pink-500 to-transparent" />
        <div className="flex items-center gap-2 text-pink-400 text-xs font-mono font-bold uppercase tracking-wider">
          <FileCode className="w-4 h-4" />
          <span>OpenSpec Architecture Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {isGerman ? 'Feature-Spezifikationen, Prompts & Tokens' : 'Feature Specs, Prompts & Design Tokens'}
        </h1>
        <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-2xl leading-relaxed">
          {isGerman
            ? 'Standardisierte OpenSpec-Spezifikationen für BrainBoss Mathe-Engines, Maskottchen, Belohnungssysteme und KI-Workflows. Direkt einsatzbereit für die Weiterentwicklung.'
            : 'Standardized OpenSpec specifications for BrainBoss math engines, mascot visual identities, reward systems, and AI workflows. Use these specs directly in your development workflow or generate custom specs with Gemini.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spec List Selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{isGerman ? 'Kuratierte OpenSpecs' : 'Curated OpenSpecs'}</span>
          </h2>

          <div className="space-y-2">
            {prebuiltSpecs.map((spec, idx) => {
              const isSelected = selectedSpecIndex === idx && !generatedSpec;
              return (
                <div
                  key={spec.id}
                  onClick={() => {
                    soundFx.playPop();
                    setSelectedSpecIndex(idx);
                    setGeneratedSpec(null);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-cyan-400 mb-1">
                    <span>{spec.category}</span>
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    {spec.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                    {spec.summary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* AI OpenSpec Generator Box */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{isGerman ? 'Individuelle OpenSpec mit KI' : 'Synthesize Custom OpenSpec'}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isGerman
                ? 'Beschreibe eine gewünschte Funktion (z. B. "Multiplayer Mathe-Duell mit 1v1 Kampfuhren"):'
                : 'Describe a feature you want to add (e.g. "Multiplayer math duel with 1v1 battle timers"): '}
            </p>
            <textarea
              rows={3}
              value={customFeaturePrompt}
              onChange={(e) => setCustomFeaturePrompt(e.target.value)}
              placeholder={isGerman ? 'z. B. Multiplayer Mathe-Duell mit Power-Ups und Avataren...' : 'e.g. Multiplayer Math Duel with power-ups and animated avatars...'}
              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono resize-none"
            />
            <button
              disabled={isGenerating || !customFeaturePrompt.trim()}
              onClick={handleGenerateAiSpec}
              className="w-full py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? (
                <span className="font-mono">{isGerman ? 'Generiere mit Gemini...' : 'Synthesizing with Gemini...'}</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isGerman ? 'OpenSpec-Entwurf generieren' : 'Draft Feature Spec (OpenSpec)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spec Viewer Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                {generatedSpec ? (isGerman ? '✨ KI-Generierte Vorschau' : '✨ AI-Generated Spec Preview') : selectedSpec.title}
              </span>
            </div>

            <button
              onClick={() => handleCopy(generatedSpec || selectedSpec.content)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono font-bold text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{isGerman ? 'Kopiert!' : 'Copied to Clipboard!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isGerman ? 'OpenSpec kopieren' : 'Copy OpenSpec'}</span>
                </>
              )}
            </button>
          </div>

          {/* Markdown / Code container */}
          <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 sm:p-6 font-mono text-xs leading-relaxed shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-x-auto max-h-[620px] scrollbar-thin border border-slate-800">
            <pre className="whitespace-pre-wrap font-mono text-cyan-100">
              {generatedSpec || selectedSpec.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
