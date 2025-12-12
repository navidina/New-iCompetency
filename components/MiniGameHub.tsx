
import React, { useState } from 'react';
import { AppView, UserProfile } from '../types';
import { 
  Layers, Calculator, Zap, Box, Compass, Eye, LayoutGrid, BrainCircuit, Lock, CheckCircle2, Play, Grid, Search
} from 'lucide-react';
import { toPersianNum } from '../utils';

interface Props {
  onSelectGame: (view: AppView) => void;
  user: UserProfile;
}

const MiniGameHub: React.FC<Props> = ({ onSelectGame, user }) => {

  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const scoreReasons: Record<string, { summary: string; factors: string[] }> = {
    [AppView.MINIGAME_MEMORY]: {
      summary: "امتیاز حافظه ترکیبی از دقت حفظ توالی، یادآوری جفت‌ها و واکنش سریع در N-Back است.",
      factors: ["توالی‌های طولانی‌تر در کورسی = امتیاز بالاتر", "درصد یادآوری جفت‌ها", "کاهش خطاها و تأخیر در N-Back"],
    },
    [AppView.MINIGAME_MATH]: {
      summary: "امتیاز ریاضی بر پایه سطح سوالات، سرعت پاسخ و کمبوهای متوالی محاسبه می‌شود.",
      factors: ["سطوح بالاتر امتیاز پایه بیشتری دارند", "پاسخ زیر ۵۰٪ زمان = ضریب سرعت", "رشته پاسخ‌های صحیح کمبو می‌سازد"],
    },
    [AppView.MINIGAME_PATTERN]: {
      summary: "امتیاز تطابق الگو از تعداد پاسخ صحیح و سرعت تکمیل ماتریس‌ها به دست می‌آید.",
      factors: ["شناسایی سریع الگوهای ۴×۴", "کاهش استفاده از حدس", "پاسخ‌های پیاپی دقیق"],
    },
    [AppView.MINIGAME_SPEED]: {
      summary: "امتیاز سرعت ادراکی با دقت تشخیص و میانگین زمان واکنش سنجیده می‌شود.",
      factors: ["واکنش‌های زیر ۲ ثانیه", "حداقل خطا در تشخیص", "ثبات عملکرد در تمام جفت‌ها"],
    },
    [AppView.MINIGAME_VISUALIZATION]: {
      summary: "امتیاز تجسم بر اساس درست‌بودن چرخش‌ها و زاویه‌های دشوار افزایش می‌یابد.",
      factors: ["زاویه‌های ۹۰° به بالا ضریب بالاتر دارند", "تمایز اشکال قرینه", "پاسخ در زمان محدود"],
    },
    [AppView.MINIGAME_ORIENTATION]: {
      summary: "امتیاز جهت‌یابی دقت تبدیل جهت نسبی به مطلق را اندازه می‌گیرد.",
      factors: ["تشخیص سریع زاویه قطب‌نما", "پاسخ صحیح در چرخش‌های ۴۵°", "ثبات در مراحل متوالی"],
    },
    [AppView.MINIGAME_STROOP]: {
      summary: "امتیاز تمرکز از اختلاف واکنش در محرک‌های سازگار و ناسازگار و دقت کلی به دست می‌آید.",
      factors: ["زمان واکنش کمتر در حالت ناسازگار", "دقت بالای رنگ‌خوانی", "کاهش False Alarm"],
    },
    [AppView.MINIGAME_MULTITASK]: {
      summary: "امتیاز پردازش موازی نسبت کارایی تک‌وظیفه‌ای به چندوظیفه‌ای و دقت هر دو را می‌سنجد.",
      factors: ["حفظ دقت هنگام سوئیچ", "زمان پاسخ متوازن", "کاهش هزینه دوتایی"],
    },
    [AppView.MINIGAME_FACTFINDING]: {
      summary: "امتیاز حقیقت‌یابی از کارایی هزینه/اطلاعات و انتخاب تصمیم درست محاسبه می‌شود.",
      factors: ["پرداخت کم برای داده ضروری", "انتخاب تصمیم نهایی صحیح", "ترکیب منابع با اطمینان بالا"],
    },
  };

  const cognitiveGames = [
    {
      id: AppView.MINIGAME_FACTFINDING,
      nodeId: '',
      code: "DM",
      title: "حقیقت‌یابی (تصمیم‌گیری)",
      description: "مدیریت بودجه و اطلاعات برای حل پرونده‌های پیچیده مدیریتی.",
      icon: <Search className="w-8 h-8 text-teal-600 dark:text-teal-400" />,
      gradient: "from-teal-100 to-emerald-50 dark:from-teal-900/40 dark:to-emerald-900/20",
      accent: "text-teal-600 dark:text-teal-400",
      bar: "bg-teal-500",
      progress: user.skills.decisionMaking || 0
    },
    {
      id: AppView.MINIGAME_MEMORY,
      nodeId: 'node-1',
      code: "A9",
      title: "سنجش حافظه",
      description: "ارزیابی توانایی به خاطرسپاری کلمات، اعداد و الگوها.",
      icon: <Layers className="w-8 h-8 text-pink-600 dark:text-pink-400" />,
      gradient: "from-pink-100 to-rose-50 dark:from-pink-900/40 dark:to-rose-900/20",
      accent: "text-pink-600 dark:text-pink-400",
      bar: "bg-pink-500",
      progress: user.skills.memory || 0
    },
    {
      id: AppView.MINIGAME_MATH,
      nodeId: 'node-2',
      code: "A10",
      title: "سنجش هوش ریاضی",
      description: "ارزیابی توانایی انجام محاسبات ریاضی با سرعت و دقت.",
      icon: <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      gradient: "from-blue-100 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/20",
      accent: "text-blue-600 dark:text-blue-400",
      bar: "bg-blue-500",
      progress: user.skills.math || 0
    },
    {
      id: AppView.MINIGAME_PATTERN,
      nodeId: '', // Open for everyone
      code: "A10+",
      title: "تطابق الگوی ماتریسی",
      description: "کشف روابط منطقی و ریاضی در شبکه‌های عددی ۴در۴.",
      icon: <Grid className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
      gradient: "from-indigo-100 to-violet-50 dark:from-indigo-900/40 dark:to-violet-900/20",
      accent: "text-indigo-600 dark:text-indigo-400",
      bar: "bg-indigo-500",
      progress: user.skills.analysis || 0
    },
    {
      id: AppView.MINIGAME_SPEED,
      nodeId: 'node-3',
      code: "A11",
      title: "سنجش سرعت ادراکی",
      description: "ارزیابی مقایسه سریع و دقیق شباهت‌ها و تفاوت‌ها.",
      icon: <Zap className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
      gradient: "from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20",
      accent: "text-amber-600 dark:text-amber-400",
      bar: "bg-amber-500",
      progress: user.skills.perception || 0
    },
    {
      id: AppView.MINIGAME_VISUALIZATION,
      nodeId: 'node-4',
      code: "A12",
      title: "سنجش تجسم فضایی",
      description: "ارزیابی توانایی تجسم پدیده‌ها و بازنمایی سه‌بعدی.",
      icon: <Box className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
      gradient: "from-indigo-100 to-violet-50 dark:from-indigo-900/40 dark:to-violet-900/20",
      accent: "text-indigo-600 dark:text-indigo-400",
      bar: "bg-indigo-500",
      progress: user.skills.visualization || 0
    },
    {
      id: AppView.MINIGAME_ORIENTATION,
      nodeId: 'node-5',
      code: "A13",
      title: "سنجش جهت‌یابی",
      description: "ارزیابی آگاهی از موقعیت مکانی خود نسبت به محیط.",
      icon: <Compass className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      gradient: "from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20",
      accent: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      progress: user.skills.orientation || 0
    },
    {
      id: AppView.MINIGAME_STROOP,
      nodeId: 'node-6',
      code: "A14",
      title: "سنجش تمرکز",
      description: "ارزیابی تمرکز بر یک کار بدون پرت شدن حواس (آزمون استروپ).",
      icon: <Eye className="w-8 h-8 text-red-600 dark:text-red-400" />,
      gradient: "from-red-100 to-rose-50 dark:from-red-900/40 dark:to-rose-900/20",
      accent: "text-red-600 dark:text-red-400",
      bar: "bg-red-500",
      progress: user.skills.focus || 0
    },
    {
      id: AppView.MINIGAME_MULTITASK,
      nodeId: 'node-7',
      code: "A15",
      title: "سنجش پردازش موازی",
      description: "ارزیابی توانایی مدیریت چند جریان اطلاعاتی به صورت همزمان.",
      icon: <LayoutGrid className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      gradient: "from-purple-100 to-fuchsia-50 dark:from-purple-900/40 dark:to-fuchsia-900/20",
      accent: "text-purple-600 dark:text-purple-400",
      bar: "bg-purple-500",
      progress: user.skills.multitasking || 0
    }
  ];

  const renderGameCard = (game: any, index: number) => {
    // Force unlock all games
    const isUnlocked = true;
    const isCompleted = game.nodeId !== '' && user.completedNodes.includes(game.nodeId);
    const hasScore = game.progress > 0;
    const details = scoreReasons[game.id];

    return (
        <div
            key={game.id}
            onClick={() => isUnlocked && onSelectGame(game.id)}
            style={{ animationDelay: `${index * 100}ms` }}
            className={`group relative bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-soft dark:shadow-none border transition-all duration-300 animate-fade-in-up 
                ${isUnlocked 
                    ? 'border-slate-100 dark:border-slate-700 hover:-translate-y-2 hover:shadow-xl cursor-pointer' 
                    : 'border-slate-100 dark:border-slate-800 opacity-60 grayscale cursor-not-allowed'
                }`}
        >
            {/* Top Section */}
            <div className={`h-32 rounded-2xl bg-gradient-to-br ${isUnlocked ? game.gradient : 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800'} mb-5 flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute top-3 left-3 bg-white/50 dark:bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-slate-700 dark:text-white">
                    {game.code}
                </div>
                {isCompleted && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                        <CheckCircle2 size={12} />
                    </div>
                )}
                
                <div className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm transform transition-transform duration-500 ease-out ${isUnlocked ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}>
                    {isUnlocked ? game.icon : <Lock className="text-slate-400 w-8 h-8" />}
                </div>
            </div>

            <div className="px-1">
                <h3 className={`text-lg font-black mb-1.5 transition-colors ${isUnlocked ? 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {game.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-5 leading-relaxed line-clamp-2 min-h-[32px]">
                    {isUnlocked ? game.description : 'برای دسترسی به این آزمون، مراحل قبل را تکمیل کنید.'}
                </p>
                
                {isUnlocked ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${game.bar} transition-all duration-1000 ease-out`} style={{width: `${game.progress}%`}}></div>
                      </div>
                      <span className={`text-[10px] font-bold ${game.accent}`}>{toPersianNum(game.progress)}%</span>
                    </div>
                    {hasScore && details && (
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/60 p-3 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">جزئیات امتیاز</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{details.summary}</p>
                          </div>
                          <button
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 underline underline-offset-4"
                            onClick={(e) => { e.stopPropagation(); setExpandedGame(expandedGame === game.id ? null : game.id); }}
                            aria-expanded={expandedGame === game.id}
                            aria-label={`نمایش جزئیات امتیاز ${game.title}`}
                          >
                            {expandedGame === game.id ? 'بستن' : 'مشاهده'}
                          </button>
                        </div>
                        {expandedGame === game.id && (
                          <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300">
                            {details.factors.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                            <li className="font-bold text-slate-800 dark:text-white">امتیاز فعلی: {toPersianNum(Math.max(game.progress, 1))} از ۱۰۰</li>
                          </ul>
                        )}
                      </div>
                    )}
                    <button className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all">
                      {isCompleted ? <Play size={14} fill="currentColor"/> : null}
                      {isCompleted ? 'تکرار آزمون' : 'شروع آزمون'}
                    </button>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pb-12">
        
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-700 animate-fade-in-up">
             <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none text-white shrink-0">
                <BrainCircuit size={40} />
             </div>
             <div className="text-center md:text-right">
                 <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">آزمون‌های شناختی</h1>
                 <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-2xl">
                     این مجموعه آزمون‌ها بر اساس مدل استاندارد رازی (A9-A15) طراحی شده‌اند تا شایستگی‌های ذهنی و شناختی شما را به دقت ارزیابی کنند.
                 </p>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {cognitiveGames.map((g, i) => renderGameCard(g, i))}
        </div>
        
      </div>
    </div>
  );
};

export default MiniGameHub;