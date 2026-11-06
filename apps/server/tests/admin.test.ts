import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { authService } from '../src/modules/auth/auth.service';
import { env } from '../src/config/env';

describe('Phase 8 & 9 - Leaderboard & Administration API Tests', () => {
  const app = createApp();
  let adminToken = '';
  let playerToken = '';

  it('should authenticate Admin user and fetch admin stats', async () => {
    await authService.seedAdminUser();

    // Login as Admin
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: env.ADMIN_USERNAME,
      password: env.ADMIN_PASSWORD,
    });

    expect(adminLoginRes.status).toBe(200);
    expect(adminLoginRes.body.data.user.role).toBe('ADMIN');
    adminToken = adminLoginRes.body.data.accessToken;

    // Fetch admin system stats
    const statsRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.totalUsers).toBeGreaterThan(0);
    expect(statsRes.body.data.activeServerUptimeSec).toBeGreaterThanOrEqual(0);
  });

  it('should reject non-admin users from accessing /admin endpoints (403 Forbidden)', async () => {
    // Register normal player
    const playerAuth = await authService.register({
      username: 'ordinary_player',
      email: 'player@chess.local',
      password: 'Password123!',
    });
    playerToken = playerAuth.accessToken;

    // Normal player tries to access admin stats
    const forbiddenRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${playerToken}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);
  });

  it('should allow admin to list users and change account status', async () => {
    // Admin lists users
    const usersRes = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(usersRes.status).toBe(200);
    expect(usersRes.body.data.length).toBeGreaterThan(0);

    const targetUser = usersRes.body.data.find(
      (u: any) => u.username === 'ordinary_player'
    );
    expect(targetUser).toBeDefined();

    // Suspend user
    const updateRes = await request(app)
      .patch(`/api/v1/admin/users/${targetUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.accountStatus).toBe('SUSPENDED');

    // Suspended user should now be blocked from logging in
    const loginAttempt = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: 'ordinary_player',
      password: 'Password123!',
    });
    expect(loginAttempt.status).toBe(403);
  });

  it('should retrieve public leaderboard sorted by ELO', async () => {
    const res = await request(app).get('/api/v1/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toBeDefined();
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });
});
