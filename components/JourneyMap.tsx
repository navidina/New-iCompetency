
import React, { useState, useMemo } from 'react';
import { AppView, JourneyNode } from '../types';
import { 
  Layers, Calculator, Zap, Box, Compass, Eye, LayoutGrid, 
  Check, Lock, MapPin, Flag, BrainCircuit, Star, FileCheck, 
  Trophy, Info, Coins, Cpu, Server, Users, X, ArrowLeft, PlayCircle
} from 'lucide-react';
import { toPersianNum } from '../utils';

interface Props {
  unlockedNodes: string[];
  completedNodes: string[];
  onSelectNode: (view: AppView) => void;
  onStartScenario: () => void;
}

interface SubNode {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
}

// Extended Journey Node with SubNodes
interface ExtendedJourneyNode extends JourneyNode {
    x: number;
    y: number;
    description: string;
    subNodes?: SubNode[];
}

const nodesList: ExtendedJourneyNode[] = [
  {
    id: 'node-1',
    view: AppView.MINIGAME_MEMORY,
    title: 'A9: سنجش جامع حافظه',
    type: 'Assessment',
    icon: Layers,
    xpReward: 300, 
    coinReward: 50,
    position: 'center',
    x: 92, y: 55,
    description: "شامل ۳ آزمون: مرکز عملیات (N-Back)، مسیر شبکه (Corsi) و کنفرانس (تداعی‌گر)",
    subNodes: [
        { id: 'mem-1', title: 'حافظه فعال', description: 'آزمون N-Back', icon: Cpu, color: 'text-blue-500' },
        { id: 'mem-2', title: 'حافظه فضایی', description: 'آزمون Corsi', icon: Server, color: 'text-emerald-500' },
        { id: 'mem-3', title: 'حافظه تداعی‌گر', description: 'آزمون جفت‌ها', icon: Users, color: 'text-purple-500' }
    ]
  },
  {
    id: 'node-2',
    view: AppView.MINIGAME_MATH,
    title: 'A10: هوش ریاضی',
    type: 'Assessment',
    icon: Calculator,
    xpReward: 120,
    coinReward: 20,
    requiredNodeId: 'node-1',
    position: 'right',
    x: 78, y: 25,
    description: "سنجش سرعت و دقت پردازش ذهنی در عملیات محاسباتی" 
  },
  {
    id: 'node-3',
    view: AppView.MINIGAME_SPEED,
    title: 'A11: سرعت ادراکی',
    type: 'Assessment',
    icon: Zap,
    xpReward: 150,
    coinReward: 25,
    requiredNodeId: 'node-2',
    position: 'right',
    x: 65, y: 65,
    description: "اندازه‌گیری سرعت واکنش و دقت در تشخیص تفاوت‌ها"
  },
  {
    id: 'node-4',
    view: AppView.MINIGAME_VISUALIZATION,
    title: 'A12: تجسم فضایی',
    type: 'Assessment',
    icon: Box,
    xpReward: 180,
    coinReward: 30,
    requiredNodeId: 'node-3',
    position: 'center',
    x: 52, y: 30,
    description: "ارزیابی توانایی چرخش ذهنی و درک روابط فضایی"
  },
  {
    id: 'node-5',
    view: AppView.MINIGAME_ORIENTATION,
    title: 'A13: جهت‌یابی',
    type: 'Assessment',
    icon: Compass,
    xpReward: 200,
    coinReward: 35,
    requiredNodeId: 'node-4',
    position: 'left',
    x: 40, y: 70,
    description: "سنجش آگاهی محیطی و تشخیص موقعیت نسبی"
  },
  {
    id: 'node-6',
    view: AppView.MINIGAME_STROOP,
    title: 'A14: قدرت تمرکز',
    type: 'Assessment',
    icon: Eye,
    xpReward: 220,
    coinReward: 40,
    requiredNodeId: 'node-5',
    position: 'left',
    x: 28, y: 35,
    description: "ارزیابی انعطاف‌پذیری شناختی و کنترل تداخل ذهنی"
  },
  {
    id: 'node-7',
    view: AppView.MINIGAME_MULTITASK,
    title: 'A15: مدیریت همزمان',
    type: 'Assessment',
    icon: LayoutGrid,
    xpReward: 300,
    coinReward: 60,
    requiredNodeId: 'node-6',
    position: 'center',
    x: 18, y: 65,
    description: "سنجش توانایی مدیریت همزمان چند جریان اطلاعاتی"
  },
  {
    id: 'node-final',
    view: AppView.ACTIVE_SCENARIO,
    title: 'ارزیابی نهایی',
    type: 'Boss',
    icon: Trophy,
    xpReward: 1000,
    coinReward: 200,
    requiredNodeId: 'node-7',
    position: 'center',
    x: 8, y: 50,
    description: "آزمون جامع حل مسئله و تصمیم‌گیری در شرایط واقعی"
  }
];

