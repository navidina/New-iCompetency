import React, { useState, useEffect } from 'react';
import { FiveWhysData } from '../types';
import { generateFiveWhysData } from '../services/geminiService';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Search } from 'lucide-react';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const FiveWhysGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [data, setData] = useState<FiveWhysData | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong' | 'finished'>('playing');
  const [score, setScore] = useState(0);

  useEffect(() => {
    generateFiveWhysData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleOptionSelect = (index: number) => {
    if (gameState !== 'playing' || !data) return;
    
    setSelectedOption(index);
    const isCorrect = index === data.levels[currentLevel].correctIndex;

    if (isCorrect) {
      setGameState('correct');
      setScore(s => s + 20); // 20 points per level -> 100 total
    } else {
      setGameState('wrong');
      setScore(s => Math.max(0, s - 5));
    }
  };

  const handleNext = () => {
    if (!data) return;
    if (currentLevel < 4) {
      setCurrentLevel(prev => prev + 1);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      setGameState('finished');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white animate-fade-in-up">
        <Loader2 className="animate-spin w-10 h-10 text-amber-500 mb-4" />
        <p className="text-lg animate-pulse">در حال بررسی حادثه...</p>
      </div>
    );
  }

  if (!data) return <div>خطا در بارگذاری بازی.</div>;

  if (gameState === 'finished') {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 p-4 animate-fade-in-up">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">علت ریشه‌ای پیدا شد!</h2>
          <p className="text-slate-600 mb-6">شما با موفقیت به هسته اصلی مشکل رسیدید.</p>
          
          <div className="text-5xl font-black text-emerald-500 mb-8">{score}<span className="text-xl text-slate-400">/100</span></div>
          
          <button 
            onClick={() => onComplete(score)}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 hover:scale-105 transition-all"
          >
            دریافت XP و خروج
          </button>
        </div>
      </div>
    );
  }

  const levelData = data.levels[currentLevel];

  return (
    <div className="h-full bg-slate-900 text-slate-100 p-6 flex flex-col overflow-y-auto animate-fade-in-up">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
                <Search className="text-amber-500" />
            </div>
            <div>
                <h2 className="font-bold text-xl">کارآگاه ۵ چرا</h2>
                <p className="text-slate-400 text-sm">سطح {currentLevel + 1} از 5</p>
            </div>
        </div>
        <button onClick={onExit} className="text-slate-500 hover:text-white text-sm transition-colors">لغو ماموریت</button>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Problem Statement / Chain */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="flex items-start gap-4">
                <AlertTriangle className="text-amber-500 shrink-0 mt-1" />
                <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                        {currentLevel === 0 ? 'مشکل اولیه' : `علت قبلی (سطح ${currentLevel})`}
                    </h3>
                    <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                        {currentLevel === 0 ? data.problemStatement : data.levels[currentLevel - 1].options[data.levels[currentLevel - 1].correctIndex]}
                    </p>
                </div>
            </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-pulse">چرا؟</h1>
            <p className="text-slate-400">{levelData.question}</p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-4 mb-8">
            {levelData.options.map((opt, idx) => {
                let btnClass = "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600";
                
                if (gameState !== 'playing' && idx === selectedOption) {
                    if (gameState === 'correct') btnClass = "bg-emerald-600/20 border-emerald-500 text-emerald-400";
                    if (gameState === 'wrong') btnClass = "bg-red-600/20 border-red-500 text-red-400";
                }

                return (
                    <button
                        key={idx}
                        disabled={gameState !== 'playing'}
                        onClick={() => handleOptionSelect(idx)}
                        className={`w-full p-6 rounded-xl border-2 text-right transition-all duration-200 text-lg font-medium flex items-center justify-between group hover:scale-[1.02] active:scale-95 ${btnClass}`}
                    >
                        {opt}
                        {gameState !== 'playing' && idx === selectedOption && (
                            gameState === 'correct' ? <CheckCircle2 /> : <XCircle />
                        )}
                    </button>
                );
            })}
        </div>

        {/* Feedback / Next */}
        {gameState !== 'playing' && (
            <div className={`rounded-xl p-6 animate-fadeIn ${gameState === 'correct' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <h4 className={`font-bold mb-2 ${gameState === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {gameState === 'correct' ? 'تحلیل صحیح!' : 'استدلال نادرست'}
                </h4>
                <p className="text-slate-300 mb-4">
                    {levelData.explanation}
                </p>
                {gameState === 'correct' ? (
                    <button 
                        onClick={handleNext}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-500 transition-colors hover:shadow-lg"
                    >
                        {currentLevel === 4 ? 'پایان تحقیقات' : 'سطح بعدی'}
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setSelectedOption(null);
                            setGameState('playing');
                        }}
                        className="bg-slate-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-600 transition-colors hover:shadow-lg"
                    >
                        تلاش مجدد
                    </button>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default FiveWhysGame;