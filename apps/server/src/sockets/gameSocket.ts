import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { SOCKET_EVENTS, ClockUpdatePayload } from '@online-chess/shared';
import { roomService } from '../modules/rooms/rooms.service';
import { gameService } from '../modules/games/games.service';
import { chatService } from '../modules/chat/chat.service';
import { matchmakingService } from '../modules/matchmaking/matchmaking.service';
import { getUserRepository } from '../modules/users/users.repository.impl';
import { getGameRepository } from '../modules/games/games.repository.impl';
import { logger } from '../config/logger';

let globalIO: SocketIOServer | null = null;
const activeGameClocks = new Map<string, NodeJS.Timeout>();

export function setIO(io: SocketIOServer) {
  globalIO = io;
}

export function getIO(): SocketIOServer | null {
  return globalIO;
}

export function stopGameClock(gameId: string) {
  const existing = activeGameClocks.get(gameId);
  if (existing) {
    clearInterval(existing);
    activeGameClocks.delete(gameId);
  }
}

export function startGameClock(gameId: string, io: SocketIOServer) {
  stopGameClock(gameId);
  const gameRepo = getGameRepository();

  const timer = setInterval(async () => {
    try {
      const game = await gameRepo.findById(gameId);
      if (!game || game.status !== 'IN_PROGRESS') {
        stopGameClock(gameId);
        return;
      }

      const now = Date.now();
      const lastTs = game.lastMoveTimestamp || game.updatedAt.getTime();
      const elapsed = Math.max(0, now - lastTs);
      const isWhite = game.currentTurn === 'w';

      let whiteRemaining = game.whiteRemainingMs;
      let blackRemaining = game.blackRemainingMs;

      if (isWhite) {
        whiteRemaining = Math.max(0, whiteRemaining - elapsed);
      } else {
        blackRemaining = Math.max(0, blackRemaining - elapsed);
      }

      const clockPayload: ClockUpdatePayload = {
        gameId,
        whiteRemainingMs: whiteRemaining,
        blackRemainingMs: blackRemaining,
        activeColor: game.currentTurn,
        timestamp: now,
      };

      io.to(`game:${gameId}`).emit(SOCKET_EVENTS.CLOCK_UPDATE, clockPayload);

      // Check timeout
      if ((isWhite && whiteRemaining <= 0) || (!isWhite && blackRemaining <= 0)) {
        stopGameClock(gameId);
        logger.info(`Server Authoritative Clock Timeout detected for game ${gameId} (${game.currentTurn})`);

        const timeoutRes = await gameService.handleTimeoutInternal(game, isWhite ? 'w' : 'b');

        io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_OVER, {
          gameId,
          result: timeoutRes.moveResult.result,
          terminationReason: timeoutRes.moveResult.terminationReason,
          whiteEloChange: timeoutRes.ratingChanges?.whiteRatingChange,
          blackEloChange: timeoutRes.ratingChanges?.blackRatingChange,
          newWhiteElo: timeoutRes.ratingChanges?.whiteRatingAfter,
          newBlackElo: timeoutRes.ratingChanges?.blackRatingAfter,
        });
      }
    } catch (err) {
      logger.error(err, `Error in clock ticker for game ${gameId}`);
    }
  }, 1000);

  activeGameClocks.set(gameId, timer);
}

