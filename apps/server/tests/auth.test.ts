import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { authService } from '../src/modules/auth/auth.service';

describe('Phase 3 - Authentication & Users API', () => {
  const app = createApp();
  const testUser = {
    username: 'chess_grandmaster',
    email: 'gm@chess.local',
    password: 'SecurePassword123!',
  };
  let accessToken: string = '';
  let verificationCode: string = '';

  beforeAll(async () => {
    await authService.seedAdminUser();
  });

  it('POST /auth/register should register a new player requiring verification', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.eloRating).toBe(1200);
    expect(res.body.data.user.role).toBe('PLAYER');
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.verificationRequired).toBe(true);

    verificationCode = res.body.data.verificationCode;
  });

  it('POST /auth/login should block login if email is not verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.username,
        password: testUser.password,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('chưa được xác minh');
  });

  it('POST /auth/verify-email should reject wrong verification code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        email: testUser.email,
        code: '999999',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/verify-email should verify email and grant accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        email: testUser.email,
        code: verificationCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isEmailVerified).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    accessToken = res.body.data.accessToken;
  });

  it('POST /auth/resend-verification should reject if already verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({
        email: testUser.email,
      });

    expect(res.status).toBe(400);
  });

  it('POST /auth/register should reject duplicate username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: testUser.username,
        email: 'other@chess.local',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'other_username',
        email: testUser.email,
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/register should reject invalid email format with Zod validation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'valid_user',
        email: 'invalid-email-format',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/register should reject password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'valid_user',
        email: 'valid@chess.local',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/login should authenticate by username when verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.username,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /auth/login should authenticate by email when verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUser.username);
  });

  it('POST /auth/login should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.username,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/google should authenticate and register/login with Google token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        credential: 'mock-google-token:master_google@gmail.com:Google Master:https://api.dicebear.com/7.x/bottts/svg?seed=gm',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('master_google@gmail.com');
    expect(res.body.data.user.displayName).toBe('Google Master');
    expect(res.body.data.user.isEmailVerified).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('GET /auth/me should return current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe(testUser.username);
    expect(res.body.data.isEmailVerified).toBe(true);
  });

  it('GET /auth/me should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /users/me should update user profile (displayName, bio, avatarUrl)', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        displayName: 'Đại Kiện Tướng VN',
        bio: 'Đam mê cờ vua đỉnh cao',
        avatarUrl: 'https://images.unsplash.com/photo-chess',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Đại Kiện Tướng VN');
    expect(res.body.data.bio).toBe('Đam mê cờ vua đỉnh cao');
    expect(res.body.data.avatarUrl).toBe('https://images.unsplash.com/photo-chess');
  });

  it('GET /users/:id/stats should return player statistics', async () => {
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    const userId = meRes.body.data.id;
    const res = await request(app).get(`/api/v1/users/${userId}/stats`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eloRating).toBe(1200);
  });
});
