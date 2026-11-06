import { UserProfile, UserRole, AccountStatus } from '@online-chess/shared';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  emailVerificationCode?: string | null;
  emailVerificationExpires?: Date | null;
  role: UserRole;
  eloRating: number;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByGoogleId(googleId: string): Promise<UserRecord | null>;
  create(data: {
    username: string;
    email: string;
    passwordHash?: string | null;
    googleId?: string | null;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    isEmailVerified?: boolean;
    emailVerificationCode?: string | null;
    emailVerificationExpires?: Date | null;
    role?: UserRole;
    eloRating?: number;
  }): Promise<UserRecord>;
  update(id: string, data: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord>;
  findMany(options?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<{ users: UserRecord[]; total: number }>;
  count(): Promise<number>;
}

export function toUserProfile(user: UserRecord): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName || null,
    bio: user.bio || null,
    avatarUrl: user.avatarUrl || null,
    isEmailVerified: !!user.isEmailVerified,
    hasPassword: !!user.passwordHash,
    googleId: user.googleId || null,
    role: user.role,
    eloRating: user.eloRating,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
