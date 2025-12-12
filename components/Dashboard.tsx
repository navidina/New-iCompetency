
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { 
  Bell, ChevronDown, 
  Settings, ArrowUpRight, Mail, X,
  Layers, Calculator, Zap, Box, Compass, Eye, LayoutGrid,
  Trophy, Moon, Sun, ClipboardCheck, Star, AlertCircle,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { toPersianNum } from '../utils';
import { ScoreExplanationCard } from '../src/components/common/ScoreExplanationCard';
import { ScoreExplanation } from '../src/utils/scoring';

interface DashboardProps {
  user: UserProfile;
  onStartScenario: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartScenario, isDarkMode, toggleTheme }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setAnimateStats(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [user]);

  // Calculations
  const totalSkill = (Object.values(user.skills) as number[]).reduce((a: number, b: number) => a + b, 0);
  const overallScore = totalSkill > 0 ? Math.min(100, Math.round(totalSkill / 7)) : 0;
  const hasData = user.currentXp > 0 || totalSkill > 0;
  const xpPercentage = Math.min(100, (user.currentXp / user.requiredXp) * 100);
  
  const circleCircumference = 502; // 2 * pi * 80
  const circleDashOffset = animateStats 
    ? circleCircumference - (circleCircumference * overallScore) / 100 
    : circleCircumference;

  const abilities = [
    { name: 'حافظه', score: user.skills.memory, icon: Layers, color: 'text-pink-600', bg: 'bg-pink-500' },
    { name: 'ریاضی', score: user.skills.math, icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-500' },
    { name: 'سرعت', score: user.skills.speed || user.skills.perception, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500' },
    { name: 'تجسم', score: user.skills.visualization, icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-500' },
    { name: 'جهت‌یابی', score: user.skills.orientation, icon: Compass, color: 'text-emerald-600', bg: 'bg-emerald-500' },
    { name: 'تمرکز', score: user.skills.focus, icon: Eye, color: 'text-red-500', bg: 'bg-red-500' },
    { name: 'همزمانی', score: user.skills.multitasking, icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-500' },
  ];

  const scoreExplanation: ScoreExplanation = {
    finalScore: overallScore,
    formula: 'Average ( Cognitive Skills )',
    variables: {},
    steps: abilities.map(a => ({ label: a.name, value: a.score }))
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8 font-sans text-slate-800 dark:text-slate-100 pb-24 custom-scrollbar relative transition-colors duration-300">
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setShowProfileModal(false)}>
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100 animate-scale-in m-4 border border-white/20" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-xl text-slate-900 dark:text-white">اطلاعات پرونده</h3>
                   <button
                     onClick={() => setShowProfileModal(false)}
                     aria-label="بستن پنجره پروفایل"
                     className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                   >
                      <X className="text-slate-400" size={24} />
                   </button>
               </div>

               <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 mb-4 overflow-hidden shadow-lg border-4 border-white dark:border-slate-700">
                     <img src={`https://api.dicebear.com/9.x/micah/svg?seed=${user.name}&baseColor=f9c9b6&hair=fonze`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{user.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold">{user.role}</p>
               </div>
               
               <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 shadow-sm">
                        <ClipboardCheck size={20} />
                      </div>
                      <div>
                         <div className="text-xs font-bold text-slate-400 uppercase">شناسه یکتا</div>
                         <div className="text-sm font-black text-slate-900 dark:text-white font-mono">ID-PENDING-001</div>
                      </div>
                   </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                   <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">ویرایش اطلاعات</button>
               </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 animate-fade-in-up">
        <div className="text-center md:text-right w-full md:w-auto">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">داشبورد وضعیت</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">گزارش جامع شایستگی و عملکرد</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
           {/* Dark Mode */}
           <div 
             onClick={toggleTheme}
             className="hidden md:flex items-center gap-3 cursor-pointer bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all active:scale-95 select-none"
           >
              {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {isDarkMode ? 'شب' : 'روز'}
              </span>
           </div>

           <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
              className="md:hidden bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
           >
               {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
           </button>

           {/* User Pill */}
           <div 
             onClick={() => setShowProfileModal(true)}
             className="flex items-center gap-3 bg-white dark:bg-slate-800 pl-2 pr-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group active:scale-95"
           >
              <div className="text-left hidden lg:block">
                 <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{user.name}</div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase">{user.role}</div>
              </div>
              <img src={`https://api.dicebear.com/9.x/micah/svg?seed=${user.name}&baseColor=f9c9b6&hair=fonze`} alt="Profile" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 object-cover" />
              <ChevronDown size={16} className="text-slate-400" />
           </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* Progress Card */}
        <div className="col-span-12 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden animate-scale-in delay-100 group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col xl:flex-row items-center gap-8">
                {/* Rank */}
                <div className="flex items-center gap-5 w-full xl:w-auto min-w-[240px]">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Trophy size={32} strokeWidth={1.5} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-slate-800 dark:text-white text-xs font-black px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">
                            Tier {toPersianNum(user.levelNumber)}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">سطح فعلی</div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user.level}</h2>
                        <div className="text-sm font-medium text-slate-400">
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNum(user.currentXp)}</span>
                            <span className="mx-1">/</span>
                            <span>{toPersianNum(user.requiredXp)} XP</span>
                        </div>
                    </div>
                </div>

                {/* Bar */}
                <div className="flex-1 w-full px-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-3">
                        <span>پیشرفت کلی</span>
                        <span>{toPersianNum(Math.round(xpPercentage))}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner p-1">
                         <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all duration-[1500ms] ease-out shadow-sm"
                            style={{ width: `${animateStats ? Math.max(5, xpPercentage) : 5}%` }}
                         >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                         </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full xl:w-auto min-w-[180px] bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600 flex items-center gap-4 group/btn hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm">
                     <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
                         <ClipboardCheck size={24} />
                     </div>
                     <div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">اقدام بعدی</div>
                         <div className="text-sm font-black text-slate-800 dark:text-white">{hasData ? 'ادامه مسیر' : 'شروع ارزیابی'}</div>
                     </div>
                </div>
            </div>
        </div>

        {/* --- Widgets --- */}
        
        {/* 1. Overall Score */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col justify-between animate-fade-in-up delay-200">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">شاخص کل صلاحیت</h3>
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <ArrowUpRight size={18} className="text-slate-400"/>
                </div>
             </div>
             
             <div className="flex-1 flex items-center justify-center py-6">
                 <div className="relative w-48 h-48">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-700" strokeLinecap="round" />
                        <circle 
                          cx="100" cy="100" r="80" 
                          stroke="url(#gradientScore)" 
                          strokeWidth="12" 
                          fill="transparent" 
                          strokeDasharray={circleCircumference} 
                          strokeDashoffset={circleDashOffset} 
                          strokeLinecap="round"
                          className="drop-shadow-glow transition-all duration-[2000ms] ease-out"
                        />
                        <defs>
                          <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {hasData ? (
                            <>
                              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{toPersianNum(overallScore)}</span>
                              <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">نمره تراز</span>
                            </>
                        ) : (
                            <span className="text-sm font-bold text-slate-400 text-center px-6">داده ناکافی</span>
                        )}
                     </div>
                 </div>
             </div>

             <button 
                onClick={onStartScenario}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
             >
                {hasData ? 'شروع آزمون جدید' : 'شروع فرآیند'}
             </button>

             {hasData && (
               <div className="mt-4">
                 <ScoreExplanationCard explanation={scoreExplanation} title="شفافیت محاسبات" />
               </div>
             )}
        </div>

        {/* 2. Skills Grid */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-700 animate-fade-in-up delay-300 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">ریز نمرات شناختی</h3>
                <Settings size={18} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
             </div>
             
             {!hasData ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} className="text-slate-400" />
                     </div>
                     <p className="text-sm font-bold text-slate-500">هنوز آزمونی ثبت نشده است.</p>
                 </div>
             ) : (
                 <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 max-h-[300px]">
                      {abilities.map((item, idx) => (
                          <div key={idx} className="group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${item.bg} bg-opacity-10`}>
                                          <item.icon size={16} className={item.color} />
                                      </div>
                                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{item.name}</span>
                                  </div>
                                  <span className={`text-xs font-black ${item.color}`}>{toPersianNum(item.score)}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.bg} rounded-full transition-all duration-1000 ease-out`} style={{width: `${item.score}%`}}></div>
                              </div>
                          </div>
                      ))}
                 </div>
             )}
        </div>

        {/* 3. Big Five Personality Profile */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-700 animate-fade-in-up delay-400 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">پروفایل شخصیت</h3>
                <Activity size={18} className="text-emerald-500" />
             </div>

             {user.bigFive ? (
                 <div className="flex-1 min-h-[300px] relative -mx-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                            { subject: 'گشودگی', A: user.bigFive.Openness, fullMark: 100 },
                            { subject: 'وجدان', A: user.bigFive.Conscientiousness, fullMark: 100 },
                            { subject: 'برون‌گرایی', A: user.bigFive.Extraversion, fullMark: 100 },
                            { subject: 'توافق', A: user.bigFive.Agreeableness, fullMark: 100 },
                            { subject: 'ثبات', A: 100 - user.bigFive.Neuroticism, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="User"
                            dataKey="A"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="#8b5cf6"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                     </ResponsiveContainer>
                     <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">مدل پنج عاملی (IPIP-50)</span>
                     </div>
                 </div>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Star size={32} className="text-slate-400" />
                     </div>
                     <p className="text-sm font-bold text-slate-500 mb-4">آزمون شخصیت انجام نشده است.</p>
                     <button onClick={onStartScenario} className="text-xs font-bold text-indigo-500 hover:underline">شروع آزمون</button>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
