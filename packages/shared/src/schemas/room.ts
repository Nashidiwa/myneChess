import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Tên phòng không được để trống').max(50, 'Tên phòng tối đa 50 ký tự').optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  initialTimeMs: z.number().int().min(60 * 1000).max(60 * 60 * 1000).default(5 * 60 * 1000),
  incrementMs: z.number().int().min(0).max(60 * 1000).default(0),
  colorPreference: z.enum(['white', 'black', 'random']).default('random'),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(10).optional(),
  roomId: z.string().uuid().optional(),
  colorPreference: z.enum(['white', 'black', 'random']).default('random'),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
