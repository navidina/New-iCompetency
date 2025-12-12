import React, { useState, useEffect } from 'react';
import { useNBack, NBackConfig } from '../../../hooks/useNBack';
import { toPersianNum } from '../../../utils/formatting';
import { Radar } from 'lucide-react';
import GameShell from '../../../../components/GameShell';

const DEFAULT_CONFIG: NBackConfig = {
  nLevels: [1, 2, 3, 4],
  stimuliPerBlock: 25,
  displayTime: 2500,
  targetRatio: 0.3,
  stimuliSet: ['A', 'B', 'C', 'D', 'E', 'H', 'K', 'L', 'M', 'O', 'P', 'T', 'X', 'Z']
};

interface NBackGameProps {
  onFinish: (score: number) => void;
}

const NBackGame: React.FC<NBackGameProps> = ({ onFinish }) => {
  const {
    gameState,
    currentLevel,
    currentStimulus,
    score,
    dPrime,
    stats,
    feedback,
    handleMatch,
    startGame,
    nextLevel
  } = useNBack(DEFAULT_CONFIG);

  const [shellState, setShellState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  useEffect(() => {
    if (shellState === 'playing' && gameState === 'IDLE') {
      startGame();
    }
  }, [shellState, gameState, startGame]);

  const handleGameFinish = () => {
    onFinish(score);
  };

  return (
    <GameShell
      title="رادار تمرکز"
      description="اگر حرف نمایش داده شده با حرف N مرحله قبل یکسان بود، دکمه را بزنید."
      instructions={[
        "تعدادی حرف به صورت متوالی نمایش داده می‌شود.",
        `در سطح ۱، اگر حرف فعلی با حرف ۱ مرحله قبل (حرف قبلی) یکی بود، دکمه را بزنید.`,
        "در سطح ۲، باید با ۲ مرحله قبل مقایسه کنید.",
        "فقط زمانی کلیک کنید که تطابق وجود داشته باشد."
      ]}
      icon={<Radar />}
      stats={{
        score,
        level: currentLevel,
      }}
      gameState={shellState}
      setGameState={setShellState}
      onExit={() => onFinish(score)}
      onRestart={startGame}
      colorTheme="rose"
    >
      <div className="flex flex-col items-center justify-center w-full h-full" dir="rtl">

        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center w-full">
             {/* Radar Scope */}
             <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-rose-900/50 bg-slate-50 flex items-center justify-center shadow-lg mb-8">
                {/* Rotating Scanner */}
                <div className="absolute inset-0 rounded-full border-t border-rose-500/30 animate-[spin_4s_linear_infinite]"></div>

                {/* The Item */}
                <div className={`transition-all duration-300 transform ${currentStimulus ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    <div className="w-32 h-32 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-6xl font-black text-rose-600 shadow-xl">
                        {currentStimulus}
                    </div>
                </div>

                {/* Feedback Overlay */}
                {feedback && (
                    <div className={`absolute inset-0 rounded-full flex items-center justify-center bg-opacity-20 animate-ping ${feedback === 'hit' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                )}
             </div>

             <button
                onClick={handleMatch}
                className="w-full max-w-xs py-5 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all rounded-2xl font-black text-2xl text-white shadow-xl border-b-4 border-rose-800 active:border-b-0 active:translate-y-1"
             >
                تطبیق! (Match)
             </button>
             <div className="mt-4 text-slate-500 text-sm">
                آیا با {toPersianNum(currentLevel)} مرحله قبل یکی است؟
             </div>
          </div>
        )}

        {gameState === 'FEEDBACK' && (
          <div className="text-center animate-scale-in bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
             <h3 className="text-xl font-bold text-slate-800 mb-6">گزارش سطح {toPersianNum(currentLevel)}</h3>

             <div className="grid grid-cols-2 gap-4 mb-8 text-right">
                <div className="bg-slate-50 p-3 rounded-xl">
                   <div className="text-xs text-slate-500">تشخیص درست</div>
                   <div className="text-lg font-bold text-emerald-600">{toPersianNum(stats.hits)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <div className="text-xs text-slate-500">خطای مثبت</div>
                   <div className="text-lg font-bold text-rose-600">{toPersianNum(stats.falseAlarms)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <div className="text-xs text-slate-500">از دست رفته</div>
                   <div className="text-lg font-bold text-orange-500">{toPersianNum(stats.misses)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <div className="text-xs text-slate-500">شاخص d'</div>
                   <div className="text-lg font-bold text-blue-600">{toPersianNum(dPrime.toFixed(2))}</div>
                </div>
             </div>

             <button
               onClick={nextLevel}
               className="w-full px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg"
             >
               ادامه
             </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="text-center animate-fade-in-up">
             <h2 className="text-2xl font-bold text-slate-800 mb-4">پایان رادار</h2>
             <div className="text-5xl font-black text-rose-600 mb-8">{toPersianNum(score)}</div>
             <button
               onClick={handleGameFinish}
               className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-900 transition-colors"
             >
               ثبت و خروج
             </button>
          </div>
        )}

      </div>
    </GameShell>
  );
};

export default NBackGame;
