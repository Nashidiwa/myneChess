import { Request, Response, NextFunction } from 'express';
import { getUserRepository } from '../users/users.repository.impl';
import { getGameRepository } from '../games/games.repository.impl';
import { AppError } from '../../middleware/errorHandler';

export class AdminController {
  private userRepo = getUserRepository();
  private gameRepo = getGameRepository();

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || undefined;
      const skip = (page - 1) * limit;

      const { users, total } = await this.userRepo.findMany({ skip, take: limit, search });

      res.status(200).json({
        success: true,
        data: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          eloRating: u.eloRating,
          accountStatus: u.accountStatus,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'RESTRICTED', 'SUSPENDED'].includes(status)) {
        throw new AppError(400, 'Trạng thái tài khoản không hợp lệ');
      }

      const updated = await this.userRepo.update(req.params.id, {
        accountStatus: status,
      });

      res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái người dùng thành ${status}`,
        data: {
          id: updated.id,
          username: updated.username,
          accountStatus: updated.accountStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalUsers = await this.userRepo.count();

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeServerUptimeSec: process.uptime(),
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
