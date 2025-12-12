import { useState, useEffect, useCallback, useRef } from 'react';
import { generateCorsiSequence } from '../utils/generators';
import { CorsiConfig } from '../types';
import { sfx } from '../../services/audioService';

type GameState = 'IDLE' | 'DISPLAYING' | 'INPUT' | 'FEEDBACK' | 'GAMEOVER' | 'COMPLETED';

export const useCorsiGame = (config: CorsiConfig) => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState(config.initialSequenceLength); // "Level" here maps to sequence length? Or actual abstract levels? The prompt says "Start with 2 squares... 2 successes = level up". So level means sequence length usually in Corsi.
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [score, setScore] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // For displaying the sequence
  const [activeBlock, setActiveBlock] = useState<number | null>(null);

  const totalCorrectRef = useRef(0);
  const totalErrorsRef = useRef(0);

  const startGame = useCallback(() => {
    setGameState('IDLE');
    setCurrentLevel(config.initialSequenceLength);
    setConsecutiveSuccesses(0);
    setConsecutiveFailures(0);
    setScore(0);
    setMaxSpan(0);
    totalCorrectRef.current = 0;
    totalErrorsRef.current = 0;
    startRound(config.initialSequenceLength);
  }, [config]);

  const startRound = useCallback((length: number) => {
    const newSeq = generateCorsiSequence(length, config.gridSize);
    setSequence(newSeq);
    setUserSequence([]);
    setFeedback(null);
    setGameState('DISPLAYING');
  }, [config.gridSize]);

  // Display Sequence Effect
  useEffect(() => {
    if (gameState === 'DISPLAYING') {
      let step = 0;
      let timeoutId: NodeJS.Timeout;

      const runStep = () => {
        if (step >= sequence.length) {
          setActiveBlock(null);
          setGameState('INPUT');
          return;
        }

        setActiveBlock(sequence[step]);

        // Turn off block
        timeoutId = setTimeout(() => {
          setActiveBlock(null);
        }, config.displayTime - 100);

        step++;
      };

      // Run first step immediately
      runStep();

      // Schedule subsequent steps
      const interval = setInterval(runStep, config.displayTime + config.delayBetweenBlocks);

      return () => {
        clearInterval(interval);
        clearTimeout(timeoutId); // cleanup inner timeout if needed (though local var logic makes it tricky, strictly not needed if component unmounts but good practice)
      };
    }
  }, [gameState, sequence, config]);

  // Audio cue for each block flash during the display phase
  useEffect(() => {
    if (gameState === 'DISPLAYING' && activeBlock !== null) {
      sfx.playHover();
    }
  }, [activeBlock, gameState]);

  const handleBlockClick = useCallback((index: number) => {
    if (gameState !== 'INPUT') return;

    sfx.playClick();

    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    // Check if the latest click matches the expected block at that position
    const currentIndex = newUserSequence.length - 1;
    if (sequence[currentIndex] !== index) {
      // Immediate failure on wrong click? Or wait for full sequence?
      // Usually Corsi stops immediately or records error.
      // Prompt says: "User must repeat the same order".
      // I'll handle immediate failure feedback or end of sequence check.
      // Let's do end of sequence check or immediate check.
      // Immediate check gives faster feedback.
      handleRoundEnd(false);
      return;
    }

    // If sequence complete
    if (newUserSequence.length === sequence.length) {
      handleRoundEnd(true);
    }
  }, [gameState, userSequence, sequence]);

  const handleRoundEnd = useCallback((success: boolean) => {
    setGameState('FEEDBACK');
    setFeedback(success ? 'correct' : 'wrong');

    if (success) {
      sfx.playSuccess();
      totalCorrectRef.current += 1;
      setConsecutiveSuccesses(prev => prev + 1);
      setConsecutiveFailures(0);
      // Determine the effective max span for scoring (current successful level vs previous best)
      const effectiveMaxSpan = Math.max(maxSpan, currentLevel);

      if (currentLevel > maxSpan) setMaxSpan(currentLevel);

      // Calculate Score
      // score = (maxSpan × 10) + (totalCorrect × 2) - (errors × 1)
      const newScore = (effectiveMaxSpan * 10) + (totalCorrectRef.current * 2) - (totalErrorsRef.current * 1);
      setScore(newScore);

      setTimeout(() => {
        if (consecutiveSuccesses + 1 >= config.successesForLevelUp) {
          // Level Up
          const nextLevel = Math.min(currentLevel + 1, config.maxSequenceLength);
          setCurrentLevel(nextLevel);
          setConsecutiveSuccesses(0); // Reset counter for next level logic? Or keep? Usually reset.
          startRound(nextLevel);
        } else {
          // Same Level
          startRound(currentLevel);
        }
      }, 1000);
    } else {
      sfx.playError();
      totalErrorsRef.current += 1;
      setConsecutiveFailures(prev => prev + 1);
      setConsecutiveSuccesses(0);

       // Calculate Score (even on error, maxSpan might be retained)
      const newScore = (maxSpan * 10) + (totalCorrectRef.current * 2) - (totalErrorsRef.current * 1);
      setScore(newScore);

      setTimeout(() => {
        if (consecutiveFailures + 1 >= config.failuresForGameOver) {
          setGameState('GAMEOVER');
        } else {
          // Retry same level or downgrade? Usually retry same or downgrade.
          // Prompt doesn't specify downgrade. Just "2 failures = Game Over".
          // So we retry same level.
          startRound(currentLevel);
        }
      }, 1000);
    }
  }, [config, consecutiveSuccesses, consecutiveFailures, currentLevel, maxSpan]);

  return {
    gameState,
    score,
    currentLevel,
    activeBlock,
    feedback,
    startGame,
    handleBlockClick,
    consecutiveFailures
  };
};
