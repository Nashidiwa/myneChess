import { Request, Response, NextFunction } from 'express';
import { getUserRepository } from '../users/users.repository.impl';
import { LeaderboardEntry, LeaderboardResponse } from '@online-chess/shared';

export class LeaderboardController {
  private userRepo = getUserRepository();

  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const { users, total } = await this.userRepo.findMany({ skip, take: limit });

      const data: LeaderboardEntry[] = users.map((u, index) => ({
        rank: skip + index + 1,
        userId: u.id,
        username: u.username,
        eloRating: u.eloRating,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
      }));

      const response: LeaderboardResponse = {
        total,
        page,
        limit,
        data,
      };

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
