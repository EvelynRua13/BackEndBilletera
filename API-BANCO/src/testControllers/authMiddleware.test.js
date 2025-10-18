import { jest } from '@jest/globals';

describe('authenticateToken middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  test('sin token en headers devuelve 401', async () => {
    jest.unstable_mockModule('jsonwebtoken', () => ({
      default: { verify: jest.fn() },
    }));

    const { authenticateToken } = await import('../middlewares/authMiddlewar.js');

    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token de autenticación faltante' });
    expect(next).not.toHaveBeenCalled();
  });

  test('token inválido devuelve 403', async () => {
    // Mock de jsonwebtoken.verify para simular error
    jest.unstable_mockModule('jsonwebtoken', () => ({
      default: { verify: (token, secret, cb) => cb(new Error('invalid token')) },
    }));

    const { authenticateToken } = await import('../middlewares/authMiddlewar.js');

    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token no válido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('token válido llama a next y setea req.user', async () => {
    const decoded = { id: 42, email: 'a@b.com' };
    jest.unstable_mockModule('jsonwebtoken', () => ({
      default: { verify: (token, secret, cb) => cb(null, decoded) },
    }));

    const { authenticateToken } = await import('../middlewares/authMiddlewar.js');

    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: decoded.id, email: decoded.email });
  });
});
