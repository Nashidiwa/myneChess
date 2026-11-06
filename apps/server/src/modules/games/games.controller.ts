import { Request, Response, NextFunction } from 'express';
import { gameService } from './games.service';
import { AppError } from '../../middleware/errorHandler';

export class GamesController {
  async getGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await gameService.getGameState(req.params.id);
      res.status(200).json({ success: true, data: game });
    } catch (error) {
      next(error);
    }
  }

  async getMoves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = await gameService.getGameState(req.params.id);
      res.status(200).json({ success: true, data: state.moves });
    } catch (error) {
      next(error);
    }
  }

  async getReplay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const replay = await gameService.getReplay(req.params.id);
      res.status(200).json({ success: true, data: replay });
    } catch (error) {
      next(error);
    }
  }

  async getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await gameService.getUserGameHistory(req.user.userId, page, limit);
      res.status(200).json({
        success: true,
        data: result.games,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  async makeMove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to, promotion, expectedVersion } = req.body;
      const result = await gameService.makeMove({
        gameId: req.params.id,
        playerId: req.user?.userId,
        from,
        to,
        promotion,
        expectedVersion,
      });
      res.status(200).json({
        success: true,
        data: result.moveResult,
        ratingChanges: result.ratingChanges,
      });
    } catch (error) {
      next(error);
    }
  }

  async resign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerId = req.user?.userId || 'guest-human';
      const result = await gameService.resign(req.params.id, playerId);
      res.status(200).json({
        success: true,
        message: 'Đã đầu hàng trận đấu',
        data: result.game,
        ratingChanges: result.ratingChanges,
      });
    } catch (error) {
      next(error);
    }
  }

  async drawOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const result = await gameService.offerDraw(req.params.id, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Đã gửi lời mời hòa tới đối thủ',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async drawAccept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
      const result = await gameService.acceptDraw(req.params.id, req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Trận đấu kết thúc với kết quả hòa',
        data: result.game,
        ratingChanges: result.ratingChanges,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const gamesController = new GamesController();
