
import React from 'react';
import { EvaluationResult, Scenario } from '../types';
import { CheckCircle, XCircle, Award, ChartBar, Clock, Lightbulb, HelpCircle, Save } from 'lucide-react';
import { toPersianNum } from '../utils';

interface FeedbackCardProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
  textColor: string;
  animation: string;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ title, items, icon, color, textColor, animation }) => {
  return (
    <div className={`p-6 rounded-2xl ${color} ${animation} hover:shadow-md transition-shadow h-full`}>
       <div className={`flex items-center gap-3 mb-4 ${textColor}`}>
           <div className="bg-white/50 p-2 rounded-lg">{icon}</div>
           <h4 className="font-bold text-lg">{title}</h4>
       </div>
       <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
           {items.map((item, idx) => (
               <li key={idx} className="flex items-start gap-3">
                   <div className={`mt-2 w-1.5 h-1.5 rounded-full ${textColor} opacity-60 shrink-0`}></div>
                   <span className={`text-sm font-medium leading-relaxed ${textColor} opacity-90`}>{item}</span>
               </li>
           ))}
       </ul>
    </div>
  );
};

interface Props {
  result: EvaluationResult;
  scenario: Scenario;
  onBack: () => void;
}

const EvaluationResultView: React.FC<Props> = ({ result, scenario, onBack }) => {
  
  const breakdownData = [
    { name: 'درک مسئله', score: result.breakdown.understanding, color: 'bg-blue-500' },
    { name: 'برنامه‌ریزی', score: result.breakdown.planning, color: 'bg-violet-500' },
    { name: 'اجرا', score: result.breakdown.execution, color: 'bg-emerald-500' },
    { name: 'بازنگری', score: result.breakdown.review, color: 'bg-amber-500' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        {/* Header Result Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-500 animate-scale-in">
            <div className="bg-slate-900 p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 animate-pulse"></div>
                <h1 className="text-3xl font-bold text-white relative z-10 mb-2 animate-fade-in-down">نتایج ارزیابی</h1>
                <p className="text-slate-400 relative z-10">سناریو: {scenario.title}</p>
                
                <div className="mt-8 flex justify-center items-center gap-8 relative z-10">
                    <div className="text-center">
                        <div className="text-5xl font-black text-emerald-400 mb-1 scale-110 transform transition-transform group-hover:scale-125 duration-500 animate-pop delay-200">{toPersianNum(result.score)}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">نمره نهایی</div>
                    </div>
                    <div className="w-px h-16 bg-slate-700"></div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1 animate-pop delay-300">{result.level}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">سطح شایستگی</div>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:-translate-y-1 transition-transform animate-fade-in-up delay-200 group relative">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
                        <Lightbulb size={18} />
                        <span>امتیاز خلاقیت</span>
                        <HelpCircle size={12} className="text-blue-400 opacity-50 group-hover:opacity-100" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{toPersianNum(result.breakdown.creativity)}٪</div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                        میزان نوآوری و ارائه راه‌حل‌های غیرمعمول
                    </div>
                 </div>

                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 hover:-translate-y-1 transition-transform animate-fade-in-up delay-300 group relative">
                    <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
                        <Clock size={18} />
                        <span>بهره‌وری زمان</span>
                        <HelpCircle size={12} className="text-amber-400 opacity-50 group-hover:opacity-100" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{toPersianNum(result.timeAnalysis.efficiencyScore)}٪</div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                        نسبت زمان صرف شده به زمان استاندارد و کیفیت پاسخ
                    </div>
                 </div>

                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 hover:-translate-y-1 transition-transform animate-fade-in-up delay-500 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold">
                        <ChartBar size={18} />
                        <span>متدولوژی</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{scenario.methodology}</div>
                 </div>
            </div>
        </div>

        {/* Breakdown Chart (Custom CSS) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-200 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-slate-800 mb-6">تحلیل عملکرد فرآیندی</h3>
            <div className="space-y-4">
                {breakdownData.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-slate-600">{item.name}</span>
                            <span className="text-sm font-black text-slate-800">{toPersianNum(item.score)}</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${item.color} transition-all duration-1000 ease-out`} 
                                style={{ width: `${item.score}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Feedback Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-full">
                <FeedbackCard 
                    title="نقاط قوت مشاهده شده" 
                    items={result.feedback.strengths} 
                    icon={<CheckCircle className="text-emerald-500"/>} 
                    color="bg-emerald-50" 
                    textColor="text-emerald-900" 
                    animation="animate-slide-in-right delay-300" 
                />
            </div>
            <div className="h-full">
                <FeedbackCard 
                    title="زمینه‌های قابل بهبود" 
                    items={result.feedback.weaknesses} 
                    icon={<XCircle className="text-red-500"/>} 
                    color="bg-red-50" 
                    textColor="text-red-900" 
                    animation="animate-slide-in-left delay-300" 
                />
            </div>
        </div>

        <div className="flex justify-center pt-4 animate-fade-in delay-700">
            <button 
                onClick={onBack}
                className="bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-900 hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
                <Save size={18} />
                ذخیره و بازگشت به داشبورد
            </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResultView;
