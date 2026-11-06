import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Server Foundation & Health Check', () => {
  const app = createApp();

  it('GET /health should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('online-chess-server');
  });

  it('GET /api/v1/health should return 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/info should return API endpoints documentation', async () => {
    const res = await request(app).get('/api/v1/info');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Online Chess API');
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints.auth).toBe('/api/v1/auth');
  });

  it('GET /non-existent-route should return 404 AppError', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
