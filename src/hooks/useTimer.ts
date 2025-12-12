import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (totalTimeMs: number, onTimeUp?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(totalTimeMs);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, totalTimeMs - elapsed);

    setTimeLeft(remaining);

    if (remaining <= 0) {
      setIsRunning(false);
      onTimeUp?.();
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [totalTimeMs, onTimeUp]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = performance.now() - (totalTimeMs - timeLeft); // Adjust for pause
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, timeLeft, totalTimeMs, tick]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setTimeLeft(totalTimeMs);
    startTimeRef.current = null;
  }, [pause, totalTimeMs]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { timeLeft, isRunning, start, pause, reset };
};
