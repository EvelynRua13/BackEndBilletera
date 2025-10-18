import request from 'supertest';
import app from '../app.js';

describe('security headers', () => {
  test('should not expose X-Powered-By header', async () => {
    const res = await request(app).get('/');
    // Header keys are lower-cased in Node
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });
});
