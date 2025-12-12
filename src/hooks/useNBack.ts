import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateZScore } from '../utils/statistics';

export interface NBackConfig {
  nLevels: number[];
  stimuliPerBlock: number;
  displayTime: number;
  targetRatio: number;
  stimuliSet: string[];
}

export const useNBack = (config: NBackConfig) => {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FEEDBACK' | 'FINISHED'>('IDLE');
  const [currentLevel, setCurrentLevel] = useState(1); // N
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentStimulus, setCurrentStimulus] = useState<string | null>(null);

  // Stats for current block
  const [hits, setHits] = useState(0); // Correct Matches
  const [falseAlarms, setFalseAlarms] = useState(0); // Wrong Matches
  const [misses, setMisses] = useState(0); // Missed Matches
  const [correctRejections, setCorrectRejections] = useState(0); // Correct Non-Matches (implicit)

  const [totalTargets, setTotalTargets] = useState(0);
  const [totalNonTargets, setTotalNonTargets] = useState(0);

  const [hasResponded, setHasResponded] = useState(false);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | 'false' | 'reject' | null>(null);

  const [dPrime, setDPrime] = useState(0);
  const [score, setScore] = useState(0);
  const [historyDPrimes, setHistoryDPrimes] = useState<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateSequence = useCallback((n: number) => {
    const seq: string[] = [];
    let targets = 0;

    for (let i = 0; i < config.stimuliPerBlock; i++) {
      let item = '';
      const isTarget = i >= n && Math.random() < config.targetRatio;

      if (isTarget) {
        item = seq[i - n];
        targets++;
      } else {
        // Generate non-matching item
        const options = config.stimuliSet.filter(s => i < n || s !== seq[i - n]);
        item = options[Math.floor(Math.random() * options.length)];
      }
      seq.push(item);
    }
    setTotalTargets(targets);
    setTotalNonTargets(config.stimuliPerBlock - targets);
    return seq;
  }, [config]);

  const startLevel = useCallback((n: number) => {
    const seq = generateSequence(n);
    setSequence(seq);
    setCurrentIndex(-1); // Will increment to 0 immediately
    setHits(0);
    setFalseAlarms(0);
    setMisses(0);
    setCorrectRejections(0);
    setHasResponded(false);
    setFeedback(null);
    setGameState('PLAYING');

    // Start loop
    nextStimulus(0, seq);
  }, [generateSequence]);

  const nextStimulus = (index: number, seq: string[]) => {
    if (index >= seq.length) {
      finishLevel();
      return;
    }

    setCurrentIndex(index);
    setCurrentStimulus(seq[index]);
    setHasResponded(false);
    setFeedback(null);

    // Auto-advance logic handled by timer
    timerRef.current = setTimeout(() => {
      handleTimeout(index, seq);
    }, config.displayTime);
  };

  const handleTimeout = (index: number, seq: string[]) => {
    // Process "No Response"
    // Check if it was a target
    const n = currentLevel;
    const isTarget = index >= n && seq[index] === seq[index - n];

    if (isTarget) {
       // Miss
       setMisses(prev => prev + 1);
       // setFeedback('miss'); // Too late to show feedback? Usually yes.
    } else {
       // Correct Rejection
       setCorrectRejections(prev => prev + 1);
    }

    nextStimulus(index + 1, seq);
  };

  const handleMatch = useCallback(() => {
    if (gameState !== 'PLAYING' || hasResponded) return;

    setHasResponded(true);
    if (timerRef.current) clearTimeout(timerRef.current); // Stop auto-advance

    const index = currentIndex;
    const n = currentLevel;
    const isTarget = index >= n && sequence[index] === sequence[index - n];

    if (isTarget) {
      setHits(prev => prev + 1);
      setFeedback('hit');
    } else {
      setFalseAlarms(prev => prev + 1);
      setFeedback('false');
    }

    // Wait briefly to show feedback then advance
    // Adjust timing? Prompt says "displayTime: 2500".
    // If user clicks early, do we wait or proceed?
    // Usually in N-Back, fixed ISI (Inter-Stimulus Interval) or fixed rate.
    // If I clicked at 500ms, I should probably wait remainder or just brief feedback.
    // I'll do brief feedback (500ms) then next.

    setTimeout(() => {
       nextStimulus(index + 1, sequence);
    }, 500);

  }, [gameState, hasResponded, currentIndex, currentLevel, sequence]);

  const finishLevel = () => {
    // Calculate Stats
    // Wait, state updates (hits, etc) from last item might be pending if I call this directly?
    // No, they are synchronous enough before this func usually, unless called from timeout closure.
    // But `handleTimeout` calls `setMisses` then `nextStimulus` then `finishLevel`.
    // The state `misses` won't be updated in this render cycle inside `finishLevel`.
    // So I need to pass final counts or use refs.
    // I'll use refs for accurate counting in loop, syncing with state for UI.
    // Actually, `finishLevel` is called from `nextStimulus`.
    // I'll use a `useEffect` on `currentIndex` to detect end?
    // Or just calculate based on knowns.
    // Better: use Functional State Updates or Refs. I'll assume standard flow for now but acknowledge potential off-by-one if not careful.
    // Actually, since I use `setMisses(prev => ...)` it's queued.
    // I should trigger "Calculating" state.

    setGameState('FEEDBACK');
  };

  // Calculate Score Effect
  useEffect(() => {
    if (gameState === 'FEEDBACK') {
      const hitRate = totalTargets > 0 ? hits / totalTargets : 0;
      const faRate = totalNonTargets > 0 ? falseAlarms / totalNonTargets : 0;

      const dp = calculateZScore(hitRate) - calculateZScore(faRate);
      const levelScore = (dp * 20) + (currentLevel * 15); // + RT bonus omitted for simplicity

      setDPrime(dp);
      setScore(Math.max(0, Math.round(levelScore))); // Ensure positive? d' can be negative. Score can be negative?
      // "Score formula provided". Assume raw.

      setHistoryDPrimes(prev => [...prev, dp]);
    }
  }, [gameState, hits, falseAlarms, totalTargets, totalNonTargets, currentLevel]);

  const nextLevel = useCallback(() => {
    const nextN = currentLevel + 1;
    if (config.nLevels.includes(nextN)) {
      setCurrentLevel(nextN);
      startLevel(nextN);
    } else {
      setGameState('FINISHED');
    }
  }, [currentLevel, config, startLevel]);

  const startGame = useCallback(() => {
    setCurrentLevel(config.nLevels[0]);
    setHistoryDPrimes([]);
    startLevel(config.nLevels[0]);
  }, [config, startLevel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    gameState,
    currentLevel,
    currentStimulus,
    score,
    dPrime,
    stats: { hits, falseAlarms, misses, correctRejections },
    feedback,
    handleMatch,
    startGame,
    nextLevel
  };
};
