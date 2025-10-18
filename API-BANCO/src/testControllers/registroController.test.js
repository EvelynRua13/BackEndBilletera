import { jest } from '@jest/globals';

let mockConnection;

// Mockear la capa de BD
await jest.unstable_mockModule('../database/database.js', () => {
  mockConnection = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    getConnection: jest.fn(() => Promise.resolve(mockConnection)),
  };
});

// Mockear bcryptjs (default export)
await jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
  },
}));

const db = await import('../database/database.js');
const bcryptModule = await import('bcryptjs');
const hash = bcryptModule.default.hash;
const { registrarUsuario } = await import('../controllers/registroController.js');

describe('registrarUsuario', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  it('debe devolver 400 si faltan campos', async () => {
    req.body = { nombre: '', email: '', password: '' };
    await registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Todos los campos son obligatorios.' });
  });

  it('debe devolver 400 si el correo o numero de cuenta ya existen', async () => {
    req.body = { nombre: 'A', email: 'a@a.com', password: '123', numero_cuenta: '100', tipo: 'ahorros' };
    // Simular SELECT que devuelve filas existentes
    mockConnection.query.mockResolvedValueOnce([[{ id: 1 }]]);
    await registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'El correo o el número de cuenta ya están registrados.' });
  });

  it('debe crear el usuario y devolver 201 en caso exitoso', async () => {
    req.body = { nombre: 'Ana', email: 'ana@example.com', password: '123456', numero_cuenta: '1000000001', tipo: 'ahorros' };
    // SELECT no encuentra nada
    mockConnection.query.mockResolvedValueOnce([[]]);
    // hash la contraseña
    hash.mockResolvedValueOnce('hashedpw');
    // INSERT devuelve resultado
    mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]);

    await registrarUsuario(req, res);

    expect(hash).toHaveBeenCalledWith('123456', 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario registrado con éxito.' });
  });

  it('debe devolver 500 si ocurre un error', async () => {
    req.body = { nombre: 'Ana', email: 'ana@example.com', password: '123456', numero_cuenta: '1000000001', tipo: 'ahorros' };
    db.getConnection.mockRejectedValueOnce(new Error('DB error'));
    await registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor.' });
  });
});
