import { randomUUID } from 'crypto';
import { ChatMessage } from '@online-chess/shared';
import { prisma, isDatabaseConnected } from '../../database/prisma';
import { logger } from '../../config/logger';

export class ChatService {
  private memoryMessages: Map<string, ChatMessage[]> = new Map();

  async addMessage(params: {
    gameId: string;
    senderId: string;
    senderUsername: string;
    content: string;
  }): Promise<ChatMessage> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const sanitizedContent = params.content.trim().slice(0, 500);

    const message: ChatMessage = {
      id,
      gameId: params.gameId,
      senderId: params.senderId,
      senderUsername: params.senderUsername,
      content: sanitizedContent,
      createdAt,
    };

    const list = this.memoryMessages.get(params.gameId) || [];
    list.push(message);
    this.memoryMessages.set(params.gameId, list);

    if (isDatabaseConnected) {
      try {
        await prisma.message.create({
          data: {
            id,
            gameId: params.gameId,
            senderId: params.senderId,
            content: sanitizedContent,
          },
        });
      } catch (err) {
        logger.error(err, 'Failed to save chat message in database');
      }
    }

    return message;
  }

  async getMessages(gameId: string): Promise<ChatMessage[]> {
    if (isDatabaseConnected) {
      try {
        const msgs = await prisma.message.findMany({
          where: { gameId },
          orderBy: { createdAt: 'asc' },
          include: { sender: true },
        });
        return msgs.map((m) => ({
          id: m.id,
          gameId: m.gameId,
          senderId: m.senderId,
          senderUsername: m.sender.username,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }));
      } catch {
        // fallback to memory
      }
    }

    return this.memoryMessages.get(gameId) || [];
  }
}

export const chatService = new ChatService();
