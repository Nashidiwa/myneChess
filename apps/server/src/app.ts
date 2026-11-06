import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, AppError } from './middleware/errorHandler';
import { isDatabaseConnected } from './database/prisma';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import gamesRoutes from './modules/games/games.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import matchmakingRoutes from './modules/matchmaking/matchmaking.routes';
import aiRoutes from './modules/ai/ai.routes';
import leaderboardRoutes from './modules/ratings/leaderboard.routes';
import adminRoutes from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  // Security & utility middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check routes
  const healthHandler = (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'online-chess-server',
      database: isDatabaseConnected ? 'connected' : 'memory_fallback',
    });
  };

  app.get('/health', healthHandler);
  app.get(`${env.API_PREFIX}/health`, healthHandler);

  // API Documentation metadata endpoint
  app.get(`${env.API_PREFIX}/info`, (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'Online Chess API',
      version: '1.0.0',
      description: 'API documentation and REST specification for Online Chess Capstone Platform',
      endpoints: {
        auth: `${env.API_PREFIX}/auth`,
        users: `${env.API_PREFIX}/users`,
        rooms: `${env.API_PREFIX}/rooms`,
        matchmaking: `${env.API_PREFIX}/matchmaking`,
        games: `${env.API_PREFIX}/games`,
        leaderboard: `${env.API_PREFIX}/leaderboard`,
        admin: `${env.API_PREFIX}/admin`,
      },
    });
  });

  // Modules registration
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/users`, usersRoutes);
  app.use(`${env.API_PREFIX}/games`, gamesRoutes);
  app.use(`${env.API_PREFIX}/rooms`, roomsRoutes);
  app.use(`${env.API_PREFIX}/matchmaking`, matchmakingRoutes);
  app.use(`${env.API_PREFIX}/ai`, aiRoutes);
  app.use(`${env.API_PREFIX}/leaderboard`, leaderboardRoutes);
  app.use(`${env.API_PREFIX}/admin`, adminRoutes);

  // 404 Catch-all handler
  app.use('*', (req: Request) => {
    throw new AppError(404, `Tài nguyên không tìm thấy: ${req.method} ${req.originalUrl}`);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
