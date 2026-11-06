import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AppError } from '../../middleware/errorHandler';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const profile = await usersService.getProfile(req.user.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const updated = await usersService.updateProfile(req.user.userId, req.body);
      res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công', data: updated });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await usersService.getUserStats(req.params.id);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
