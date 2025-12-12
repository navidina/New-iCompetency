import React, { useState, useEffect } from 'react';
import { SwotData } from '../types';
import { generateSwotData } from '../services/geminiService';
import { Loader2, Building2 } from 'lucide-react';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const SwotGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [data, setData] = useState<SwotData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string} | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    generateSwotData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleChoice = (category: 'S' | 'W' | 'O' | 'T') => {
    if (!data || feedback) return;
    
    const item = data.items[currentIndex];
    const isCorrect = item.category === category;

    setFeedback({
        correct: isCorrect,
        msg: isCorrect ? "دقیقاً!" : `اشتباه. این مورد ${item.category} است زیرا: ${item.reason}`
    });

    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
        setFeedback(null);
        if (currentIndex < data.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    }, isCorrect ? 800 : 2500);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 animate-fade-in-up">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
        <p className="text-lg font-medium">در حال تحلیل داده‌های بازار...</p>
      </div>
    );
  }

  if (!data) return <div>خطا.</div>;

  if (finished) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-50 animate-fade-in-up">
            <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl text-center border border-slate-100">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-blue-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">تحلیل SWOT تکمیل شد</h2>
                 <p className="text-slate-500 mb-6">شما تمام آیتم‌ها را طبقه‌بندی کردید.</p>
                 <div className="text-5xl font-black text-blue-600 mb-8">{score * 10}</div>
                 <button onClick={() => onComplete(score * 10)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                    پایان و ثبت
                 </button>
            </div>
        </div>
      );
  }

  const currentItem = data.items[currentIndex];

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded text-blue-600"><Building2 size={20} /></div>
                <div>
                    <h2 className="font-bold text-slate-800">{data.companyContext}</h2>
                    <p className="text-xs text-slate-500">مورد {currentIndex + 1} از {data.items.length}</p>
                </div>
            </div>
            <div className="text-xl font-bold text-blue-600 tabular-nums">{score} امتیاز</div>
        </div>

        {/* Game Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
            
            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center mb-12 transform transition-all hover:scale-105 duration-300 border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 leading-snug">
                    "{currentItem.text}"
                </h3>
                <div className="h-1 w-16 bg-slate-200 mx-auto rounded-full"></div>
            </div>

            {/* Feedback Overlay */}
            {feedback && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm ${feedback.correct ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    <div className={`px-8 py-4 rounded-full font-bold text-white text-xl shadow-lg animate-bounce ${feedback.correct ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {feedback.msg}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                <button onClick={() => handleChoice('S')} className="h-32 rounded-xl bg-green-100 border-2 border-green-200 text-green-800 text-xl font-bold hover:bg-green-200 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
                    <span>💪 نقاط قوت</span>
                    <span className="text-xs font-normal opacity-75">(داخلی + مثبت)</span>
                </button>
                <button onClick={() => handleChoice('W')} className="h-32 rounded-xl bg-red-100 border-2 border-red-200 text-red-800 text-xl font-bold hover:bg-red-200 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
                    <span>⚠️ نقاط ضعف</span>
                    <span className="text-xs font-normal opacity-75">(داخلی + منفی)</span>
                </button>
                <button onClick={() => handleChoice('O')} className="h-32 rounded-xl bg-blue-100 border-2 border-blue-200 text-blue-800 text-xl font-bold hover:bg-blue-200 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
                    <span>🚀 فرصت‌ها</span>
                    <span className="text-xs font-normal opacity-75">(خارجی + مثبت)</span>
                </button>
                <button onClick={() => handleChoice('T')} className="h-32 rounded-xl bg-amber-100 border-2 border-amber-200 text-amber-800 text-xl font-bold hover:bg-amber-200 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
                    <span>🛡️ تهدیدها</span>
                    <span className="text-xs font-normal opacity-75">(خارجی + منفی)</span>
                </button>
            </div>
        </div>
        
        <div className="p-4 text-center">
            <button onClick={onExit} className="text-slate-400 hover:text-slate-600 transition-colors">خروج از بازی</button>
        </div>
    </div>
  );
};

export default SwotGame;