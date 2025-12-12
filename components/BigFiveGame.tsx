import React, { useState, useMemo } from 'react';
import { 
  Rocket, ShieldAlert, HeartHandshake, Eye,
  Database, Activity, Save, TrendingUp, Brain, CheckCircle
} from 'lucide-react';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';
import { BIG_FIVE_QUESTIONS, BigFiveQuestion } from '../src/data/bigFiveQuestions';

interface Props {
  onExit: () => void;
  onComplete: (score: any) => void;
}

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const traits = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
  const labels = ['گشودگی', 'وظیفه‌شناسی', 'برون‌گرایی', 'توافق', 'ثبات']; // Neuroticism -> Emotional Stability label for positive spin? Or just Neuroticism. Usually "Stability" is preferred in work context.
  // Actually, I keyed Neuroticism as High Score = High Neuroticism (Anxiety).
  // For the chart, High Score usually means "Good".
  // Should I invert Neuroticism for the chart?
  // High Neuroticism = Low Stability.
  // Let's display "Stability" (ثبات هیجانی) and invert the score for display (100 - score).
  
  const points = traits.map((trait, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    let value = scores[trait] || 0;
    if (trait === 'Neuroticism') value = 100 - value; // Invert for "Stability" visualization
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [20, 40, 60, 80, 100];
  
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square animate-scale-in">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        {gridLevels.map(level => {
          const pts = traits.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = (level / 100) * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />;
        })}
        {traits.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#334155" strokeWidth="1" opacity="0.5" />;
        })}
        {traits.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const labelRadius = radius + 25;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text 
              key={i} x={x} y={y} 
              textAnchor="middle" dominantBaseline="middle" 
              className="text-[10px] md:text-xs fill-slate-400 font-bold"
            >
              {labels[i]}
            </text>
          );
        })}
        <polygon points={points} fill="rgba(99, 102, 241, 0.4)" stroke="#818cf8" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        {traits.map((trait, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          let value = scores[trait] || 0;
          if (trait === 'Neuroticism') value = 100 - value;
          const r = (value / 100) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

const BigFiveGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Memoize shuffled questions so they don't re-shuffle on render
  const questions = useMemo(() => shuffleArray(BIG_FIVE_QUESTIONS), []);

  const handleChoice = (value: number) => {
    sfx.playClick();
    const currentQ = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));

    if (currentIndex < questions.length - 1) {
      // Small delay for animation feel could be added here
      setCurrentIndex(prev => prev + 1);
    } else {
      sfx.playWin();
      setGameState('results');
    }
  };

  const finalScores = useMemo(() => {
    if (gameState !== 'results') return {
        Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0
    };

    const scores: Record<string, number> = {
        Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0
    };

    // Calculate raw sums
    // Each trait has 10 questions.
    // Raw sum range: 10 to 50.

    BIG_FIVE_QUESTIONS.forEach(q => {
        const ans = answers[q.id] || 3; // Default to neutral if missing (shouldn't happen)
        const score = q.keyed === 'plus' ? ans : (6 - ans);
        scores[q.trait] += score;
    });

    // Normalize to 0-100
    // Min 10, Max 50. Range 40.
    // (Raw - 10) / 40 * 100
    const normalized: Record<string, number> = {};
    Object.keys(scores).forEach(trait => {
        normalized[trait] = Math.round(((scores[trait] - 10) / 40) * 100);
    });

    return normalized;
  }, [gameState, answers]);

  if (gameState === 'intro') {
    return (
      <div className="h-full bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl w-full bg-slate-900/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-slate-700 shadow-2xl text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                <Brain size={48} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tighter text-white">آزمون شخصیت‌شناسی استاندارد</h1>
            <h2 className="text-lg font-bold text-slate-400 mb-8 leading-relaxed">
              این آزمون بر اساس مدل استاندارد پنج عاملی (Big Five) طراحی شده است.
              <br/>
              <span className="text-sm mt-4 block opacity-70 bg-slate-800/50 py-2 px-4 rounded-xl inline-block border border-slate-700">۵۰ سوال • دقیق و علمی • تحلیل جامع</span>
            </h2>
            <p className="text-slate-500 text-sm mb-8 px-8">
                لطفاً با صداقت کامل پاسخ دهید. هیچ پاسخی درست یا غلط نیست. اولین پاسخی که به ذهنتان می‌رسد معمولاً دقیق‌ترین است.
            </p>
            <button 
                onClick={() => { sfx.playClick(); setGameState('playing'); }}
                className="group w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
                <Rocket size={24} /> شروع آزمون
            </button>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
      return (
        <div className="h-full bg-slate-950 text-white overflow-y-auto custom-scrollbar p-6 md:p-8 animate-fade-in-up">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-6 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Activity className="text-emerald-400" /> پروفایل شخصیت</h2>
                        <p className="text-slate-400 font-mono text-sm">Big Five Personality Traits (IPIP-50)</p>
                    </div>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/10 text-xs font-mono text-slate-400">
                         Completed: {new Date().toLocaleDateString('fa-IR')}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <div className="lg:col-span-5 bg-slate-900/50 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center shadow-inner relative overflow-hidden min-h-[400px]">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full"></div>
                        <RadarChart scores={finalScores} />
                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">تحلیل کلی</p>
                            <p className="text-sm text-slate-300 mt-1 px-6">نمودار فوق توازن ابعاد شخصیتی شما را نشان می‌دهد. نقاط دورتر از مرکز نشان‌دهنده شدت بیشتر آن ویژگی است.</p>
                        </div>
                    </div>
                    <div className="lg:col-span-7 space-y-4">
                        {Object.entries(finalScores).map(([trait, score], idx) => {
                             let label = trait;
                             let icon = Brain;
                             let desc = "";
                             // We display Neuroticism as Emotional Stability usually, but keep technical name or clarify?
                             // Let's use standard names but explain.
                             if(trait === 'Openness') {
                                 label = 'گشودگی به تجربه (Openness)';
                                 icon = Eye;
                                 desc = "خلاقیت، کنجکاوی و تمایل به تجربیات جدید.";
                             }
                             if(trait === 'Conscientiousness') {
                                 label = 'وجدان کاری (Conscientiousness)';
                                 icon = Database;
                                 desc = "نظم، وظیفه‌شناسی، و تلاش برای پیشرفت.";
                             }
                             if(trait === 'Extraversion') {
                                 label = 'برون‌گرایی (Extraversion)';
                                 icon = Rocket;
                                 desc = "انرژی اجتماعی، قاطعیت و هیجان‌طلبی.";
                             }
                             if(trait === 'Agreeableness') {
                                 label = 'توافق‌پذیری (Agreeableness)';
                                 icon = HeartHandshake;
                                 desc = "همدلی، همکاری و اعتماد به دیگران.";
                             }
                             if(trait === 'Neuroticism') {
                                 label = 'روان‌رنجوری (Neuroticism)';
                                 icon = ShieldAlert;
                                 desc = "حساسیت به استرس و نوسانات هیجانی. (نمره پایین‌تر = ثبات بیشتر)";
                             }
                             
                             const Icon = icon;
                             return (
                                <div key={trait} className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 hover:bg-slate-800 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-slate-900 text-slate-400 border border-slate-700 group-hover:text-white group-hover:border-indigo-500/30 transition-colors"><Icon size={24} /></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-lg text-slate-200">{label}</h4>
                                                <span className={`font-mono font-black text-2xl ${score > 75 ? 'text-emerald-400' : score < 40 ? 'text-rose-400' : 'text-blue-400'}`}>{toPersianNum(String(score))}%</span>
                                            </div>
                                            <div className="h-3 bg-slate-900 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`h-full ${score > 75 ? 'bg-emerald-500' : score < 40 ? 'bg-rose-500' : 'bg-blue-500'} transition-all duration-1000`}
                                                    style={{width: `${score}%`}}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500">{desc}</p>
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
                <div className="flex justify-center gap-4 pb-10">
                    <button onClick={() => onComplete(finalScores)} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-all flex items-center gap-3 text-lg shadow-lg shadow-indigo-600/20 active:scale-95">
                        <Save size={20} /> ثبت نهایی و خروج
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-900 w-full relative z-50">
            <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        
        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center p-6 relative z-10">

            <div className="mb-12 text-center animate-fade-in-up">
                <span className="inline-block py-1 px-3 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-bold font-mono mb-6">
                    QUESTION {currentIndex + 1} / {questions.length}
                </span>
                <h2 className="text-2xl md:text-4xl font-black leading-tight text-white drop-shadow-xl">
                    {currentQ.text}
                </h2>
            </div>

            {/* Options */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-3 md:gap-4">
                {[
                    { val: 1, label: 'کاملاً مخالفم', color: 'bg-rose-500', text: 'text-rose-200' },
                    { val: 2, label: 'مخالفم', color: 'bg-orange-500', text: 'text-orange-200' },
                    { val: 3, label: 'بی‌نظر', color: 'bg-slate-500', text: 'text-slate-200' },
                    { val: 4, label: 'موافقم', color: 'bg-emerald-500', text: 'text-emerald-200' },
                    { val: 5, label: 'کاملاً موافقم', color: 'bg-blue-600', text: 'text-blue-200' }
                ].map((opt) => (
                    <button
                        key={opt.val}
                        onClick={() => handleChoice(opt.val)}
                        className={`group relative h-24 sm:h-32 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-transparent transition-all duration-200 active:scale-95 flex flex-col items-center justify-center overflow-hidden`}
                    >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${opt.color} transition-opacity duration-300`}></div>
                        <div className={`text-2xl font-black mb-1 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ${opt.text.replace('200', '400')}`}>
                            {opt.val}
                        </div>
                        <span className={`text-xs md:text-sm font-bold text-slate-500 group-hover:text-white transition-colors`}>{opt.label}</span>
                        {/* Indicator dot on hover */}
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 opacity-0 group-hover:opacity-100 ${opt.color} shadow-[0_0_8px_currentColor] transition-all duration-300`}></div>
                    </button>
                ))}
            </div>

            <div className="mt-12 text-center opacity-30 text-xs font-mono">
                IPIP-50 STANDARD PSYCHOMETRIC TEST
            </div>
        </div>
    </div>
  );
};

export default BigFiveGame;
