import React, { useState, useEffect } from 'react';
import { useCorsiGame } from '../../../hooks/useCorsiGame';
import { CorsiConfig } from '../../../types';
import { Play, RotateCcw, CheckCircle, Server } from 'lucide-react';
import { toPersianNum } from '../../../utils/formatting';
import GameShell from '../../../../components/GameShell';

const DEFAULT_CONFIG: CorsiConfig = {
  gridSize: 4,
  initialSequenceLength: 2,
  maxSequenceLength: 9,
  displayTime: 1000,
  delayBetweenBlocks: 500,
  successesForLevelUp: 2,
  failuresForGameOver: 2,
};

interface CorsiBlockGameProps {
  onFinish: (score: number, details?: any) => void;
}

const CorsiBlockGame: React.FC<CorsiBlockGameProps> = ({ onFinish }) => {
  const {
    gameState,
    score,
    currentLevel,
    activeBlock,
    feedback,
    startGame,
    handleBlockClick,
    consecutiveFailures
  } = useCorsiGame(DEFAULT_CONFIG);

  const [shellState, setShellState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  const blocks = Array.from({ length: DEFAULT_CONFIG.gridSize * DEFAULT_CONFIG.gridSize }, (_, i) => i);

  // Sync Start
  useEffect(() => {
    if (shellState === 'playing' && gameState === 'IDLE') {
       startGame();
    }
  }, [shellState, gameState, startGame]);

  // Sync Game Over
  useEffect(() => {
    // We handle game over UI inside the shell content
  }, [gameState]);

  const handleFinish = () => {
    onFinish(score, { maxSpan: currentLevel });
  };

  return (
    <GameShell
      title="شبکه امنیتی"
      description="الگوی روشن شدن سرورها را به خاطر بسپارید و دقیقاً تکرار کنید. با هر ۲ پاسخ صحیح، طول دنباله افزایش می‌یابد."
      instructions={[
        "تعدادی از خانه‌ها به ترتیب روشن می‌شوند.",
        "دقت کنید و ترتیب را به خاطر بسپارید.",
        "پس از پایان نمایش، همان ترتیب را روی خانه‌ها کلیک کنید.",
        "۲ اشتباه پیاپی باعث پایان بازی می‌شود."
      ]}
      icon={<Server />}
      stats={{
        score,
        level: currentLevel,
        lives: 2 - consecutiveFailures,
        maxLives: 2
      }}
      gameState={shellState}
      setGameState={setShellState}
      onExit={() => onFinish(score)}
      onRestart={startGame}
      colorTheme="emerald"
    >
      <div className="flex flex-col items-center justify-center w-full h-full" dir="rtl">

        {/* Game Grid */}
        <div
          className="grid gap-4 mb-8 p-4 bg-white rounded-2xl shadow-inner-light"
          style={{
            gridTemplateColumns: `repeat(${DEFAULT_CONFIG.gridSize}, minmax(0, 1fr))`
          }}
        >
          {blocks.map((index) => {
            const isActive = activeBlock === index;
            const isInteractable = gameState === 'INPUT';

            let bgColor = 'bg-gray-200';
            if (isActive) bgColor = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-105 transition-transform duration-100';

            return (
              <button
                key={index}
                disabled={!isInteractable}
                onClick={() => handleBlockClick(index)}
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all duration-200
                  ${bgColor}
                  ${isInteractable ? 'hover:bg-emerald-100 active:scale-95 cursor-pointer' : 'cursor-default'}
                `}
              />
            );
          })}
        </div>

        {/* Status Text */}
        <div className="h-16 flex items-center justify-center w-full">
          {gameState === 'DISPLAYING' && (
            <span className="text-lg text-emerald-600 font-bold animate-pulse">
              به الگو دقت کنید...
            </span>
          )}

          {gameState === 'INPUT' && (
            <span className="text-lg text-slate-600 font-bold">
              حالا تکرار کنید
            </span>
          )}

          {gameState === 'FEEDBACK' && (
            <div className={`text-xl font-bold ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? 'آفرین! درست بود' : 'اشتباه!'}
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="flex flex-col items-center animate-fade-in-up gap-3">
              <span className="text-xl font-bold text-slate-800">پایان بازی</span>
              <div className="flex gap-2">
                  <button
                    onClick={startGame}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    تلاش مجدد
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    ثبت نتیجه
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
};

export default CorsiBlockGame;
