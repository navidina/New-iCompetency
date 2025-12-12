import React, { useState, useEffect } from 'react';
import { CynefinData } from '../types';
import { generateCynefinData } from '../services/geminiService';
import { Loader2, Activity } from 'lucide-react';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const CynefinGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [data, setData] = useState<CynefinData | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    generateCynefinData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleSelect = (domain: string) => {
    if (!data || result) return;
    const scenario = data.scenarios[index];
    const isCorrect = scenario.domain === domain;
    
    if (isCorrect) {
        setScore(s => s + 25);
        setResult("صحیح");
    } else {
        setResult(`نادرست. این مورد ${scenario.domain} است. ${scenario.reason}`);
    }

    setTimeout(() => {
        setResult(null);
        if (index < data.scenarios.length - 1) {
            setIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    }, 2500);
  };

  if (loading) return <div className="h-full flex items-center justify-center text-slate-500 animate-fade-in-up">در حال تولید سناریوها...</div>;
  if (!data) return <div>خطا</div>;

  if (finished) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-900 text-white animate-fade-in-up">
             <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl text-center border border-white/10">
                 <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-purple-400" />
                 </div>
                 <h2 className="text-2xl font-bold mb-2">دسته‌بندی کامل شد</h2>
                 <p className="text-purple-200 mb-6">تحلیل شما از موقعیت‌ها پایان یافت.</p>
                 <div className="text-5xl font-black text-purple-400 mb-8">{score}</div>
                 <button onClick={() => onComplete(score)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-500 transition-colors hover:shadow-lg hover:shadow-purple-500/30">
                    ثبت و خروج
                 </button>
            </div>
        </div>
      )
  }

  const current = data.scenarios[index];

  return (
    <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 flex flex-col animate-fade-in-up">
        <div className="flex justify-between items-center mb-12">
             <h2 className="text-2xl font-bold flex items-center gap-2"><Activity /> چارچوب Cynefin</h2>
             <div className="text-xl font-bold tabular-nums">{score} امتیاز</div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 mb-12 w-full text-center min-h-[200px] flex flex-col justify-center shadow-2xl">
                <p className="text-2xl font-medium leading-relaxed">{current.description}</p>
                {result && (
                    <div className="mt-4 text-amber-400 font-bold animate-pulse">{result}</div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                <button onClick={() => handleSelect('Simple')} className="p-6 bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 rounded-xl font-bold transition-all shadow-lg">
                    Simple (ساده)
                    <span className="block text-xs font-normal opacity-70 mt-1">بهترین روش (حس-دسته‌بندی-پاسخ)</span>
                </button>
                <button onClick={() => handleSelect('Complicated')} className="p-6 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 rounded-xl font-bold transition-all shadow-lg">
                    Complicated (پیچیده)
                    <span className="block text-xs font-normal opacity-70 mt-1">روش خوب (حس-تحلیل-پاسخ)</span>
                </button>
                <button onClick={() => handleSelect('Complex')} className="p-6 bg-purple-600 hover:bg-purple-500 hover:scale-105 active:scale-95 rounded-xl font-bold transition-all shadow-lg">
                    Complex (بغرنج)
                    <span className="block text-xs font-normal opacity-70 mt-1">نوظهور (کاوش-حس-پاسخ)</span>
                </button>
                <button onClick={() => handleSelect('Chaotic')} className="p-6 bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 rounded-xl font-bold transition-all shadow-lg">
                    Chaotic (آشوبناک)
                    <span className="block text-xs font-normal opacity-70 mt-1">بدیع (عمل-حس-پاسخ)</span>
                </button>
            </div>
        </div>
        <button onClick={onExit} className="self-center mt-8 text-slate-400 hover:text-white transition-colors">خروج از بازی</button>
    </div>
  );
}

export default CynefinGame;