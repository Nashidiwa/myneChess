import { z } from 'zod';

export const makeMoveSchema = z.object({
  gameId: z.string().uuid(),
  from: z.string().regex(/^[a-h][1-8]$/, 'Tọa độ ô đi không hợp lệ'),
  to: z.string().regex(/^[a-h][1-8]$/, 'Tọa độ ô đến không hợp lệ'),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
  expectedVersion: z.number().int().nonnegative(),
});

export type MakeMoveInput = z.infer<typeof makeMoveSchema>;

export const createAiGameSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  initialTimeMs: z.number().int().min(60 * 1000).max(60 * 60 * 1000).default(5 * 60 * 1000),
  incrementMs: z.number().int().min(0).max(60 * 1000).default(0),
  playerColor: z.enum(['white', 'black', 'random']).default('white'),
});

export type CreateAiGameInput = z.infer<typeof createAiGameSchema>;

export const drawActionSchema = z.object({
  gameId: z.string().uuid(),
});

export type DrawActionInput = z.infer<typeof drawActionSchema>;

export const resignSchema = z.object({
  gameId: z.string().uuid(),
});

export type ResignInput = z.infer<typeof resignSchema>;
