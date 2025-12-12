import React, { useState, useEffect } from 'react';
import { Box, Check, X, Scan, RotateCw, HelpCircle, BrainCircuit } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const MAX_ROUNDS = 10;

// 3D Cube Component
const Cube3D = ({ size = 64, rotateZ = 0, color = 'indigo', className = '' }: { size?: number, rotateZ?: number, color?: 'indigo' | 'emerald' | 'red' | 'slate', className?: string }) => {
  const colors = {
    indigo: { front: '#6366f1', side: '#312e81', top: '#818cf8', marker: '#e0e7ff' }, // Darker side for contrast
    emerald: { front: '#10b981', side: '#064e3b', top: '#6ee7b7', marker: '#d1fae5' },
    red: { front: '#ef4444', side: '#7f1d1d', top: '#fca5a5', marker: '#fee2e2' },
    slate: { front: '#64748b', side: '#1e293b', top: '#94a3b8', marker: '#f1f5f9' }
  }[color];

  const half = size / 2;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer Rotation (Game Logic - 2D spin) */}
      <div
        className="w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${rotateZ}deg)` }}
      >
        {/* Inner Isometric Projection (Fixed 3D View) */}
        <div
            className="w-full h-full relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(-30deg) rotateY(45deg)'
            }}
        >
            {/* Faces */}
            {/* Front */}
            <div
                className="absolute inset-0 border-2 border-white/20 flex items-center justify-center shadow-inner"
                style={{ backgroundColor: colors.front, transform: `translateZ(${half}px)` }}
            >
                <div className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: colors.marker }}></div>
            </div>

            {/* Back */}
            <div
                className="absolute inset-0 border-2 border-white/20"
                style={{ backgroundColor: colors.front, transform: `rotateY(180deg) translateZ(${half}px)` }}
            />
            {/* Right */}
            <div
                className="absolute inset-0 border-2 border-white/20"
                style={{ backgroundColor: colors.side, transform: `rotateY(90deg) translateZ(${half}px)` }}
            />
            {/* Left */}
            <div
                className="absolute inset-0 border-2 border-white/20"
                style={{ backgroundColor: colors.side, transform: `rotateY(-90deg) translateZ(${half}px)` }}
            />
            {/* Top */}
            <div
                className="absolute inset-0 border-2 border-white/20"
                style={{ backgroundColor: colors.top, transform: `rotateX(90deg) translateZ(${half}px)` }}
            />
            {/* Bottom */}
            <div
                className="absolute inset-0 border-2 border-white/20"
                style={{ backgroundColor: colors.top, transform: `rotateX(-90deg) translateZ(${half}px)` }}
            />
        </div>
      </div>
    </div>
  );
};

// Helper Component for Visual Angle
const AngleGauge = ({ degrees }: { degrees: number }) => {
  const radius = 36;
  const center = 50;
  const startAngle = -90; 
  const endAngle = startAngle + degrees;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const x1 = center + radius * Math.cos(toRad(startAngle));
  const y1 = center + radius * Math.sin(toRad(startAngle));
  
  const x2 = center + radius * Math.cos(toRad(endAngle));
  const y2 = center + radius * Math.sin(toRad(endAngle));

  const largeArcFlag = degrees > 180 ? 1 : 0;

  const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center bg-slate-800/50 rounded-full border-2 border-slate-700 shadow-inner">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="50" y1="10" x2="50" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d={pathData} fill="#818cf8" fillOpacity="0.4" stroke="#818cf8" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-300 pt-8">
            {toPersianNum(degrees)}°
        </div>
        <RotateCw size={14} className="absolute top-2 text-indigo-400" />
    </div>
  );
};

const VisualizationGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');
  const [round, setRound] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [targetRotation, setTargetRotation] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
      if (gameState === 'playing') generateLevel();
  }, [round, gameState]);

  const generateLevel = () => {
      let step = 90;
      if (difficulty >= 3) step = 45;
      if (difficulty >= 7) step = 30;

      const rot = Math.floor(Math.random() * (360 / step)) * step;
      const finalRot = rot === 0 ? step : rot;
      
      setTargetRotation(finalRot);

      const correct = finalRot;
      const uniqueOptions = new Set([correct]);
      while (uniqueOptions.size < 3) {
          const rand = Math.floor(Math.random() * (360 / step)) * step;
          if (rand !== correct) uniqueOptions.add(rand);
      }

      setOptions(Array.from(uniqueOptions).sort(() => Math.random() - 0.5));
      setSelectedOption(null);
      setIsCorrect(null);
  }

  const handleGuess = (deg: number) => {
      if (selectedOption !== null) return;

      const correct = deg === targetRotation;
      setSelectedOption(deg);
      setIsCorrect(correct);

      if (correct) {
          setScore(s => s + (10 * difficulty));
          setDifficulty(d => Math.min(10, d + 1));
      } else {
          setDifficulty(d => Math.max(1, d - 1));
      }
      
      setTimeout(() => {
          if (round < MAX_ROUNDS) {
              setRound(r => r + 1);
          } else {
              setGameState('finished');
          }
      }, 1200);
  };

  if (gameState === 'finished') {
      const normalizedScore = Math.min(100, Math.round(score / 5));
      return (
        <div className="h-full flex items-center justify-center bg-indigo-50 p-4 animate-fade-in-up">
             <div className="bg-white p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full border border-indigo-100">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <BrainCircuit size={40} className="text-indigo-600" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 mb-2">پایان آزمون</h2>
                <div className="flex flex-col items-center gap-1 mb-8">
                    <span className="text-5xl font-black text-slate-800">{toPersianNum(score)}</span>
                    <span className="text-xs text-slate-400 font-bold">امتیاز خام</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <Scan className="text-indigo-500" size={18} />
                         <span className="text-sm font-bold text-slate-600">سطح نهایی</span>
                     </div>
                     <span className="text-xl font-black text-indigo-600">{toPersianNum(difficulty)}</span>
                </div>

                <button onClick={() => onComplete(normalizedScore)} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30">
                    ثبت نتیجه
                </button>
            </div>
        </div>
      )
  }

  return (
    <GameShell
        title="قدرت تجسم (A12)"
        description="این آزمون توانایی چرخش ذهنی شما را می‌سنجد. یک شکل سه بعدی و مقدار چرخش آن داده می‌شود. نتیجه نهایی را انتخاب کنید."
        instructions={[
            "به مکعب سمت راست و زاویه چرخش دقت کنید.",
            "مکعب را در ذهن خود بچرخانید.",
            "گزینه‌ای که وضعیت نهایی مکعب را نشان می‌دهد انتخاب کنید."
        ]}
        icon={<Box />}
        stats={{ score, level: difficulty, timeLeft: undefined, lives: undefined }} // No timer or lives in this version
        gameState={gameState}
        setGameState={setGameState}
        colorTheme="indigo"
        onExit={onExit}
        onRestart={() => { setRound(1); setScore(0); setDifficulty(1); setGameState('playing'); }}
    >
        <div className="h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">

            {/* Round Indicator */}
            <div className="absolute top-4 left-4 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-indigo-200">
                مرحله {toPersianNum(round)} / {toPersianNum(MAX_ROUNDS)}
            </div>

            {/* --- The Visual Equation --- */}
            <div className="w-full max-w-3xl mb-12 flex items-center justify-center gap-4 md:gap-8 z-10 scale-90 md:scale-100">

                {/* 1. Original Shape */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-500/20 rounded-3xl border-2 border-indigo-500/30 flex items-center justify-center shadow-2xl relative backdrop-blur-sm">
                        <div className="absolute -top-3 bg-indigo-900 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-700 shadow-sm">مبدا</div>
                        <Cube3D size={64} rotateZ={0} color="indigo" />
                    </div>
                </div>

                {/* Operator */}
                <div className="text-2xl md:text-3xl font-black text-slate-500">+</div>

                {/* 2. Rotation Instruction */}
                <div className="flex flex-col items-center gap-2">
                    <AngleGauge degrees={targetRotation} />
                    <span className="text-[10px] font-bold text-slate-400">چرخش</span>
                </div>

                {/* Operator */}
                <div className="text-2xl md:text-3xl font-black text-slate-500">=</div>

                {/* 3. Result Placeholder */}
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 border-dashed flex items-center justify-center shadow-inner transition-all duration-300 ${selectedOption !== null ? (isCorrect ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500') : 'bg-slate-800/50 border-slate-600'}`}>
                        {selectedOption !== null ? (
                            <Cube3D
                                size={64}
                                rotateZ={selectedOption}
                                color={isCorrect ? 'emerald' : 'red'}
                            />
                        ) : (
                            <HelpCircle size={40} className="text-slate-600 animate-pulse" />
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">نتیجه؟</span>
                </div>

            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 w-full max-w-2xl px-4 z-10">
                {options.map((optDeg, idx) => {
                    const isSelected = selectedOption === optDeg;
                    const isTarget = optDeg === targetRotation;

                    let ringClass = "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800";
                    if (selectedOption !== null) {
                        if (isSelected) {
                            ringClass = isCorrect ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20" : "border-red-500 bg-red-500/10 ring-2 ring-red-500/20";
                        } else if (isTarget) {
                            ringClass = "border-emerald-500/50 bg-emerald-500/5 dashed"; // Hint correct answer if wrong
                        } else {
                            ringClass = "border-slate-800 opacity-20";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleGuess(optDeg)}
                            disabled={selectedOption !== null}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 relative overflow-visible group ${ringClass}`}
                        >
                            <div className="absolute top-2 right-3 text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">{toPersianNum(idx + 1)}</div>

                            <div className="transform transition-transform duration-300 group-hover:scale-110">
                                {/* Use 'indigo' for options instead of 'slate' to make them pop */}
                                <Cube3D
                                    size={48}
                                    rotateZ={optDeg}
                                    color={selectedOption === null ? 'indigo' : (isSelected && isCorrect ? 'emerald' : (isSelected && !isCorrect ? 'red' : 'indigo'))}
                                />
                            </div>

                            {isSelected && (
                                <div className="absolute -bottom-3 bg-white rounded-full p-1 shadow-lg">
                                    {isCorrect ? <Check size={16} className="text-emerald-600" /> : <X size={16} className="text-red-600" />}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="mt-12 text-slate-500 text-xs font-medium text-center">
                گزینه صحیح را انتخاب کنید
            </div>
        </div>
    </GameShell>
  );
};

export default VisualizationGame;
