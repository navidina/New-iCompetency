
import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle2, TrendingUp, Eye } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

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
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');
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
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [roundStart, setRoundStart] = useState<number | null>(null);

  useEffect(() => {
    if (gameState === 'playing' && !finished && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
      return () => clearInterval(timer);
    }

    if (gameState === 'playing' && timeLeft <= 0 && !finished) {
      setFinished(true);
      setGameState('finished');
    }
  }, [gameState, timeLeft, finished]);

  useEffect(() => {
    if (gameState === 'playing' && !started) {
      setStarted(true);
      generateRound();
    }
  }, [gameState, started]);

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
    setRoundStart(Date.now());
  };

  const resetGame = () => {
    sfx.playClick();
    setScore(0);
    setDifficulty(1);
    setTimeLeft(GAME_DURATION);
    setFinished(false);
    setStarted(false);
    setAttempts(0);
    setCorrectCount(0);
    setCombo(0);
    setBestCombo(0);
    setFlash(null);
    setRoundStart(null);
    setCurrentRound({ text: '', colorHex: '', colorName: '' });
    setGameState('playing');
  };

  const handleAnswer = (selectedColorName: string) => {
    if (gameState !== 'playing' || finished) return;

    setAttempts(prev => prev + 1);
    const isCorrect = selectedColorName === currentRound.colorName;
    const reactionTime = roundStart ? Date.now() - roundStart : null;

    if (isCorrect) {
      sfx.playSuccess();
      setCorrectCount(prev => prev + 1);
      setFlash('correct');

      const basePoints = 10 + difficulty * 2;
      const speedBonus = reactionTime ? Math.max(0, Math.floor((2000 - reactionTime) / 200)) : 0;
      const comboBonus = Math.min(15, combo * 2);

      setCombo(prev => {
        const nextCombo = prev + 1;
        setBestCombo(prevBest => Math.max(prevBest, nextCombo));
        return nextCombo;
      });

      setScore(s => s + basePoints + speedBonus + comboBonus);

      // CAT: Increase difficulty for streaks
      setDifficulty(d => Math.min(10, d + 1));

      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      sfx.playError();
      // Penalty scales with current difficulty, but softer than before
      setScore(s => Math.max(0, s - Math.max(5, difficulty * 2)));
      setFlash('wrong');
      setCombo(0);

      // CAT: Decrease difficulty
      setDifficulty(d => Math.max(1, d - 1));

      if (navigator.vibrate) navigator.vibrate(200);
    }
    
    setTimeout(() => setFlash(null), 200);
    generateRound();
  };

  useEffect(() => {
    if (finished) {
      const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
      const normalizedScore = Math.min(
        100,
        Math.round(score * 0.6) + Math.round(accuracy * 0.4) + Math.min(20, bestCombo * 2)
      );

      if (normalizedScore >= 50) {
        sfx.playWin();
      } else {
        sfx.playSuccess();
      }
    }
  }, [finished, attempts, correctCount, score, bestCombo]);

  const getRating = (finalScore: number) => {
      if (finalScore >= 80) return "ذهن لیزری";
      if (finalScore >= 50) return "متمرکز";
      return "پراکنده";
  };

  if (finished) {
      const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
      const normalizedScore = Math.min(
        100,
        Math.round(score * 0.6) + Math.round(accuracy * 0.4) + Math.min(20, bestCombo * 2)
      );
      const rating = getRating(normalizedScore);

      return (
        <GameShell
          title="قدرت تمرکز (A14)"
          description="سیستم تست انطباقی (CAT): پاسخ‌های صحیح و سریع، سطح دشواری و امتیاز شما را بالا می‌برند. اشتباهات، امتیاز بیشتری کسر می‌کنند."
          instructions={[
            'نام رنگ نمایش داده شده را با رنگ نوشته مطابقت دهید.',
            'پاسخ سریع و صحیح کمبو و امتیاز بیشتری می‌دهد.',
            'اشتباهات کمبو را از بین می‌برند و سطح را پایین می‌آورند.',
          ]}
          icon={<Eye />}
          stats={{ score, timeLeft: Math.ceil(timeLeft), level: difficulty, combo }}
          gameState={gameState}
          setGameState={setGameState}
          onExit={onExit}
          colorTheme="rose"
        >
          <div className="h-full bg-white flex items-center justify-center p-4 animate-fade-in-up">
              <div className="max-w-md w-full bg-slate-50 p-8 rounded-[2rem] shadow-2xl text-center border border-slate-100">
                  <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Brain className="w-10 h-10 text-cyan-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">تحلیل تمرکز (CAT)</h2>
                  <div className="text-cyan-600 font-bold mb-6">{rating}</div>

                  <div className="text-5xl font-black text-slate-800 mb-2">{toPersianNum(normalizedScore)}</div>
                  <div className="text-xs font-bold text-slate-400 mb-8">امتیاز نهایی</div>

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
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2">
                          <Eye className="mx-auto text-cyan-500 mb-1" size={20} />
                          <div className="font-black text-2xl text-slate-800">{toPersianNum(bestCombo)}</div>
                          <div className="text-[10px] font-bold text-slate-400">بیشترین زنجیره پاسخ سریع</div>
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
        </GameShell>
      )
  }

  const progressPercent = (timeLeft / GAME_DURATION) * 100;
  const liveAccuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

  return (
    <GameShell
      title="قدرت تمرکز (A14)"
      description="سیستم تست انطباقی (CAT): پاسخ‌های صحیح و سریع، سطح دشواری و امتیاز شما را بالا می‌برند. اشتباهات، امتیاز بیشتری کسر می‌کنند."
      instructions={[
        'پس از شروع بازی، نام رنگ را با رنگ نوشته مطابقت دهید.',
        'پاسخ سریع و پیاپی، کمبو و امتیاز بیشتری ایجاد می‌کند.',
        'خطاها کمبو را ریست می‌کنند و سطح را کاهش می‌دهند.',
      ]}
      icon={<Eye />}
      stats={{ score, timeLeft: Math.ceil(timeLeft), level: difficulty, combo }}
      gameState={gameState}
      setGameState={setGameState}
      onExit={onExit}
      onRestart={resetGame}
      colorTheme="rose"
    >
      <div className={`h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-150 ${flash === 'correct' ? 'bg-emerald-100' : flash === 'wrong' ? 'bg-red-100' : 'bg-white'}`}>

        {/* Visual Timer Bar - TOP */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-200">
            <div
                className={`h-full bg-rose-500 transition-all duration-100 ease-linear`}
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="relative mb-12 transform hover:scale-105 transition-transform duration-300">
              <h1
                  className="text-7xl md:text-9xl font-black tracking-wider cursor-default select-none drop-shadow-2xl font-sans"
                  style={{ color: currentRound.colorHex, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                  {currentRound.text}
              </h1>
              <p className="text-center text-slate-300 font-bold mt-6 text-sm uppercase tracking-[0.2em] bg-slate-100 inline-block px-4 py-1 rounded-full mx-auto">رنگ را بخوانید</p>
              <div className="mt-4 flex flex-col md:flex-row gap-3 items-center justify-center">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold">{toPersianNum(liveAccuracy)}٪ دقت زنده</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100 shadow-sm">
                  <TrendingUp size={18} />
                  <span className="text-sm font-bold">{combo > 0 ? `${toPersianNum(combo)}× کومبو فعال` : 'کومبو بساز تا امتیاز بگیری'}</span>
                </div>
              </div>
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
    </GameShell>
  );
};

export default StroopGame;
