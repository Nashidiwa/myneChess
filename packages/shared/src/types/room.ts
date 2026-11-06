export type RoomVisibility = 'PUBLIC' | 'PRIVATE';
export type RoomStatusType = 'WAITING' | 'READY' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export interface RoomPlayer {
  userId: string;
  username: string;
  eloRating: number;
  colorPreference: 'white' | 'black' | 'random';
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
}

export interface RoomData {
  id: string;
  roomCode: string;
  hostId: string;
  name: string;
  visibility: RoomVisibility;
  status: RoomStatusType;
  initialTimeMs: number;
  incrementMs: number;
  gameId?: string | null;
  players: RoomPlayer[];
  createdAt: string;
}
