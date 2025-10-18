import { jest } from '@jest/globals';
import request from 'supertest';

describe('CORS origins', () => {
  beforeEach(() => {
    // clear module cache so app picks up env changes
    jest.resetModules();
  });

  test('allows requests from allowed origin', async () => {
    process.env.CORS_ORIGINS = 'http://allowed.example.com';
    const { default: app } = await import('../app.js');
    const res = await request(app).get('/').set('Origin', 'http://allowed.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('http://allowed.example.com');
  });

  test('blocks requests from other origins', async () => {
    process.env.CORS_ORIGINS = 'http://allowed.example.com';
    const { default: app } = await import('../app.js');
    const res = await request(app).get('/').set('Origin', 'http://evil.example.com');
    // When CORS rejects, header may be undefined
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
