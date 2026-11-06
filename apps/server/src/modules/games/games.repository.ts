import { GameState, MoveData, GameMode, GameStatusType, GameResultType, TerminationReasonType, PieceColor } from '@online-chess/shared';

export interface GameRecord {
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
  drawOfferedBy?: string | null;
  lastMoveTimestamp?: number | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameRepository {
  create(data: {
    whitePlayerId: string;
    whitePlayerName: string;
    whitePlayerRating: number;
    blackPlayerId?: string | null;
    blackPlayerName?: string | null;
    blackPlayerRating?: number | null;
    gameMode: GameMode;
    aiDifficulty?: string | null;
    initialTimeMs: number;
    incrementMs: number;
  }): Promise<GameRecord>;
  findById(id: string): Promise<GameRecord | null>;
  update(id: string, data: Partial<GameRecord>): Promise<GameRecord>;
  addMove(move: Omit<MoveData, 'id' | 'createdAt'>): Promise<MoveData>;
  getMovesByGameId(gameId: string): Promise<MoveData[]>;
  getUserGames(userId: string, skip?: number, take?: number): Promise<{ games: GameRecord[]; total: number }>;
}
