import { getGameRepository } from './games.repository.impl';
import { GameRecord } from './games.repository';
import { chessRulesService } from '../chess/chessRules.service';
import { ratingsService, RatingChangeResult } from '../ratings/ratings.service';
import { AppError } from '../../middleware/errorHandler';
import {
  GameState,
  MoveData,
  MoveResultPayload,
  GameMode,
  PieceColor,
  STARTING_FEN,
  GameResultType,
  TerminationReasonType,
} from '@online-chess/shared';
import { Chess } from 'chess.js';

export class GameService {
  private gameRepo = getGameRepository();

  async createGame(data: {
    whitePlayerId: string;
    whitePlayerName: string;
    whitePlayerRating: number;
    blackPlayerId?: string | null;
    blackPlayerName?: string | null;
    blackPlayerRating?: number | null;
    gameMode: GameMode;
    aiDifficulty?: string | null;
    initialTimeMs: number;
    incrementMs: number;
  }): Promise<GameRecord> {
    return this.gameRepo.create(data);
  }

  async getGameState(gameId: string): Promise<GameState> {
    const game = await this.gameRepo.findById(gameId);
    if (!game) {
      throw new AppError(404, 'Không tìm thấy thông tin trận đấu');
    }

    const moves = await this.gameRepo.getMovesByGameId(gameId);
    const chess = new Chess(game.currentFen);

    return {
      id: game.id,
      whitePlayerId: game.whitePlayerId,
      whitePlayerName: game.whitePlayerName,
      whitePlayerRating: game.whitePlayerRating,
      blackPlayerId: game.blackPlayerId,
      blackPlayerName: game.blackPlayerName,
      blackPlayerRating: game.blackPlayerRating,
      gameMode: game.gameMode,
      aiDifficulty: game.aiDifficulty,
      status: game.status,
      result: game.result,
      terminationReason: game.terminationReason,
      initialTimeMs: game.initialTimeMs,
      incrementMs: game.incrementMs,
      whiteRemainingMs: game.whiteRemainingMs,
      blackRemainingMs: game.blackRemainingMs,
      currentTurn: game.currentTurn,
      currentFen: game.currentFen,
      positionVersion: game.positionVersion,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      startedAt: game.startedAt ? game.startedAt.toISOString() : null,
      endedAt: game.endedAt ? game.endedAt.toISOString() : null,
      createdAt: game.createdAt.toISOString(),
      moves,
    };
  }

