
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Database, Zap, Play, RotateCcw, 
  Server, Lock, Unlock, Eye, HelpCircle, 
  Brain, CheckCircle2, XCircle, Radar, Target,
  Briefcase, Cloud, Terminal, Cpu, Wifi, Radio,
  Globe, Monitor, Anchor, Activity, AlertCircle, Clock, Heart
} from 'lucide-react';
import { toPersianNum } from '../utils';
import { UserProfile } from '../types';
import { sfx } from '../services/audioService';
import CorsiBlockGame from '../src/components/games/memory/CorsiBlockGame';
import PairedAssociationGame from '../src/components/games/memory/PairedAssociationGame';
import NBackGame from '../src/components/games/memory/NBackGame';
import DelayedRecallGame from '../src/components/games/memory/DelayedRecallGame';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
  user?: UserProfile;
  onStepComplete?: (game: 'corsi' | 'pairs' | 'nback' | 'recall', score: number) => void;
}

// --- Shared Components ---

const GameResult: React.FC<{ 
  title: string; 
  score: number; 
  metrics: { label: string; value: string }[]; 
  onExit: () => void;
}> = ({ title, score, metrics, onExit }) => {
  useEffect(() => { sfx.playWin(); }, []);
  return (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-scale-in">
    <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
        <Brain size={48} className="text-white" />
    </div>
    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">تحلیل عملکرد شناختی</p>
    
    <div className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-8 tracking-tighter drop-shadow-sm">{toPersianNum(score)}</div>
    
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-bold text-slate-800 dark:text-white mb-1">{m.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase">{m.label}</div>
            </div>
        ))}
    </div>

    <button onClick={onExit} className="w-full max-w-sm bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
        ثبت نتیجه و خروج
    </button>
  </div>
)};

// --- Game 1: Corsi Block (External) ---
// See src/components/games/memory/CorsiBlockGame.tsx

// --- Game 2: Paired Association (External) ---
// See src/components/games/memory/PairedAssociationGame.tsx

// --- Game 3: N-Back (External) ---
// See src/components/games/memory/NBackGame.tsx

// --- Main Container ---

interface MenuCardProps {
    id: 'corsi' | 'pairs' | 'nback' | 'recall';
    title: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
    score: number;
    isDone: boolean;
    customStatus?: string;
}

