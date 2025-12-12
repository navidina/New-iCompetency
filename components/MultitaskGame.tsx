
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Split, TrendingUp } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const GAME_DURATION = 40;

const MultitaskGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1); // CAT Level
  const [hasStarted, setHasStarted] = useState(false);
  
  // Task 1: Math (Even/Odd)
  const [number, setNumber] = useState(0);
  
  // Task 2: Color Matching
  const [colorText, setColorText] = useState('قرمز');
  const [colorHex, setColorHex] = useState('red');
  
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Stats
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (!hasStarted) {
      setHasStarted(true);
      generateTasks();
    }

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(timer);
          setFinished(true);
          setGameState('finished');
          return 0;
        }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameState, hasStarted]);

  const generateTasks = () => {
      setFeedback(null);
      
      // CAT Logic: Number range increases with difficulty
      const maxNum = difficulty > 5 ? 500 : 100;
      setNumber(Math.floor(Math.random() * maxNum));

      const colors = [
          {name: 'قرمز', hex: '#ef4444'}, 
          {name: 'آبی', hex: '#3b82f6'}, 
          {name: 'سبز', hex: '#22c55e'}
      ];
      const textIdx = Math.floor(Math.random() * 3);
      const hexIdx = Math.random() > 0.5 ? textIdx : Math.floor(Math.random() * 3);
      
      setColorText(colors[textIdx].name);
      setColorHex(colors[hexIdx].hex);
  };

  const handleAnswer = (isEven: boolean, isMatch: boolean) => {
      if (gameState !== 'playing' || finished) return;
      setAttempts(prev => prev + 1);
      
      const correctEven = number % 2 === 0;
      const correctMatch = (colorText === 'قرمز' && colorHex === '#ef4444') || 
                           (colorText === 'آبی' && colorHex === '#3b82f6') || 
                           (colorText === 'سبز' && colorHex === '#22c55e');
      
      if (isEven === correctEven && isMatch === correctMatch) {
          sfx.playSuccess();
          setScore(s => s + (10 * difficulty));
          setCorrectCount(prev => prev + 1);
          setFeedback('correct');
          
          setDifficulty(d => Math.min(10, d + 1));

          if (navigator.vibrate) navigator.vibrate(50);
      } else {
          sfx.playError();
          setScore(s => Math.max(0, s - (5 * difficulty)));
          setFeedback('wrong');
          
          setDifficulty(d => Math.max(1, d - 1));

          if (navigator.vibrate) navigator.vibrate(200);
      }
      
      setTimeout(generateTasks, 300);
  };

  const getRating = (s: number) => {
      if (s > 80) return "خلبان جنگنده";
      if (s > 50) return "مدیر پروژه";
      return "تک‌وظیفه‌ای";
  };

    useEffect(() => {
      if (finished) {
        const normalizedScore = Math.min(100, Math.round(score / 30));
        if (normalizedScore > 0) {
          sfx.playWin();
        } else {
          sfx.playSuccess();
        }
      }
    }, [finished, score]);

    if (finished) {
        const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
        const normalizedScore = Math.min(100, Math.round(score / 30));
        const rating = getRating(normalizedScore);

        return (
          <div className="h-full flex items-center justify-center bg-purple-50 p-4 animate-fade-in-up">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-3xl w-full border border-purple-100 md:grid md:grid-cols-[1.2fr,1fr] md:items-center md:gap-10">
                 <div className="text-center md:text-right space-y-6">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center shadow-md">
                            <LayoutGrid size={40} className="text-purple-600" />
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-slate-800 mb-1">مدیریت همزمان (CAT)</h2>
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
                                {rating}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between md:gap-6">
                        <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-5xl font-black text-purple-600">{toPersianNum(score)}</span>
                            <span className="text-slate-400 font-bold text-sm">امتیاز وزنی</span>
                        </div>
                    </div>

                    <button onClick={() => onComplete(normalizedScore)} className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg transition-all active:scale-95 md:max-w-xs md:ml-auto">
                        ثبت نتیجه
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center">
                          <Split className="text-purple-400 mb-2" size={20}/>
                          <div className="font-black text-slate-800 text-xl">{toPersianNum(accuracy)}٪</div>
                          <div className="text-[10px] font-bold text-slate-400">دقت</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center">
                          <TrendingUp className="text-purple-400 mb-2" size={20}/>
                          <div className="font-black text-slate-800 text-xl">{toPersianNum(difficulty)}</div>
                          <div className="text-[10px] font-bold text-slate-400">سطح نهایی</div>
                      </div>
                 </div>
             </div>
         </div>
        );
    }

    return (
      <GameShell
        title="انجام همزمان امور (A15)"
        description="سیستم تست انطباقی (CAT): در سطوح بالاتر، اعداد پیچیده‌تر و زمان تصمیم‌گیری حیاتی‌تر می‌شود."
        instructions={[
          'در هر ثانیه دو قضاوت کنید: زوج بودن عدد و تطابق رنگ متن.',
          'جواب‌ها را بر اساس هر دو معیار انتخاب کنید تا امتیاز کامل بگیرید.',
          'خطا کمبو و سطح را کاهش می‌دهد؛ سرعت و دقت امتیاز را بیشتر می‌کند.',
        ]}
        icon={<LayoutGrid />}
        stats={{ score, timeLeft, level: difficulty }}
        onExit={onExit}
        onRestart={() => {
          setTimeLeft(GAME_DURATION);
          setScore(0);
          setDifficulty(1);
          setAttempts(0);
          setCorrectCount(0);
          setFeedback(null);
          setFinished(false);
          setHasStarted(false);
          setGameState('playing');
        }}
        gameState={gameState}
        setGameState={setGameState}
        colorTheme="purple"
      >
        <div className={`h-full text-white flex flex-col p-4 transition-colors duration-300 relative overflow-hidden ${feedback === 'correct' ? 'bg-emerald-900' : feedback === 'wrong' ? 'bg-red-900' : 'bg-purple-900'}`}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
              {/* Task 1 */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center justify-center border border-white/10 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-400/50"></div>
                  <h3 className="text-purple-200 font-bold mb-2 uppercase tracking-widest text-[10px] bg-purple-900/40 px-3 py-1 rounded-full">آیا عدد زوج است؟</h3>
                  <div className="text-8xl font-black text-white drop-shadow-lg">{toPersianNum(number)}</div>
              </div>

              {/* Task 2 */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center justify-center border border-white/10 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-pink-400/50"></div>
                  <h3 className="text-slate-200 font-bold mb-2 uppercase tracking-widest text-[10px] bg-pink-900/40 px-3 py-1 rounded-full">رنگ متن تطابق دارد؟</h3>
                  <div className="text-6xl font-black drop-shadow-lg transition-transform hover:scale-110 duration-200" style={{color: colorHex}}>{colorText}</div>
              </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3 h-48 max-w-2xl mx-auto w-full">
               <button onClick={() => handleAnswer(true, true)} className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all rounded-2xl font-bold text-lg shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-1 group">
                   <span className="text-2xl group-hover:-translate-y-1 transition-transform">✅ / ✅</span>
                   <span className="text-[10px] font-normal opacity-80">زوج + تطابق</span>
               </button>
               <button onClick={() => handleAnswer(false, false)} className="bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-2xl font-bold text-lg shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-1 group">
                   <span className="text-2xl group-hover:-translate-y-1 transition-transform">❌ / ❌</span>
                   <span className="text-[10px] font-normal opacity-80">فرد + عدم تطابق</span>
               </button>
               <button onClick={() => handleAnswer(true, false)} className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-2xl font-bold text-lg shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-1">
                   <span>✅ / ❌</span>
                   <span className="text-[10px] font-normal opacity-80">زوج / غلط</span>
               </button>
               <button onClick={() => handleAnswer(false, true)} className="bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all rounded-2xl font-bold text-lg shadow-lg border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-1">
                   <span>❌ / ✅</span>
                   <span className="text-[10px] font-normal opacity-80">فرد / درست</span>
               </button>
          </div>
        </div>
      </GameShell>
    );
  };

export default MultitaskGame;
