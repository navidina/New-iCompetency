import React, { useState, useEffect } from 'react';
import { usePairedAssociation, PairedAssociationConfig, ICONS_POOL } from '../../../hooks/usePairedAssociation';
import { toPersianNum } from '../../../utils/formatting';
import { CheckCircle, Brain, Database, Eye } from 'lucide-react';
import GameShell from '../../../../components/GameShell';

const DEFAULT_CONFIG: PairedAssociationConfig = {
  levels: [4, 6, 8, 10, 12],
  displayTimePerPair: 3000,
  delayPhase: 5000,
  colors: [
    { name: 'red', class: 'bg-red-500', hex: '#ef4444' },
    { name: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'green', class: 'bg-green-500', hex: '#22c55e' },
    { name: 'yellow', class: 'bg-yellow-400', hex: '#facc15' },
    { name: 'purple', class: 'bg-purple-500', hex: '#a855f7' },
    { name: 'orange', class: 'bg-orange-500', hex: '#f97316' },
    { name: 'pink', class: 'bg-pink-500', hex: '#ec4899' },
    { name: 'cyan', class: 'bg-cyan-500', hex: '#06b6d4' }
  ]
};

interface PairedAssociationGameProps {
  onFinish: (score: number) => void;
}

const PairedAssociationGame: React.FC<PairedAssociationGameProps> = ({ onFinish }) => {
  const {
    gameState,
    currentLevel,
    currentPair,
    delayTimeLeft,
    currentQuestionIndex,
    totalPairs,
    score,
    handleAnswer,
    startGame,
    nextLevel
  } = usePairedAssociation(DEFAULT_CONFIG);

  const [shellState, setShellState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  useEffect(() => {
    if (shellState === 'playing' && gameState === 'IDLE') {
      startGame();
    }
  }, [shellState, gameState, startGame]);

  const handleGameFinish = () => {
    onFinish(score);
  };

  const IconComponent = currentPair ? ICONS_POOL[currentPair.iconIndex] : null;

  return (
    <GameShell
      title="جفت‌های پنهان"
      description="ارتباط بین نمادها و رنگ‌ها را به خاطر بسپارید. پس از یک وقفه کوتاه، باید رنگ صحیح هر نماد را انتخاب کنید."
      instructions={[
        "تعدادی جفت (نماد + رنگ) نمایش داده می‌شود.",
        "سعی کنید رنگ مربوط به هر نماد را حفظ کنید.",
        "یک صفحه نویز برای پاکسازی حافظه دیداری نمایش داده می‌شود.",
        "سپس نمادها را می‌بینید و باید رنگ صحیح را انتخاب کنید."
      ]}
      icon={<Database />}
      stats={{
        score,
        level: currentLevel,
        timeLeft: gameState === 'DELAY' ? delayTimeLeft / 1000 : undefined
      }}
      gameState={shellState}
      setGameState={setShellState}
      onExit={() => onFinish(score)}
      onRestart={startGame}
      colorTheme="purple"
    >
      <div className="flex flex-col items-center justify-center w-full h-full" dir="rtl">

        {gameState === 'LEARNING' && currentPair && IconComponent && (
          <div className="flex flex-col items-center animate-scale-in">
             <span className="mb-8 text-lg font-bold text-purple-600 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                به خاطر بسپارید
             </span>
             <div className="flex flex-col items-center gap-8">
                <IconComponent size={120} className="text-slate-700 drop-shadow-md" />
                <div className={`w-24 h-24 rounded-full shadow-lg ${DEFAULT_CONFIG.colors[currentPair.colorIndex].class}`} />
             </div>
          </div>
        )}

        {gameState === 'DELAY' && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="animate-pulse text-slate-400 font-bold text-xl mb-4">صبر کنید...</div>
            {/* Visual Noise */}
            <div className="w-64 h-64 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]"></div>
          </div>
        )}

        {gameState === 'TESTING' && currentPair && IconComponent && (
          <div className="flex flex-col items-center w-full animate-fade-in-up">
            <span className="mb-4 text-slate-400 font-bold">کدام رنگ بود؟</span>
            <div className="mb-10 p-6 bg-slate-50 rounded-2xl shadow-sm border border-slate-100">
               <IconComponent size={80} className="text-slate-800" />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
               {DEFAULT_CONFIG.colors.map((color, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleAnswer(idx)}
                   className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${color.class} shadow-md hover:scale-110 active:scale-95 transition-all border-4 border-transparent hover:border-white/50`}
                 />
               ))}
            </div>
            <div className="mt-8 text-xs font-bold text-slate-300">
                سوال {toPersianNum(currentQuestionIndex + 1)} از {toPersianNum(totalPairs)}
            </div>
          </div>
        )}

        {gameState === 'FEEDBACK' && (
          <div className="text-center animate-scale-in">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto text-green-600">
                <CheckCircle size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">سطح {toPersianNum(currentLevel)} تکمیل شد</h3>
             <button
               onClick={nextLevel}
               className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors shadow-lg"
             >
               ادامه به سطح بعد
             </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="text-center animate-fade-in-up">
             <h2 className="text-2xl font-bold text-slate-800 mb-4">پایان بازی</h2>
             <div className="text-5xl font-black text-purple-600 mb-8">{toPersianNum(score)}</div>
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

export default PairedAssociationGame;
