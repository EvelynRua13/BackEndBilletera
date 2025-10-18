import { jest } from '@jest/globals';

// Mock de la función getConnection antes de importar el módulo bajo prueba
await jest.unstable_mockModule('../database/database.js', () => ({
  getConnection: jest.fn(),
}));

const { getConnection } = await import('../database/database.js');
const { getUserData } = await import('../controllers/userController.js');

describe('getUserData', () => {
  // Silenciar logs para mantener la salida de tests limpia
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  let req, res, connection;

  beforeEach(() => {
    req = { user: { email: 'test@example.com' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    connection = {
      query: jest.fn(),
    };
    getConnection.mockResolvedValue(connection);
  });

  it('debe responder con los datos del usuario si existe', async () => {
    connection.query.mockResolvedValueOnce([
      [{ nombre: 'Test', numero_cuenta: '123', saldo: 100, tipo: 'ahorros' }],
    ]);
    await getUserData(req, res);
    expect(res.json).toHaveBeenCalledWith({
      nombre: 'Test',
      numero_cuenta: '123',
      saldo: 100,
      tipo: 'ahorros',
    });
  });

  it('debe responder 404 si el usuario no existe', async () => {
    connection.query.mockResolvedValueOnce([[]]);
    await getUserData(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
  });

  it('debe responder 500 si ocurre un error', async () => {
    getConnection.mockRejectedValueOnce(new Error('DB error'));
    await getUserData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });
  });
});
