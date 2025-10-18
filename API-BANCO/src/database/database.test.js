import { jest } from '@jest/globals';

// Mockear mysql2/promise antes de importar el módulo
await jest.unstable_mockModule('mysql2/promise', () => {
  const mConnection = { query: jest.fn(), release: jest.fn() };
  // exportar como default porque el código hace `import mysql from 'mysql2/promise'`
  return {
    default: {
      createPool: jest.fn(() => ({
        getConnection: jest.fn(() => Promise.resolve(mConnection)),
      })),
    },
  };
});

const { getConnection } = await import('./database.js');

describe('getConnection', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  it('debe devolver una conexión simulada', async () => {
    const connection = await getConnection();
    expect(connection).toHaveProperty('query');
    expect(connection).toHaveProperty('release');
  });
});
