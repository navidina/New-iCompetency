
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ActiveScenario from './components/ActiveScenario';
import EvaluationResultView from './components/EvaluationResult';
import JourneyMap from './components/JourneyMap';
import MiniGameHub from './components/MiniGameHub';
import VerifiedResume from './components/VerifiedResume';
import BackgroundQuotes from './components/BackgroundQuotes';
import BigFiveGame from './components/BigFiveGame'; // Import BigFive

// Methodology Games
import FiveWhysGame from './components/FiveWhysGame';
import SwotGame from './components/SwotGame';
import CynefinGame from './components/CynefinGame';

// Cognitive Games (Razi Model A9-A15)
import MemoryGame from './components/MemoryGame';          // A9
import MathGame from './components/MathGame';              // A10
import SpeedGame from './components/SpeedGame';            // A11
import VisualizationGame from './components/VisualizationGame'; // A12
import OrientationGame from './components/OrientationGame'; // A13
import StroopGame from './components/StroopGame';          // A14
import MultitaskGame from './components/MultitaskGame';    // A15
import PatternGame from './components/PatternGame'; // A10+
import FactFindingGame from './components/FactFindingGame'; // New Game

import { AppView, UserProfile, Scenario, EvaluationResult, UserResponse } from './types';
import { generateScenario, evaluateSession } from './services/geminiService';
import { Loader2 } from 'lucide-react';

