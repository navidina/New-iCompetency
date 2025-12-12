export interface GameSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  games: GameResult[];
  validity: ValidityCheck;
}

export interface GameResult {
  gameCode: string;
  subGame?: string;
  rawScore: number;
  tScore: number;
  accuracy: number;
  averageRT: number;
  responses: Response[];
  metadata: GameMetadata;
}

export interface GameMetadata {
  levelReached?: number;
  maxSpan?: number;
  totalTrials?: number;
  [key: string]: any;
}

export interface Response {
  trialNumber: number;
  stimulus: any;
  userResponse: any;
  correctResponse: any;
  isCorrect: boolean;
  reactionTime: number;
  timestamp: Date;
}

export interface ValidityCheck {
  isValid: boolean;
  flags: string[];
}

export interface RawScores {
  A9a: number;  // Corsi Span
  A9b: number;  // Paired Association
  A9c: number;  // N-Back d'
  A10: number;  // Math
  [key: string]: number;
}

export interface TScores {
  memoryIndex: number;      // MI
  attentionIndex: number;   // AI
  reasoningIndex: number;   // RI
  spatialIndex: number;     // SI
  executiveIndex: number;   // EI
  totalCognitive: number;   // TCS
}

// Game Config Types
export interface CorsiConfig {
  gridSize: number;
  initialSequenceLength: number;
  maxSequenceLength: number;
  displayTime: number;
  delayBetweenBlocks: number;
  successesForLevelUp: number;
  failuresForGameOver: number;
}

export interface MathGameConfig {
  totalTime: number; // ms
  correctBonus: number; // ms
  wrongPenalty: number; // ms
  speedBonusThreshold: number; // ratio (e.g. 0.5)
  speedBonusMultiplier: number;
  levels: Record<number, MathLevelConfig>;
}

export interface MathLevelConfig {
  ops?: string[] | 'all';
  range: [number, number];
  terms?: number;
  parentheses?: boolean;
  type?: 'standard' | 'percentage' | 'mixed';
  includes?: string[];
}

export interface MathQuestion {
  id: string;
  text: string;     // The display text, e.g., "12 + 5"
  answer: number;   // The numeric answer
  level: number;
  terms: number;    // Number of terms used
  ops: string[];    // Operations used
}

// Pattern Game Configs (A10+)
export interface NumberMatrixConfig {
  gridSize: number;
  timeLimit: number;
  patterns: string[]; // 'linear', 'multiplicative', 'fibonacci', 'power'
}

export interface VisualSequenceConfig {
  sequenceLength: number;
  transformations: string[];
  shapes: string[];
}

export interface VisualAnalogyConfig {
  relationships: string[];
  optionCount: number;
}
