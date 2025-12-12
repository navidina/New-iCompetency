import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'iCompetency_DelayedRecall';

export interface DelayedRecallConfig {
  wordList: string[];
  learningTrials: number;
  delayMinutes: number;
  recallTime: number; // ms
}

interface RecallState {
  phase: 'INTRO' | 'LEARNING' | 'DELAY_WAIT' | 'DELAY_RECALL' | 'FINISHED';
  subPhase: 'DISPLAY' | 'RECALL' | 'READY'; // Added READY to show "Start Trial X"
  trial: number; // 1 to 5
  delayStartTime: number | null;
  scores: number[]; // Scores for each learning trial
  delayedScore: number | null;
}

const DEFAULT_STATE: RecallState = {
  phase: 'INTRO',
  subPhase: 'READY',
  trial: 1,
  delayStartTime: null,
  scores: [],
  delayedScore: null
};

export const useDelayedRecall = (config: DelayedRecallConfig) => {
  const [state, setState] = useState<RecallState>(DEFAULT_STATE);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  // isDisplaying is derived from state or managed locally?
  // If we rely on state.subPhase, we can derive it.
  // But display logic needs interval.
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to load delayed recall state", e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startLearning = useCallback(() => {
    // Start display for current trial
    setState(prev => ({ ...prev, subPhase: 'DISPLAY', phase: prev.phase === 'INTRO' ? 'LEARNING' : prev.phase }));
    setIsDisplaying(true);
    setCurrentWordIndex(0);
    displayWords();
  }, [config]);

  const displayWords = () => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= config.wordList.length) {
        clearInterval(interval);
        setIsDisplaying(false);
        setCurrentWordIndex(-1);
        setState(prev => ({ ...prev, subPhase: 'RECALL' }));
        setTimeLeft(config.recallTime);
        return;
      }
      setCurrentWordIndex(i);
      i++;
    }, 1500);
  };

  const submitRecall = (words: string[]) => {
    // Calculate match count
    // Simple exact match or fuzzy? Persian might need normalization.
    // Assume exact for now or normalized.
    const correctCount = words.filter(w => config.wordList.includes(w.trim())).length;
    // Actually, unique correct words.
    const uniqueWords = new Set(words.map(w => w.trim()));
    const score = Array.from(uniqueWords).filter(w => config.wordList.includes(w)).length;

    if (state.phase === 'INTRO' || state.phase === 'LEARNING') {
       const newScores = [...state.scores, score];
       if (state.trial < config.learningTrials) {
         // Next trial
         setState(prev => ({
           ...prev,
           phase: 'LEARNING',
           subPhase: 'READY', // Reset to ready for next display
           trial: prev.trial + 1,
           scores: newScores
         }));
       } else {
         // Finished learning, start delay
         setState(prev => ({
           ...prev,
           phase: 'DELAY_WAIT',
           subPhase: 'READY',
           trial: prev.trial,
           scores: newScores,
           delayStartTime: Date.now()
         }));
       }
    } else if (state.phase === 'DELAY_RECALL') {
       setState(prev => ({
         ...prev,
         phase: 'FINISHED',
         delayedScore: score
       }));
    }
  };

  const startDelayedRecall = () => {
     if (canStartDelayed()) {
       setState(prev => ({ ...prev, phase: 'DELAY_RECALL' }));
       setTimeLeft(config.recallTime);
     }
  };

  const canStartDelayed = () => {
    if (state.phase !== 'DELAY_WAIT' || !state.delayStartTime) return false;
    const elapsed = Date.now() - state.delayStartTime;
    return elapsed >= config.delayMinutes * 60 * 1000;
  };

  const getRemainingDelay = () => {
     if (!state.delayStartTime) return 0;
     const target = state.delayStartTime + (config.delayMinutes * 60 * 1000);
     return Math.max(0, target - Date.now());
  };

  const resetGame = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    state,
    isDisplaying,
    currentWord: currentWordIndex >= 0 ? config.wordList[currentWordIndex] : null,
    submitRecall,
    startLearning,
    startDelayedRecall,
    canStartDelayed,
    getRemainingDelay,
    resetGame,
    timeLeft
  };
};
