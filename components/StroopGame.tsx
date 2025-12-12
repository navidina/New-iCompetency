
import React, { useState, useEffect } from 'react';
import { Clock, Brain, AlertCircle, CheckCircle2, TrendingUp, Eye } from 'lucide-react';
import GameIntro from './GameIntro';
import { toPersianNum } from '../utils';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const COLORS = [
  { name: 'قرمز', hex: '#ef4444' },
  { name: 'آبی', hex: '#3b82f6' },
  { name: 'سبز', hex: '#22c55e' },
  { name: 'زرد', hex: '#eab308' },
  { name: 'بنفش', hex: '#9333ea' }, 
  { name: 'نارنجی', hex: '#f97316' }, 
];

const GAME_DURATION = 35;

const StroopGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1); // CAT Level
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentRound, setCurrentRound] = useState<{ text: string; colorHex: string; colorName: string }>({ text: '', colorHex: '', colorName: '' });
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  
  // Stats
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (started && !finished && timeLeft > 0) {
      // CAT Logic: Time consumption increases with difficulty? 
      // Actually, we make the time flow normally, but the points depend on difficulty.
      // But we can punish wrong answers more at higher difficulty.
      const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
      return () => clearInterval(timer);
    } else if (started && timeLeft <= 0 && !finished) {
      setFinished(true);
    }
  }, [started, timeLeft, finished]);

  const generateRound = () => {
    // Difficulty in Stroop can be:
    // 1. More colors
    // 2. Mismatch probability (Higher diff = more mismatches which are harder to process)
    
    // For CAT in this version, we will focus on SCORING adaptation mostly, 
    // as Stroop is inherently cognitively loading.
    
    const textIndex = Math.floor(Math.random() * COLORS.length);
    let colorIndex = Math.floor(Math.random() * COLORS.length);
    
    // At higher difficulty, increase chance of matching (which is actually easier?)
    // No, mismatch is harder (interference).
    // Let's ensure mismatch at high difficulty?
    // Actually, random is standard Stroop. 
    
    setCurrentRound({
      text: COLORS[textIndex].name,
      colorHex: COLORS[colorIndex].hex,
      colorName: COLORS[colorIndex].name
    });
  };

  const handleStart = () => {
    setShowIntro(false);
    setStarted(true);
    generateRound();
  };

  const handleAnswer = (selectedColorName: string) => {
    setAttempts(prev => prev + 1);
    const isCorrect = selectedColorName === currentRound.colorName;
    
    if (isCorrect) {
      // Score weighted by difficulty
      setScore(s => s + (1 * difficulty));
      setCorrectCount(prev => prev + 1);
      setFlash('correct');
      
      // CAT: Increase difficulty
      setDifficulty(d => Math.min(10, d + 1));

      // Bonus time for correct answer? Small amount.
      // setTimeLeft(t => Math.min(GAME_DURATION, t + 0.5));
      
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      // Penalty
      setScore(s => Math.max(0, s - difficulty)); // Higher penalty at higher levels
      setFlash('wrong');
      
      // CAT: Decrease difficulty
      setDifficulty(d => Math.max(1, d - 1));

      if (navigator.vibrate) navigator.vibrate(200);
    }
    
    setTimeout(() => setFlash(null), 200);
    generateRound();
  };

  const getRating = (finalScore: number) => {
      if (finalScore >= 80) return "ذهن لیزری";
      if (finalScore >= 50) return "متمرکز";
      return "پراکنده";
  };

  if (showIntro) {
    return (
      <GameIntro 
        title="قدرت تمرکز (A14)"
        description="سیستم تست انطباقی (CAT): پاسخ‌های صحیح و سریع، سطح دشواری و امتیاز شما را بالا می‌برند. اشتباهات، امتیاز بیشتری کسر می‌کنند."
        icon={<Eye />}
        gradientFrom="from-red-500"
        gradientTo="to-orange-600"
        accentColor="text-red-600"
        onStart={handleStart}
      />
    );
  }

  if (finished) {
      const normalizedScore = Math.min(100, Math.round(score / 2)); // Normalize roughly based on max possible attempts
      const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
      const rating = getRating(normalizedScore);

      return (
          <div className="h-full bg-white flex items-center justify-center p-4 animate-fade-in-up">
              <div className="max-w-md w-full bg-slate-50 p-8 rounded-[2rem] shadow-2xl text-center border border-slate-100">
                  <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Brain className="w-10 h-10 text-cyan-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">تحلیل تمرکز (CAT)</h2>
                  <div className="text-cyan-600 font-bold mb-6">{rating}</div>
                  
                  <div className="text-5xl font-black text-slate-800 mb-2">{toPersianNum(score)}</div>
                  <div className="text-xs font-bold text-slate-400 mb-8">امتیاز خام</div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <CheckCircle2 className="mx-auto text-emerald-500 mb-1" size={20} />
                          <div className="font-black text-2xl text-slate-800">{toPersianNum(accuracy)}٪</div>
                          <div className="text-[10px] font-bold text-slate-400">دقت پاسخ</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <TrendingUp className="mx-auto text-orange-500 mb-1" size={20} />
                          <div className="font-black text-2xl text-slate-800">{toPersianNum(difficulty)}</div>
                          <div className="text-[10px] font-bold text-slate-400">سطح نهایی</div>
                      </div>
                  </div>
                  
                  <button 
                    onClick={() => onComplete(normalizedScore)}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95"
                  >
                    ثبت نتیجه
                  </button>
              </div>
          </div>
      )
  }

  const progressPercent = (timeLeft / GAME_DURATION) * 100;

  return (
    <div className={`h-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-150 ${flash === 'correct' ? 'bg-emerald-100' : flash === 'wrong' ? 'bg-red-100' : 'bg-white'}`}>
      
      {/* Visual Timer Bar - TOP */}
      <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 z-50">
          <div 
              className={`h-full bg-cyan-500 transition-all duration-100 ease-linear`} 
              style={{ width: `${progressPercent}%` }}
          ></div>
      </div>

      {/* HUD */}
      <div className="absolute top-6 w-full max-w-2xl px-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-xl tabular-nums font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
             <Clock size={18} /> {toPersianNum(Math.ceil(timeLeft))}
          </div>
          
          <div className="flex items-center gap-2">
             <div className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">Lv {toPersianNum(difficulty)}</div>
             <div className="tabular-nums text-xl font-bold text-cyan-600 bg-cyan-50 px-4 py-1.5 rounded-full border border-cyan-100">
                {toPersianNum(score)}
             </div>
          </div>
      </div>

      <button onClick={onExit} className="absolute top-20 text-slate-400 hover:text-slate-600 text-xs font-bold z-10">
          انصراف
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative mb-12 transform hover:scale-105 transition-transform duration-300">
            <h1 
                className="text-7xl md:text-9xl font-black tracking-wider cursor-default select-none drop-shadow-2xl font-sans"
                style={{ color: currentRound.colorHex, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
                {currentRound.text}
            </h1>
            <p className="text-center text-slate-300 font-bold mt-6 text-sm uppercase tracking-[0.2em] bg-slate-100 inline-block px-4 py-1 rounded-full mx-auto">رنگ را بخوانید</p>
        </div>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 p-4 z-10">
        {COLORS.map((btnColor) => (
           <button
             key={btnColor.name}
             onClick={() => handleAnswer(btnColor.name)}
             className="py-5 rounded-xl bg-white border border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] hover:shadow-[0_2px_0_rgb(226,232,240)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all font-bold text-slate-700 text-xl"
           >
             {btnColor.name}
           </button>
        ))}
      </div>
    </div>
  );
};

export default StroopGame;
