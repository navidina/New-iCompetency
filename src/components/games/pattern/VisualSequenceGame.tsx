import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toPersianNum } from '../../../utils';
import { ScoreExplanation, toTScoreWithExplanation } from '../../../utils/scoring';
import { ScoreExplanationCard } from '../../common/ScoreExplanationCard';
import { Star, Square, Circle, Triangle, Hexagon } from 'lucide-react';
import { sfx } from '../../../../services/audioService';

// Shapes mapping
const SHAPES: Record<string, React.ElementType> = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  star: Star
};

const generateSequence = (level: number) => {
  const keys = Object.keys(SHAPES);
  const colors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500', 'text-orange-500'];

  let sequence = [];
  let correct = null;

  // Difficulty Logic
  if (level <= 3) {
      // Level 1-3: Simple Color Rotation (Fixed Shape)
      const baseShape = keys[Math.floor(Math.random() * keys.length)];
      const startColorIdx = Math.floor(Math.random() * colors.length);
      const step = 1;

      for (let i = 0; i < 4; i++) {
        sequence.push({
          shape: baseShape,
          color: colors[(startColorIdx + i * step) % colors.length]
        });
      }
      correct = {
          shape: baseShape,
          color: colors[(startColorIdx + 4 * step) % colors.length]
      };
  } else if (level <= 6) {
      // Level 4-6: Simple Shape Rotation (Fixed Color)
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      const startShapeIdx = Math.floor(Math.random() * keys.length);
      const step = 1;

      for (let i = 0; i < 4; i++) {
        sequence.push({
          shape: keys[(startShapeIdx + i * step) % keys.length],
          color: baseColor
        });
      }
      correct = {
          shape: keys[(startShapeIdx + 4 * step) % keys.length],
          color: baseColor
      };
  } else {
      // Level 7+: Coupled Rotation (Shape AND Color change)
      const startShapeIdx = Math.floor(Math.random() * keys.length);
      const startColorIdx = Math.floor(Math.random() * colors.length);

      for (let i = 0; i < 4; i++) {
        sequence.push({
          shape: keys[(startShapeIdx + i) % keys.length],
          color: colors[(startColorIdx + i) % colors.length]
        });
      }
      correct = {
          shape: keys[(startShapeIdx + 4) % keys.length],
          color: colors[(startColorIdx + 4) % colors.length]
      };
  }

  const options = [correct];
  // Wrong options
  while(options.length < 4) {
      const rndColor = colors[Math.floor(Math.random() * colors.length)];
      const rndShape = keys[Math.floor(Math.random() * keys.length)];

      // Ensure unique options
      const isDuplicate = options.some(o => o.shape === rndShape && o.color === rndColor);
      if (!isDuplicate) {
          options.push({ shape: rndShape, color: rndColor });
      }
  }

  return { sequence, correct, options: options.sort(() => Math.random() - 0.5) };
};

export const VisualSequenceGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(generateSequence(1));
  const [gameOver, setGameOver] = useState(false);
  const [explanation, setExplanation] = useState<ScoreExplanation | null>(null);

  const handleAnswer = (opt: any) => {
    if (opt.shape === question.correct.shape && opt.color === question.correct.color) {
      sfx.playSuccess();
      const nextLevel = level + 1;
      setScore(s => s + 15 + (level * 2)); // Bonus for higher levels
      setLevel(nextLevel);
      setQuestion(generateSequence(nextLevel));
      if (nextLevel > 15) handleGameOver(); // Cap at level 15
    } else {
      sfx.playError();
      handleGameOver();
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    if (score > 0) sfx.playWin();
    const result = toTScoreWithExplanation(score, 100, 30, 'Sequence Score');
    setExplanation(result.explanation);
  };

  if (gameOver && explanation) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">پایان دنباله</h2>
          <div className="w-full max-w-md mb-8">
              <ScoreExplanationCard explanation={explanation} />
          </div>
          <button
             onClick={() => onComplete(explanation.finalScore)}
             className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold"
          >
            ادامه
          </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4">
      <div className="mb-8 text-lg font-bold">سطح: {toPersianNum(level)}</div>

      <div className="flex items-center gap-4 mb-12">
        {question.sequence.map((item, idx) => {
           const Icon = SHAPES[item.shape];
           return (
             <motion.div
               key={idx}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.1 }}
               className={`p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700`}
             >
               <Icon size={40} className={item.color} />
             </motion.div>
           );
        })}
        <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center font-bold text-2xl text-slate-400">
          ?
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {question.options.map((opt, idx) => {
           const Icon = SHAPES[opt.shape];
           return (
             <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-center transition-all active:scale-95"
             >
                <Icon size={40} className={opt.color} />
             </button>
           )
        })}
      </div>
    </div>
  );
};
