
export interface UserProfile {
  name: string;
  role: string;
  level: string;
  levelNumber: number; // Added for numerical level
  currentXp: number;   // Current XP in this level
  requiredXp: number;  // XP needed for next level
  totalScenarios: number;
  badges: string[];
  skills: SkillMatrix;
  coins: number;       // Virtual Currency
  streak: number;      // Daily Streak
  unlockedNodes: string[]; // IDs of unlocked journey nodes
  completedNodes: string[]; // IDs of completed nodes
  memorySubScores?: {
    corsi: number;
    pairs: number;
    nback: number;
  };
  bigFive?: {
    Openness: number;
    Conscientiousness: number;
    Extraversion: number;
    Agreeableness: number;
    Neuroticism: number;
  };
}

export interface SkillMatrix {
  // General/Legacy Skills
  analysis: number;
  creativity: number;
  speed: number;
  quality: number;
  teamwork: number;
  decisionMaking: number;
  
  // Cognitive Skills (Razi Model A9-A15)
  memory: number;        // A9
  math: number;          // A10
  perception: number;    // A11
  visualization: number; // A12
  orientation: number;   // A13
  focus: number;         // A14
  multitasking: number;  // A15
}

export interface ScenarioPhase {
  id: string;
  title: string;
  description: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'decision';
  options?: string[]; // for multiple choice
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  industry: string;
  description: string;
  timeLimitMinutes: number;
  methodology: 'FactFinding' | 'SixSigma' | 'DesignThinking' | 'General';
  phases: ScenarioPhase[];
}

export interface UserResponse {
  phaseId: string;
  answer: string;
  timeSpentSeconds: number;
}

export interface EvaluationResult {
  score: number;
  level: string;
  breakdown: {
    understanding: number;
    planning: number;
    execution: number;
    review: number;
    creativity: number; // Bonus metric
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  timeAnalysis: {
    totalTime: number;
    efficiencyScore: number;
  };
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCENARIO_CONFIG = 'SCENARIO_CONFIG',
  ACTIVE_SCENARIO = 'ACTIVE_SCENARIO',
  EVALUATION = 'EVALUATION',
  JOURNEY_MAP = 'JOURNEY_MAP',
  MINIGAME_HUB = 'MINIGAME_HUB', 
  VERIFIED_RESUME = 'VERIFIED_RESUME', // New View
  // Methodology Games
  MINIGAME_5WHYS = 'MINIGAME_5WHYS',
  MINIGAME_SWOT = 'MINIGAME_SWOT',
  MINIGAME_CYNEFIN = 'MINIGAME_CYNEFIN',
  // Cognitive Games (Razi Model A9-A15)
  MINIGAME_MEMORY = 'MINIGAME_MEMORY',      // A9: به یادسپاری
  MINIGAME_MATH = 'MINIGAME_MATH',          // A10: توان محاسبات ریاضی
  MINIGAME_SPEED = 'MINIGAME_SPEED',        // A11: سرعت ادراکی
  MINIGAME_VISUALIZATION = 'MINIGAME_VISUALIZATION', // A12: قدرت تجسم
  MINIGAME_ORIENTATION = 'MINIGAME_ORIENTATION', // A13: تشخیص موقعیت مکانی
  MINIGAME_STROOP = 'MINIGAME_STROOP',      // A14: قدرت تمرکز
  MINIGAME_FOCUS_TRACK = 'MINIGAME_FOCUS_TRACK', // A14+: مسیر رنگی تمرکز
  MINIGAME_MULTITASK = 'MINIGAME_MULTITASK', // A15: انجام همزمان امور
  MINIGAME_PATTERN = 'MINIGAME_PATTERN', // A10+
  MINIGAME_FACTFINDING = 'MINIGAME_FACTFINDING', // New Decision Making Game
  
  // New Big Five Game
  MINIGAME_BIGFIVE = 'MINIGAME_BIGFIVE'
}

// --- Journey Types ---
export interface JourneyNode {
  id: string;
  view: AppView;
  title: string;
  type: 'Game' | 'Assessment' | 'Boss';
  icon: any;
  xpReward: number;
  coinReward: number;
  requiredNodeId?: string; // Prerequisite
  position: 'left' | 'center' | 'right';
}

// --- Mini Game Types ---

export interface FiveWhysLevel {
  level: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FiveWhysData {
  problemStatement: string;
  levels: FiveWhysLevel[];
}

export interface SwotItem {
  text: string;
  category: 'S' | 'W' | 'O' | 'T';
  reason: string;
}

export interface SwotData {
  companyContext: string;
  items: SwotItem[];
}

export interface CynefinScenario {
  description: string;
  domain: 'Simple' | 'Complicated' | 'Complex' | 'Chaotic';
  reason: string;
}

export interface CynefinData {
  scenarios: CynefinScenario[];
}