  async makeMove(params: {
    gameId: string;
    playerId?: string | null;
    from: string;
    to: string;
    promotion?: string;
    expectedVersion: number;
  }): Promise<{ moveResult: MoveResultPayload; ratingChanges?: RatingChangeResult }> {
    const { gameId, playerId, from, to, promotion, expectedVersion } = params;
    const game = await this.gameRepo.findById(gameId);
    if (!game) {
      throw new AppError(404, 'Không tìm thấy trận đấu');
    }

    if (game.status !== 'IN_PROGRESS') {
      throw new AppError(400, 'Trận đấu không ở trạng thái đang diễn ra');
    }

    // Version concurrency control
    if (game.positionVersion !== expectedVersion) {
      throw new AppError(
        409,
        `Trạng thái bàn cờ đã thay đổi (Phiên bản yêu cầu: ${expectedVersion}, Hiện tại: ${game.positionVersion})`
      );
    }

    // Verify player and turn
    const isWhiteTurn = game.currentTurn === 'w';
    if (playerId) {
      if (isWhiteTurn && game.whitePlayerId !== playerId) {
        throw new AppError(403, 'Không phải lượt đi của bạn (Trắng đang đi)');
      }
      if (!isWhiteTurn && game.blackPlayerId !== playerId) {
        throw new AppError(403, 'Không phải lượt đi của bạn (Đen đang đi)');
      }
    }

    // Authoritative Server Clock Calculation
    const now = Date.now();
    const elapsed = game.lastMoveTimestamp ? Math.max(0, now - game.lastMoveTimestamp) : 0;
    let whiteRemaining = game.whiteRemainingMs;
    let blackRemaining = game.blackRemainingMs;

    if (isWhiteTurn) {
      whiteRemaining = whiteRemaining - elapsed;
      if (whiteRemaining <= 0) {
        // White timed out!
        return this.handleTimeoutInternal(game, 'w');
      }
      whiteRemaining += game.incrementMs;
    } else {
      blackRemaining = blackRemaining - elapsed;
      if (blackRemaining <= 0) {
        // Black timed out!
        return this.handleTimeoutInternal(game, 'b');
      }
      blackRemaining += game.incrementMs;
    }

    // Validate and apply move through authoritative rules service
    const moveValidation = chessRulesService.applyMove(game.currentFen, from, to, promotion);

    const moves = await this.gameRepo.getMovesByGameId(gameId);
    const ply = moves.length + 1;
    const moveNumber = Math.ceil(ply / 2);

    const savedMove = await this.gameRepo.addMove({
      gameId,
      moveNumber,
      ply,
      playerId,
      fromSquare: from,
      toSquare: to,
      promotion,
      san: moveValidation.san,
      fenAfter: moveValidation.fenAfter,
      clockRemainingMs: isWhiteTurn ? whiteRemaining : blackRemaining,
    });

    const isGameOver = moveValidation.isCheckmate || moveValidation.isDraw;
    const nextVersion = game.positionVersion + 1;

    let ratingChanges: RatingChangeResult | undefined;
    if (isGameOver && game.gameMode === 'PVP' && game.blackPlayerId && moveValidation.result) {
      ratingChanges = await ratingsService.applyGameRatingChanges(
        game.id,
        game.whitePlayerId,
        game.blackPlayerId,
        moveValidation.result
      );
    }

    await this.gameRepo.update(gameId, {
      currentFen: moveValidation.fenAfter,
      currentTurn: moveValidation.nextTurn,
      positionVersion: nextVersion,
      whiteRemainingMs: whiteRemaining,
      blackRemainingMs: blackRemaining,
      lastMoveTimestamp: now,
      drawOfferedBy: null, // clear any pending draw offer upon move
      status: isGameOver ? 'COMPLETED' : 'IN_PROGRESS',
      result: moveValidation.result,
      terminationReason: moveValidation.terminationReason,
      endedAt: isGameOver ? new Date() : null,
    });

    return {
      moveResult: {
        gameId,
        move: savedMove,
        fen: moveValidation.fenAfter,
        currentTurn: moveValidation.nextTurn,
        positionVersion: nextVersion,
        isCheck: moveValidation.isCheck,
        isGameOver,
        result: moveValidation.result,
        terminationReason: moveValidation.terminationReason,
        whiteRemainingMs: whiteRemaining,
        blackRemainingMs: blackRemaining,
      },
      ratingChanges,
    };
  }

  private async handleTimeoutInternal(
    game: GameRecord,
    timedOutColor: PieceColor
  ): Promise<{ moveResult: MoveResultPayload; ratingChanges?: RatingChangeResult }> {
    const result: GameResultType = timedOutColor === 'w' ? 'BLACK_WON' : 'WHITE_WON';
    const terminationReason: TerminationReasonType = 'TIMEOUT';

    let ratingChanges: RatingChangeResult | undefined;
    if (game.gameMode === 'PVP' && game.blackPlayerId) {
      ratingChanges = await ratingsService.applyGameRatingChanges(
        game.id,
        game.whitePlayerId,
        game.blackPlayerId,
        result
      );
    }

    await this.gameRepo.update(game.id, {
      status: 'COMPLETED',
      result,
      terminationReason,
      endedAt: new Date(),
    });

    const moves = await this.gameRepo.getMovesByGameId(game.id);
    const lastMove = moves[moves.length - 1];

    return {
      moveResult: {
        gameId: game.id,
        move: lastMove || {
          gameId: game.id,
          moveNumber: 0,
          ply: 0,
          fromSquare: '',
          toSquare: '',
          san: 'Timeout',
          fenAfter: game.currentFen,
        },
        fen: game.currentFen,
        currentTurn: game.currentTurn,
        positionVersion: game.positionVersion,
        isCheck: false,
        isGameOver: true,
        result,
        terminationReason,
        whiteRemainingMs: game.whiteRemainingMs,
        blackRemainingMs: game.blackRemainingMs,
      },
      ratingChanges,
    };
  }

