import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ProblemItem, SkinTheme } from '../../types';
import { encodeOrderedTiles, encodePairs, encodeSort, ENTRY_SEPARATOR } from '../../utils/exerciseAnswers';
import { Check } from 'lucide-react';

interface Props {
  problem: ProblemItem;
  skin: SkinTheme;
  onAnswerSubmit: (answer: string) => void;
  disabled: boolean;
}

export const InteractiveExerciseRenderer: React.FC<Props> = ({ problem, skin, onAnswerSubmit, disabled }) => {
  const [currentTiles, setCurrentTiles] = useState<string[]>([]);
  
  // Re-init state when problem changes
  useEffect(() => {
    if (problem.exerciseData?.tiles) {
      setCurrentTiles(problem.exerciseData.tiles);
    }
  }, [problem]);

  const type = problem.exerciseType;
  const data = problem.exerciseData;
  if (!data || !type) return null;

  const handleSubmit = (answer: string) => {
    if (!disabled) onAnswerSubmit(answer);
  };

  const renderSubmitButton = (onClick: () => void, text = "Prüfen") => (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        style={{
          background: skin.primaryButtonGradient,
          boxShadow: `0 4px 15px ${skin.primaryButtonGlow}`,
        }}
      >
        <Check className="w-5 h-5" />
        <span>{text}</span>
      </button>
    </div>
  );

  if (type === 'sentence_builder' || type === 'letter_puzzle' || type === 'dialogue_order') {
    const separator = data.separator ?? (type === 'letter_puzzle' ? '' : ' ');
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <Reorder.Group
          axis="x"
          values={currentTiles}
          onReorder={setCurrentTiles}
          className={`flex flex-wrap justify-center gap-2 ${type === 'dialogue_order' ? 'flex-col' : ''}`}
        >
          {currentTiles.map((tile, idx) => (
            <Reorder.Item
              key={tile + idx}
              value={tile}
              className={`px-4 py-2 rounded-xl font-bold text-lg shadow-md border cursor-grab active:cursor-grabbing bg-slate-900 ${type === 'letter_puzzle' ? 'text-2xl min-w-[3rem] text-center' : ''}`}
              style={{
                borderColor: skin.cardBorder,
                color: skin.textAccent,
              }}
            >
              {tile}
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        {renderSubmitButton(() => handleSubmit(encodeOrderedTiles(currentTiles, separator)))}
      </div>
    );
  }

  if (type === 'cloze_wordbank') {
    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="text-xl sm:text-2xl font-medium text-white leading-relaxed text-center px-4">
          {data.clozeSentence?.split('___').map((part, idx, arr) => (
            <React.Fragment key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="inline-block border-b-2 mx-2 w-16 h-6 border-amber-500/50" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {data.tiles?.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(tile)}
              disabled={disabled}
              className="px-6 py-3 rounded-xl font-bold text-lg border shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: skin.modeCardBg,
                borderColor: skin.modeCardBorder,
                color: skin.textAccent,
              }}
            >
              {tile}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for other interactive types that aren't fully implemented yet
  return (
    <div className="text-center text-slate-400 font-mono text-sm">
      Interaktive Übung: Bitte aktualisieren Sie die App.
    </div>
  );
};
