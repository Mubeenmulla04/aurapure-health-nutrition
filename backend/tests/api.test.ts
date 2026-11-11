import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AuraPure API Integration Tests', () => {
  const app = createApp();

  it('GET /health should return 200 OK with server health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('GET /api/v1 should return 200 with platform index', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('1.0.0');
  });

  it('GET non-existent endpoint should return 404 ROUTE_NOT_FOUND', async () => {
    const res = await request(app).get('/api/v1/invalid-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('POST /api/v1/auth/register should fail validation when fields are missing', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'invalid-email',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
