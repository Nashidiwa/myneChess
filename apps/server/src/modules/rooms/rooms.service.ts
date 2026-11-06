import { randomUUID } from 'crypto';
import { RoomData, RoomPlayer, RoomVisibility, RoomStatusType } from '@online-chess/shared';
import { AppError } from '../../middleware/errorHandler';
import { gameService } from '../games/games.service';

export class RoomService {
  private rooms: Map<string, RoomData> = new Map();

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom(params: {
    hostId: string;
    hostUsername: string;
    hostRating: number;
    name?: string;
    visibility: RoomVisibility;
    initialTimeMs: number;
    incrementMs: number;
    colorPreference: 'white' | 'black' | 'random';
  }): Promise<RoomData> {
    const id = randomUUID();
    let roomCode = this.generateRoomCode();
    while (Array.from(this.rooms.values()).some((r) => r.roomCode === roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const hostPlayer: RoomPlayer = {
      userId: params.hostId,
      username: params.hostUsername,
      eloRating: params.hostRating,
      colorPreference: params.colorPreference,
      isReady: true,
      isHost: true,
      isConnected: true,
    };

    const room: RoomData = {
      id,
      roomCode,
      hostId: params.hostId,
      name: params.name || `Phòng của ${params.hostUsername}`,
      visibility: params.visibility,
      status: 'WAITING',
      initialTimeMs: params.initialTimeMs,
      incrementMs: params.incrementMs,
      gameId: null,
      players: [hostPlayer],
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(id, room);
    return room;
  }

  async getRoom(roomIdOrCode: string): Promise<RoomData | null> {
    const byId = this.rooms.get(roomIdOrCode);
    if (byId) return byId;

    const upper = roomIdOrCode.toUpperCase();
    for (const r of this.rooms.values()) {
      if (r.roomCode === upper) return r;
    }
    return null;
  }

  async getPublicRooms(): Promise<RoomData[]> {
    return Array.from(this.rooms.values())
      .filter((r) => r.visibility === 'PUBLIC' && r.status === 'WAITING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async joinRoom(params: {
    roomIdOrCode: string;
    userId: string;
    username: string;
    userRating: number;
    colorPreference?: 'white' | 'black' | 'random';
  }): Promise<{ room: RoomData; gameId?: string }> {
    const room = await this.getRoom(params.roomIdOrCode);
    if (!room) {
      throw new AppError(404, 'Không tìm thấy phòng chơi');
    }

    // Check if player is already in room
    const existingIndex = room.players.findIndex((p) => p.userId === params.userId);
    if (existingIndex !== -1) {
      room.players[existingIndex].isConnected = true;
      return { room, gameId: room.gameId || undefined };
    }

    if (room.players.length >= 2) {
      throw new AppError(400, 'Phòng chơi đã đủ 2 người');
    }

    const newPlayer: RoomPlayer = {
      userId: params.userId,
      username: params.username,
      eloRating: params.userRating,
      colorPreference: params.colorPreference || 'random',
      isReady: true,
      isHost: false,
      isConnected: true,
    };

    room.players.push(newPlayer);
    room.status = 'READY';

    // Start game automatically when 2 players are present
    const host = room.players[0];
    const guest = room.players[1];

    let whitePlayer: RoomPlayer;
    let blackPlayer: RoomPlayer;

    if (host.colorPreference === 'white') {
      whitePlayer = host;
      blackPlayer = guest;
    } else if (host.colorPreference === 'black') {
      whitePlayer = guest;
      blackPlayer = host;
    } else if (guest.colorPreference === 'white') {
      whitePlayer = guest;
      blackPlayer = host;
    } else if (guest.colorPreference === 'black') {
      whitePlayer = host;
      blackPlayer = guest;
    } else {
      // Random assignment
      if (Math.random() < 0.5) {
        whitePlayer = host;
        blackPlayer = guest;
      } else {
        whitePlayer = guest;
        blackPlayer = host;
      }
    }

    const game = await gameService.createGame({
      whitePlayerId: whitePlayer.userId,
      whitePlayerName: whitePlayer.username,
      whitePlayerRating: whitePlayer.eloRating,
      blackPlayerId: blackPlayer.userId,
      blackPlayerName: blackPlayer.username,
      blackPlayerRating: blackPlayer.eloRating,
      gameMode: 'PVP',
      initialTimeMs: room.initialTimeMs,
      incrementMs: room.incrementMs,
    });

    room.gameId = game.id;
    room.status = 'IN_PROGRESS';

    return { room, gameId: game.id };
  }

  async leaveRoom(roomId: string, userId: string): Promise<RoomData | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.userId !== userId);
    if (room.players.length === 0) {
      room.status = 'CANCELLED';
      this.rooms.delete(roomId);
      return null;
    }

    if (room.status === 'READY') {
      room.status = 'WAITING';
    }

    return room;
  }
}

export const roomService = new RoomService();
