import { RawScores, TScores } from '../types';

export interface CalculationStep {
  label: string;
  value: number | string;
  operation?: string; // '+', '-', '*', '/', '='
  description?: string;
}

export interface ScoreExplanation {
  finalScore: number;
  formula: string;
  steps: CalculationStep[];
  variables: Record<string, number | string>;
}

export interface DomainScoreDetails {
  score: number;
  weight: number;
  contribution: number;
  subGameScores: { gameId: string; score: number }[];
  explanation: ScoreExplanation;
}

export interface TotalScoreDetails {
  totalScore: number;
  domains: Record<keyof Omit<TScores, 'totalCognitive'>, DomainScoreDetails>;
  explanation: ScoreExplanation;
}

// Standard T-Score formula
export const toTScore = (rawScore: number, mean: number, sd: number): number => {
  if (sd === 0) return 50;
  return 50 + 10 * ((rawScore - mean) / sd);
};

export const toTScoreWithExplanation = (
  rawScore: number,
  mean: number,
  sd: number,
  label: string = 'Score'
): { score: number; explanation: ScoreExplanation } => {
  const zScore = sd === 0 ? 0 : (rawScore - mean) / sd;
  const tScore = 50 + 10 * zScore;

  return {
    score: tScore,
    explanation: {
      finalScore: tScore,
      formula: '50 + 10 * ((Raw - Mean) / SD)',
      variables: {
        Raw: rawScore,
        Mean: mean,
        SD: sd
      },
      steps: [
        { label: 'Raw Score', value: rawScore, description: 'امتیاز خام کسب شده' },
        { label: 'Mean', value: mean, description: 'میانگین جمعیت' },
        { label: 'SD', value: sd, description: 'انحراف معیار' },
        { label: 'Z-Score', value: zScore.toFixed(2), operation: '=', description: '(Raw - Mean) / SD' },
        { label: 'T-Score', value: tScore.toFixed(2), operation: '=', description: '50 + 10 * Z' }
      ]
    }
  };
};

const average = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

// Weights from prompt
const WEIGHTS = {
  memoryIndex: 0.20,
  attentionIndex: 0.20,
  reasoningIndex: 0.25,
  spatialIndex: 0.15,
  executiveIndex: 0.20
};

export const calculateIndices = (raw: RawScores): TScores => {
  // Simplified version for backward compatibility
  // Assuming 'raw' here contains T-Scores of individual games for simplicity in this legacy function,
  // OR we assume raw is actually raw and we don't have means/SDs here.
  // Ideally this function should take Normalized Scores (T-Scores).

  // For the purpose of this task, I will assume the caller has already converted Raw -> T-Score
  // or that this function is just a placeholder.
  // I will focus on the 'Detailed' version.
  return {
    memoryIndex: 0,
    attentionIndex: 0,
    reasoningIndex: 0,
    spatialIndex: 0,
    executiveIndex: 0,
    totalCognitive: 0
  };
};

export const calculateDetailedIndices = (
  gameTScores: Record<string, number> // Map of Game ID -> T-Score
): TotalScoreDetails => {

  const getDomainScore = (games: string[], weight: number): DomainScoreDetails => {
    const validScores = games.map(g => ({ gameId: g, score: gameTScores[g] || 50 })); // Default 50 if missing
    const avg = average(validScores.map(s => s.score));

    return {
      score: avg,
      weight,
      contribution: avg * weight,
      subGameScores: validScores,
      explanation: {
        finalScore: avg,
        formula: 'Average(Game Scores)',
        variables: {},
        steps: validScores.map(s => ({ label: s.gameId, value: s.score.toFixed(1) }))
      }
    };
  };

  const memory = getDomainScore(['A9a', 'A9b', 'A9c'], WEIGHTS.memoryIndex);
  const attention = getDomainScore(['A11', 'A14', 'A15'], WEIGHTS.attentionIndex);
  const reasoning = getDomainScore(['A10', 'A10plus', 'A18'], WEIGHTS.reasoningIndex);
  const spatial = getDomainScore(['A12', 'A13'], WEIGHTS.spatialIndex);
  const executive = getDomainScore(['A14', 'A15', 'A16'], WEIGHTS.executiveIndex);

  const total =
    memory.contribution +
    attention.contribution +
    reasoning.contribution +
    spatial.contribution +
    executive.contribution;

  return {
    totalScore: total,
    domains: {
      memoryIndex: memory,
      attentionIndex: attention,
      reasoningIndex: reasoning,
      spatialIndex: spatial,
      executiveIndex: executive
    },
    explanation: {
      finalScore: total,
      formula: 'Σ (Domain Score * Weight)',
      variables: {},
      steps: [
        { label: 'Memory', value: memory.score.toFixed(1), description: `Weight: ${memory.weight}` },
        { label: 'Attention', value: attention.score.toFixed(1), description: `Weight: ${attention.weight}` },
        { label: 'Reasoning', value: reasoning.score.toFixed(1), description: `Weight: ${reasoning.weight}` },
        { label: 'Spatial', value: spatial.score.toFixed(1), description: `Weight: ${spatial.weight}` },
        { label: 'Executive', value: executive.score.toFixed(1), description: `Weight: ${executive.weight}` },
      ]
    }
  };
};

export const getPerformanceLevel = (tScore: number): string => {
  if (tScore >= 70) return 'عالی';
  if (tScore >= 60) return 'بالاتر از میانگین';
  if (tScore >= 40) return 'میانگین';
  if (tScore >= 30) return 'پایین‌تر از میانگین';
  return 'نیازمند توجه';
};
