import { roomService } from '../rooms/rooms.service';
import { RoomData } from '@online-chess/shared';

export interface MatchmakingQueueEntry {
  userId: string;
  username: string;
  eloRating: number;
  initialTimeMs: number;
  incrementMs: number;
  joinedAt: number;
  socketId: string;
}

export class MatchmakingService {
  private queue: MatchmakingQueueEntry[] = [];

  addToQueue(entry: MatchmakingQueueEntry): { matched: boolean; room?: RoomData; opponent?: MatchmakingQueueEntry } {
    // Check if player is already in queue
    this.removeFromQueue(entry.userId);

    // Look for matching opponent
    const matchIndex = this.queue.findIndex(
      (q) =>
        q.initialTimeMs === entry.initialTimeMs &&
        q.incrementMs === entry.incrementMs &&
        q.userId !== entry.userId
    );

    if (matchIndex !== -1) {
      const opponent = this.queue.splice(matchIndex, 1)[0];
      return {
        matched: true,
        opponent,
      };
    }

    this.queue.push(entry);
    return { matched: false };
  }

  removeFromQueue(userId: string): boolean {
    const idx = this.queue.findIndex((q) => q.userId === userId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return true;
    }
    return false;
  }

  getQueueStatus(userId: string) {
    const entry = this.queue.find((q) => q.userId === userId);
    return {
      inQueue: !!entry,
      queuedTimeMs: entry ? Date.now() - entry.joinedAt : 0,
      totalInQueue: this.queue.length,
    };
  }
}

export const matchmakingService = new MatchmakingService();
