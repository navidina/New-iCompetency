
import React, { useState, useEffect } from 'react';
import { Scenario, UserResponse } from '../types';
import { Clock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ActiveScenarioProps {
  scenario: Scenario;
  onComplete: (responses: UserResponse[]) => void;
  onCancel: () => void;
}

const ActiveScenario: React.FC<ActiveScenarioProps> = ({ scenario, onComplete, onCancel }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phaseStartTime, setPhaseStartTime] = useState(Date.now());

  const currentPhase = scenario.phases[currentPhaseIndex];
  const progress = ((currentPhaseIndex) / scenario.phases.length) * 100;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = () => {
    if (!inputText.trim()) return;

    const timeSpent = Math.floor((Date.now() - phaseStartTime) / 1000);

    const newResponse: UserResponse = {
      phaseId: currentPhase.id,
      answer: inputText,
      timeSpentSeconds: timeSpent
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentPhaseIndex < scenario.phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
      setInputText('');
      setPhaseStartTime(Date.now());
    } else {
      // Finish
      onComplete(updatedResponses);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm animate-slide-in-right">
        <div>
          <h2 className="font-bold text-lg text-slate-800">{scenario.title}</h2>
          <p className="text-sm text-slate-500">متدولوژی: {scenario.methodology}</p>
        </div>
        <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 tabular-nums text-lg font-semibold ${elapsedTime > scenario.timeLimitMinutes * 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                <Clock size={20} />
                {formatTime(elapsedTime)}
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors hover:scale-105">
                خروج از سناریو
            </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-200" dir="ltr">
        <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out relative" 
            style={{ width: `${progress}%` }} 
        >
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/30 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        
        {/* Context Card */}
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-6 mb-8 hover:shadow-md transition-shadow duration-300 animate-fade-in-up delay-100">
            <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-indigo-500 mt-1" />
                <h3 className="text-xl font-bold text-slate-800">شرح موقعیت</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg text-justify">
                {scenario.description}
            </p>
        </div>

        {/* Current Phase Interaction */}
        <div key={currentPhaseIndex} className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col animate-fade-in-up delay-200">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    مرحله {currentPhaseIndex + 1} از {scenario.phases.length}
                </span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold animate-pop">
                    {currentPhase.title}
                </span>
            </div>
            
            <div className="p-6 md:p-8">
                <p className="text-slate-700 mb-6 italic border-r-4 border-emerald-400 pr-4 py-2 bg-slate-50/50 animate-slide-in-right delay-300">
                    {currentPhase.description}
                </p>
                
                <h4 className="text-xl font-bold text-slate-900 mb-4">
                    {currentPhase.question}
                </h4>

                <textarea
                    className="w-full h-48 p-4 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none text-slate-700 text-lg hover:border-emerald-300 hover:shadow-sm font-sans"
                    placeholder="پاسخ و راهکار خود را اینجا بنویسید..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleNext}
                    disabled={!inputText.trim()}
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-md transition-all duration-300 ${
                        inputText.trim() 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white translate-y-0 hover:scale-105 hover:shadow-lg' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                    }`}
                >
                    {currentPhaseIndex === scenario.phases.length - 1 ? 'ثبت نهایی' : 'مرحله بعد'}
                    {currentPhaseIndex === scenario.phases.length - 1 ? <CheckCircle2 size={20} /> : <ArrowLeft size={20} />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ActiveScenario;
