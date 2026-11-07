import { randomUUID } from 'crypto';
import { IGameRepository, GameRecord } from './games.repository';
import { MoveData, STARTING_FEN } from '@online-chess/shared';
import { prisma, isDatabaseConnected } from '../../database/prisma';
import { AppError } from '../../middleware/errorHandler';

export class MemoryGameRepository implements IGameRepository {
  private games: Map<string, GameRecord> = new Map();
  private moves: Map<string, MoveData[]> = new Map();

  async create(data: {
    whitePlayerId: string;
    whitePlayerName: string;
    whitePlayerRating: number;
    blackPlayerId?: string | null;
    blackPlayerName?: string | null;
    blackPlayerRating?: number | null;
    gameMode: GameRecord['gameMode'];
    aiDifficulty?: string | null;
    initialTimeMs: number;
    incrementMs: number;
  }): Promise<GameRecord> {
    const now = new Date();
    const game: GameRecord = {
      id: randomUUID(),
      whitePlayerId: data.whitePlayerId,
      whitePlayerName: data.whitePlayerName,
      whitePlayerRating: data.whitePlayerRating,
      blackPlayerId: data.blackPlayerId ?? null,
      blackPlayerName: data.blackPlayerName ?? (data.gameMode === 'AI' ? 'StockAI' : null),
      blackPlayerRating: data.blackPlayerRating ?? (data.gameMode === 'AI' ? 1500 : null),
      gameMode: data.gameMode,
      aiDifficulty: data.aiDifficulty ?? null,
      status: 'IN_PROGRESS',
      result: null,
      terminationReason: null,
      initialTimeMs: data.initialTimeMs,
      incrementMs: data.incrementMs,
      whiteRemainingMs: data.initialTimeMs,
      blackRemainingMs: data.initialTimeMs,
      currentTurn: 'w',
      currentFen: STARTING_FEN,
      positionVersion: 0,
      drawOfferedBy: null,
      lastMoveTimestamp: Date.now(),
      fenHistory: [STARTING_FEN],
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.games.set(game.id, game);
    this.moves.set(game.id, []);
    return game;
  }

  async findById(id: string): Promise<GameRecord | null> {
    return this.games.get(id) || null;
  }

  async update(id: string, data: Partial<GameRecord>, expectedVersion?: number): Promise<GameRecord> {
    const existing = this.games.get(id);
    if (!existing) {
      throw new Error(`Game ${id} not found`);
    }

    if (expectedVersion !== undefined && existing.positionVersion !== expectedVersion) {
      throw new AppError(409, 'Trạng thái bàn cờ đã thay đổi (Xung đột đồng thời)');
    }

    const updated: GameRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.games.set(id, updated);
    return updated;
  }

  async addMove(moveData: Omit<MoveData, 'id' | 'createdAt'>): Promise<MoveData> {
    const list = this.moves.get(moveData.gameId) || [];
    const move: MoveData = {
      ...moveData,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    list.push(move);
    this.moves.set(moveData.gameId, list);
    return move;
  }

  async getMovesByGameId(gameId: string): Promise<MoveData[]> {
    return this.moves.get(gameId) || [];
  }

  async getUserGames(
    userId: string,
    skip = 0,
    take = 20
  ): Promise<{ games: GameRecord[]; total: number }> {
    const all = Array.from(this.games.values())
      .filter((g) => g.whitePlayerId === userId || g.blackPlayerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      games: all.slice(skip, skip + take),
      total: all.length,
    };
  }
}

export class PrismaGameRepository implements IGameRepository {
  async create(data: {
    whitePlayerId: string;
    whitePlayerName: string;
    whitePlayerRating: number;
    blackPlayerId?: string | null;
    blackPlayerName?: string | null;
    blackPlayerRating?: number | null;
    gameMode: GameRecord['gameMode'];
    aiDifficulty?: string | null;
    initialTimeMs: number;
    incrementMs: number;
  }): Promise<GameRecord> {
    const now = new Date();
    const nowTs = Date.now();
    const game = await prisma.game.create({
      data: {
        whitePlayerId: data.whitePlayerId,
        blackPlayerId: data.blackPlayerId || undefined,
        gameMode: data.gameMode,
        aiDifficulty: data.aiDifficulty || undefined,
        status: 'IN_PROGRESS',
        initialTimeMs: data.initialTimeMs,
        incrementMs: data.incrementMs,
        whiteRemainingMs: data.initialTimeMs,
        blackRemainingMs: data.initialTimeMs,
        currentTurn: 'w',
        currentFen: STARTING_FEN,
        positionVersion: 0,
        lastMoveTimestamp: BigInt(nowTs),
        fenHistory: [STARTING_FEN],
        startedAt: now,
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    return {
      id: game.id,
      whitePlayerId: game.whitePlayerId,
      whitePlayerName: game.whitePlayer.username,
      whitePlayerRating: game.whitePlayer.eloRating,
      blackPlayerId: game.blackPlayerId,
      blackPlayerName: game.blackPlayer ? game.blackPlayer.username : 'StockAI',
      blackPlayerRating: game.blackPlayer ? game.blackPlayer.eloRating : 1500,
      gameMode: game.gameMode as any,
      aiDifficulty: game.aiDifficulty,
      status: game.status as any,
      result: game.result as any,
      terminationReason: game.terminationReason as any,
      initialTimeMs: game.initialTimeMs,
      incrementMs: game.incrementMs,
      whiteRemainingMs: game.whiteRemainingMs,
      blackRemainingMs: game.blackRemainingMs,
      currentTurn: game.currentTurn as any,
      currentFen: game.currentFen,
      positionVersion: game.positionVersion,
      drawOfferedBy: game.drawOfferedBy,
      fenHistory: game.fenHistory || [STARTING_FEN],
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      lastMoveTimestamp: game.lastMoveTimestamp ? Number(game.lastMoveTimestamp) : nowTs,
    };
  }

  async findById(id: string): Promise<GameRecord | null> {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });
    if (!game) return null;

    return {
      id: game.id,
      whitePlayerId: game.whitePlayerId,
      whitePlayerName: game.whitePlayer.username,
      whitePlayerRating: game.whitePlayer.eloRating,
      blackPlayerId: game.blackPlayerId,
      blackPlayerName: game.blackPlayer ? game.blackPlayer.username : 'StockAI',
      blackPlayerRating: game.blackPlayer ? game.blackPlayer.eloRating : 1500,
      gameMode: game.gameMode as any,
      aiDifficulty: game.aiDifficulty,
      status: game.status as any,
      result: game.result as any,
      terminationReason: game.terminationReason as any,
      initialTimeMs: game.initialTimeMs,
      incrementMs: game.incrementMs,
      whiteRemainingMs: game.whiteRemainingMs,
      blackRemainingMs: game.blackRemainingMs,
      currentTurn: game.currentTurn as any,
      currentFen: game.currentFen,
      positionVersion: game.positionVersion,
      drawOfferedBy: game.drawOfferedBy,
      fenHistory: game.fenHistory || [game.currentFen],
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      lastMoveTimestamp: game.lastMoveTimestamp ? Number(game.lastMoveTimestamp) : game.updatedAt.getTime(),
    };
  }

  async update(id: string, data: Partial<GameRecord>, expectedVersion?: number): Promise<GameRecord> {
    const updateData: any = {
      status: data.status as any,
      result: data.result as any,
      terminationReason: data.terminationReason as any,
      currentFen: data.currentFen,
      currentTurn: data.currentTurn,
      positionVersion: data.positionVersion,
      whiteRemainingMs: data.whiteRemainingMs,
      blackRemainingMs: data.blackRemainingMs,
      endedAt: data.endedAt,
    };

    if (data.lastMoveTimestamp !== undefined) {
      updateData.lastMoveTimestamp = data.lastMoveTimestamp ? BigInt(data.lastMoveTimestamp) : null;
    }
    if (data.fenHistory !== undefined) {
      updateData.fenHistory = data.fenHistory;
    }
    if (data.drawOfferedBy !== undefined) {
      updateData.drawOfferedBy = data.drawOfferedBy;
    }

    if (expectedVersion !== undefined) {
      // Optimistic concurrency Compare-And-Swap
      const updateResult = await prisma.game.updateMany({
        where: { id, positionVersion: expectedVersion },
        data: updateData,
      });

      if (updateResult.count === 0) {
        throw new AppError(409, 'Trạng thái bàn cờ đã thay đổi (Xung đột đồng thời)');
      }

      const updated = await prisma.game.findUniqueOrThrow({
        where: { id },
        include: {
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      return {
        id: updated.id,
        whitePlayerId: updated.whitePlayerId,
        whitePlayerName: updated.whitePlayer.username,
        whitePlayerRating: updated.whitePlayer.eloRating,
        blackPlayerId: updated.blackPlayerId,
        blackPlayerName: updated.blackPlayer ? updated.blackPlayer.username : 'StockAI',
        blackPlayerRating: updated.blackPlayer ? updated.blackPlayer.eloRating : 1500,
        gameMode: updated.gameMode as any,
        aiDifficulty: updated.aiDifficulty,
        status: updated.status as any,
        result: updated.result as any,
        terminationReason: updated.terminationReason as any,
        initialTimeMs: updated.initialTimeMs,
        incrementMs: updated.incrementMs,
        whiteRemainingMs: updated.whiteRemainingMs,
        blackRemainingMs: updated.blackRemainingMs,
        currentTurn: updated.currentTurn as any,
        currentFen: updated.currentFen,
        positionVersion: updated.positionVersion,
        drawOfferedBy: updated.drawOfferedBy,
        fenHistory: updated.fenHistory || [updated.currentFen],
        startedAt: updated.startedAt,
        endedAt: updated.endedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        lastMoveTimestamp: updated.lastMoveTimestamp ? Number(updated.lastMoveTimestamp) : updated.updatedAt.getTime(),
      };
    }

    const updated = await prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    return {
      id: updated.id,
      whitePlayerId: updated.whitePlayerId,
      whitePlayerName: updated.whitePlayer.username,
      whitePlayerRating: updated.whitePlayer.eloRating,
      blackPlayerId: updated.blackPlayerId,
      blackPlayerName: updated.blackPlayer ? updated.blackPlayer.username : 'StockAI',
      blackPlayerRating: updated.blackPlayer ? updated.blackPlayer.eloRating : 1500,
      gameMode: updated.gameMode as any,
      aiDifficulty: updated.aiDifficulty,
      status: updated.status as any,
      result: updated.result as any,
      terminationReason: updated.terminationReason as any,
      initialTimeMs: updated.initialTimeMs,
      incrementMs: updated.incrementMs,
      whiteRemainingMs: updated.whiteRemainingMs,
      blackRemainingMs: updated.blackRemainingMs,
      currentTurn: updated.currentTurn as any,
      currentFen: updated.currentFen,
      positionVersion: updated.positionVersion,
      drawOfferedBy: updated.drawOfferedBy,
      fenHistory: updated.fenHistory || [updated.currentFen],
      startedAt: updated.startedAt,
      endedAt: updated.endedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastMoveTimestamp: updated.lastMoveTimestamp ? Number(updated.lastMoveTimestamp) : updated.updatedAt.getTime(),
    };
  }

  async addMove(moveData: Omit<MoveData, 'id' | 'createdAt'>): Promise<MoveData> {
    const move = await prisma.move.create({
      data: {
        gameId: moveData.gameId,
        moveNumber: moveData.moveNumber,
        ply: moveData.ply,
        playerId: moveData.playerId || undefined,
        fromSquare: moveData.fromSquare,
        toSquare: moveData.toSquare,
        promotion: moveData.promotion || undefined,
        san: moveData.san,
        fenAfter: moveData.fenAfter,
        clockRemainingMs: moveData.clockRemainingMs || undefined,
      },
    });

    return {
      id: move.id,
      gameId: move.gameId,
      moveNumber: move.moveNumber,
      ply: move.ply,
      playerId: move.playerId,
      fromSquare: move.fromSquare,
      toSquare: move.toSquare,
      promotion: move.promotion,
      san: move.san,
      fenAfter: move.fenAfter,
      clockRemainingMs: move.clockRemainingMs,
      createdAt: move.createdAt.toISOString(),
    };
  }

  async getMovesByGameId(gameId: string): Promise<MoveData[]> {
    const moves = await prisma.move.findMany({
      where: { gameId },
      orderBy: { ply: 'asc' },
    });
    return moves.map((m) => ({
      id: m.id,
      gameId: m.gameId,
      moveNumber: m.moveNumber,
      ply: m.ply,
      playerId: m.playerId,
      fromSquare: m.fromSquare,
      toSquare: m.toSquare,
      promotion: m.promotion,
      san: m.san,
      fenAfter: m.fenAfter,
      clockRemainingMs: m.clockRemainingMs,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async getUserGames(
    userId: string,
    skip = 0,
    take = 20
  ): Promise<{ games: GameRecord[]; total: number }> {
    const where = {
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    };

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { whitePlayer: true, blackPlayer: true },
      }),
      prisma.game.count({ where }),
    ]);

    return {
      games: games.map((g) => ({
        id: g.id,
        whitePlayerId: g.whitePlayerId,
        whitePlayerName: g.whitePlayer.username,
        whitePlayerRating: g.whitePlayer.eloRating,
        blackPlayerId: g.blackPlayerId,
        blackPlayerName: g.blackPlayer ? g.blackPlayer.username : 'StockAI',
        blackPlayerRating: g.blackPlayer ? g.blackPlayer.eloRating : 1500,
        gameMode: g.gameMode as any,
        aiDifficulty: g.aiDifficulty,
        status: g.status as any,
        result: g.result as any,
        terminationReason: g.terminationReason as any,
        initialTimeMs: g.initialTimeMs,
        incrementMs: g.incrementMs,
        whiteRemainingMs: g.whiteRemainingMs,
        blackRemainingMs: g.blackRemainingMs,
        currentTurn: g.currentTurn as any,
        currentFen: g.currentFen,
        positionVersion: g.positionVersion,
        drawOfferedBy: g.drawOfferedBy,
        fenHistory: g.fenHistory || [g.currentFen],
        startedAt: g.startedAt,
        endedAt: g.endedAt,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        lastMoveTimestamp: g.lastMoveTimestamp ? Number(g.lastMoveTimestamp) : g.updatedAt.getTime(),
      })),
      total,
    };
  }
}

const memoryGameRepo = new MemoryGameRepository();
const prismaGameRepo = new PrismaGameRepository();

export function getGameRepository(): IGameRepository {
  if (isDatabaseConnected) {
    return prismaGameRepo;
  }
  return memoryGameRepo;
}
