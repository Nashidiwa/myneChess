export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AISearchStats {
  depth: number;
  nodesVisited: number;
  nodesPruned: number;
  durationMs: number;
  score: number;
  bestMove: string;
}

export interface AIChessMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  score: number;
  stats: AISearchStats;
}