const MapBackground = () => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Abstract Terrain Lines / Topography */}
        <path d="M0 80 Q 20 60 40 80 T 80 80 T 100 60 V 100 H 0 Z" fill="currentColor" />
        <path d="M0 30 Q 30 10 50 30 T 100 20 V 0 H 0 Z" fill="currentColor" />
        
        {/* Islands */}
        <path d="M 85 50 Q 95 40 98 55 T 85 50" fill="currentColor" opacity="0.5" />
        <path d="M 10 60 Q 5 70 15 75 T 10 60" fill="currentColor" opacity="0.5" />
    </svg>
);

const JourneyMap: React.FC<Props> = ({ unlockedNodes, completedNodes, onSelectNode, onStartScenario }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<ExtendedJourneyNode | null>(null);

  const getSegmentPath = (start: {x:number, y:number}, end: {x:number, y:number}) => {
    // Curvier paths
    const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const midX = (start.x + end.x) / 2;
    // Add some curve based on direction
    const curveY = start.y > end.y ? -10 : 10;
    const cp1x = (start.x + end.x) / 2;
    const cp1y = start.y + (end.y - start.y) * 0.1;
    const cp2x = (start.x + end.x) / 2;
    const cp2y = end.y - (end.y - start.y) * 0.1;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
  };

  const activeNodeId = useMemo(() => {
    const unlocked = nodesList.filter(n => unlockedNodes.includes(n.id));
    return unlocked.length > 0 ? unlocked[unlocked.length - 1].id : nodesList[0].id;
  }, [unlockedNodes]);

  const activeNode = nodesList.find(n => n.id === activeNodeId);

  const handleNodeClick = (node: ExtendedJourneyNode) => {
      if (!unlockedNodes.includes(node.id)) return;

      if (node.subNodes) {
          setFocusedNode(node);
      } else if (node.id === 'node-final') {
          onStartScenario();
      } else {
          onSelectNode(node.view);
      }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] dark:bg-slate-950 relative flex flex-col items-center shadow-inner overflow-hidden transition-colors duration-300">
        
        {/* Background Texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
            backgroundSize: '30px 30px',
            opacity: 0.4
        }}></div>
        
        <MapBackground />

        {/* Header */}
        <div className={`relative z-10 pt-8 pb-4 text-center transition-all duration-500 flex-shrink-0 w-full ${focusedNode ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100'}`}>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
                <MapPin className="text-blue-500" /> نقشه مسیر صلاحیت
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">مسیر ارزیابی شایستگی‌های شناختی و رفتاری</p>
        </div>

        {/* Map Container */}
        <div className="relative w-full flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth" dir="ltr">
            
            <div 
                className={`relative h-full min-w-[1200px] mx-auto transition-all duration-700 ease-in-out transform ${focusedNode ? 'scale-[1.5] blur-sm opacity-20 pointer-events-none' : 'scale-100 opacity-100'}`}
                style={focusedNode ? { transformOrigin: `${focusedNode.x}% ${focusedNode.y}%` } : {}}
            >
                
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {nodesList.map((node, index) => {
                        if (index === nodesList.length - 1) return null;
                        const nextNode = nodesList[index + 1];
                        const isSegmentUnlocked = completedNodes.includes(node.id);
                        const isNextUnlocked = unlockedNodes.includes(nextNode.id);

                        return (
                            <g key={`path-${index}`}>
                                {/* Road Bed (White/Dark Outline) */}
                                <path 
                                    d={getSegmentPath(node, nextNode)} 
                                    fill="none" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    className="stroke-white dark:stroke-slate-900"
                                />
                                {/* Path Line (Dotted or Solid) */}
                                <path 
                                    d={getSegmentPath(node, nextNode)} 
                                    fill="none" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round"
                                    strokeDasharray={isSegmentUnlocked ? "0" : "4 6"}
                                    className={`${isSegmentUnlocked ? 'stroke-slate-300 dark:stroke-slate-600' : 'stroke-slate-200 dark:stroke-slate-800'}`}
                                />
                                
                                {/* Active Progress Path */}
                                {isSegmentUnlocked && (
                                    <path 
                                        d={getSegmentPath(node, nextNode)} 
                                        fill="none" 
                                        stroke="url(#gradientPath)" 
                                        strokeWidth="2" 
                                        strokeLinecap="round"
                                        className="animate-draw-path"
                                        style={{ filter: 'drop-shadow(0px 0px 4px rgba(59, 130, 246, 0.4))' }}
                                    />
                                )}
                            </g>
                        );
                    })}
                    <defs>
                        <linearGradient id="gradientPath" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Nodes */}
                {nodesList.map((node, index) => {
                    const isUnlocked = unlockedNodes.includes(node.id);
                    const isCompleted = completedNodes.includes(node.id);
                    const isCurrent = activeNodeId === node.id;
                    const isBoss = node.type === 'Boss';
                    const isHovered = hoveredNode === node.id;
                    
                    // Determine if node is in the top half or bottom half of the map
                    const isTopHalf = node.y < 50;

                    return (
                        <div 
                            key={node.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group outline-none"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Tooltip (Dynamic Positioning) */}
                            {!focusedNode && (
                                <div className={`
                                    absolute left-1/2 -translate-x-1/2 w-72 transition-all duration-300 z-50 pointer-events-none
                                    ${isTopHalf 
                                        ? (isHovered ? 'top-[130%] opacity-100 scale-100' : 'top-[110%] opacity-0 scale-95') // Show BELOW if node is high
                                        : (isHovered ? 'bottom-[130%] opacity-100 scale-100' : 'bottom-[110%] opacity-0 scale-95') // Show ABOVE if node is low
                                    }
                                `}>
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl text-center border-2 border-slate-100 dark:border-slate-700 relative">
                                        {/* Arrow Pointer */}
                                        <div className={`
                                            absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800
                                            ${isTopHalf 
                                                ? '-top-2 rotate-45 border-t-2 border-l-2 border-slate-100 dark:border-slate-700' 
                                                : '-bottom-2 rotate-45 border-r-2 border-b-2 border-slate-100 dark:border-slate-700'}
                                        `}></div>
                                        
                                        <div className="font-bold text-slate-800 dark:text-white text-lg mb-1">{node.title}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 leading-relaxed">{node.description}</div>
                                        
                                        {/* XP Reward Removed Here */}

                                        <div className={`text-xs font-bold py-2 rounded-xl ${isUnlocked ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {isCompleted ? 'تکمیل شده' : isUnlocked ? 'برای شروع کلیک کنید' : 'قفل شده'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Node Visual */}
                            <button
                                onClick={(e) => {
                                    if (isUnlocked) handleNodeClick(node);
                                }}
                                className={`
                                    relative flex flex-col items-center justify-center transition-all duration-300
                                    ${isCurrent ? 'scale-110 -translate-y-2' : 'hover:-translate-y-1'}
                                `}
                            >
                                {/* Pin/Marker Shape */}
                                <div className={`
                                    w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 relative z-10 transition-colors
                                    ${isCompleted 
                                        ? 'bg-emerald-500 border-white dark:border-slate-900 text-white' 
                                        : isCurrent 
                                            ? 'bg-white border-blue-500 text-blue-600 animate-pulse-soft' 
                                            : isUnlocked 
                                                ? 'bg-white border-slate-200 text-slate-600 hover:border-blue-400' 
                                                : 'bg-slate-100 border-slate-200 text-slate-300'}
                                `}>
                                    {isCompleted ? <Check size={24} strokeWidth={3} /> : <node.icon size={24} />}
                                    
                                    {!isUnlocked && <Lock size={14} className="absolute -bottom-1 -right-1 bg-slate-200 rounded-full p-0.5 text-slate-500" />}
                                </div>

                                {/* Base/Shadow */}
                                <div className="w-8 h-1.5 bg-slate-300/50 rounded-[100%] mt-2 blur-[1px]"></div>

                                {isCurrent && !focusedNode && (
                                    <div className="absolute -top-12 animate-bounce">
                                        <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md mb-1">شما اینجایید</div>
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600 mx-auto"></div>
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* --- FOCUS MODE OVERLAY (Micro-Journey Path) --- */}
        {focusedNode && focusedNode.subNodes && (
            <div className="absolute inset-0 z-50 flex flex-col bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md animate-fade-in overflow-hidden">
                
                {/* Header */}
                <div className="p-8 flex items-center justify-between max-w-5xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                             <focusedNode.icon size={32} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{focusedNode.title}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">مسیر ارزیابی ریز-مهارت‌ها</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setFocusedNode(null)}
                        className="p-3 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-red-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Linear Track Layout */}
                <div className="flex-1 flex items-center justify-center w-full overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-0 px-12 min-w-max pb-12">
                        
                        {/* Start Marker */}
                        <div className="flex flex-col items-center gap-3 opacity-50">
                            <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                            <span className="text-xs font-bold text-slate-400">شروع</span>
                        </div>

                        {/* Track & Nodes */}
                        {focusedNode.subNodes.map((sub, idx) => (
                            <div key={sub.id} className="flex items-center">
                                
                                {/* Connecting Line (Left) */}
                                <div className={`w-40 h-1.5 ${idx === 0 ? 'bg-slate-300 dark:bg-slate-700 rounded-l-full' : 'bg-slate-300 dark:bg-slate-700'}`}></div>

                                {/* Node Card Container */}
                                <div className="relative group">
                                    {/* The Node on Track */}
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-4 border-blue-100 dark:border-slate-700 flex items-center justify-center shadow-lg relative z-20 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => onSelectNode(focusedNode.view)}>
                                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                    </div>

                                    {/* Info Card (Above Track) */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-64 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div 
                                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform cursor-pointer group-hover:border-blue-500 dark:group-hover:border-blue-400"
                                            onClick={() => onSelectNode(focusedNode.view)}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                                    <sub.icon size={20} className={sub.color} />
                                                </div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{sub.title}</div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{sub.description}</p>
                                            <button className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <PlayCircle size={14} /> شروع آزمون
                                            </button>
                                        </div>
                                        {/* Connector to Track */}
                                        <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600 mx-auto"></div>
                                    </div>
                                </div>

                                {/* Connecting Line (Right) */}
                                <div className={`w-40 h-1.5 ${idx === focusedNode.subNodes!.length - 1 ? 'bg-slate-300 dark:bg-slate-700 rounded-r-full' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                            </div>
                        ))}

                        {/* End Marker */}
                        <div className="flex flex-col items-center gap-3 opacity-50">
                            <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                            <span className="text-xs font-bold text-slate-400">پایان</span>
                        </div>

                    </div>
                </div>

                <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                        <Info size={14} /> برای تکمیل این مرحله، تمام آزمون‌های بالا را انجام دهید
                    </div>
                </div>

            </div>
        )}
    </div>
  );
};

export default JourneyMap;
