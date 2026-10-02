// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server';

describe('Server API', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/auth/me should return authentication status', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });
});
