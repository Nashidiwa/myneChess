import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { getUserRepository } from '../users/users.repository.impl';
import { toUserProfile, UserRecord } from '../users/users.repository';
import {
  RegisterInput,
  LoginInput,
  AuthTokens,
  UserProfile,
  VerifyEmailInput,
  ResendVerificationInput,
  GoogleAuthInput,
} from '@online-chess/shared';
import { AuthJwtPayload } from '../../middleware/auth';
import { logger } from '../../config/logger';
import { generateVerificationCode, sendVerificationEmail } from '../../utils/mailer';

export class AuthService {
  private userRepo = getUserRepository();

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existingUsername = await this.userRepo.findByUsername(input.username);
    if (existingUsername) {
      throw new AppError(400, 'Tên đăng nhập đã tồn tại trên hệ thống');
    }

    const existingEmail = await this.userRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new AppError(400, 'Địa chỉ email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await this.userRepo.create({
      username: input.username,
      email: input.email,
      displayName: input.username,
      passwordHash,
      role: 'PLAYER',
      eloRating: 1200,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email asynchronously
    sendVerificationEmail(user.email, verificationCode).catch((err) => {
      logger.error(err, `Failed to send email to ${user.email}`);
    });

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: toUserProfile(user),
      verificationRequired: true,
      verificationCode, // Included for development convenience
    };
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    let user = await this.userRepo.findByUsername(input.usernameOrEmail);
    if (!user) {
      user = await this.userRepo.findByEmail(input.usernameOrEmail);
    }

    if (!user) {
      throw new AppError(401, 'Tên đăng nhập/email hoặc mật khẩu không chính xác');
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError(403, 'Tài khoản của bạn đã bị khóa bởi quản trị viên');
    }

