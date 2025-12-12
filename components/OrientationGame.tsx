
import React, { useState, useEffect } from 'react';
import { Compass, Target, Move, LocateFixed } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const GAME_DURATION = 60;

type Direction = 'N' | 'E' | 'S' | 'W';
type ScreenDir = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
type Mode = 'COMPASS' | 'SCREEN';

const OrientationGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Core Logic State
  const [compassRotation, setCompassRotation] = useState(0); // Degrees
  const [target, setTarget] = useState<Direction | ScreenDir>('N');
  const [mode, setMode] = useState<Mode>('COMPASS');
  
  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  
  // Feedback
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && !hasStarted) {
      setHasStarted(true);
      generateRound();
    }
  }, [gameState, hasStarted]);

  const finishGame = () => {
      setIsFinished(true);
      setGameState('finished');
      if (score > 0) sfx.playWin();
  };

  const generateRound = () => {
      // Difficulty Logic
      // Lv 1: No Rotation, Compass Mode
      // Lv 2: 90 deg Rotation, Compass Mode
      // Lv 3: Random Rotation, Compass Mode
      // Lv 5: Mixed Modes (Screen vs Compass)
      
      let newRotation = compassRotation;
      let newMode: Mode = 'COMPASS';
      let newTarget: Direction | ScreenDir = 'N';

      // 1. Determine Rotation
      if (difficulty === 1) {
          newRotation = 0;
      } else if (difficulty < 4) {
          // Snap to 90s
          const snaps = [0, 90, 180, 270];
          newRotation = snaps[Math.floor(Math.random() * snaps.length)];
      } else {
          // Full chaos
          newRotation = Math.floor(Math.random() * 360);
      }

      // 2. Determine Mode
      if (difficulty >= 5 && Math.random() > 0.6) {
          newMode = 'SCREEN';
      }

      // 3. Determine Target
      if (newMode === 'COMPASS') {
          const dirs: Direction[] = ['N', 'E', 'S', 'W'];
          newTarget = dirs[Math.floor(Math.random() * dirs.length)];
      } else {
          const dirs: ScreenDir[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
          newTarget = dirs[Math.floor(Math.random() * dirs.length)];
      }

      setCompassRotation(newRotation);
      setMode(newMode);
      setTarget(newTarget);
      setFeedback(null);
  };

  const handleInput = (inputDir: ScreenDir) => {
      if (gameState !== 'playing' || feedback) return;

      let isCorrect = false;

      if (mode === 'SCREEN') {
          // Simple check
          isCorrect = inputDir === target;
      } else {
          // Mental Rotation Calculation
          // Logic: We need to find where the Target Compass Direction is relative to screen
          // North is at Rotation. 
          // If Compass North is at 90deg (Right), and Target is North, Input should be RIGHT.
          
          // Map input to degrees (0 is Up, 90 Right...)
          const inputDegMap: Record<ScreenDir, number> = { 'UP': 0, 'RIGHT': 90, 'DOWN': 180, 'LEFT': 270 };
          const inputAngle = inputDegMap[inputDir];

          // Target Offset from North
          const targetOffsetMap: Record<Direction, number> = { 'N': 0, 'E': 90, 'S': 180, 'W': 270 };
          const targetOffset = targetOffsetMap[target as Direction];

          // The angle of the target on screen = (CompassRotation + TargetOffset) % 360
          // We need to allow some margin for error if rotation is smooth (e.g. +/- 45 deg sector)
          let expectedAngle = (compassRotation + targetOffset) % 360;
          
          // Normalize angles for comparison (closest 90 degree sector)
          // Actually, let's map the expected angle to the closest ScreenDir
          if (expectedAngle >= 315 || expectedAngle < 45) expectedAngle = 0;
          else if (expectedAngle >= 45 && expectedAngle < 135) expectedAngle = 90;
          else if (expectedAngle >= 135 && expectedAngle < 225) expectedAngle = 180;
          else expectedAngle = 270;

          isCorrect = inputAngle === expectedAngle;
      }

      if (isCorrect) {
          sfx.playSuccess();
          // Scoring
          const basePoints = 50;
          const diffBonus = difficulty * 10;
          const comboBonus = Math.min(combo, 5) * 10;
          
          setScore(s => s + basePoints + diffBonus + comboBonus);
          setCombo(c => c + 1);
          setCorrectCount(c => c + 1);
          setDifficulty(d => Math.min(10, d + 1));
          setFeedback('correct');
          if (navigator.vibrate) navigator.vibrate(50);
      } else {
          sfx.playError();
          // Penalty
          setCombo(1);
          setWrongCount(w => w + 1);
          setDifficulty(d => Math.max(1, d - 1));
          setFeedback('wrong');
          if (navigator.vibrate) navigator.vibrate(200);
      }

      setTimeout(() => {
          generateRound();
      }, 250); // Short delay for feedback
  };

  const getTargetText = () => {
      const map: Record<string, string> = {
          'N': 'شمال', 'E': 'شرق', 'S': 'جنوب', 'W': 'غرب',
          'UP': 'بالا', 'RIGHT': 'راست', 'DOWN': 'پایین', 'LEFT': 'چپ'
      };
      return map[target];
  };

  const getRating = (s: number) => {
      if (s > 4000) return "ناوبر کیهانی";
      if (s > 2500) return "خلبان ارشد";
      if (s > 1000) return "جهت‌یاب";
      return "نیاز به تمرین";
  };

    if (isFinished) {
        const normalizedScore = Math.min(100, Math.round(score / 50));
        const rating = getRating(score);

      return (
        <div className="h-full flex items-center justify-center bg-slate-900 p-4 animate-fade-in-up font-sans">
             <div className="bg-slate-800 p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                   <Target size={40} className="text-cyan-400" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">عملیات ناوبری پایان یافت</h2>
                <div className="inline-block px-4 py-1 rounded-full bg-cyan-900/30 text-cyan-400 font-bold text-sm mb-8 border border-cyan-500/20">
                    {rating}
                </div>
                
                <div className="flex flex-col items-center gap-1 mb-8">
                   <span className="text-5xl font-black text-white tracking-tight">{toPersianNum(score)}</span>
                   <span className="text-xs text-slate-400 font-bold">امتیاز کل</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
                         <div className="text-emerald-400 font-black text-xl">{toPersianNum(correctCount)}</div>
                         <div className="text-[10px] font-bold text-slate-400">تشخیص صحیح</div>
                     </div>
                     <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
                         <div className="text-amber-400 font-black text-xl">{toPersianNum(difficulty)}</div>
                         <div className="text-[10px] font-bold text-slate-400">سطح نهایی</div>
                     </div>
                </div>

                <button onClick={() => onComplete(normalizedScore)} className="w-full bg-cyan-600 text-white py-4 rounded-xl font-bold hover:bg-cyan-500 transition-all shadow-lg hover:shadow-cyan-500/30 active:scale-95">
                   ثبت رکورد
                </button>
            </div>
        </div>
      );
  }

  // HUD Colors
  const hudColor = mode === 'COMPASS' ? 'text-cyan-400 border-cyan-500/30' : 'text-orange-400 border-orange-500/30';
  const hudBg = mode === 'COMPASS' ? 'bg-cyan-950/50' : 'bg-orange-950/50';

  return (
    <GameShell
      title="قطب‌نمای آشوب (A13)"
      description="سیستم تست انطباقی (CAT): جهت‌ها را پیدا کنید! وقتی قطب‌نما می‌چرخد، شمال دیگر بالا نیست. جهت خواسته شده را نسبت به وضعیت فعلی قطب‌نما انتخاب کنید."
      instructions={[
        'جهت خواسته شده را روی صفحه ببینید.',
        'اگر بازی در حالت قطب‌نماست، موقعیت جهت را با چرخش فعلی محاسبه کنید.',
        'اگر بازی در حالت صفحه است، جهت روی صفحه بدون چرخش قطب‌نما را انتخاب کنید.',
      ]}
      icon={<Compass />}
      stats={{ score, timeLeft, level: difficulty, combo }}
      onExit={onExit}
      onRestart={() => {
        setTimeLeft(GAME_DURATION);
        setScore(0);
        setCombo(1);
        setDifficulty(1);
        setCorrectCount(0);
        setWrongCount(0);
        setFeedback(null);
        setCompassRotation(0);
        setMode('COMPASS');
        setTarget('N');
        setHasStarted(false);
        setIsFinished(false);
        setGameState('playing');
      }}
      gameState={gameState}
      setGameState={setGameState}
      colorTheme="blue"
    >
      <div
        className={`h-full w-full bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center select-none transition-colors duration-500 ${
          feedback === 'correct' ? 'bg-emerald-950' : feedback === 'wrong' ? 'bg-red-950' : ''
        }`}
      >
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        ></div>

        {/* Center Game Area */}
        <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center">
          {/* The Compass Ring */}
          <div
            className={`w-64 h-64 md:w-80 md:h-80 rounded-full border-2 flex items-center justify-center relative transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
              mode === 'COMPASS' ? 'border-cyan-500/30' : 'border-slate-700 opacity-20'
            }`}
            style={{ transform: `rotate(${compassRotation}deg)` }}
          >
            {/* Cardinal Markers */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-950 px-2 text-cyan-400 font-black text-lg">N</div>
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 bg-slate-950 px-1 text-slate-500 font-bold text-xs">E</div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-950 px-1 text-slate-500 font-bold text-xs">S</div>
            <div className="absolute top-1/2 -left-3 -translate-y-1/2 bg-slate-950 px-1 text-slate-500 font-bold text-xs">W</div>

            {/* Inner Ticks */}
            <div className="absolute inset-2 border border-dashed border-slate-700 rounded-full opacity-50"></div>
            <div className="absolute w-full h-px bg-slate-800/50"></div>
            <div className="absolute h-full w-px bg-slate-800/50"></div>

            {/* North Indicator Triangle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-cyan-500 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          </div>

          {/* Central HUD / Target Display */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl ${hudBg} backdrop-blur-md border-2 ${hudColor} flex flex-col items-center justify-center shadow-2xl z-20 transition-colors duration-300 animate-pop`}
          >
            <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">
              {mode === 'COMPASS' ? 'قطب‌نما' : 'صفحه'}
            </div>
            <div className="text-4xl font-black mb-1">{getTargetText()}</div>
            {mode === 'SCREEN' && <Move size={16} className="opacity-50" />}
            {mode === 'COMPASS' && <LocateFixed size={16} className="opacity-50" />}
          </div>

          {/* Directional Controls (Invisible but clickable areas or styled buttons) */}

          {/* UP */}
          <button
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg active:scale-95 transition-all group z-30"
            onClick={() => handleInput('UP')}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-white group-hover:-translate-y-1 transition-transform"></div>
          </button>

          {/* RIGHT */}
          <button
            className="absolute right-0 top-1/2 translate-x-6 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg active:scale-95 transition-all group z-30"
            onClick={() => handleInput('RIGHT')}
          >
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-white group-hover:translate-x-1 transition-transform"></div>
          </button>

          {/* DOWN */}
          <button
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg active:scale-95 transition-all group z-30"
            onClick={() => handleInput('DOWN')}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-white group-hover:translate-y-1 transition-transform"></div>
          </button>

          {/* LEFT */}
          <button
            className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg active:scale-95 transition-all group z-30"
            onClick={() => handleInput('LEFT')}
          >
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[15px] border-r-white group-hover:-translate-x-1 transition-transform"></div>
          </button>
        </div>

        {/* Instructions Footer */}
        <div className="absolute bottom-16 md:bottom-8 text-center opacity-50 text-xs md:text-sm font-medium text-slate-400">
          {mode === 'COMPASS' ? 'جهت را روی قطب‌نما پیدا کنید' : 'جهت روی صفحه (مستقل از قطب‌نما)'}
        </div>
      </div>
    </GameShell>
  );
};

export default OrientationGame;
    