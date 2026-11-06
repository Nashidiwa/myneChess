export type GameMode = 'PVP' | 'AI';
export type PieceColor = 'w' | 'b';
export type ChessColorFull = 'white' | 'black';

export type GameStatusType = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type GameResultType = 'WHITE_WON' | 'BLACK_WON' | 'DRAW';
export type TerminationReasonType =
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'TIMEOUT'
  | 'RESIGNATION'
  | 'THREEFOLD_REPETITION'
  | 'FIFTY_MOVE_RULE'
  | 'INSUFFICIENT_MATERIAL'
  | 'MUTUAL_AGREEMENT'
  | 'ABANDONED';

export interface MoveData {
  id?: string;
  gameId: string;
  moveNumber: number;
  ply: number;
  playerId?: string | null;
  fromSquare: string;
  toSquare: string;
  promotion?: string | null;
  san: string;
  fenAfter: string;
  clockRemainingMs?: number | null;
  createdAt?: string;
}

export interface GameState {
  id: string;
  whitePlayerId: string;
  whitePlayerName: string;
  whitePlayerRating: number;
  blackPlayerId?: string | null;
  blackPlayerName?: string | null;
  blackPlayerRating?: number | null;
  gameMode: GameMode;
  aiDifficulty?: string | null;
  status: GameStatusType;
  result?: GameResultType | null;
  terminationReason?: TerminationReasonType | null;
  initialTimeMs: number;
  incrementMs: number;
  whiteRemainingMs: number;
  blackRemainingMs: number;
  currentTurn: PieceColor;
  currentFen: string;
  positionVersion: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  moves: MoveData[];
}

export interface MoveSubmission {
  gameId: string;
  from: string;
  to: string;
  promotion?: string;
  expectedVersion: number;
}

export interface MoveResultPayload {
  gameId: string;
  move: MoveData;
  fen: string;
  currentTurn: PieceColor;
  positionVersion: number;
  isCheck: boolean;
  isGameOver: boolean;
  result?: GameResultType | null;
  terminationReason?: TerminationReasonType | null;
  whiteRemainingMs: number;
  blackRemainingMs: number;
}
