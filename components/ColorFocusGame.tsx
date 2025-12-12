import React, { useEffect, useMemo, useState } from 'react';
import { Car, Flag, Flame, Gauge, Palette, ShieldCheck, Sparkles, Timer, Zap } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

type Directive = 'gate' | 'text' | 'avoid';

type ColorOption = {
  key: string;
  label: string;
  hex: string;
  gradient: string;
};

type Segment = {
  id: number;
  gate: ColorOption;
  word: ColorOption;
  directive: Directive;
  alt?: ColorOption;
  hint: string;
};

const PALETTE: ColorOption[] = [
  { key: 'red', label: 'قرمز', hex: '#ef4444', gradient: 'from-rose-500 to-red-500' },
  { key: 'blue', label: 'آبی', hex: '#3b82f6', gradient: 'from-sky-500 to-indigo-500' },
  { key: 'green', label: 'سبز', hex: '#22c55e', gradient: 'from-emerald-500 to-green-500' },
  { key: 'yellow', label: 'زرد', hex: '#eab308', gradient: 'from-amber-400 to-yellow-400' },
  { key: 'purple', label: 'بنفش', hex: '#a855f7', gradient: 'from-violet-500 to-purple-500' },
  { key: 'orange', label: 'نارنجی', hex: '#f97316', gradient: 'from-orange-500 to-amber-500' },
];

const GAME_DURATION = 55; // seconds
const ROAD_TARGET = 12; // number of gates to finish the lap
const BASE_GATE_WINDOW = 5.5; // seconds to auto-hit an obstacle
const MIN_GATE_WINDOW = 2.4;

const pickColor = (exclude: string[] = []) => {
  const pool = PALETTE.filter((c) => !exclude.includes(c.key));
  return pool[Math.floor(Math.random() * pool.length)];
};

const directiveCopy: Record<Directive, { title: string; detail: string }> = {
  gate: { title: 'به مانع نگاه کن', detail: 'بدنه مانع و خط پایان رنگ درست را به تو می‌گویند.' },
  text: { title: 'به کلمه اعتماد کن', detail: 'رنگ نوشته را انتخاب کن حتی اگر بدنه مانع فریب‌دهنده است.' },
  avoid: { title: 'دام رنگی', detail: 'رنگی را بزن که نوشته نشده است تا از مانع رد شوی.' },
};

const ColorFocusGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');
  const [hasStarted, setHasStarted] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [roundStart, setRoundStart] = useState<number | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [endReason, setEndReason] = useState<'time' | 'lives' | 'finish' | null>(null);
  const [gateTimer, setGateTimer] = useState(BASE_GATE_WINDOW);
  const [trackShift, setTrackShift] = useState(0);
  const [roadVibe, setRoadVibe] = useState<'calm' | 'fast'>('calm');

  const difficultyLevel = useMemo(() => Math.max(1, Math.ceil((progress + 1) / 3)), [progress]);
  const gateWindow = useMemo(
    () => Math.max(MIN_GATE_WINDOW, +(BASE_GATE_WINDOW - (difficultyLevel - 1) * 0.25 - combo * 0.08).toFixed(2)),
    [difficultyLevel, combo]
  );
  const currentSpeedMs = useMemo(() => Math.max(450, 1150 - combo * 45 - difficultyLevel * 35), [combo, difficultyLevel]);

  const generateSegment = (index: number): Segment => {
    const gate = pickColor();
    const word = pickColor();

    let directive: Directive = 'gate';
    if (difficultyLevel >= 3 && difficultyLevel < 6) {
      directive = Math.random() > 0.4 ? 'gate' : 'text';
    } else if (difficultyLevel >= 6) {
      const options: Directive[] = ['gate', 'text', 'avoid'];
      directive = options[Math.floor(Math.random() * options.length)];
    }

    const alt = pickColor([gate.key, word.key]);
    let hint = directiveCopy[directive].detail;

    return {
      id: index,
      gate,
      word,
      directive,
      alt,
      hint,
    };
  };

  const bootstrapTrack = () => {
    const initial = Array.from({ length: 4 }).map((_, idx) => generateSegment(idx + 1));
    setSegments(initial);
    setProgress(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(3);
    setAttempts(0);
    setCorrect(0);
    setTimeLeft(GAME_DURATION);
    setFlash(null);
    setFinished(false);
    setEndReason(null);
    setHasStarted(true);
    setRoundStart(Date.now());
    setGateTimer(BASE_GATE_WINDOW);
    setTrackShift(0);
    setRoadVibe('calm');
  };

  useEffect(() => {
    if (gameState === 'playing' && !hasStarted) {
      bootstrapTrack();
    }
  }, [gameState, hasStarted]);

  useEffect(() => {
    if (gameState !== 'playing' || finished) return;

    if (timeLeft <= 0) {
      finishRun('time');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          finishRun('time');
          return 0;
        }
        return Math.max(0, +(prev - 0.1).toFixed(2));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, finished, timeLeft]);

  const currentSegment = segments[0];

  useEffect(() => {
    if (!currentSegment || gameState !== 'playing' || finished) return;
    setGateTimer(gateWindow);
    setRoundStart(Date.now());
    setRoadVibe(gateWindow < 3.4 ? 'fast' : 'calm');
  }, [currentSegment?.id, gateWindow, gameState, finished]);

  const getTargetColor = (segment: Segment) => {
    if (segment.directive === 'gate') return segment.gate.key;
    if (segment.directive === 'text') return segment.word.key;
    return segment.alt?.key || segment.gate.key;
  };

  const finishRun = (reason: 'time' | 'lives' | 'finish') => {
    setFinished(true);
    setGameState('finished');
    setEndReason(reason);
  };

  const advanceTrack = (shouldCountProgress: boolean) => {
    const shiftStep = shouldCountProgress ? 1 : 0.9;

    setSegments((prev) => {
      if (!prev.length) return prev;
      const [, ...rest] = prev;
      const nextId = (prev[prev.length - 1]?.id || prev.length) + 1;
      const newSegment = generateSegment(nextId);
      const newSegments = [...rest, newSegment];

      setTrackShift((prevShift) => {
        const maxSpan = Math.max(1, newSegments.length - 1);
        const next = +(prevShift + shiftStep).toFixed(2);
        return next > maxSpan ? shiftStep : next;
      });

      return newSegments;
    });

    setGateTimer(gateWindow);
    setRoundStart(Date.now());
    setProgress((prev) => {
      const next = Math.min(ROAD_TARGET, prev + 1);
      if (next >= ROAD_TARGET) finishRun('finish');
      return next;
    });
  };

  const handleCrash = (countAttempt = false) => {
    if (countAttempt) setAttempts((prev) => prev + 1);
    sfx.playError();
    setFlash('wrong');
    setCombo(0);
    setRoadVibe('calm');
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) finishRun('lives');
      return Math.max(0, next);
    });
    setScore((prev) => Math.max(0, prev - 8));
    advanceTrack(false);
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => setFlash(null), 220);
  };

  useEffect(() => {
    if (!currentSegment || gameState !== 'playing' || finished) return;
    const timer = setInterval(() => {
      setGateTimer((prev) => {
        const next = +(prev - 0.1).toFixed(2);
        if (next <= 0) {
          clearInterval(timer);
          handleCrash(true);
          return 0;
        }
        return Math.max(0, next);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentSegment?.id, gameState, finished]);

  const handleChoice = (colorKey: string) => {
    if (gameState !== 'playing' || finished || !currentSegment) return;

    const target = getTargetColor(currentSegment);
    const reaction = roundStart ? Date.now() - roundStart : 800;

    setAttempts((prev) => prev + 1);

    if (colorKey === target) {
      sfx.playSuccess();
      setCorrect((prev) => prev + 1);
      setFlash('correct');

      const basePoints = 14 + difficultyLevel;
      const speedBonus = Math.max(0, Math.min(12, Math.round((1600 - reaction) / 130)));
      const comboBonus = Math.min(14, combo * 2);

      setCombo((prev) => {
        const next = prev + 1;
        setBestCombo((best) => Math.max(best, next));
        return next;
      });

      setScore((prev) => prev + basePoints + speedBonus + comboBonus);
      setRoadVibe(combo >= 3 ? 'fast' : 'calm');
      advanceTrack(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      handleCrash();
    }

    setTimeout(() => setFlash(null), 220);
  };

  const resetGame = () => {
    sfx.playClick();
    bootstrapTrack();
    setGameState('playing');
  };

  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const completionRate = Math.min(1, progress / ROAD_TARGET);
  const staminaBonus = Math.max(0, lives - 1) * 5;
  const flowScore = Math.min(60, Math.round((score / (ROAD_TARGET * 25)) * 60));
  const finalScore = Math.min(
    100,
    flowScore + Math.round(completionRate * 25) + Math.round(accuracy * 0.15) + Math.min(15, bestCombo * 2) + staminaBonus
  );
  const gateTimerPercent = Math.max(0, Math.round((gateTimer / gateWindow) * 100));
  const pacePercent = Math.min(100, Math.max(0, Math.round(((BASE_GATE_WINDOW - gateWindow) / (BASE_GATE_WINDOW - MIN_GATE_WINDOW)) * 100)));
  const remainingGates = Math.max(0, ROAD_TARGET - progress);
  const activeColorKey = currentSegment ? getTargetColor(currentSegment) : null;

  const stateBadge = useMemo(() => {
    if (!currentSegment) return null;
    const info = directiveCopy[currentSegment.directive];
    const colorClass =
      currentSegment.directive === 'gate'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
        : currentSegment.directive === 'text'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-amber-50 text-amber-700 border-amber-100';
    return (
      <div className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-sm ${colorClass}`}>
        <Sparkles size={16} />
        <div className="flex flex-col items-start leading-tight">
          <span>{info.title}</span>
          <span className="text-[10px] font-medium opacity-70">{info.detail}</span>
        </div>
      </div>
    );
  }, [currentSegment]);

  const finishCard = (
    <div className="h-full w-full flex items-center justify-center p-4 animate-fade-in-up">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-2xl border border-slate-100 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-purple-200/60 to-transparent blur-2xl" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-purple-200 mb-5">
            <ShieldCheck size={38} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">خط پایان</h2>
          <p className="text-slate-500 text-sm mb-6">
            {endReason === 'finish' ? 'همه موانع را رد کردی! امتیازت را ثبت کن.' : endReason === 'time' ? 'زمان به پایان رسید، ولی هنوز می‌توانی بهتر شوی.' : 'جان‌ها تمام شد، یک نفس عمیق و دوباره تلاش کن!'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 text-right">
              <div className="text-[11px] font-bold text-purple-500 mb-1">امتیاز تمرکز</div>
              <div className="text-4xl font-black text-slate-900">{toPersianNum(finalScore)}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">حاصل سرعت، دقت و کمبو</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-right shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 mb-1">پیشرفت مسیر</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-slate-900">{toPersianNum(progress)}</div>
                <div className="text-sm font-bold text-slate-400">از {toPersianNum(ROAD_TARGET)}</div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${completionRate * 100}%` }} />
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-right shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 mb-1">دقت رنگ</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-black text-emerald-600">{toPersianNum(accuracy)}٪</div>
                <div className="text-[11px] font-bold text-slate-400">{toPersianNum(correct)} از {toPersianNum(attempts)}</div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-right shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 mb-1">بهترین زنجیره</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-black text-amber-500">×{toPersianNum(bestCombo)}</div>
                <div className="text-[11px] font-bold text-slate-400">کمبوی متوالی</div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-right shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 mb-1">ریتم رانر</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-black text-indigo-600">٪{toPersianNum(pacePercent)}</div>
                <div className="text-[11px] font-bold text-slate-400">پنجره رنگ {toPersianNum(gateWindow.toFixed(1))} ثانیه</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => onComplete(finalScore)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-2xl font-black text-lg shadow-lg hover:-translate-y-0.5 transition-all"
            >
              ثبت و بازگشت
            </button>
            <button
              onClick={resetGame}
              className="w-full bg-white text-slate-600 py-3.5 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all"
            >
              تلاش دوباره
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGate = (segment: Segment, isActive = false, index = 0) => (
    <div
      key={segment.id}
      className="relative w-44 h-56 flex-shrink-0"
      style={{ transform: `translateY(${isActive ? '-8px' : '8px'}) scale(${isActive ? 1.05 : 0.97})` }}
    >
      <div className="absolute inset-x-5 bottom-1 h-14 bg-black/30 blur-3xl rounded-full" />
      <div
        className={`relative h-full rounded-3xl overflow-hidden border-2 shadow-2xl transition-all duration-500 ${
          isActive ? 'ring-4 ring-emerald-400/60 border-white/80' : 'border-white/20'
        }`}
        style={{ background: `linear-gradient(150deg, ${segment.gate.hex} 0%, ${segment.gate.hex}c7 60%, #0f172a 120%)` }}
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.32),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_0%,transparent_40%,rgba(255,255,255,0.15)_80%)]" />
        <div className="absolute inset-0 border-4 border-dashed border-white/20" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-black/25 backdrop-blur-sm" />

        <div className="absolute left-3 top-3 flex items-center gap-2 text-[11px] font-black bg-white/75 text-slate-800 px-2.5 py-1 rounded-2xl shadow-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: segment.gate.hex }} />
          {directiveCopy[segment.directive].title}
        </div>
        <div className="absolute right-3 top-3 text-[11px] font-bold text-white/80">{toPersianNum(index + 1)}</div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">{segment.word.label}</div>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-[11px] font-bold text-white/80">
          <div className="flex items-center gap-1"><Zap size={14} /> ریتم</div>
          <div className="flex items-center gap-1"><Palette size={14} /> {segment.alt?.label || segment.gate.label}</div>
        </div>
      </div>
    </div>
  );

  const gameplay = (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 border border-slate-100 shadow-sm">
            <Flag size={18} className="text-purple-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-slate-500">پیشرفت مسیر</span>
              <span className="text-base font-black text-slate-900">{toPersianNum(progress)} / {toPersianNum(ROAD_TARGET)}</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 border border-slate-100 shadow-sm">
            <Gauge size={18} className="text-indigo-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-slate-500">دقت لحظه‌ای</span>
              <span className="text-base font-black text-slate-900">{toPersianNum(accuracy)}٪</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 border border-slate-100 shadow-sm">
            <Flame size={18} className="text-amber-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-slate-500">ریتم مسیر</span>
              <span className="text-base font-black text-slate-900">٪{toPersianNum(pacePercent)}</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 border border-slate-100 shadow-sm">
            <Timer size={18} className="text-rose-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-slate-500">مهلت هر مانع</span>
              <span className="text-base font-black text-slate-900">{toPersianNum(gateWindow.toFixed(1))} ثانیه</span>
            </div>
          </div>
        </div>
        {stateBadge}
      </div>

      <div className="relative rounded-[32px] bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-purple-500/15 via-transparent to-transparent" />

        <div className="relative p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Car className="w-9 h-9" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">چالش رانر</div>
                <div className="text-xl font-black">
                  {currentSegment ? directiveCopy[currentSegment.directive].title : 'در حال آماده‌سازی مسیر...'}
                </div>
                <div className="text-sm text-slate-400 max-w-2xl">{currentSegment?.hint}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur">
              <div className="flex items-center gap-2 text-[12px] font-bold text-white/80">
                <Timer size={16} />
                تا برخورد: <span className="text-white">{toPersianNum(gateTimer.toFixed(1))} ث</span>
              </div>
              <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500" style={{ width: `${gateTimerPercent}%` }} />
              </div>
              <div className="text-[12px] font-bold text-amber-200">{toPersianNum(remainingGates)} مانع باقی</div>
              <div
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                  roadVibe === 'fast'
                    ? 'bg-amber-400/15 text-amber-100 border-amber-200/30'
                    : 'bg-white/5 text-white/80 border-white/10'
                }`}
              >
                {roadVibe === 'fast' ? 'حالت توربو' : 'ریتم پایدار'}
              </div>
            </div>
          </div>

          <div className={`relative rounded-3xl border-2 border-white/10 bg-white/5 backdrop-blur-lg p-4 ${flash === 'correct' ? 'ring-4 ring-emerald-400/50' : flash === 'wrong' ? 'ring-4 ring-rose-400/60' : ''}`}>
            <div className="absolute top-4 left-4 right-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-red-500" style={{ width: `${gateTimerPercent}%` }} />
            </div>
            <div className="flex items-end gap-5 pt-6 overflow-hidden">
              <div className="w-60 bg-white/10 border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow"> <Car size={22} /> </div>
                  <div>
                    <div className="text-xs text-slate-300">سرعت فعلی</div>
                    <div className="text-lg font-black">{toPersianNum(Math.round(Math.max(1, 120 - currentSpeedMs / 10)))} کیلومترِ ذهنی</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-200">
                  <div className="flex items-center gap-1"><Flame size={14} /> کمبو {toPersianNum(combo)}</div>
                  <div className="flex items-center gap-1"><Gauge size={14} /> ضربان {toPersianNum(Math.max(80, 80 + combo * 6))}</div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500" style={{ width: `${Math.min(100, 20 + combo * 10)}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>مسیر پیش رو</span>
                  <span className="flex items-center gap-1 text-amber-200"><Zap size={14} /> واکنش سریع = امتیاز بیشتر</span>
                </div>
                <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950">
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '120px 120px' }} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 left-1/2 w-1 bg-white/10" />
                  <div
                    className="absolute inset-0 flex items-end gap-5 px-6 transition-transform"
                    style={{ transform: `translateX(-${trackShift * 170}px)`, transitionDuration: `${currentSpeedMs}ms` }}
                  >
                    {segments.map((segment, idx) => renderGate(segment, idx === 0, idx))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PALETTE.map((color) => {
          const isTarget = activeColorKey === color.key;
          return (
            <button
              key={color.key}
              onClick={() => handleChoice(color.key)}
              className={`relative overflow-hidden rounded-2xl p-4 text-white font-black shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-white/60 ${
                isTarget ? 'ring-4 ring-white/70 scale-[1.02] shadow-purple-400/40' : 'hover:-translate-y-1'
              }`}
              style={{ backgroundImage: `linear-gradient(135deg, ${color.hex}, ${color.hex}cc)` }}
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
              {isTarget && <div className="absolute inset-0 bg-white/10" />}
              <div className="relative flex items-center justify-between">
                <span className="text-lg">{color.label}</span>
                <span className="w-8 h-8 rounded-xl bg-white/25 border border-white/40 shadow-inner" style={{ backgroundColor: `${color.hex}33` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <GameShell
      title="مسیر تمرکز رنگی"
      description="یک رانر رنگی با ریتم تند؛ رنگ درست را در زمان مناسب بزن تا خودرو از موانع عبور کند و کمبو بسازد."
      instructions={[
        'رانر خودکار است؛ قبل از تمام شدن نوار «تا برخورد» رنگ صحیح را فعال کن.',
        'قانون هر مانع در کارت بالای جاده نوشته شده: بدنه، نوشته یا رنگی که نباید انتخاب شود.',
        'کمبو و سرعت ریتم را بالا می‌برند؛ سه خطا جان‌ها را تمام می‌کند. ۱۲ مانع را رد کن تا برنده شوی.',
      ]}
      icon={<Palette />}
      stats={{ score, timeLeft: Math.ceil(timeLeft), level: difficultyLevel, combo, lives, maxLives: 3 }}
      gameState={gameState}
      setGameState={setGameState}
      onExit={onExit}
      onRestart={resetGame}
      colorTheme="purple"
    >
      {finished ? finishCard : gameplay}
    </GameShell>
  );
};

export default ColorFocusGame;