export function registerSocketHandlers(io: SocketIOServer) {
  setIO(io);
  const userRepo = getUserRepository();
  const socketJoinedGames = new Map<string, Set<string>>();

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.data?.user;
    logger.info(`Socket connected: ${socket.id} (User: ${user ? user.username : 'Guest'})`);

    const trackGameJoin = (gameId: string) => {
      let games = socketJoinedGames.get(socket.id);
      if (!games) {
        games = new Set();
        socketJoinedGames.set(socket.id, games);
      }
      games.add(gameId);
    };

    // JOIN_ROOM
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload, callback) => {
      try {
        if (!user) {
          throw new Error('Bạn cần đăng nhập để tham gia phòng');
        }

        const userProfile = await userRepo.findById(user.userId);
        const rating = userProfile?.eloRating || 1200;

        const result = await roomService.joinRoom({
          roomIdOrCode: payload.roomId || payload.roomCode,
          userId: user.userId,
          username: user.username,
          userRating: rating,
          colorPreference: payload.colorPreference,
        });

        socket.join(`room:${result.room.id}`);
        if (result.gameId) {
          socket.join(`game:${result.gameId}`);
          trackGameJoin(result.gameId);
          startGameClock(result.gameId, io);
        }

        io.to(`room:${result.room.id}`).emit(SOCKET_EVENTS.ROOM_UPDATED, result.room);

        if (result.gameId) {
          const gameState = await gameService.getGameState(result.gameId);
          io.to(`room:${result.room.id}`).emit(SOCKET_EVENTS.GAME_STATE, gameState);
        }

        if (callback) callback({ success: true, data: result });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'JOIN_ROOM_ERROR', message: err.message });
      }
    });

    // LEAVE_ROOM
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, async (payload) => {
      try {
        if (!user) return;
        const updated = await roomService.leaveRoom(payload.roomId, user.userId);
        socket.leave(`room:${payload.roomId}`);
        if (updated) {
          io.to(`room:${payload.roomId}`).emit(SOCKET_EVENTS.ROOM_UPDATED, updated);
        }
      } catch (err: any) {
        logger.error(err, 'Leave room error');
      }
    });

    // REQUEST_GAME_STATE
    socket.on(SOCKET_EVENTS.REQUEST_GAME_STATE, async (payload, callback) => {
      try {
        socket.join(`game:${payload.gameId}`);
        trackGameJoin(payload.gameId);
        const state = await gameService.getGameState(payload.gameId);
        const messages = await chatService.getMessages(payload.gameId);

        if (state.status === 'IN_PROGRESS') {
          startGameClock(payload.gameId, io);
        }

        socket.emit(SOCKET_EVENTS.GAME_STATE, state);
        if (callback) callback({ success: true, data: { state, messages } });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // MOVE (Finding C-02 & Step 3 Guard)
    socket.on(SOCKET_EVENTS.MOVE, async (payload, callback) => {
      try {
        const { gameId, from, to, promotion, expectedVersion } = payload;
        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để thực hiện nước đi' });
          socket.emit(SOCKET_EVENTS.MOVE_REJECTED, { gameId, message: 'Yêu cầu đăng nhập để thực hiện nước đi' });
          if (callback) callback({ success: false, message: 'Yêu cầu đăng nhập để thực hiện nước đi' });
          return;
        }

        const result = await gameService.makeMove({
          gameId,
          playerId: user.userId,
          from,
          to,
          promotion,
          expectedVersion,
        });

        // Broadcast authoritative move result to both players
        io.to(`game:${gameId}`).emit(SOCKET_EVENTS.MOVE_RESULT, result.moveResult);

        // If game is over, broadcast GAME_OVER and stop clock
        if (result.moveResult.isGameOver) {
          stopGameClock(gameId);
          if (result.moveResult.result) {
            io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_OVER, {
              gameId,
              result: result.moveResult.result,
              terminationReason: result.moveResult.terminationReason,
              whiteEloChange: result.ratingChanges?.whiteRatingChange,
              blackEloChange: result.ratingChanges?.blackRatingChange,
              newWhiteElo: result.ratingChanges?.whiteRatingAfter,
              newBlackElo: result.ratingChanges?.blackRatingAfter,
            });
          }
        } else {
          // Restart/reset timer for next player's turn
          startGameClock(gameId, io);
        }

        if (callback) callback({ success: true, data: result.moveResult });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'MOVE_ERROR', message: err.message });
        socket.emit(SOCKET_EVENTS.MOVE_REJECTED, { gameId: payload?.gameId, message: err.message });
      }
    });

    // CLAIM_TIMEOUT (Finding C-03)
    socket.on(SOCKET_EVENTS.CLAIM_TIMEOUT, async (payload, callback) => {
      try {
        const { gameId } = payload;
        const result = await gameService.claimTimeout(gameId, user?.userId);
        stopGameClock(gameId);

        io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_OVER, {
          gameId,
          result: result.moveResult.result,
          terminationReason: result.moveResult.terminationReason,
          whiteEloChange: result.ratingChanges?.whiteRatingChange,
          blackEloChange: result.ratingChanges?.blackRatingChange,
          newWhiteElo: result.ratingChanges?.whiteRatingAfter,
          newBlackElo: result.ratingChanges?.blackRatingAfter,
        });

        if (callback) callback({ success: true, data: result.moveResult });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'TIMEOUT_ERROR', message: err.message });
      }
    });

    // CHAT
    socket.on(SOCKET_EVENTS.CHAT, async (payload) => {
      try {
        if (!user) return;
        const message = await chatService.addMessage({
          gameId: payload.gameId,
          senderId: user.userId,
          senderUsername: user.username,
          content: payload.message,
        });
        io.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'CHAT_ERROR', message: err.message });
      }
    });

    // RESIGN
    socket.on(SOCKET_EVENTS.RESIGN, async (payload, callback) => {
      try {
        if (!user) throw new Error('Chưa đăng nhập');
        const res = await gameService.resign(payload.gameId, user.userId);
        stopGameClock(payload.gameId);

        io.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.GAME_OVER, {
          gameId: payload.gameId,
          result: res.game.result,
          terminationReason: res.game.terminationReason,
          whiteEloChange: res.ratingChanges?.whiteRatingChange,
          blackEloChange: res.ratingChanges?.blackRatingChange,
          newWhiteElo: res.ratingChanges?.whiteRatingAfter,
          newBlackElo: res.ratingChanges?.blackRatingAfter,
        });

        if (callback) callback({ success: true, data: res.game });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // DRAW_OFFER
    socket.on(SOCKET_EVENTS.DRAW_OFFER, async (payload) => {
      try {
        if (!user) return;
        await gameService.offerDraw(payload.gameId, user.userId);
        socket.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.DRAW_OFFERED, {
          gameId: payload.gameId,
          offeredBy: user.username,
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'DRAW_ERROR', message: err.message });
      }
    });

    // DRAW_ACCEPT
    socket.on(SOCKET_EVENTS.DRAW_ACCEPT, async (payload) => {
      try {
        if (!user) return;
        const res = await gameService.acceptDraw(payload.gameId, user.userId);
        stopGameClock(payload.gameId);

        io.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.GAME_OVER, {
          gameId: payload.gameId,
          result: 'DRAW',
          terminationReason: 'MUTUAL_AGREEMENT',
          whiteEloChange: res.ratingChanges?.whiteRatingChange,
          blackEloChange: res.ratingChanges?.blackRatingChange,
          newWhiteElo: res.ratingChanges?.whiteRatingAfter,
          newBlackElo: res.ratingChanges?.blackRatingAfter,
        });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'DRAW_ERROR', message: err.message });
      }
    });

    // DRAW_REJECT
    socket.on(SOCKET_EVENTS.DRAW_REJECT, (payload) => {
      socket.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.DRAW_REJECTED, {
        gameId: payload.gameId,
        rejectedBy: user?.username,
      });
    });

    // RECONNECT
    socket.on(SOCKET_EVENTS.RECONNECT, async (payload, callback) => {
      try {
        socket.join(`game:${payload.gameId}`);
        trackGameJoin(payload.gameId);
        const state = await gameService.getGameState(payload.gameId);
        const messages = await chatService.getMessages(payload.gameId);

        if (state.status === 'IN_PROGRESS') {
          startGameClock(payload.gameId, io);
        }

        socket.to(`game:${payload.gameId}`).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
          userId: user?.userId,
          username: user?.username,
        });

        if (callback) callback({ success: true, data: { state, messages } });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // MATCHMAKING_JOIN
    socket.on(SOCKET_EVENTS.MATCHMAKING_JOIN, async (payload, callback) => {
      try {
        if (!user) throw new Error('Vui lòng đăng nhập để ghép trận');
        const userProfile = await userRepo.findById(user.userId);
        const rating = userProfile?.eloRating || 1200;

        const matchResult = matchmakingService.addToQueue({
          userId: user.userId,
          username: user.username,
          eloRating: rating,
          initialTimeMs: payload.initialTimeMs,
          incrementMs: payload.incrementMs,
          joinedAt: Date.now(),
          socketId: socket.id,
        });

        if (matchResult.matched && matchResult.opponent) {
          // Create room and start game
          const room = await roomService.createRoom({
            hostId: matchResult.opponent.userId,
            hostUsername: matchResult.opponent.username,
            hostRating: matchResult.opponent.eloRating,
            visibility: 'PUBLIC',
            initialTimeMs: payload.initialTimeMs,
            incrementMs: payload.incrementMs,
            colorPreference: 'random',
          });

          const joinResult = await roomService.joinRoom({
            roomIdOrCode: room.id,
            userId: user.userId,
            username: user.username,
            userRating: rating,
          });

          // Join sockets to game room
          socket.join(`game:${joinResult.gameId}`);
          trackGameJoin(joinResult.gameId!);
          const opponentSocket = io.sockets.sockets.get(matchResult.opponent.socketId);
          if (opponentSocket) {
            opponentSocket.join(`game:${joinResult.gameId}`);
            let opponentGames = socketJoinedGames.get(opponentSocket.id);
            if (!opponentGames) {
              opponentGames = new Set();
              socketJoinedGames.set(opponentSocket.id, opponentGames);
            }
            opponentGames.add(joinResult.gameId!);
          }

          startGameClock(joinResult.gameId!, io);

          const gameState = await gameService.getGameState(joinResult.gameId!);

          io.to(`game:${joinResult.gameId}`).emit(SOCKET_EVENTS.MATCH_FOUND, {
            gameId: joinResult.gameId,
            gameState,
          });
        }

        if (callback) callback({ success: true, matched: matchResult.matched });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // MATCHMAKING_CANCEL
    socket.on(SOCKET_EVENTS.MATCHMAKING_CANCEL, () => {
      if (user) {
        matchmakingService.removeFromQueue(user.userId);
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        matchmakingService.removeFromQueue(user.userId);
        const joinedGames = socketJoinedGames.get(socket.id);
        if (joinedGames) {
          for (const gameId of joinedGames) {
            io.to(`game:${gameId}`).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
              userId: user.userId,
              username: user.username,
            });
          }
        }
        logger.info(`Socket disconnected: ${socket.id} (User: ${user.username})`);
      } else {
        logger.info(`Socket disconnected: ${socket.id}`);
      }
      socketJoinedGames.delete(socket.id);
    });
  });
}