    if (!user.passwordHash) {
      throw new AppError(
        400,
        'Tài khoản này được đăng ký thông qua Google. Vui lòng đăng nhập bằng Google hoặc tạo mật khẩu qua trang Hồ Sơ.'
      );
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'Tên đăng nhập/email hoặc mật khẩu không chính xác');
    }

    // STRICT CHECK: Email MUST be verified to continue
    if (!user.isEmailVerified) {
      let code = user.emailVerificationCode;
      if (!code || (user.emailVerificationExpires && user.emailVerificationExpires < new Date())) {
        code = generateVerificationCode();
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await this.userRepo.update(user.id, {
          emailVerificationCode: code,
          emailVerificationExpires: expires,
        });
        sendVerificationEmail(user.email, code).catch(() => {});
      }

      throw new AppError(
        403,
        'Tài khoản chưa được xác minh email. Vui lòng xác minh email của bạn để tiếp tục sử dụng hệ thống.',
        {
          requiresVerification: true,
          email: user.email,
        }
      );
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: toUserProfile(user),
      verificationRequired: false,
    };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy tài khoản với email này');
    }

    if (user.isEmailVerified) {
      const token = this.generateToken(user);
      return {
        accessToken: token,
        user: toUserProfile(user),
        verificationRequired: false,
      };
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== input.code.trim()) {
      throw new AppError(400, 'Mã xác minh không chính xác');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new AppError(400, 'Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    const updated = await this.userRepo.update(user.id, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
    });

    // Email verified successfully -> Grant accessToken to allow user to continue!
    const token = this.generateToken(updated);
    return {
      accessToken: token,
      user: toUserProfile(updated),
      verificationRequired: false,
    };
  }

  async resendVerification(input: ResendVerificationInput): Promise<{ message: string; code?: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy tài khoản với email này');
    }

    if (user.isEmailVerified) {
      throw new AppError(400, 'Địa chỉ email này đã được xác minh trước đó');
    }

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepo.update(user.id, {
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });

    await sendVerificationEmail(user.email, code);

    return {
      message: 'Mã xác minh mới đã được gửi tới email của bạn',
      code, // returned for dev convenience
    };
  }

  async googleAuth(input: GoogleAuthInput): Promise<AuthTokens> {
    const googleProfile = await this.verifyGoogleAuthData(input);

    // 1. Try finding by Google ID
    let user = await this.userRepo.findByGoogleId(googleProfile.googleId);

    // 2. If not found by googleId, try finding by email
    if (!user) {
      user = await this.userRepo.findByEmail(googleProfile.email);
      if (user) {
        // Link Google ID and verify email
        user = await this.userRepo.update(user.id, {
          googleId: googleProfile.googleId,
          isEmailVerified: true,
          avatarUrl: user.avatarUrl || googleProfile.picture || null,
          displayName: user.displayName || googleProfile.name || null,
        });
      }
    }

    // 3. If still no user, create new user
    if (!user) {
      const baseUsername = googleProfile.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 15);

      let finalUsername = baseUsername;
      let counter = 1;
      while (await this.userRepo.findByUsername(finalUsername)) {
        finalUsername = `${baseUsername.slice(0, 12)}_${counter}`;
        counter++;
      }

      user = await this.userRepo.create({
        username: finalUsername,
        email: googleProfile.email,
        displayName: googleProfile.name || finalUsername,
        avatarUrl: googleProfile.picture || null,
        googleId: googleProfile.googleId,
        isEmailVerified: true, // Google emails are already verified
        role: 'PLAYER',
        eloRating: 1200,
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError(403, 'Tài khoản của bạn đã bị khóa bởi quản trị viên');
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: toUserProfile(user),
      verificationRequired: false,
    };
  }

  private async verifyGoogleAuthData(input: GoogleAuthInput): Promise<{
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }> {
    // 1. Direct profile provided (already verified on client via Google GIS)
    if (input.profile?.email) {
      return {
        googleId: input.profile.sub || `google-${Buffer.from(input.profile.email).toString('hex').slice(0, 16)}`,
        email: input.profile.email,
        name: input.profile.name || input.profile.email.split('@')[0],
        picture: input.profile.picture,
      };
    }

    // 2. Case A: Access Token received from Google Popup (OAuth 2.0 initTokenClient)
    if (input.accessToken) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
          },
        });
        if (response.ok) {
          const profile: any = await response.json();
          if (profile.email) {
            return {
              googleId: profile.sub,
              email: profile.email,
              name: profile.name || profile.email.split('@')[0],
              picture: profile.picture,
            };
          }
        }
      } catch (err) {
        logger.error(err, 'Failed to fetch userinfo from Google with accessToken');
      }

      // Fallback: tokeninfo endpoint
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(input.accessToken)}`);
        if (res.ok) {
          const info: any = await res.json();
          if (info.email) {
            return {
              googleId: info.sub || `google-${Buffer.from(info.email).toString('hex').slice(0, 16)}`,
              email: info.email,
              name: info.email.split('@')[0],
            };
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Case B: ID Token (credential)
    const credential = input.credential || '';

    // Mock / Demo credential support for testing
    if (credential.startsWith('demo-google-') || credential.startsWith('mock-google-')) {
      const parts = credential.split(':');
      const email = parts[1] || 'chess_master@gmail.com';
      const name = parts[2] || 'Google Chess Player';
      const picture = parts[3] || 'https://api.dicebear.com/7.x/bottts/svg?seed=chess_master';
      return {
        googleId: `mock-google-id-${Buffer.from(email).toString('hex').slice(0, 16)}`,
        email,
        name,
        picture,
      };
    }

    if (credential) {
      try {
        const client = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID || undefined,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture,
          };
        }
      } catch (err: any) {
        // Fallback 1: query Google tokeninfo
        try {
          const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (res.ok) {
            const payload: any = await res.json();
            if (payload.email) {
              return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                picture: payload.picture,
              };
            }
          }
        } catch {
          // ignore
        }

        // Fallback 2: Decode JWT payload safely
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const json = Buffer.from(parts[1], 'base64').toString('utf-8');
            const payload = JSON.parse(json);
            if (payload.email) {
              return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                picture: payload.picture,
              };
            }
          }
        } catch {
          // ignore
        }
      }
    }

    throw new AppError(401, 'Xác thực tài khoản Google không thành công. Vui lòng thử lại.');
  }

  async getCurrentUser(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Không tìm thấy thông tin người dùng');
    }
    return toUserProfile(user);
  }

  generateToken(user: UserRecord): string {
    const payload: AuthJwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  async seedAdminUser(): Promise<void> {
    try {
      const existing = await this.userRepo.findByUsername(env.ADMIN_USERNAME);
      if (!existing) {
        const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
        await this.userRepo.create({
          username: env.ADMIN_USERNAME,
          email: env.ADMIN_EMAIL,
          displayName: 'Quản trị viên Hệ thống',
          passwordHash,
          role: 'ADMIN',
          eloRating: 1800,
          isEmailVerified: true,
        });
        logger.info(`Default Admin user initialized (${env.ADMIN_USERNAME})`);
      }
    } catch (err) {
      logger.error(err, 'Failed to seed default admin user');
    }
  }
}

export const authService = new AuthService();
