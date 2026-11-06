import { Request, Response, NextFunction } from 'express';
import { roomService } from './rooms.service';
import { getUserRepository } from '../users/users.repository.impl';
import { AppError } from '../../middleware/errorHandler';
import { getIO } from '../../sockets/gameSocket';
import { SOCKET_EVENTS } from '@online-chess/shared';

export class RoomsController {
  private userRepo = getUserRepository();

  async getRooms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await roomService.getPublicRooms();
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  async getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.getRoom(req.params.id);
      if (!room) throw new AppError(404, 'Không tìm thấy phòng chơi');
      res.status(200).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const user = await this.userRepo.findById(req.user.userId);
      const rating = user?.eloRating || 1200;

      const room = await roomService.createRoom({
        hostId: req.user.userId,
        hostUsername: req.user.username,
        hostRating: rating,
        name: req.body.name,
        visibility: req.body.visibility || 'PUBLIC',
        initialTimeMs: req.body.initialTimeMs || 5 * 60 * 1000,
        incrementMs: req.body.incrementMs || 0,
        colorPreference: req.body.colorPreference || 'random',
      });

      res.status(201).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  async joinRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const user = await this.userRepo.findById(req.user.userId);
      const rating = user?.eloRating || 1200;

      const result = await roomService.joinRoom({
        roomIdOrCode: req.params.id,
        userId: req.user.userId,
        username: req.user.username,
        userRating: rating,
        colorPreference: req.body.colorPreference,
      });

      const io = getIO();
      if (io) {
        io.to(`room:${result.room.id}`).emit(SOCKET_EVENTS.ROOM_UPDATED, result.room);
        if (result.gameId) {
          io.to(`room:${result.room.id}`).emit(SOCKET_EVENTS.MATCH_FOUND, { gameId: result.gameId });
          io.to(`room:${result.room.id}`).emit('GAME_STARTED', { gameId: result.gameId });
        }
      }

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async leaveRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const result = await roomService.leaveRoom(req.params.id, req.user.userId);
      const io = getIO();
      if (io && result) {
        io.to(`room:${req.params.id}`).emit(SOCKET_EVENTS.ROOM_UPDATED, result);
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const roomsController = new RoomsController();
