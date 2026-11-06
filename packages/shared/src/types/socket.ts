import { GameState, MoveData, MoveResultPayload, MoveSubmission, PieceColor, GameResultType, TerminationReasonType } from './game';
import { RoomData } from './room';

export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  MOVE: 'MOVE',
  CHAT: 'CHAT',
  RESIGN: 'RESIGN',
  DRAW_OFFER: 'DRAW_OFFER',
  DRAW_ACCEPT: 'DRAW_ACCEPT',
  DRAW_REJECT: 'DRAW_REJECT',
  RECONNECT: 'RECONNECT',
  MATCHMAKING_JOIN: 'MATCHMAKING_JOIN',
  MATCHMAKING_CANCEL: 'MATCHMAKING_CANCEL',
  REQUEST_GAME_STATE: 'REQUEST_GAME_STATE',

  // Server to Client
  ROOM_JOINED: 'ROOM_JOINED',
  ROOM_UPDATED: 'ROOM_UPDATED',
  MATCH_FOUND: 'MATCH_FOUND',
  MOVE_RESULT: 'MOVE_RESULT',
  GAME_STATE: 'GAME_STATE',
  GAME_OVER: 'GAME_OVER',
  CLOCK_UPDATE: 'CLOCK_UPDATE',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  DRAW_OFFERED: 'DRAW_OFFERED',
  DRAW_REJECTED: 'DRAW_REJECTED',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
  ERROR: 'ERROR',
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Payload definitions
export interface JoinRoomPayload {
  roomCode?: string;
  roomId?: string;
  colorPreference?: 'white' | 'black' | 'random';
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface ChatPayload {
  gameId: string;
  message: string;
}

export interface ResignPayload {
  gameId: string;
}

export interface DrawOfferPayload {
  gameId: string;
}

export interface DrawAcceptPayload {
  gameId: string;
}

export interface DrawRejectPayload {
  gameId: string;
}

export interface ReconnectPayload {
  gameId: string;
}

export interface MatchmakingJoinPayload {
  initialTimeMs: number;
  incrementMs: number;
}

export interface RequestGameStatePayload {
  gameId: string;
}

export interface ClockUpdatePayload {
  gameId: string;
  whiteRemainingMs: number;
  blackRemainingMs: number;
  activeColor: PieceColor;
  timestamp: number;
}

export interface GameOverPayload {
  gameId: string;
  result: GameResultType;
  terminationReason: TerminationReasonType;
  winnerId?: string | null;
  whiteEloChange?: number;
  blackEloChange?: number;
  newWhiteElo?: number;
  newBlackElo?: number;
}

export interface ChatMessagePayload {
  id: string;
  gameId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
