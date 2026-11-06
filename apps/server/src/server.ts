import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkDatabaseConnection, prisma } from './database/prisma';
import { socketAuthMiddleware } from './sockets/socketAuth';
import { registerSocketHandlers } from './sockets/gameSocket';

export async function bootstrap() {
  await checkDatabaseConnection();

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(socketAuthMiddleware);
  registerSocketHandlers(io);

  server.listen(env.PORT, () => {
    logger.info(`Server is running at http://localhost:${env.PORT}`);
    logger.info(`API Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Socket.IO listening on port ${env.PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    io.close(() => {
      logger.info('Socket.IO connections closed.');
    });
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Shutdown timed out, force exiting.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  return { app, server, io };
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    logger.error(err, 'Fatal error during server bootstrap');
    process.exit(1);
  });
}
