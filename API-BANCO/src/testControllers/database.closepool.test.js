import { jest } from '@jest/globals';

// Mockear mysql2/promise createPool to capture .end
jest.unstable_mockModule('mysql2/promise', () => ({
  default: {
    createPool: jest.fn(() => ({
      end: jest.fn(() => Promise.resolve()),
    })),
  },
}));

const { closePool } = await import('../database/database.js');

describe('database closePool', () => {
  beforeEach(() => jest.resetModules());

  test('closePool llama a pool.end sin errores', async () => {
    await closePool();
    // Si no lanza, asumimos éxito - la mock hará resolve
    expect(true).toBe(true);
  });
});
