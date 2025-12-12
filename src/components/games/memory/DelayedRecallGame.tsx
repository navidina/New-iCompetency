import React, { useState, useEffect } from 'react';
import { useDelayedRecall, DelayedRecallConfig } from '../../../hooks/useDelayedRecall';
import { toPersianNum } from '../../../utils/formatting';
import { Play, Clock, BookOpen, Lock } from 'lucide-react';
import GameShell from '../../../../components/GameShell';

const DEFAULT_CONFIG: DelayedRecallConfig = {
  wordList: ['سیب', 'میز', 'سکه', 'اسب', 'کتاب', 'خانه', 'ساعت', 'درخت', 'مداد', 'شانه', 'پنجره', 'کفش', 'باران', 'نان', 'کلید'],
  learningTrials: 5,
  delayMinutes: 20,
  recallTime: 120000
};

interface DelayedRecallGameProps {
  onFinish: (score: number) => void;
}

const DelayedRecallGame: React.FC<DelayedRecallGameProps> = ({ onFinish }) => {
  const {
    state,
    isDisplaying,
    currentWord,
    submitRecall,
    startLearning,
    startDelayedRecall,
    canStartDelayed,
    getRemainingDelay,
    resetGame,
    timeLeft
  } = useDelayedRecall(DEFAULT_CONFIG);

  const [inputText, setInputText] = useState("");
  const [remainingDelay, setRemainingDelay] = useState(0);
  const [shellState, setShellState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  // Update delay countdown
  useEffect(() => {
    if (state.phase === 'DELAY_WAIT') {
      const interval = setInterval(() => {
        setRemainingDelay(getRemainingDelay());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.phase, getRemainingDelay]);

  // Sync Start (Only for first trial intro)
  useEffect(() => {
    if (shellState === 'playing' && state.phase === 'INTRO') {
       startLearning();
    }
  }, [shellState, state.phase, startLearning]);

  const handleSubmit = () => {
    const words = inputText.split(/[\s,\-\n،]+/).filter(Boolean);
    submitRecall(words);
    setInputText("");
  };

  const getStats = () => {
      const baseStats = { score: state.delayedScore || 0, level: state.trial };
      if (state.phase === 'DELAY_WAIT') {
          return { ...baseStats, timeLeft: remainingDelay / 1000 };
      }
      return baseStats;
  }

  return (
    <GameShell
      title="یادآوری کلمات"
      description="این آزمون شامل دو مرحله است. در مرحله اول باید کلمات را یاد بگیرید و در مرحله دوم (پس از ۲۰ دقیقه) آن‌ها را به یاد بیاورید."
      instructions={[
        "در مرحله اول، ۱۵ کلمه به شما نمایش داده می‌شود.",
        "کلمات را به خاطر بسپارید و بلافاصله تایپ کنید.",
        "این کار ۵ بار تکرار می‌شود تا یادگیری تثبیت شود.",
        "سپس یک وقفه ۲۰ دقیقه‌ای خواهید داشت.",
        "پس از وقفه، باید هرچه به یاد دارید را بنویسید."
      ]}
      icon={<BookOpen />}
      stats={getStats()}
      gameState={shellState}
      setGameState={setShellState}
      onExit={() => onFinish(state.delayedScore || 0)}
      colorTheme="amber"
    >
      <div className="flex flex-col items-center justify-center w-full h-full" dir="rtl">

       {state.phase === 'DELAY_WAIT' && (
          <div className="text-center animate-fade-in">
             <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 mx-auto text-amber-600">
                <Clock size={40} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">فاز تأخیر</h2>
             <p className="text-slate-500 mb-8 max-w-sm">
                مرحله اول تکمیل شد. لطفاً به بازی‌های دیگر بپردازید و پس از ۲۰ دقیقه بازگردید.
             </p>

             <button
               onClick={startDelayedRecall}
               disabled={!canStartDelayed()}
               className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                 canStartDelayed()
                 ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg'
                 : 'bg-slate-200 text-slate-400 cursor-not-allowed'
               }`}
             >
               {canStartDelayed() ? <Play size={18} /> : <Lock size={18} />}
               شروع مرحله دوم
             </button>
          </div>
       )}

       {isDisplaying ? (
          <div className="flex flex-col items-center justify-center animate-scale-in">
             <div className="text-sm text-amber-600 font-bold mb-8 animate-pulse">در حال نمایش کلمات...</div>
             <div className="text-5xl font-black text-slate-800 mb-12 h-20">{currentWord}</div>
             <div className="w-16 h-16 rounded-full border-4 border-t-amber-600 border-slate-200 animate-spin"></div>
          </div>
       ) : (state.phase === 'LEARNING' || state.phase === 'DELAY_RECALL') && (
          <div className="flex flex-col items-center w-full max-w-md animate-fade-in-up">
             {state.subPhase === 'READY' ? (
                <>
                   <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                      <BookOpen size={40} />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800 mb-2">تلاش {toPersianNum(state.trial)}</h2>
                   <p className="text-slate-500 mb-8 text-center">
                      آیا برای مشاهده مجدد کلمات آماده‌اید؟
                   </p>
                   <button
                     onClick={startLearning}
                     className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"
                   >
                     <Play size={18} /> شروع تلاش {toPersianNum(state.trial)}
                   </button>
                </>
             ) : (
                <>
                   <h3 className="text-xl font-bold text-slate-800 mb-4">
                      {state.trial > 1 ? 'چه کلماتی را به یاد دارید؟' : 'کلمات را وارد کنید'}
                   </h3>
                   <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="کلمات را اینجا بنویسید (با فاصله جدا کنید)..."
                      className="w-full h-32 p-4 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-0 resize-none text-lg mb-6 bg-slate-50"
                      autoFocus
                   />
                   <button
                     onClick={handleSubmit}
                     className="w-full px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg"
                   >
                     ثبت
                   </button>
                </>
             )}
          </div>
       )}

       {state.phase === 'FINISHED' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">نتیجه یادآوری</h2>
              <div className="grid grid-cols-2 gap-8 mb-8">
                 <div className="bg-blue-50 p-4 rounded-2xl">
                    <div className="text-sm text-slate-500">یادگیری (میانگین)</div>
                    <div className="text-2xl font-bold text-blue-600">
                       {toPersianNum(Math.round(state.scores.reduce((a,b)=>a+b,0)/state.scores.length))}
                    </div>
                 </div>
                 <div className="bg-purple-50 p-4 rounded-2xl">
                    <div className="text-sm text-slate-500">یادآوری تأخیری</div>
                    <div className="text-2xl font-bold text-purple-600">
                       {toPersianNum(state.delayedScore)}
                    </div>
                 </div>
              </div>
              <button
                 onClick={() => onFinish(state.delayedScore || 0)}
                 className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-900 transition-colors"
              >
                 خروج
              </button>
          </div>
       )}
      </div>
    </GameShell>
  );
};

export default DelayedRecallGame;