const MemoryGame: React.FC<Props> = ({ onExit, onComplete, user, onStepComplete }) => {
    const [view, setView] = useState<'menu' | 'corsi' | 'pairs' | 'nback' | 'recall'>('menu');
    const [scores, setScores] = useState({ corsi: 0, pairs: 0, nback: 0, recall: 0 });
    const [completed, setCompleted] = useState({ corsi: false, pairs: false, nback: false, recall: false });
    const [recallState, setRecallState] = useState<any>(null);

    useEffect(() => {
        // Load recall state for menu status
        const saved = localStorage.getItem('iCompetency_DelayedRecall');
        if (saved) {
             setRecallState(JSON.parse(saved));
        }
    }, [view]);

    // Initialize state from user profile to remember progress
    useEffect(() => {
        if (user && user.memorySubScores) {
            setScores(prev => ({ ...prev, ...user.memorySubScores }));
            setCompleted({
                corsi: user.memorySubScores.corsi > 0,
                pairs: user.memorySubScores.pairs > 0,
                nback: user.memorySubScores.nback > 0,
                recall: recallState?.phase === 'FINISHED' // Approximate check
            });
        }
    }, [user, recallState]);

    const handleFinishSubGame = (game: 'corsi' | 'pairs' | 'nback' | 'recall', score: number) => {
        const newScores = { ...scores, [game]: score };
        setScores(newScores);
        setCompleted(prev => ({ ...prev, [game]: true }));
        
        if (onStepComplete) {
            onStepComplete(game, score);
        }

        setView('menu');
    };

    const allDone = completed.corsi && completed.pairs && completed.nback && completed.recall;
    const finalScore = Math.round((scores.corsi + scores.pairs + scores.nback + scores.recall) / 4);

    const getRecallStatus = () => {
        if (!recallState) return "شروع نشده";
        if (recallState.phase === 'FINISHED') return "تکمیل شده";
        if (recallState.phase === 'DELAY_WAIT') return "در انتظار (۲۰ دقیقه)";
        if (recallState.phase === 'DELAY_RECALL') return "آماده مرحله ۲";
        if (recallState.phase === 'LEARNING' || recallState.phase === 'INTRO') return "مرحله ۱: یادگیری";
        return "در جریان";
    };

    const MenuCard = ({ id, title, desc, icon: Icon, color, bg, score, isDone, customStatus }: MenuCardProps) => (
        <button 
            onClick={() => { sfx.playClick(); setView(id); }}
            onMouseEnter={() => sfx.playHover()}
            className={`w-full p-4 md:p-6 rounded-3xl border-2 transition-all flex items-center gap-4 md:gap-6 text-right group relative overflow-hidden ${isDone ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg'}`}
        >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={28} className={`md:w-8 md:h-8 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-black text-slate-800 mb-1 truncate">{title}</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium truncate">{desc}</p>
                {customStatus && !isDone && (
                    <div className="text-[10px] text-amber-500 font-bold mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded-md">
                        {customStatus}
                    </div>
                )}
            </div>
            {isDone ? (
                <div className="flex flex-col items-center">
                    <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                    <div className="text-xs font-black text-slate-900">{toPersianNum(score)}%</div>
                </div>
            ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                    <Play size={14} className="md:w-4 md:h-4" fill="currentColor" />
                </div>
            )}
        </button>
    );

    if (view === 'menu') {
        return (
            <div className="h-full bg-slate-50 flex flex-col items-center p-4 md:p-6 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800">سنجش جامع حافظه (CAT)</h1>
                            <p className="text-slate-500 font-bold text-xs md:text-sm mt-1">متدولوژی تست انطباقی کامپیوتری</p>
                        </div>
                        <button onClick={onExit} className="text-sm font-bold text-slate-400 hover:text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">خروج</button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <MenuCard
                            id="recall" title="یادآوری کلمات (Delayed Recall)"
                            desc="سنجش حافظه بلندمدت کلامی"
                            icon={Clock} color="text-amber-600" bg="bg-amber-100"
                            score={scores.recall} isDone={completed.recall}
                            customStatus={getRecallStatus()}
                        />
                        <MenuCard 
                            id="corsi" title="شبکه امنیتی (Corsi Block)" 
                            desc="سنجش حافظه فضایی-دیداری" 
                            icon={Server} color="text-emerald-600" bg="bg-emerald-100"
                            score={scores.corsi} isDone={completed.corsi}
                        />
                        <MenuCard 
                            id="pairs" title="جفت‌های پنهان (Association)" 
                            desc="سنجش حافظه تداعی‌گر و پیوندی" 
                            icon={Database} color="text-purple-600" bg="bg-purple-100"
                            score={scores.pairs} isDone={completed.pairs}
                        />
                        <MenuCard 
                            id="nback" title="رادار تمرکز (N-Back)" 
                            desc="سنجش حافظه فعال و هوش سیال" 
                            icon={Radar} color="text-rose-600" bg="bg-rose-100"
                            score={scores.nback} isDone={completed.nback}
                        />
                    </div>

                    {allDone && (
                        <div className="bg-slate-900 text-white p-6 rounded-3xl text-center animate-fade-in-up shadow-xl shadow-slate-900/20">
                            <h3 className="text-lg font-bold mb-2">ارزیابی حافظه تکمیل شد</h3>
                            <div className="text-4xl font-black mb-6 text-emerald-400">{toPersianNum(finalScore)}</div>
                            <button 
                                onClick={() => onComplete(finalScore)}
                                className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                ثبت نهایی و خروج
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white p-0 relative overflow-hidden">
            <button onClick={() => setView('menu')} className="absolute top-4 left-4 p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 z-50 text-slate-400 hover:text-white border border-white/10 transition-colors">
                <RotateCcw size={20}/>
            </button>
            
            {view === 'corsi' && <CorsiBlockGame onFinish={(s) => handleFinishSubGame('corsi', s)} />}
            {view === 'pairs' && <PairedAssociationGame onFinish={(s) => handleFinishSubGame('pairs', s)} />}
            {view === 'nback' && <NBackGame onFinish={(s) => handleFinishSubGame('nback', s)} />}
            {view === 'recall' && <DelayedRecallGame onFinish={(s) => handleFinishSubGame('recall', s)} />}
        </div>
    );
};

export default MemoryGame;
