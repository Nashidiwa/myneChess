import { describe, it, expect } from 'vitest';
import { gameService } from '../src/modules/games/games.service';
import { authService } from '../src/modules/auth/auth.service';

describe('Phase 4 - Game Service & Authoritative State Tests', () => {
  let whiteUserId: string;
  let blackUserId: string;

  it('should initialize two players and create a game', async () => {
    const whiteAuth = await authService.register({
      username: 'player_white',
      email: 'white@chess.local',
      password: 'Password123!',
    });
    const blackAuth = await authService.register({
      username: 'player_black',
      email: 'black@chess.local',
      password: 'Password123!',
    });

    whiteUserId = whiteAuth.user.id;
    blackUserId = blackAuth.user.id;

    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 3 * 1000,
    });

    expect(game.id).toBeDefined();
    expect(game.status).toBe('IN_PROGRESS');
    expect(game.currentTurn).toBe('w');
    expect(game.positionVersion).toBe(0);
  });

  it('should process legal moves and update clocks and position version', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 3 * 1000,
    });

    // 1. e4 (White)
    const move1 = await gameService.makeMove({
      gameId: game.id,
      playerId: whiteUserId,
      from: 'e2',
      to: 'e4',
      expectedVersion: 0,
    });

    expect(move1.moveResult.move.san).toBe('e4');
    expect(move1.moveResult.positionVersion).toBe(1);
    expect(move1.moveResult.currentTurn).toBe('b');

    // 1... e5 (Black)
    const move2 = await gameService.makeMove({
      gameId: game.id,
      playerId: blackUserId,
      from: 'e7',
      to: 'e5',
      expectedVersion: 1,
    });

    expect(move2.moveResult.move.san).toBe('e5');
    expect(move2.moveResult.positionVersion).toBe(2);
    expect(move2.moveResult.currentTurn).toBe('w');
  });

  it('should reject stale moves with positionVersion mismatch', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 0,
    });

    // Move 1
    await gameService.makeMove({
      gameId: game.id,
      playerId: whiteUserId,
      from: 'e2',
      to: 'e4',
      expectedVersion: 0,
    });

    // Submitting with expectedVersion 0 again should fail (concurrency / race condition protection)
    await expect(
      gameService.makeMove({
        gameId: game.id,
        playerId: blackUserId,
        from: 'e7',
        to: 'e5',
        expectedVersion: 0,
      })
    ).rejects.toThrow('Trạng thái bàn cờ đã thay đổi');
  });

  it('should reject moving when it is not the players turn', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 0,
    });

    // Black tries to move on White's turn
    await expect(
      gameService.makeMove({
        gameId: game.id,
        playerId: blackUserId,
        from: 'e7',
        to: 'e5',
        expectedVersion: 0,
      })
    ).rejects.toThrow('Không phải lượt đi của bạn');
  });

  it('should handle resignation and update ELO rating', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 0,
    });

    const resignResult = await gameService.resign(game.id, whiteUserId);
    expect(resignResult.game.status).toBe('COMPLETED');
    expect(resignResult.game.result).toBe('BLACK_WON');
    expect(resignResult.game.terminationReason).toBe('RESIGNATION');
    expect(resignResult.ratingChanges).toBeDefined();
    expect(resignResult.ratingChanges?.blackRatingChange).toBeGreaterThan(0);
    expect(resignResult.ratingChanges?.whiteRatingChange).toBeLessThan(0);
  });

  it('should handle draw offer and acceptance', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 0,
    });

    // White offers draw
    await gameService.offerDraw(game.id, whiteUserId);
    // Black accepts draw
    const drawRes = await gameService.acceptDraw(game.id, blackUserId);

    expect(drawRes.game.status).toBe('COMPLETED');
    expect(drawRes.game.result).toBe('DRAW');
    expect(drawRes.game.terminationReason).toBe('MUTUAL_AGREEMENT');
  });

  it('should reconstruct move replay step by step', async () => {
    const game = await gameService.createGame({
      whitePlayerId: whiteUserId,
      whitePlayerName: 'player_white',
      whitePlayerRating: 1200,
      blackPlayerId: blackUserId,
      blackPlayerName: 'player_black',
      blackPlayerRating: 1200,
      gameMode: 'PVP',
      initialTimeMs: 5 * 60 * 1000,
      incrementMs: 0,
    });

    await gameService.makeMove({
      gameId: game.id,
      playerId: whiteUserId,
      from: 'e2',
      to: 'e4',
      expectedVersion: 0,
    });
    await gameService.makeMove({
      gameId: game.id,
      playerId: blackUserId,
      from: 'e7',
      to: 'e5',
      expectedVersion: 1,
    });

    const replay = await gameService.getReplay(game.id);
    expect(replay.history.length).toBe(3); // Start, move 1, move 2
    expect(replay.history[0].ply).toBe(0);
    expect(replay.history[1].san).toBe('e4');
    expect(replay.history[2].san).toBe('e5');
  });

  it('should allow resignation in AI games with guest-human player', async () => {
    const game = await gameService.createGame({
      whitePlayerId: 'guest-human',
      whitePlayerName: 'Bạn',
      whitePlayerRating: 1200,
      blackPlayerId: 'ai-engine',
      blackPlayerName: 'AI (MEDIUM)',
      blackPlayerRating: 1500,
      gameMode: 'AI',
      initialTimeMs: 10 * 60 * 1000,
      incrementMs: 0,
    });

    const result = await gameService.resign(game.id, 'guest-human');
    expect(result.game.status).toBe('COMPLETED');
    expect(result.game.result).toBe('BLACK_WON');
    expect(result.game.terminationReason).toBe('RESIGNATION');
  });
});