  async resign(
    gameId: string,
    playerId: string
  ): Promise<{ game: GameRecord; ratingChanges?: RatingChangeResult }> {
    const game = await this.gameRepo.findById(gameId);
    if (!game) throw new AppError(404, 'Không tìm thấy trận đấu');
    if (game.status !== 'IN_PROGRESS') {
      throw new AppError(400, 'Trận đấu đã kết thúc');
    }

    const isWhite = game.whitePlayerId === playerId;
    const isBlack = game.blackPlayerId === playerId;
    if (!isWhite && !isBlack) {
      throw new AppError(403, 'Bạn không tham gia trận đấu này');
    }

    const result: GameResultType = isWhite ? 'BLACK_WON' : 'WHITE_WON';
    const terminationReason: TerminationReasonType = 'RESIGNATION';

    let ratingChanges: RatingChangeResult | undefined;
    if (game.gameMode === 'PVP' && game.blackPlayerId) {
      ratingChanges = await ratingsService.applyGameRatingChanges(
        game.id,
        game.whitePlayerId,
        game.blackPlayerId,
        result
      );
    }

    const updated = await this.gameRepo.update(gameId, {
      status: 'COMPLETED',
      result,
      terminationReason,
      endedAt: new Date(),
    });

    return { game: updated, ratingChanges };
  }

  async offerDraw(gameId: string, playerId: string): Promise<GameRecord> {
    const game = await this.gameRepo.findById(gameId);
    if (!game) throw new AppError(404, 'Không tìm thấy trận đấu');
    if (game.status !== 'IN_PROGRESS') {
      throw new AppError(400, 'Trận đấu đã kết thúc');
    }

    if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
      throw new AppError(403, 'Bạn không tham gia trận đấu này');
    }

    return this.gameRepo.update(gameId, { drawOfferedBy: playerId });
  }

  async acceptDraw(
    gameId: string,
    playerId: string
  ): Promise<{ game: GameRecord; ratingChanges?: RatingChangeResult }> {
    const game = await this.gameRepo.findById(gameId);
    if (!game) throw new AppError(404, 'Không tìm thấy trận đấu');
    if (game.status !== 'IN_PROGRESS') {
      throw new AppError(400, 'Trận đấu đã kết thúc');
    }

    if (!game.drawOfferedBy || game.drawOfferedBy === playerId) {
      throw new AppError(400, 'Không có lời mời hòa hợp lệ từ đối thủ để chấp nhận');
    }

    const result: GameResultType = 'DRAW';
    const terminationReason: TerminationReasonType = 'MUTUAL_AGREEMENT';

    let ratingChanges: RatingChangeResult | undefined;
    if (game.gameMode === 'PVP' && game.blackPlayerId) {
      ratingChanges = await ratingsService.applyGameRatingChanges(
        game.id,
        game.whitePlayerId,
        game.blackPlayerId,
        result
      );
    }

    const updated = await this.gameRepo.update(gameId, {
      status: 'COMPLETED',
      result,
      terminationReason,
      drawOfferedBy: null,
      endedAt: new Date(),
    });

    return { game: updated, ratingChanges };
  }

  async getReplay(gameId: string): Promise<{
    game: GameState;
    history: Array<{ ply: number; san: string; from: string; to: string; fen: string }>;
  }> {
    const state = await this.getGameState(gameId);
    const moves = await this.gameRepo.getMovesByGameId(gameId);

    // Reconstruct board step-by-step from moves
    const chess = new Chess(STARTING_FEN);
    const history: Array<{ ply: number; san: string; from: string; to: string; fen: string }> = [
      { ply: 0, san: 'Bắt đầu', from: '', to: '', fen: STARTING_FEN },
    ];

    for (const m of moves) {
      chess.move({
        from: m.fromSquare,
        to: m.toSquare,
        promotion: (m.promotion as any) || undefined,
      });
      history.push({
        ply: m.ply,
        san: m.san,
        from: m.fromSquare,
        to: m.toSquare,
        fen: chess.fen(),
      });
    }

    return {
      game: state,
      history,
    };
  }

  async getUserGameHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.gameRepo.getUserGames(userId, skip, limit);
  }
}

export const gameService = new GameService();
