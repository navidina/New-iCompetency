import React, { useState, useEffect } from 'react';
import { useMathGame } from '../../../hooks/useMathGame';
import GameShell from '../../../../components/GameShell';
import { Calculator, Check, Delete, RotateCcw, X } from 'lucide-react';
import { toPersianNum } from '../../../utils/formatting';
import { toTScoreWithExplanation } from '../../../utils/scoring';
import { ScoreExplanationCard } from '../../common/ScoreExplanationCard';

interface MathGameProps {
  onFinish: (score: number, details?: any) => void;
}

const MathGame: React.FC<MathGameProps> = ({ onFinish }) => {
  const {
    gameState,
    score,
    timeLeft,
    currentLevel,
    question,
    userInput,
    feedback,
    streak,
    startGame,
    handleInput,
    submitAnswer
  } = useMathGame();

  const [shellState, setShellState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  // Sync Start
  useEffect(() => {
    if (shellState === 'playing' && gameState === 'IDLE') {
      startGame();
    }
  }, [shellState, gameState, startGame]);

  // Sync Finish
  useEffect(() => {
    if (gameState === 'GAMEOVER') {
        // We don't automatically close the shell, we show game over UI inside.
    }
  }, [gameState]);

  const handleFinish = () => {
    onFinish(score, { levelReached: currentLevel });
  };

  const handleNumpadClick = (num: string) => {
    if (gameState !== 'PLAYING') return;
    if (userInput.length < 8) {
      handleInput(userInput + num);
    }
  };

  const handleBackspace = () => {
     if (gameState !== 'PLAYING') return;
     handleInput(userInput.slice(0, -1));
  };

  const handleClear = () => {
      if (gameState !== 'PLAYING') return;
      handleInput('');
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shellState !== 'playing' || gameState !== 'PLAYING') return;

      if (e.key >= '0' && e.key <= '9') {
        handleNumpadClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        submitAnswer();
      } else if (e.key === 'Escape' || e.key === 'c') {
          handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shellState, gameState, userInput, submitAnswer]);

  return (
    <GameShell
      title="هوش محاسباتی"
      description="به سوالات ریاضی با بیشترین سرعت و دقت پاسخ دهید. سرعت بالاتر امتیاز بیشتر دارد."
      instructions={[
        "سوال ریاضی نمایش داده شده را حل کنید.",
        "پاسخ را با صفحه کلید یا دکمه‌های روی صفحه وارد کنید.",
        "برای تایید دکمه تیک سبز یا Enter را بزنید.",
        "پاسخ صحیح زمان اضافه می‌کند، پاسخ غلط زمان کم می‌کند."
      ]}
      icon={<Calculator />}
      stats={{
        score,
        level: currentLevel,
        timeLeft: timeLeft / 1000, // GameShell expects seconds usually? No, it uses Math.ceil(stats.timeLeft). If I pass ms, it will show huge number.
        // Wait, GameShell render: {toPersianNum(Math.ceil(stats.timeLeft))}
        // If I pass 300000, it shows 300000.
        // Usually timer is in seconds.
        // My hook uses ms.
        // I should pass seconds.
        combo: streak
      }}
      gameState={shellState}
      setGameState={setShellState}
      onExit={() => onFinish(score)}
      onRestart={startGame}
      colorTheme="blue"
    >
      <div className="flex flex-col items-center w-full max-w-lg mx-auto h-full justify-between pb-4" dir="rtl">

        {/* Question Display */}
        <div className="flex-1 flex flex-col items-center justify-center w-full mb-4 relative">
             {gameState === 'PLAYING' && question ? (
                 <div className="text-5xl md:text-6xl font-bold text-slate-800 tracking-wider mb-8 dir-ltr">
                     {/* Render text directly. If it has Persian chars (from generator), it's fine.
                         But math is usually LTR even in Persian context for formulas?
                         Prompt says: "50% of 100" -> "۵۰٪ عدد ۱۰۰". This is RTL.
                         "12 + 5" -> "۱۲ + ۵". This is LTR structure usually.
                         Let's just center it.
                     */}
                     {/* We might want to format numbers to Persian if text contains digits */}
                     {toPersianNum(question.text)}
                 </div>
             ) : (
                gameState === 'GAMEOVER' && (
                    <div className="text-2xl font-bold text-slate-800 animate-bounce">
                        زمان تمام شد!
                    </div>
                )
             )}

             {/* Feedback Overlay */}
             {feedback !== 'none' && (
                 <div className={`absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10 animate-fade-in`}>
                     {feedback === 'correct' ? (
                         <Check className="w-24 h-24 text-green-500 drop-shadow-lg" />
                     ) : (
                         <X className="w-24 h-24 text-red-500 drop-shadow-lg" />
                     )}
                 </div>
             )}
        </div>

        {/* Input Display */}
        <div className="w-full mb-6">
            <div className={`
                w-full h-16 bg-white rounded-xl shadow-inner border-2 flex items-center justify-center text-3xl font-bold text-slate-700
                ${feedback === 'correct' ? 'border-green-400 bg-green-50' : ''}
                ${feedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-slate-200'}
            `}>
                {toPersianNum(userInput) || <span className="text-gray-300 text-2xl">پاسخ...</span>}
            </div>
        </div>

        {/* Numpad */}
        <div className="w-full grid grid-cols-4 gap-3">
            {[7, 8, 9].map(n => (
                <NumpadBtn key={n} onClick={() => handleNumpadClick(n.toString())}>{n}</NumpadBtn>
            ))}
            <button
                onClick={handleClear}
                className="bg-red-100 text-red-600 rounded-xl font-bold text-xl hover:bg-red-200 active:scale-95 transition-all flex items-center justify-center"
            >
                C
            </button>

            {[4, 5, 6].map(n => (
                <NumpadBtn key={n} onClick={() => handleNumpadClick(n.toString())}>{n}</NumpadBtn>
            ))}
            <button
                onClick={handleBackspace}
                className="bg-slate-100 text-slate-600 rounded-xl font-bold text-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
            >
                <Delete className="w-6 h-6" />
            </button>

            {[1, 2, 3].map(n => (
                <NumpadBtn key={n} onClick={() => handleNumpadClick(n.toString())}>{n}</NumpadBtn>
            ))}
             <button
                onClick={submitAnswer}
                className="row-span-2 bg-blue-600 text-white rounded-xl font-bold text-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-blue-200"
            >
                <Check className="w-8 h-8" />
            </button>

            <NumpadBtn className="col-span-2" onClick={() => handleNumpadClick('0')}>0</NumpadBtn>
            <NumpadBtn onClick={() => handleNumpadClick('.')}>.</NumpadBtn>
        </div>

        {gameState === 'GAMEOVER' && (
             <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6">
                <div className="text-3xl font-bold text-slate-800 mb-2">پایان بازی</div>
                <div className="text-lg text-slate-600 mb-4">امتیاز نهایی: {toPersianNum(score)}</div>

                <div className="w-full max-w-md mb-8 h-64 overflow-y-auto custom-scrollbar">
                    <ScoreExplanationCard
                        explanation={toTScoreWithExplanation(score, 1000, 250, 'Math Score').explanation}
                    />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={startGame}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5" />
                    تلاش مجدد
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    <Check className="w-5 h-5" />
                    ثبت نتیجه
                  </button>
                </div>
             </div>
        )}

      </div>
    </GameShell>
  );
};

const NumpadBtn: React.FC<{ children: React.ReactNode, onClick: () => void, className?: string }> = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`
            bg-white text-slate-700 rounded-xl font-bold text-2xl h-14
            shadow-sm border-b-4 border-slate-200 active:border-b-0 active:translate-y-1
            hover:bg-slate-50 transition-all
            ${className}
        `}
    >
        {typeof children === 'string' || typeof children === 'number' ? toPersianNum(children) : children}
    </button>
);

export default MathGame;
