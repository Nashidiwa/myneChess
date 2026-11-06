import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export let isDatabaseConnected = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDatabaseConnected = true;
    logger.info('Database connected successfully (PostgreSQL via Prisma)');
    return true;
  } catch (error) {
    isDatabaseConnected = false;
    logger.warn('PostgreSQL database not reachable. Running in resilient memory-store mode.');
    return false;
  }
}
