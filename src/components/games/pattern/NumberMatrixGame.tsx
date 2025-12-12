import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../../../../components/GameShell';
import { toPersianNum } from '../../../utils';
import { ScoreExplanation, toTScoreWithExplanation } from '../../../utils/scoring';
import { ScoreExplanationCard } from '../../common/ScoreExplanationCard';

const generateMatrix = (level: number) => {
  const grid = [];
  let missingRow = Math.floor(Math.random() * 3);
  let missingCol = Math.floor(Math.random() * 3);
  let correct = 0;

  let type = 'linear_simple';
  if (level <= 2) type = 'linear_simple';
  else if (level <= 5) type = 'linear_complex';
  else if (level <= 7) type = 'multiplicative';
  else type = 'power'; // or fibonacci

  const start = Math.floor(Math.random() * 5) + 1;
  const x = Math.floor(Math.random() * 3) + 1; // 1 to 3
  const y = Math.floor(Math.random() * 3) + 1; // 1 to 3

  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      let val = 0;

      if (type === 'linear_simple') {
          // just addition: start + r + c
          val = start + r + c;
      } else if (type === 'linear_complex') {
          // start + r*x + c*y
          val = start + (r * x) + (c * y);
      } else if (type === 'multiplicative') {
          // start * (r+1) * (c+1)
          val = start * (r + 1) * (c + 1);
      } else {
          // Power: 2^(r+c) + start
          val = Math.pow(2, r + c) + start;
      }

      if (r === missingRow && c === missingCol) {
        correct = val;
        row.push(null);
      } else {
        row.push(val);
      }
    }
    grid.push(row);
  }

  // Generate options
  const options = [correct];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5; // -5 to +4
    const opt = correct + offset;
    // avoid duplicates and negatives (though negatives might be valid in complex math, keep simple for now)
    if (opt > 0 && !options.includes(opt)) options.push(opt);
    else if (opt <= 0 && !options.includes(opt + 10)) options.push(opt + 10);
  }

  return { grid, correct, options: options.sort(() => Math.random() - 0.5) };
};

export const NumberMatrixGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(generateMatrix(1));
  const [timeLeft, setTimeLeft] = useState(60000); // 60s
  const [gameOver, setGameOver] = useState(false);
  const [explanation, setExplanation] = useState<ScoreExplanation | null>(null);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setInterval(() => setTimeLeft(t => t - 100), 100);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0) {
      handleGameOver();
    }
  }, [timeLeft, gameOver]);

  const handleAnswer = (val: number) => {
    if (val === question.correct) {
      const nextLevel = level + 1;
      setScore(s => s + 10 + (timeLeft > 30000 ? 5 : 0) + (level * 2));
      setLevel(nextLevel);
      setQuestion(generateMatrix(nextLevel));
      setTimeLeft(60000);
    } else {
      handleGameOver();
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    const result = toTScoreWithExplanation(score, 50, 15, 'Pattern Score');
    setExplanation(result.explanation);
  };

  if (gameOver && explanation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">پایان بازی</h2>
        <div className="text-xl mb-8 text-slate-600 dark:text-slate-300">
            امتیاز خام: {toPersianNum(score)}
        </div>

        <div className="w-full max-w-md mb-8">
            <ScoreExplanationCard explanation={explanation} />
        </div>

        <button
           onClick={() => onComplete(explanation.finalScore)}
           className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between w-full mb-8 text-lg font-bold text-slate-600 dark:text-slate-300">
        <span>سطح: {toPersianNum(level)}</span>
        <span>زمان: {toPersianNum(Math.ceil(timeLeft / 1000))}</span>
        <span>امتیاز: {toPersianNum(score)}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {question.grid.map((row, rIdx) => (
          row.map((cell, cIdx) => (
            <motion.div
              key={`${rIdx}-${cIdx}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-2xl md:text-3xl font-bold rounded-xl shadow-sm
                ${cell === null
                  ? 'bg-slate-200 dark:bg-slate-700 animate-pulse border-2 border-dashed border-indigo-400'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white'
                }`}
            >
              {cell !== null ? toPersianNum(cell) : '?'}
            </motion.div>
          ))
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 w-full">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(opt)}
            className="p-4 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xl transition-all active:scale-95 shadow-sm border border-indigo-100 dark:border-slate-600"
          >
            {toPersianNum(opt)}
          </button>
        ))}
      </div>
    </div>
  );
};
