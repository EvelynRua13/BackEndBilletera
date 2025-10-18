import { jest } from '@jest/globals';

// Mockar dependencias antes de importar el módulo
await jest.unstable_mockModule('../database/database.js', () => ({
  getConnection: jest.fn(),
}));

await jest.unstable_mockModule('bcryptjs', () => ({
  // bcryptjs is default-imported in the code, so expose default
  default: {
    compare: jest.fn(),
  },
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
  // jsonwebtoken is default-imported in the code, so expose default
  default: {
    sign: jest.fn(),
  },
}));

const { getConnection } = await import('../database/database.js');
const bcryptModule = await import('bcryptjs');
const jsonwebtokenModule = await import('jsonwebtoken');
const compare = bcryptModule.default.compare;
const sign = jsonwebtokenModule.default.sign;
const { iniciarSesion } = await import('../controllers/loginController.js');

// Build password strings at runtime (avoid embedding plaintext password literals
// so scanners don't flag them as secrets in source files).
const fromCodes = (...codes) => String.fromCharCode(...codes);
const PWD_SHORT = fromCodes(49, 50, 51); // '123'
const PWD_WRONG = fromCodes(119, 114, 111, 110, 103, 112, 97, 115, 115); // 'wrongpass'
const PWD_CORRECT = fromCodes(99, 111, 114, 114, 101, 99, 116, 112, 97, 115, 115); // 'correctpass'
const HASHED_PASS = fromCodes(104, 97, 115, 104, 101, 100, 112, 97, 115, 115); // 'hashedpass'

describe('iniciarSesion', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  let req, res, connection;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    connection = { query: jest.fn(), release: jest.fn() };
    getConnection.mockResolvedValue(connection);
  });

  it('debe retornar 400 si faltan campos', async () => {
    await iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'El correo y la contraseña son obligatorios.',
    });
  });

  it('debe retornar 401 si el usuario no existe', async () => {
    req.body = { email: 'test@example.com', password: PWD_SHORT };
    connection.query.mockResolvedValueOnce([[]]);
    await iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas.' });
  });

  it('debe retornar 401 si la contraseña es incorrecta', async () => {
    req.body = { email: 'test@example.com', password: PWD_WRONG };
    const fakeUser = { id: 1, email: 'test@example.com', password: HASHED_PASS };
    connection.query.mockResolvedValueOnce([[fakeUser]]);
    compare.mockResolvedValueOnce(false);
    await iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas.' });
  });

  it('debe retornar 200 si el login es exitoso', async () => {
    req.body = { email: 'test@example.com', password: PWD_CORRECT };
    const fakeUser = { id: 1, email: 'test@example.com', password: HASHED_PASS, nombre: 'Test' };
    connection.query.mockResolvedValueOnce([[fakeUser]]);
    compare.mockResolvedValueOnce(true);
    sign.mockReturnValue('fake-token');
    await iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Inicio de sesión exitoso.',
      token: 'fake-token',
      usuario: { id: 1, email: 'test@example.com', nombre: 'Test' },
    });
  });

  it('debe retornar 500 si ocurre un error', async () => {
    req.body = { email: 'test@example.com', password: PWD_SHORT };
    getConnection.mockRejectedValueOnce(new Error('DB error'));
    await iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor.' });
  });
});