// Initial Empty State (No Mock Data)
const initialUser: UserProfile = {
  name: "کاربر میهمان",
  role: "متقاضی ارزیابی",
  level: "تعیین نشده",
  levelNumber: 0,
  currentXp: 0,
  requiredXp: 500,
  totalScenarios: 0,
  badges: [],
  skills: {
    // General
    analysis: 0,
    creativity: 0,
    speed: 0,
    quality: 0,
    teamwork: 0,
    decisionMaking: 0,
    // Cognitive (A9-A15)
    memory: 0,
    math: 0,
    perception: 0,
    visualization: 0,
    orientation: 0,
    focus: 0,
    multitasking: 0
  },
  coins: 0,
  streak: 0,
  unlockedNodes: ['node-1'], 
  completedNodes: [],
  memorySubScores: { corsi: 0, pairs: 0, nback: 0 }
};

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Persistence Logic ---
  
  // Load from LocalStorage on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('iCompetency_User');
    if (savedUser) {
        try {
            const parsed = JSON.parse(savedUser);
            // Schema Migration: Ensure memorySubScores exists
            if (!parsed.memorySubScores) {
                parsed.memorySubScores = { corsi: 0, pairs: 0, nback: 0 };
            }
            setUser(parsed);
        } catch (e) {
            console.error("Failed to load saved state", e);
        }
    }
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage on Change
  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem('iCompetency_User', JSON.stringify(user));
    }
  }, [user, isInitialized]);

  // --- Navigation Safety (Browser Back Button) ---
  useEffect(() => {
      window.history.replaceState({ view: AppView.DASHBOARD }, '');

      const handlePopState = (event: PopStateEvent) => {
          if (view !== AppView.DASHBOARD) {
              setView(AppView.DASHBOARD);
              window.history.pushState({ view: AppView.DASHBOARD }, '');
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  // --- Assessment Logic ---

  const changeView = (newView: AppView) => {
      setView(newView);
      if (newView !== AppView.DASHBOARD) {
          window.history.pushState({ view: newView }, '');
      }
  };

  const updateAssessmentScore = (scorePoints: number) => {
      let newXp = user.currentXp + scorePoints;
      let newLevelNum = user.levelNumber;
      
      // Level Up Logic
      if (newXp >= user.requiredXp) {
          newXp = newXp - user.requiredXp;
          newLevelNum += 1;
      }

      setUser(prev => ({
          ...prev,
          currentXp: newXp,
          levelNumber: newLevelNum,
          level: getTierTitle(newLevelNum),
          // If it's the first time gaining XP, update total scenarios/activity count
          totalScenarios: prev.totalScenarios + 1
      }));
  };

  const getTierTitle = (lvl: number) => {
      if (lvl === 0) return "مبتدی";
      if (lvl < 3) return "سطح C (مقدماتی)";
      if (lvl < 5) return "سطح B (متوسط)";
      if (lvl < 10) return "سطح A (پیشرفته)";
      return "سطح S (خبره)";
  };

  const unlockNextNode = (currentNodeId: string) => {
      const nodeOrder = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-final'];
      const currentIndex = nodeOrder.indexOf(currentNodeId);
      
      const newCompleted = [...user.completedNodes];
      if (!newCompleted.includes(currentNodeId)) {
          newCompleted.push(currentNodeId);
      }

      const newUnlocked = [...user.unlockedNodes];
      if (currentIndex !== -1 && currentIndex < nodeOrder.length - 1) {
          const nextNode = nodeOrder[currentIndex + 1];
          if (!newUnlocked.includes(nextNode)) {
              newUnlocked.push(nextNode);
          }
      }

      setUser(prev => ({
          ...prev,
          completedNodes: newCompleted,
          unlockedNodes: newUnlocked
      }));
  };

  // --- Handlers ---

  const handleMemoryProgress = (gameType: 'corsi' | 'pairs' | 'nback', score: number) => {
      setUser(prev => {
          const currentSubScores = prev.memorySubScores || { corsi: 0, pairs: 0, nback: 0 };
          const newSubScores = { ...currentSubScores, [gameType]: score };
          
          // Calculate overall memory score (Simple Average of 3 components)
          // Even if 0, it counts towards average, incentivizing completion of all 3.
          const totalSub = newSubScores.corsi + newSubScores.pairs + newSubScores.nback;
          const avgScore = Math.round(totalSub / 3);

          return {
              ...prev,
              memorySubScores: newSubScores,
              skills: {
                  ...prev.skills,
                  memory: Math.max(prev.skills.memory, avgScore) // Keep highest or updated average? Let's use updated average to reflect current state
              }
          };
      });
  };

  const handleMiniGameComplete = (score: number, nodeId: string, gameView: AppView) => {
      // Base score calc
      const pointsEarned = Math.floor(score * 1.5);
      
      // Update XP & Level
      updateAssessmentScore(pointsEarned);
      
      // Update Progress Map
      if (nodeId && user.unlockedNodes.includes(nodeId)) {
         unlockNextNode(nodeId);
      }

      // Update Specific Skills
      setUser(prev => {
        const newSkills = { ...prev.skills };
        
        // --- Cognitive Skills (Razi Model) ---
        // Memory is handled incrementally via handleMemoryProgress, but we ensure it here too
        if (gameView === AppView.MINIGAME_MEMORY) {
             // Just ensure logic holds, maybe give bonus?
        }
        if (gameView === AppView.MINIGAME_MATH) {
            newSkills.math = Math.max(newSkills.math, score);
            // Math also helps Analysis
            newSkills.analysis = Math.max(newSkills.analysis, Math.round(score * 0.7)); 
        }
        if (gameView === AppView.MINIGAME_PATTERN) {
            newSkills.analysis = Math.max(newSkills.analysis, score);
            newSkills.math = Math.max(newSkills.math, Math.round(score * 0.5));
        }
        if (gameView === AppView.MINIGAME_SPEED) {
            newSkills.perception = Math.max(newSkills.perception, score);
            newSkills.speed = Math.max(newSkills.speed, score);
        }
        if (gameView === AppView.MINIGAME_VISUALIZATION) newSkills.visualization = Math.max(newSkills.visualization, score);
        if (gameView === AppView.MINIGAME_ORIENTATION) newSkills.orientation = Math.max(newSkills.orientation, score);
        if (gameView === AppView.MINIGAME_STROOP) newSkills.focus = Math.max(newSkills.focus, score);
        if (gameView === AppView.MINIGAME_MULTITASK) newSkills.multitasking = Math.max(newSkills.multitasking, score);
        
        // Fact Finding -> Decision Making
        if (gameView === AppView.MINIGAME_FACTFINDING) {
             newSkills.decisionMaking = Math.max(newSkills.decisionMaking, score);
        }

        // --- Methodology Skills ---
        
        // 5 Whys -> Analysis (Root Cause)
        if (gameView === AppView.MINIGAME_5WHYS) {
             newSkills.analysis = Math.max(newSkills.analysis, score);
        }
        
        // SWOT -> Analysis & Decision Making (Strategy)
        if (gameView === AppView.MINIGAME_SWOT) {
             newSkills.analysis = Math.max(newSkills.analysis, score);
             newSkills.decisionMaking = Math.max(newSkills.decisionMaking, score);
        }
        
        // Cynefin -> Decision Making (Context Sensing)
        if (gameView === AppView.MINIGAME_CYNEFIN) {
             newSkills.decisionMaking = Math.max(newSkills.decisionMaking, score);
        }

        return {
            ...prev,
            skills: newSkills
        };
      });
      
      // Return to Hub or Map depending on flow (Simpler to go to Dashboard/Hub)
      changeView(AppView.DASHBOARD);
  };

  const handleBigFiveComplete = (scores: any) => {
      // Save results to user profile
      setUser(prev => ({
          ...prev,
          bigFive: scores
      }));
      // Award XP for completing the simulation
      updateAssessmentScore(250); 
      changeView(AppView.DASHBOARD);
  }

  const handleStartGeneration = async (methodology: 'FactFinding' | 'SixSigma', difficulty: string, focusArea: string) => {
    setLoading(true);
    setLoadingMessage(`در حال طراحی سناریو با هوش مصنوعی...`);
    try {
      const scenario = await generateScenario(difficulty, "Tech SaaS", focusArea, methodology);
      setCurrentScenario(scenario);
      changeView(AppView.ACTIVE_SCENARIO);
    } catch (e) {
      alert("خطا در تولید سناریو. لطفا دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteScenario = async (responses: UserResponse[]) => {
    if (!currentScenario) return;
    
    setLoading(true);
    setLoadingMessage("تحلیل عملکرد شما توسط هوش مصنوعی...");
    try {
      const result = await evaluateSession(currentScenario, responses);
      setEvaluationResult(result);
      
      updateAssessmentScore(result.score * 5); // 5x multiplier for full scenarios
      
      // Update relevant soft skills based on scenario result
      setUser(prev => ({
          ...prev,
          skills: {
              ...prev.skills,
              analysis: Math.max(prev.skills.analysis, result.breakdown.understanding),
              creativity: Math.max(prev.skills.creativity, result.breakdown.creativity),
              decisionMaking: Math.max(prev.skills.decisionMaking, result.breakdown.planning),
              quality: Math.max(prev.skills.quality, result.breakdown.execution),
          }
      }));
      
      if (user.unlockedNodes.includes('node-final')) {
          unlockNextNode('node-final');
      }

      changeView(AppView.EVALUATION);
    } catch (e) {
      console.error(e);
      alert("خطا در ارزیابی.");
    } finally {
      setLoading(false);
    }
  };

  // Render loading overlay
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-blue-900 dark:text-blue-100 z-50 relative overflow-hidden">
        <BackgroundQuotes />
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6" />
            <h2 className="text-2xl font-bold animate-pulse mb-2">{loadingMessage}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden relative transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Layer */}
      <BackgroundQuotes />

      <Sidebar 
        currentView={view} 
        onChangeView={changeView} 
        user={user} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 h-full md:mr-20 lg:mr-72 pb-16 md:pb-0 transition-all duration-300 relative z-10">
          <div className="h-full w-full animate-fade-in-up overflow-hidden">
                 {view === AppView.DASHBOARD && (
                    <Dashboard 
                      user={user} 
                      onStartScenario={() => handleStartGeneration('FactFinding', 'Medium', 'Strategic Thinking')}
                      isDarkMode={darkMode}
                      toggleTheme={toggleTheme}
                    />
                 )}
                 {view === AppView.ACTIVE_SCENARIO && currentScenario && (
                    <ActiveScenario 
                       scenario={currentScenario}
                       onComplete={handleCompleteScenario}
                       onCancel={() => changeView(AppView.DASHBOARD)}
                    />
                 )}
                 {view === AppView.EVALUATION && evaluationResult && currentScenario && (
                    <EvaluationResultView 
                       result={evaluationResult}
                       scenario={currentScenario}
                       onBack={() => changeView(AppView.DASHBOARD)}
                    />
                 )}
                 {view === AppView.JOURNEY_MAP && (
                    <JourneyMap 
                       unlockedNodes={user.unlockedNodes}
                       completedNodes={user.completedNodes}
                       onSelectNode={(v) => changeView(v)}
                       onStartScenario={() => handleStartGeneration('FactFinding', 'Hard', 'Complex Problem Solving')}
                    />
                 )}
                 {view === AppView.MINIGAME_HUB && (
                    <MiniGameHub onSelectGame={changeView} user={user} />
                 )}
                 {view === AppView.MINIGAME_BIGFIVE && (
                    <BigFiveGame onExit={() => changeView(AppView.DASHBOARD)} onComplete={handleBigFiveComplete} />
                 )}
                 {view === AppView.VERIFIED_RESUME && (
                    <VerifiedResume user={user} isDarkMode={darkMode} />
                 )}
                 
                 {/* --- Cognitive Games (Razi Model) --- */}
                 
                 {view === AppView.MINIGAME_MEMORY && (
                    <MemoryGame 
                        user={user}
                        onExit={() => changeView(AppView.JOURNEY_MAP)} 
                        onComplete={(s) => handleMiniGameComplete(s, 'node-1', AppView.MINIGAME_MEMORY)}
                        onStepComplete={handleMemoryProgress}
                    />
                 )}
                 {view === AppView.MINIGAME_MATH && (
                    <MathGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-2', AppView.MINIGAME_MATH)} />
                 )}
                 {view === AppView.MINIGAME_PATTERN && (
                    <PatternGame onExit={() => changeView(AppView.MINIGAME_HUB)} onComplete={(s) => handleMiniGameComplete(s, '', AppView.MINIGAME_PATTERN)} />
                 )}
                 {view === AppView.MINIGAME_SPEED && (
                    <SpeedGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-3', AppView.MINIGAME_SPEED)} />
                 )}
                 {view === AppView.MINIGAME_VISUALIZATION && (
                    <VisualizationGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-4', AppView.MINIGAME_VISUALIZATION)} />
                 )}
                 {view === AppView.MINIGAME_ORIENTATION && (
                    <OrientationGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-5', AppView.MINIGAME_ORIENTATION)} />
                 )}
                 {view === AppView.MINIGAME_STROOP && (
                    <StroopGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-6', AppView.MINIGAME_STROOP)} />
                 )}
                 {view === AppView.MINIGAME_MULTITASK && (
                    <MultitaskGame onExit={() => changeView(AppView.JOURNEY_MAP)} onComplete={(s) => handleMiniGameComplete(s, 'node-7', AppView.MINIGAME_MULTITASK)} />
                 )}
                 {view === AppView.MINIGAME_FACTFINDING && (
                    <FactFindingGame onExit={() => changeView(AppView.MINIGAME_HUB)} onComplete={(s) => handleMiniGameComplete(s, '', AppView.MINIGAME_FACTFINDING)} />
                 )}

                 {/* --- Methodology Games --- */}
                 {view === AppView.MINIGAME_5WHYS && (
                    <FiveWhysGame onExit={() => changeView(AppView.MINIGAME_HUB)} onComplete={(s) => handleMiniGameComplete(s, '', AppView.MINIGAME_5WHYS)} />
                 )}
                 {view === AppView.MINIGAME_SWOT && (
                    <SwotGame onExit={() => changeView(AppView.MINIGAME_HUB)} onComplete={(s) => handleMiniGameComplete(s, '', AppView.MINIGAME_SWOT)} />
                 )}
                 {view === AppView.MINIGAME_CYNEFIN && (
                    <CynefinGame onExit={() => changeView(AppView.MINIGAME_HUB)} onComplete={(s) => handleMiniGameComplete(s, '', AppView.MINIGAME_CYNEFIN)} />
                 )}
          </div>
      </main>
    </div>
  );
}

export default App;
