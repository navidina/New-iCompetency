
import React, { useState } from 'react';
import { 
  Search, FileText, CheckCircle2, AlertTriangle, Briefcase, 
  Lock, DollarSign, PieChart, XCircle, FolderOpen, 
  MessageSquare, Terminal, Eye, Fingerprint, ChevronLeft,
  Shield, Globe, Server, User
} from 'lucide-react';
import GameIntro from './GameIntro';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

// --- New Data Structures ---

type SourceType = 'HUMINT' | 'SIGINT' | 'OSINT';

interface Action {
  id: string;
  label: string;
  cost: number;
  riskLevel: 'Low' | 'Medium' | 'High'; // Risk of getting vague info
  content: string;
  isCrucial: boolean; // Gives bonus points if found
}

interface Source {
  id: string;
  name: string;
  role: string;
  type: SourceType;
  reliability: number; // 0-100%
  description: string;
  actions: Action[];
}

interface Category {
  id: string;
  title: string;
  icon: any;
  sources: Source[];
}

interface Scenario {
  id: number;
  title: string;
  context: string;
  budget: number;
  categories: Category[];
  options: { id: string; text: string; isCorrect: boolean; feedback: string }[];
}

// --- Scenarios Data ---

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "بحران پروژه آلفا",
    context: "پروژه نرم‌افزاری حیاتی شرکت ۲ ماه تاخیر دارد. سهامداران عصبانی هستند. مدیرعامل به شما اختیار تام داده تا مقصر یا علت اصلی را پیدا کنید.",
    budget: 120,
    categories: [
      {
        id: 'cat_human',
        title: 'منابع انسانی (HUMINT)',
        icon: User,
        sources: [
          {
            id: 'src_cto',
            name: 'مدیر فنی (CTO)',
            role: 'مدیر ارشد',
            type: 'HUMINT',
            reliability: 90,
            description: 'مسئول مستقیم تیم توسعه. تحت فشار شدید.',
            actions: [
              { 
                id: 'act_cto_chat', 
                label: 'گپ غیررسمی (کافه)', 
                cost: 10, 
                riskLevel: 'Medium', 
                content: `[ترنسکریپت صدای ضبط شده - محیط کافه]
CTO: "ببین صادقانه بگم... بچه‌های من دارن می‌برن. هفته پیش علی (Senior Dev) استعفا داد. مارکتینگ دیوانه‌مون کرده. صبح میگن دکمه آبی باشه، عصر میگن کلاً دکمه رو حذف کنین جاش اسلایدر بذارین. ما کد میزنیم، فرداش باید پاک کنیم. اینجوری نمیشه کار کرد."`, 
                isCrucial: false 
              },
              { 
                id: 'act_cto_formal', 
                label: 'جلسه رسمی بازخواست', 
                cost: 35, 
                riskLevel: 'Low', 
                content: `[صورت‌جلسه رسمی شماره ۱۴۰۲-۵۵]
موضوع: بررسی دلایل تاخیر
CTO: "من رسماً اعلام می‌کنم که تیم فنی هیچ مستندات تایید شده‌ای (Signed-off Requirements) دریافت نکرده است. ما بر اساس وایرفریم‌های دستی که در واتس‌اپ مدیر محصول فرستاده می‌شود کار می‌کنیم. در ۳ ماه گذشته، دیتابیس ۴ بار به طور کامل تغییر ساختار داده شده چون مدل کسب‌وکار عوض شده است. مشکل ما فنی نیست، مشکل بی ثباتی تصمیمات است."`, 
                isCrucial: true 
              },
            ]
          },
          {
            id: 'src_pm',
            name: 'مدیر محصول (PM)',
            role: 'واسط تیم‌ها',
            type: 'HUMINT',
            reliability: 60,
            description: 'لینک بین فنی و مارکتینگ. شایعه است که دنبال کار جدید می‌گردد.',
            actions: [
              { 
                id: 'act_pm_email', 
                label: 'بررسی تقویم و ایمیل‌ها', 
                cost: 20, 
                riskLevel: 'Low', 
                content: `[Outlook Calendar Export]
Mon 10:00 - Sync w/ Devs (CANCELED by PM)
Tue 14:00 - Sprint Planning (CANCELED by PM)
Wed 11:00 - Interview with DigiKala (Private)
Thu 09:00 - Requirements Review (Rescheduled to next week)
---
[Email Draft]
To: HR Head
Subject: Resignation Letter
"Dear Sarah, per our discussion..."`, 
                isCrucial: true 
              },
              { 
                id: 'act_pm_interview', 
                label: 'مصاحبه عملکرد', 
                cost: 25, 
                riskLevel: 'High', 
                content: `PM: "پروژه؟ عالیه! ما توی متدولوژی چابک (Agile) هستیم، تغییرات طبیعیه. تیم فنی یکم کند کار میکنه و همش بهانه میارن که مستندات نداریم. توی استارتاپ که وقت مستندات نوشتن نیست! ما باید سریع باشیم."`, 
                isCrucial: false 
              },
            ]
          }
        ]
      },
      {
        id: 'cat_digital',
        title: 'داده‌های دیجیتال (SIGINT)',
        icon: Server,
        sources: [
          {
            id: 'src_logs',
            name: 'لاگ‌های سرور',
            role: 'زیرساخت',
            type: 'SIGINT',
            reliability: 100,
            description: 'ثبت وقایع سیستمی و خطاهای فنی.',
            actions: [
              { 
                id: 'act_logs_scan', 
                label: 'اسکن سلامت سیستم', 
                cost: 15, 
                riskLevel: 'Low', 
                content: `root@server:~# tail -n 20 /var/log/syslog
[INFO] Service 'OrderManager' running. Uptime: 45 days.
[INFO] DB Connection: Stable (Latency: 2ms).
[WARN] API Rate Limit approaching for user_id: 4421.
[INFO] Build v1.4.2 deployed successfully.
---
ANALYSIS REPORT:
System Health: 99.8%
Critical Errors: 0
Performance Issues: None
Conclusion: No infrastructure blockage found.`, 
                isCrucial: false 
              },
            ]
          },
          {
            id: 'src_git',
            name: 'مخزن کد (Git)',
            role: 'Version Control',
            type: 'SIGINT',
            reliability: 100,
            description: 'تاریخچه تغییرات کد.',
            actions: [
              { 
                id: 'act_git_blame', 
                label: 'تحلیل Git Stats', 
                cost: 30, 
                riskLevel: 'Low', 
                content: `git log --stat --since="2 weeks ago"

commit a8f93d (HEAD -> master)
Author: Senior_Dev
Message: "Reverting 'Dark Mode' feature per marketing request"
 files changed: 12, insertions: 0, deletions: 450 (-)

commit b2c45e
Author: Senior_Dev
Message: "Implemented 'Dark Mode' feature completely"
 files changed: 12, insertions: 450, deletions: 10 (+)

commit c3d67f
Author: Frontend_Lead
Message: "Changed button colors to Green (was Blue yesterday)"

---
METRICS:
Churn Rate: 65% (Extremely High)
Explanation: 65% of code written is deleted or rewritten within 3 days.`, 
                isCrucial: true 
              },
            ]
          }
        ]
      },
      {
        id: 'cat_docs',
        title: 'اسناد و مدارک (OSINT)',
        icon: FolderOpen,
        sources: [
          {
            id: 'src_req',
            name: 'سند نیازمندی‌ها (PRD)',
            role: 'مستندات',
            type: 'OSINT',
            reliability: 100,
            description: 'قرارداد اولیه محصول.',
            actions: [
              { 
                id: 'act_prd_read', 
                label: 'بازبینی سند PRD', 
                cost: 10, 
                riskLevel: 'Low', 
                content: `DOCUMENT HEADER:
Title: Alpha Project Requirements
Version: 0.1 (Draft)
Last Modified: 1402/05/10 (6 months ago!)
Status: NOT SIGNED
Author: [Former PM]

CONTENT:
1. Introduction: [Empty]
2. User Stories: 
   - User should be able to login.
   - [TBD]
   - [TBD]

[NOTE]: This document is practically empty. The team is building a complex system without a blueprint.`, 
                isCrucial: true 
              },
            ]
          }
        ]
      }
    ],
    options: [
      { id: 'opt1', text: "اخراج مدیر فنی به دلیل بی‌کفایتی", isCorrect: false, feedback: "اشتباه فاحش. لاگ‌ها نشان داد سیستم پایدار است و گیت نشان داد تیم کار می‌کند اما کارشان دور ریخته می‌شود. شما مدیر لایقی را قربانی کردید." },
      { id: 'opt2', text: "استخدام نیروهای بیشتر برای تسریع کار", isCorrect: false, feedback: "اشتباه. طبق قانون بروکس (Brooks's Law)، افزودن نیروی انسانی به پروژه نرم‌افزاری عقب‌افتاده، آن را دیرتر می‌کند. مشکل کمبود نیرو نیست، ابهام است." },
      { id: 'opt3', text: "توقف توسعه و فریز کردن نیازمندی‌ها (Sign-off)", isCorrect: true, feedback: "آفرین! ریشه مشکل «تغییر مداوم دامنه (Scope Creep)» و نبود مستندات بود. تا زمانی که نیازمندی‌ها فریز نشود، کد زدن فایده‌ای ندارد." },
    ]
  },
  {
    id: 2,
    title: "جاسوسی صنعتی",
    context: "طرح‌های محرمانه محصول جدید ما (Project X) قبل از رونمایی به دست رقیب رسیده و آن‌ها محصول مشابهی را ثبت اختراع کرده‌اند. نفوذی را پیدا کنید.",
    budget: 100,
    categories: [
      {
        id: 'cat_access',
        title: 'کنترل دسترسی',
        icon: Lock,
        sources: [
          {
            id: 'src_door',
            name: 'گیت‌های ورودی',
            role: 'فیزیکی',
            type: 'SIGINT',
            reliability: 100,
            description: 'ترددهای فیزیکی به ساختمان R&D.',
            actions: [
              { 
                id: 'act_door_check', 
                label: 'لاگ تردد (بازه ۲ تا ۵ صبح)', 
                cost: 20, 
                riskLevel: 'Low', 
                content: `ACCESS CONTROL LOG [SECURITY LEVEL 5]:
DATE       TIME     CARD_ID      USER            LOCATION
---------------------------------------------------------
2023-10-12 02:14:00 998211       CLEANING_STAFF  MAIN_LOBBY
2023-10-12 02:45:00 110293       SALES_DIRECTOR  SERVER_ROOM (Access Denied)
2023-10-12 02:46:12 110293       SALES_DIRECTOR  R&D_OFFICE (Access Granted)
2023-10-12 03:30:00 110293       SALES_DIRECTOR  EXIT`, 
                isCrucial: true 
              },
            ]
          }
        ]
      },
      {
        id: 'cat_network',
        title: 'ترافیک شبکه',
        icon: Globe,
        sources: [
          {
            id: 'src_firewall',
            name: 'فایروال شرکت',
            role: 'امنیت',
            type: 'SIGINT',
            reliability: 95,
            description: 'لاگ‌های آپلود و دانلود.',
            actions: [
              { 
                id: 'act_fw_deep', 
                label: 'DPI (Deep Packet Inspection)', 
                cost: 40, 
                riskLevel: 'Low', 
                content: `NETWORK ALERT [SEVERITY: HIGH]
Source IP: 192.168.1.45 (Sales_Director_PC)
Destination: 85.11.xx.xx (Unknown External Server)
Protocol: SFTP (Encrypted)
Total Bytes: 4.2 GB
Timestamp: 2023-10-12 03:15:00

Content Analysis: File headers match .CAD and .DWG formats (Engineering Blueprints).`, 
                isCrucial: true 
              },
              { 
                id: 'act_fw_quick', 
                label: 'گزارش پهنای باند کلی', 
                cost: 10, 
                riskLevel: 'High', 
                content: `TRAFFIC SUMMARY:
Total Upload: 50GB (Spike detected on Tuesday night).
Top Users: Sales Dept, Engineering Dept.`, 
                isCrucial: false 
              },
            ]
          }
        ]
      },
      {
        id: 'cat_staff',
        title: 'پرسنل کلیدی',
        icon: User,
        sources: [
          {
            id: 'src_sales_head',
            name: 'مدیر فروش',
            role: 'مدیریت',
            type: 'HUMINT',
            reliability: 50,
            description: 'بسیار جاه‌طلب. اخیراً ماشین مدل بالایی خریده است.',
            actions: [
              { 
                id: 'act_sales_bank', 
                label: 'تحقیقات مالی (غیررسمی)', 
                cost: 50, 
                riskLevel: 'Low', 
                content: `REPORT from Private Investigator:
Subject purchased a Luxury SUV (Value: $80k) on 2023-10-15.
Payment method: Cash/Crypto Transfer.
Subject has recurrent meetings with "Competitor X" representatives at local golf club.`, 
                isCrucial: true 
              },
              { 
                id: 'act_sales_talk', 
                label: 'صحبت درباره وضعیت بازار', 
                cost: 10, 
                riskLevel: 'Medium', 
                content: `Sales Director: "ببینید، بازار داره عوض میشه. رقبا خیلی سریع‌ان. ما اگه نتونیم محصول رو برسونیم، نابود میشیم. من فقط نگران آینده شرکت هستم، همین."`, 
                isCrucial: false 
              },
            ]
          },
          {
            id: 'src_cleaner',
            name: 'مسئول نظافت',
            role: 'خدمات',
            type: 'HUMINT',
            reliability: 80,
            description: 'دسترسی به تمام اتاق‌ها دارد.',
            actions: [
              { 
                id: 'act_cleaner_ask', 
                label: 'پرس‌وجو', 
                cost: 15, 
                riskLevel: 'Low', 
                content: `Cleaning Staff: "آقا من اون شب دیدمشون. آقای مدیر فروش بودن. خیلی عرق کرده بودن و دستپاچه بودن. یه هارد اکسترنال مشکی هم دستشون بود. من فکر کردم دارن بکاپ میگیرن چیزی نگفتم."`, 
                isCrucial: false 
              },
            ]
          }
        ]
      }
    ],
    options: [
      { id: 'opt1', text: "اخراج مسئول نظافت", isCorrect: false, feedback: "اشتباه. لاگ‌ها نشان داد او فقط در لابی بوده و شهادت او کلید حل معما بود. شما شاهد اصلی را اخراج کردید." },
      { id: 'opt2', text: "شکایت از مدیر فروش به جرم سرقت اطلاعات", isCorrect: true, feedback: "صحیح! تردد شبانه به اتاق R&D، آپلود ۴ گیگابایت فایل CAD، خرید ماشین گران‌قیمت و شهادت نظافتچی همه قطعات پازل را تکمیل کرد." },
      { id: 'opt3', text: "تقویت فایروال‌ها و بستن پورت‌ها", isCorrect: false, feedback: "ناکافی. نفوذ از نوع Insider Threat (تهدید داخلی) بود. فایروال جلوی کسی که دسترسی فیزیکی و پسورد ادمین دارد را نمی‌گیرد." },
    ]
  }
];

const FactFindingGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [level, setLevel] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [performedActions, setPerformedActions] = useState<string[]>([]); // Action IDs
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [result, setResult] = useState<{ isWin: boolean; feedback: string; score: number } | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  const scenario = SCENARIOS[level];

  // Initialize level
  React.useEffect(() => {
    if (!showIntro && gameState === 'playing') {
      setCurrentBudget(scenario.budget);
      setPerformedActions([]);
      setResult(null);
      setSelectedCategory(null);
      setSelectedSource(null);
    }
  }, [showIntro, level, gameState]);

  const handleAction = (action: Action) => {
    if (performedActions.includes(action.id)) return;
    
    if (currentBudget >= action.cost) {
      sfx.playClick();
      setCurrentBudget(prev => prev - action.cost);
      setPerformedActions(prev => [...prev, action.id]);
    } else {
      sfx.playError();
    }
  };

  const handleDecision = (optionId: string) => {
    const selectedOption = scenario.options.find(o => o.id === optionId);
    if (!selectedOption) return;

    let roundScore = 0;
    const isWin = selectedOption.isCorrect;

    if (isWin) {
      sfx.playSuccess();
      // Efficiency Bonus
      const efficiency = (currentBudget / scenario.budget) * 30;
      // Information Gathering Bonus (Crucial clues found)
      let crucialFound = 0;
      let totalCrucial = 0;
      
      scenario.categories.forEach(cat => 
        cat.sources.forEach(src => 
            src.actions.forEach(act => {
                if (act.isCrucial) totalCrucial++;
                if (act.isCrucial && performedActions.includes(act.id)) crucialFound++;
            })
        )
      );

      const investigationBonus = (crucialFound / Math.max(1, totalCrucial)) * 70;
      roundScore = Math.round(efficiency + investigationBonus);
    } else {
      sfx.playError();
      roundScore = 0;
    }

    setResult({
      isWin,
      feedback: selectedOption.feedback,
      score: roundScore
    });
    setTotalScore(prev => prev + roundScore);
    setGameState('result');
  };

  const nextLevel = () => {
    if (level < SCENARIOS.length - 1) {
      setLevel(prev => prev + 1);
      setGameState('playing');
    } else {
      onComplete(totalScore);
    }
  };

  const getTypeIcon = (type: SourceType) => {
      if (type === 'HUMINT') return <User size={14} />;
      if (type === 'SIGINT') return <Terminal size={14} />;
      return <FileText size={14} />;
  }

  const getRiskColor = (risk: string) => {
      if (risk === 'Low') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      if (risk === 'Medium') return 'text-amber-500 bg-amber-50 border-amber-100';
      return 'text-red-500 bg-red-50 border-red-100';
  }

  const renderEvidenceContent = (sourceType: SourceType, content: string) => {
      if (sourceType === 'SIGINT') {
          return (
              <div className="mt-4 bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-inner font-mono text-xs md:text-sm text-green-400 overflow-x-auto whitespace-pre animate-fade-in" dir="ltr">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2 text-slate-500">
                      <Terminal size={14} /> SYSTEM_LOG_OUTPUT
                  </div>
                  {content}
              </div>
          );
      }
      
      if (sourceType === 'OSINT') {
          return (
              <div className="mt-4 bg-white rounded-sm p-6 border border-slate-300 shadow-md font-serif text-slate-800 text-sm leading-relaxed whitespace-pre-wrap animate-fade-in relative">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-slate-100 border-l border-b border-slate-300"></div>
                  <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-widest text-xs text-slate-500 flex items-center gap-2">
                      <FileText size={14} /> Official Document
                  </div>
                  {content}
              </div>
          );
      }

      // HUMINT
      return (
          <div className="mt-4 bg-blue-50/50 rounded-xl p-4 border-l-4 border-blue-500 text-slate-700 italic text-sm leading-relaxed shadow-sm animate-fade-in whitespace-pre-wrap">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-2 not-italic">
                  <MessageSquare size={14} /> TRANSCRIPT / NOTES
              </div>
              "{content}"
          </div>
      );
  };

  if (showIntro) {
    return (
      <GameIntro 
        title="اتاق وضعیت: حقیقت‌یابی"
        description="شما در نقش کارآگاه سازمانی هستید. با بودجه محدود، منابع اطلاعاتی را مدیریت کنید. انتخاب کنید که با هر منبع چطور تعامل کنید: یک گپ ارزان یا یک بازرسی دقیق و گران؟ استراتژی شما در جمع‌آوری شواهد، سرنوشت شرکت را رقم می‌زند."
        icon={<Fingerprint />}
        gradientFrom="from-slate-700"
        gradientTo="to-slate-900"
        accentColor="text-emerald-400"
        onStart={() => setShowIntro(false)}
      />
    );
  }

  return (
    <div className="h-full bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden animate-fade-in font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Shield className="text-emerald-400" size={24} />
          </div>
          <div>
             <h2 className="text-lg font-bold">پرونده #{toPersianNum(level + 1)}: {scenario.title}</h2>
             <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                 <span className="flex items-center gap-1"><DollarSign size={12}/> BUDGET: {toPersianNum(currentBudget)}</span>
                 <span className="flex items-center gap-1"><Eye size={12}/> ACTIONS: {toPersianNum(performedActions.length)}</span>
             </div>
          </div>
        </div>
        <button onClick={onExit} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors">خروج از سیستم</button>
      </div>

      {gameState === 'result' && result ? (
          <div className="flex-1 flex items-center justify-center animate-scale-in p-4 overflow-y-auto">
              <div className={`max-w-lg w-full p-8 rounded-3xl text-center shadow-2xl border-2 bg-white ${result.isWin ? 'border-emerald-500' : 'border-red-500'}`}>
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${result.isWin ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {result.isWin ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-slate-900">
                        {result.isWin ? 'پرونده مختومه شد' : 'شکست تحقیقات'}
                    </h3>
                    <p className="text-slate-600 font-medium mb-8 leading-relaxed text-lg border-y py-4 border-slate-100">
                        {result.feedback}
                    </p>
                    {result.isWin && (
                        <div className="mb-8 flex justify-center gap-4">
                            <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-bold border border-emerald-100">
                                امتیاز: {toPersianNum(result.score)}
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={nextLevel}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 ${result.isWin ? 'bg-slate-900' : 'bg-slate-500'}`}
                    >
                        {level < SCENARIOS.length - 1 ? 'پرونده بعدی' : 'پایان بازی'}
                    </button>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
              
              {/* LEFT PANE: DIRECTORY */}
              <div className="lg:w-1/4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm flex items-center gap-2">
                      <FolderOpen size={16} /> دایرکتوری منابع
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {scenario.categories.map(cat => (
                          <div key={cat.id} className="space-y-1">
                              <button 
                                onClick={() => {
                                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
                                    setSelectedSource(null);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                  <div className={`p-1.5 rounded-lg ${selectedCategory === cat.id ? 'bg-blue-100' : 'bg-slate-200'}`}>
                                     <cat.icon size={16} />
                                  </div>
                                  {cat.title}
                              </button>
                              
                              {selectedCategory === cat.id && (
                                  <div className="pr-4 space-y-1 animate-slide-in-right">
                                      {cat.sources.map(src => (
                                          <button
                                            key={src.id}
                                            onClick={() => setSelectedSource(src.id)}
                                            className={`w-full text-right p-2.5 rounded-lg text-xs font-medium border-r-2 transition-all flex justify-between items-center ${selectedSource === src.id ? 'bg-slate-800 text-white border-blue-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                          >
                                              <span>{src.name}</span>
                                              <span className="opacity-50">{getTypeIcon(src.type)}</span>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              {/* CENTER PANE: WORKSPACE */}
              <div className="flex-1 flex flex-col gap-4">
                  {/* Source Detail & Action Area */}
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-y-auto custom-scrollbar">
                      {selectedSource ? (
                          (() => {
                              const category = scenario.categories.find(c => c.id === selectedCategory);
                              const src = category?.sources.find(s => s.id === selectedSource);
                              if (!src) return null;
                              return (
                                  <div className="animate-fade-in pb-12">
                                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                          <div>
                                              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                                  {src.name}
                                                  <span className="text-xs font-normal px-2 py-1 bg-slate-100 rounded text-slate-500">{src.role}</span>
                                              </h2>
                                              <p className="text-slate-500 mt-2 text-sm">{src.description}</p>
                                          </div>
                                          <div className="text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <div className={`text-lg font-black ${src.reliability > 80 ? 'text-emerald-500' : src.reliability < 60 ? 'text-red-500' : 'text-amber-500'}`}>{toPersianNum(src.reliability)}%</div>
                                              <div className="text-[10px] text-slate-400 uppercase font-bold">اعتبار منبع</div>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-6">
                                          {src.actions.map(action => {
                                              const isPerformed = performedActions.includes(action.id);
                                              const canAfford = currentBudget >= action.cost;

                                              return (
                                                  <div key={action.id} className="flex flex-col">
                                                      <button
                                                          onClick={() => handleAction(action)}
                                                          disabled={isPerformed || (!canAfford)}
                                                          className={`
                                                              text-right p-4 rounded-xl border-2 transition-all relative overflow-hidden group w-full
                                                              ${isPerformed 
                                                                  ? 'bg-slate-50 border-slate-200 cursor-default' 
                                                                  : canAfford 
                                                                      ? 'bg-white border-blue-100 hover:border-blue-500 hover:shadow-lg active:scale-[0.98]' 
                                                                      : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'}
                                                          `}
                                                      >
                                                          <div className="flex justify-between items-center mb-3 relative z-10">
                                                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getRiskColor(action.riskLevel)}`}>
                                                                  ریسک: {action.riskLevel}
                                                              </span>
                                                              {!isPerformed && (
                                                                  <span className="font-bold text-slate-800 bg-amber-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                                      {toPersianNum(action.cost)} <DollarSign size={10} />
                                                                  </span>
                                                              )}
                                                          </div>
                                                          
                                                          <h4 className={`font-bold mb-1 ${isPerformed ? 'text-slate-500' : 'text-slate-800 group-hover:text-blue-700'}`}>{action.label}</h4>
                                                      </button>

                                                      {/* Reveal Content Below Button */}
                                                      {isPerformed && renderEvidenceContent(src.type, action.content)}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              );
                          })()
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300">
                              <Search size={64} className="mb-4 opacity-50" />
                              <p className="font-bold text-lg">یک منبع را از منوی راست انتخاب کنید</p>
                          </div>
                      )}
                  </div>

                  {/* Context & Decision Area (Bottom) */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/2">
                          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <AlertTriangle size={16} className="text-amber-500" /> خلاصه وضعیت
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {scenario.context}
                          </p>
                      </div>
                      <div className="md:w-1/2">
                          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                              <CheckCircle2 size={16} className="text-emerald-500" /> تصمیم نهایی
                          </h3>
                          <div className="flex flex-col gap-2">
                              {scenario.options.map(opt => (
                                  <button
                                      key={opt.id}
                                      onClick={() => handleDecision(opt.id)}
                                      className="w-full text-right px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                  >
                                      {opt.text}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FactFindingGame;
