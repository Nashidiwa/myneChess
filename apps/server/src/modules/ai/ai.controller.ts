import { Request, Response, NextFunction } from 'express';
import { chessAI } from './chessAi.service';
import { gameService } from '../games/games.service';
import { getUserRepository } from '../users/users.repository.impl';
import { AppError } from '../../middleware/errorHandler';
import { AIDifficulty } from '@online-chess/shared';

export class AIController {
  private userRepo = getUserRepository();

  async createAIGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const difficulty: AIDifficulty = req.body.difficulty || 'MEDIUM';
      const initialTimeMs = req.body.initialTimeMs || 10 * 60 * 1000;
      const incrementMs = req.body.incrementMs || 0;
      const playerColor = req.body.playerColor || 'white';

      const isHumanWhite =
        playerColor === 'white'
          ? true
          : playerColor === 'black'
          ? false
          : Math.random() < 0.5;

      const userId = req.user?.userId || 'guest-human';
      const username = req.user?.username || 'Bạn';
      const userRating = req.user ? (await this.userRepo.findById(userId))?.eloRating || 1200 : 1200;

      const whitePlayerId = isHumanWhite ? userId : 'ai-engine';
      const whitePlayerName = isHumanWhite ? username : `AI (${difficulty})`;
      const whiteRating = isHumanWhite ? userRating : 1500;

      const blackPlayerId = isHumanWhite ? 'ai-engine' : userId;
      const blackPlayerName = isHumanWhite ? `AI (${difficulty})` : username;
      const blackRating = isHumanWhite ? 1500 : userRating;

      const game = await gameService.createGame({
        whitePlayerId,
        whitePlayerName,
        whitePlayerRating: whiteRating,
        blackPlayerId,
        blackPlayerName,
        blackPlayerRating: blackRating,
        gameMode: 'AI',
        aiDifficulty: difficulty,
        initialTimeMs,
        incrementMs,
      });

      // If AI is white, trigger its opening move immediately!
      if (!isHumanWhite) {
        const aiMove = await chessAI.chooseMove(game.currentFen, difficulty);
        await gameService.makeMove({
          gameId: game.id,
          playerId: 'ai-engine',
          from: aiMove.from,
          to: aiMove.to,
          promotion: aiMove.promotion,
          expectedVersion: 0,
        });
      }

      const updatedState = await gameService.getGameState(game.id);
      res.status(201).json({ success: true, data: updatedState });
    } catch (error) {
      next(error);
    }
  }

  async triggerAIMove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameId } = req.body;
      const game = await gameService.getGameState(gameId);

      if (game.status !== 'IN_PROGRESS') {
        throw new AppError(400, 'Trận đấu đã kết thúc');
      }

      // Check whose turn it is and if AI should move
      const isAITurn =
        (game.currentTurn === 'w' && game.whitePlayerId === 'ai-engine') ||
        (game.currentTurn === 'b' && game.blackPlayerId === 'ai-engine');

      if (!isAITurn) {
        throw new AppError(400, 'Chưa đến lượt đi của AI');
      }

      const difficulty = (game.aiDifficulty as AIDifficulty) || 'MEDIUM';
      const aiMove = await chessAI.chooseMove(game.currentFen, difficulty);

      const moveResult = await gameService.makeMove({
        gameId: game.id,
        playerId: 'ai-engine',
        from: aiMove.from,
        to: aiMove.to,
        promotion: aiMove.promotion,
        expectedVersion: game.positionVersion,
      });

      res.status(200).json({
        success: true,
        data: moveResult.moveResult,
        stats: aiMove.stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
