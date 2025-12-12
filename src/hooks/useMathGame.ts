import { useState, useEffect, useRef, useCallback } from 'react';
import { MathGameConfig, MathQuestion, MathLevelConfig } from '../types';
import { generateMathQuestion } from '../utils/generators';

// Default config based on prompt
const DEFAULT_CONFIG: MathGameConfig = {
  totalTime: 300000, // 5 minutes
  correctBonus: 3000,
  wrongPenalty: 2000,
  speedBonusThreshold: 0.5,
  speedBonusMultiplier: 1.5,
  levels: {
    1: { ops: ['+', '-'], range: [1, 20] },
    2: { ops: ['+', '-'], range: [1, 50] },
    3: { ops: ['×', '÷'], range: [1, 12] },
    4: { ops: ['×', '÷'], range: [1, 20] },
    5: { ops: ['+', '-', '×'], range: [1, 50], terms: 3 },
    6: { ops: ['+', '-', '×', '÷'], range: [1, 50], terms: 3 },
    7: { ops: 'all', range: [1, 100], parentheses: true },
    8: { ops: 'all', range: [1, 100], parentheses: true },
    9: { type: 'percentage', range: [1, 100] },
    10: { type: 'mixed', range: [1, 100], includes: ['fraction', 'percentage'] }
  }
};

export const useMathGame = (customConfig?: Partial<MathGameConfig>) => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.totalTime);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [streak, setStreak] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0); // Correct answers in current level

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Timer Logic
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            endGame();
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const startGame = useCallback(() => {
    setGameState('PLAYING');
    setScore(0);
    setTimeLeft(config.totalTime);
    setCurrentLevel(1);
    setStreak(0);
    setLevelProgress(0);
    nextQuestion(1);
  }, [config.totalTime]);

  const nextQuestion = (level: number) => {
    const q = generateMathQuestion(level, config.levels[level] || config.levels[10]);
    setQuestion(q);
    setUserInput('');
    setFeedback('none');
    questionStartTimeRef.current = performance.now();
  };

  const handleInput = (val: string) => {
    if (gameState !== 'PLAYING') return;
    setUserInput(val);
  };

  const submitAnswer = () => {
    if (!question || gameState !== 'PLAYING' || !userInput) return;

    const userAnswer = parseFloat(userInput);
    const isCorrect = Math.abs(userAnswer - question.answer) < 0.01; // Allow small float error

    const now = performance.now();
    const timeTaken = now - questionStartTimeRef.current;

    // Scoring
    if (isCorrect) {
      // Base Score
      // Prompt: baseScore = levelPoints[level] (implied increasing)
      const baseScore = currentLevel * 10;

      // Speed Bonus
      // Prompt: speedMultiplier = responseTime < (maxTime * 0.5) ? 1.5 : 1
      // What is maxTime per question? Prompt doesn't define per-question limit, only total limit.
      // But maybe there is an implicit expected time?
      // Or maybe "maxTime" refers to some baseline.
      // Let's assume 5 seconds is a baseline "maxTime" for bonus?
      // Or maybe prompt meant "totalTime"? No, that's 5 minutes.
      // A10+a says "60s per question". A10 says "5 min total".
      // Let's use an arbitrary threshold: e.g. 5000ms.
      // Actually prompt says: "speedBonusThreshold: 0.5; // 50% time = bonus".
      // This implies there is a time limit per question OR it refers to the 5min total (which makes no sense).
      // Let's assume a standard 10s per question "expected" time for calculation purposes.
      const expectedTime = 10000;
      const speedMult = timeTaken < (expectedTime * config.speedBonusThreshold) ? config.speedBonusMultiplier : 1;

      // Combo Multiplier
      // Prompt: 1 + (streak * 0.1)
      const comboMult = 1 + (streak * 0.1);

      const points = Math.round(baseScore * speedMult * comboMult);
      setScore(s => s + points);

      // Time Bonus
      setTimeLeft(t => Math.min(t + config.correctBonus, config.totalTime)); // Cap at max? Or allow overflow? Usually cap at initial.

      setFeedback('correct');
      setStreak(s => s + 1);

      // Level Progression
      // Logic: 5 correct to level up?
      const newProgress = levelProgress + 1;
      if (newProgress >= 5 && currentLevel < 10) {
          setCurrentLevel(l => l + 1);
          setLevelProgress(0);
          setTimeout(() => nextQuestion(currentLevel + 1), 500);
      } else {
          setLevelProgress(newProgress);
          setTimeout(() => nextQuestion(currentLevel), 500);
      }

    } else {
      setFeedback('wrong');
      setStreak(0);
      setTimeLeft(t => Math.max(0, t - config.wrongPenalty));

      // Don't change level on error immediately? Or drop level?
      // Usually stay on level.
      setTimeout(() => nextQuestion(currentLevel), 800);
    }
  };

  const endGame = () => {
    setGameState('GAMEOVER');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return {
    gameState,
    score,
    timeLeft,
    currentLevel,
    question,
    userInput,
    feedback,
    streak,
    startGame,
    handleInput,
    submitAnswer
  };
};
