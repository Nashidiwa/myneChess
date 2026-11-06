export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const TIME_CONTROLS = {
  BULLET_1: { name: '1 min', initialTimeMs: 60 * 1000, incrementMs: 0 },
  BLITZ_3: { name: '3 min', initialTimeMs: 3 * 60 * 1000, incrementMs: 0 },
  BLITZ_5: { name: '5 min', initialTimeMs: 5 * 60 * 1000, incrementMs: 0 },
  RAPID_10: { name: '10 min', initialTimeMs: 10 * 60 * 1000, incrementMs: 0 },
  RAPID_15_10: { name: '15 | 10', initialTimeMs: 15 * 60 * 1000, incrementMs: 10 * 1000 },
} as const;

export const DEFAULT_TIME_CONTROL = TIME_CONTROLS.BLITZ_5;

export const ELO_CONFIG = {
  DEFAULT_RATING: 1200,
  K_FACTOR_DEFAULT: 32,
  K_FACTOR_HIGH: 16,
  HIGH_RATING_THRESHOLD: 2400,
} as const;

export const AI_DIFFICULTIES = {
  EASY: {
    level: 'EASY',
    displayName: 'Dễ (Easy)',
    depth: 1,
    timeLimitMs: 1000,
    randomnessFactor: 0.35,
  },
  MEDIUM: {
    level: 'MEDIUM',
    displayName: 'Trung bình (Medium)',
    depth: 3,
    timeLimitMs: 2000,
    randomnessFactor: 0.1,
  },
  HARD: {
    level: 'HARD',
    displayName: 'Khó (Hard)',
    depth: 4,
    timeLimitMs: 4000,
    randomnessFactor: 0,
  },
} as const;

export type AIDifficultyLevel = keyof typeof AI_DIFFICULTIES;

export const ROOM_STATUS = {
  WAITING: 'WAITING',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;

export const GAME_STATUS = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;

export const GAME_RESULT = {
  WHITE_WON: 'WHITE_WON',
  BLACK_WON: 'BLACK_WON',
  DRAW: 'DRAW',
} as const;

export const TERMINATION_REASON = {
  CHECKMATE: 'CHECKMATE',
  STALEMATE: 'STALEMATE',
  TIMEOUT: 'TIMEOUT',
  RESIGNATION: 'RESIGNATION',
  THREEFOLD_REPETITION: 'THREEFOLD_REPETITION',
  FIFTY_MOVE_RULE: 'FIFTY_MOVE_RULE',
  INSUFFICIENT_MATERIAL: 'INSUFFICIENT_MATERIAL',
  MUTUAL_AGREEMENT: 'MUTUAL_AGREEMENT',
  ABANDONED: 'ABANDONED',
} as const;
