import bcrypt from 'bcryptjs';
import { getUserRepository } from './users.repository.impl';
import { toUserProfile, UserRecord } from './users.repository';
import { AppError } from '../../middleware/errorHandler';
import { UserProfile, UserStats, UpdateProfileInput } from '@online-chess/shared';
import { generateVerificationCode, sendVerificationEmail } from '../../utils/mailer';

export class UsersService {
  private userRepo = getUserRepository();

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy người dùng');
    }
    return toUserProfile(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy người dùng');
    }

    const updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>> = {};

    if (input.displayName !== undefined) {
      updates.displayName = input.displayName;
    }

    if (input.bio !== undefined) {
      updates.bio = input.bio;
    }

    if (input.avatarUrl !== undefined) {
      updates.avatarUrl = input.avatarUrl;
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing && existing.id !== user.id) {
        throw new AppError(400, 'Email này đã được sử dụng bởi tài khoản khác');
      }
      updates.email = input.email;
      updates.isEmailVerified = false;
      const code = generateVerificationCode();
      updates.emailVerificationCode = code;
      updates.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      sendVerificationEmail(input.email, code).catch(() => {});
    }

    if (input.newPassword) {
      // If user already has a password, check currentPassword
      if (user.passwordHash) {
        if (!input.currentPassword) {
          throw new AppError(400, 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
        }
        const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isMatch) {
          throw new AppError(400, 'Mật khẩu hiện tại không chính xác');
        }
      }
      updates.passwordHash = await bcrypt.hash(input.newPassword, 10);
    }

    const updated = await this.userRepo.update(userId, updates);
    return toUserProfile(updated);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy người dùng');
    }

    return {
      userId: user.id,
      username: user.username,
      eloRating: user.eloRating,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
    };
  }
}

export const usersService = new UsersService();
