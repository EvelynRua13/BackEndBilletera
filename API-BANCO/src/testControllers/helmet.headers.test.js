import request from 'supertest';
import app from '../app.js';

describe('helmet headers', () => {
  test('sets common security headers via Helmet (presence checks)', async () => {
    const res = await request(app).get('/');

    // Node lower-cases header names
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-content-type-options');
    // Optional: some Helmet configs set 'x-download-options'
    // but presence is enough for coverage and safety checks
    expect(res.headers).toHaveProperty('x-download-options');
  });
});
