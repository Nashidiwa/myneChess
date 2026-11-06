export type UserRole = 'GUEST' | 'PLAYER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  hasPassword?: boolean;
  googleId?: string | null;
  role: UserRole;
  eloRating: number;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  userId: string;
  username: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface AuthTokens {
  accessToken: string;
  user: UserProfile;
  verificationRequired?: boolean;
  verificationCode?: string; // Trả về trong môi trường dev nếu cần test
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: AuthTokens;
}
