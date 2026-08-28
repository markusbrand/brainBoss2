import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'celebrating' | 'cheering' | 'hinting';

interface MascotBotProps {
  mood?: MascotMood;
  speechText?: string;
  className?: string;
  onMascotClick?: () => void;
}

export const MascotBot: React.FC<MascotBotProps> = ({
  mood = 'idle',
  speechText,
  className = '',
  onMascotClick,
}) => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  const getSpeechDefault = () => {
    switch (mood) {
      case 'happy':
        return isGerman ? 'Toll gemacht! Das ist richtig! ⭐' : 'Awesome job! You got it right! ⭐';
      case 'celebrating':
        return isGerman
          ? 'WOOHOO!! Du bist ein unaufhaltbarer Mathe-Boss! 🎉'
          : 'WOOHOO!! You are an unstoppable Math Boss! 🎉';
      case 'thinking':
        return isGerman ? 'Lass dir Zeit! Suche nach Mustern... 💡' : 'Take your time! Look for patterns... 💡';
      case 'cheering':
        return isGerman ? 'Halte deine Trefferserie am Laufen! 🔥' : 'Keep that combo streak going! 🔥';
      case 'hinting':
        return isGerman ? 'Tipp: Zerlege die Aufgabe Schritt für Schritt!' : 'Here is a hint: Break it down step by step!';
      case 'idle':
      default:
        return isGerman ? 'Bereit für deine nächste Mathe-Quest? Los geht\'s!' : 'Ready for your next math quest? Let’s roll!';
    }
  };

  const message = speechText || getSpeechDefault();

  return (
    <div className={`flex items-center gap-3 relative ${className}`}>
      {/* Animated SVG Robot / Brain Mascot */}
      <motion.div
        onClick={onMascotClick}
        className="cursor-pointer select-none"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={
          mood === 'celebrating'
            ? { y: [0, -12, 0, -8, 0], rotate: [0, -6, 6, -3, 0] }
            : mood === 'thinking'
            ? { rotate: [0, 5, -5, 0] }
            : { y: [0, -4, 0] }
        }
        transition={{
          repeat: mood === 'idle' ? Infinity : 0,
          duration: mood === 'idle' ? 3 : 0.6,
          ease: 'easeInOut',
        }}
      >
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 rounded-full bg-linear-to-tr from-indigo-400/30 via-purple-400/30 to-pink-400/30 blur-sm animate-pulse" />

          {/* SVG Character */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Mascot Head Outer */}
            <defs>
              <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="earGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Floating Antenna / Crown */}
            <path
              d="M 38 18 L 50 8 L 62 18 L 56 22 L 44 22 Z"
              fill="url(#crownGrad)"
              stroke="#d97706"
              strokeWidth="2"
            />
            <circle cx="50" cy="8" r="3" fill="#fef08a" />

            {/* Head Shape */}
            <rect
              x="18"
              y="22"
              width="64"
              height="58"
              rx="24"
              fill="url(#headGrad)"
              stroke="#3730a3"
              strokeWidth="2.5"
            />

            {/* Cute Ear Bolts */}
            <circle cx="15" cy="50" r="5" fill="url(#earGrad)" stroke="#9f1239" strokeWidth="1.5" />
            <circle cx="85" cy="50" r="5" fill="url(#earGrad)" stroke="#9f1239" strokeWidth="1.5" />

            {/* Screen Visor Face */}
            <rect
              x="26"
              y="32"
              width="48"
              height="38"
              rx="14"
              fill="#0f172a"
              stroke="#1e1b4b"
              strokeWidth="1.5"
            />

            {/* Glowing Eyes */}
            {mood === 'celebrating' || mood === 'happy' ? (
              // Star/Happy arc eyes
              <g>
                <path
                  d="M 34 50 Q 40 42 46 50"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 54 50 Q 60 42 66 50"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ) : mood === 'thinking' ? (
              // One curious eye, one blink
              <g>
                <circle cx="40" cy="48" r="4.5" fill="#38bdf8" />
                <path
                  d="M 55 49 L 65 49"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              // Normal friendly glowing circles
              <g>
                <circle cx="40" cy="48" r="4.5" fill="#38bdf8" />
                <circle cx="42" cy="46" r="1.5" fill="#ffffff" />
                <circle cx="60" cy="48" r="4.5" fill="#38bdf8" />
                <circle cx="62" cy="46" r="1.5" fill="#ffffff" />
              </g>
            )}

            {/* Cheeks */}
            <circle cx="31" cy="58" r="3" fill="#f43f5e" opacity="0.8" />
            <circle cx="69" cy="58" r="3" fill="#f43f5e" opacity="0.8" />

            {/* Cheerful Smile */}
            <path
              d={
                mood === 'celebrating'
                  ? 'M 44 58 Q 50 66 56 58'
                  : mood === 'thinking'
                  ? 'M 46 60 Q 50 62 54 60'
                  : 'M 45 58 Q 50 63 55 58'
              }
              stroke="#fb7185"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill={mood === 'celebrating' ? '#e11d48' : 'none'}
            />
          </svg>

          {/* Particle Accents */}
          {mood === 'celebrating' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.3, 0], opacity: [1, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -top-2 -right-1"
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300" />
            </motion.div>
          )}
          {mood === 'happy' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.2, 0], opacity: [1, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute -top-1 -right-1"
            >
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Comic Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative bg-slate-900/95 text-slate-200 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold max-w-xs sm:max-w-md font-mono"
        >
          {/* Arrow */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-blue-500/40" />
          <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-slate-900" />
          <span>{message}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
