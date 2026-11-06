import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  gameId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .min(1, 'Tin nhắn không được để trống')
    .max(500, 'Tin nhắn không được vượt quá 500 ký tự'),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
