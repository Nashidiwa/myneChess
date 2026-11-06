import { randomUUID } from 'crypto';
import { IUserRepository, UserRecord } from './users.repository';
import { prisma, isDatabaseConnected } from '../../database/prisma';

export class MemoryUserRepository implements IUserRepository {
  private users: Map<string, UserRecord> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    const now = new Date();
    const defaultUsers: UserRecord[] = [
      {
        id: 'user-admin-001',
        username: 'admin',
        email: 'admin@onlinechess.local',
        passwordHash: '$2a$10$pfPDA2YGRD8rpJ4Yz3zXL.zafsq/e0k3GAD7B3fPLpIr1kz1W32h6', // AdminSecurePass123!
        displayName: 'Quản trị viên',
        bio: 'Hệ thống Quản trị Viên Online Chess',
        avatarUrl: null,
        isEmailVerified: true,
        role: 'ADMIN',
        eloRating: 1800,
        accountStatus: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-player1-002',
        username: 'grandmaster',
        email: 'gm@onlinechess.local',
        passwordHash: '$2a$10$ougRNmlcWdEFi6dmaZW43O8RH4zUsXNXkTAeonzlXK37Yy6Q0r2Pq', // Password123!
        displayName: 'Đại Kiện Tướng',
        bio: 'Đam mê cờ vua đỉnh cao',
        avatarUrl: null,
        isEmailVerified: true,
        role: 'PLAYER',
        eloRating: 2150,
        accountStatus: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-player2-003',
        username: 'player1',
        email: 'player1@onlinechess.local',
        passwordHash: '$2a$10$ougRNmlcWdEFi6dmaZW43O8RH4zUsXNXkTAeonzlXK37Yy6Q0r2Pq', // Password123!
        displayName: 'Kỳ Thủ Số 1',
        bio: 'Thích cờ chớp 3 phút',
        avatarUrl: null,
        isEmailVerified: true,
        role: 'PLAYER',
        eloRating: 1450,
        accountStatus: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-player3-004',
        username: 'player2',
        email: 'player2@onlinechess.local',
        passwordHash: '$2a$10$ougRNmlcWdEFi6dmaZW43O8RH4zUsXNXkTAeonzlXK37Yy6Q0r2Pq', // Password123!
        displayName: 'Kỳ Thủ Số 2',
        bio: 'Yêu thích phòng thủ Sicilian',
        avatarUrl: null,
        isEmailVerified: true,
        role: 'PLAYER',
        eloRating: 1320,
        accountStatus: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const u of defaultUsers) {
      this.users.set(u.id, u);
    }
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const lower = username.toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === lower) return u;
    }
    return null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === lower) return u;
    }
    return null;
  }

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    for (const u of this.users.values()) {
      if (u.googleId === googleId) return u;
    }
    return null;
  }

  async create(data: {
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
    role?: UserRecord['role'];
    eloRating?: number;
  }): Promise<UserRecord> {
    const now = new Date();
    const user: UserRecord = {
      id: randomUUID(),
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash || null,
      googleId: data.googleId || null,
      displayName: data.displayName || null,
      bio: data.bio || null,
      avatarUrl: data.avatarUrl || null,
      isEmailVerified: data.isEmailVerified ?? false,
      emailVerificationCode: data.emailVerificationCode || null,
      emailVerificationExpires: data.emailVerificationExpires || null,
      role: data.role || 'PLAYER',
      eloRating: data.eloRating ?? 1200,
      accountStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: UserRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async findMany(options?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<{ users: UserRecord[]; total: number }> {
    let list = Array.from(this.users.values());
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const skip = options?.skip || 0;
    const take = options?.take || 20;
    list = list.slice(skip, skip + take);
    return { users: list, total };
  }

  async count(): Promise<number> {
    return this.users.size;
  }
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as UserRecord | null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    return user as UserRecord | null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user as UserRecord | null;
  }

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { googleId } });
    return user as UserRecord | null;
  }

  async create(data: {
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
    role?: UserRecord['role'];
    eloRating?: number;
  }): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash || null,
        googleId: data.googleId || null,
        displayName: data.displayName || null,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        isEmailVerified: data.isEmailVerified ?? false,
        emailVerificationCode: data.emailVerificationCode || null,
        emailVerificationExpires: data.emailVerificationExpires || null,
        role: data.role || 'PLAYER',
        eloRating: data.eloRating ?? 1200,
      },
    });
    return user as UserRecord;
  }

  async update(id: string, data: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return user as UserRecord;
  }

  async findMany(options?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<{ users: UserRecord[]; total: number }> {
    const where = options?.search
      ? {
          OR: [
            { username: { contains: options.search, mode: 'insensitive' as const } },
            { email: { contains: options.search, mode: 'insensitive' as const } },
            { displayName: { contains: options.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: options?.skip || 0,
        take: options?.take || 20,
        orderBy: { eloRating: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users as UserRecord[], total };
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}

const memoryRepoInstance = new MemoryUserRepository();
const prismaRepoInstance = new PrismaUserRepository();

export function getUserRepository(): IUserRepository {
  if (isDatabaseConnected) {
    return prismaRepoInstance;
  }
  return memoryRepoInstance;
}
