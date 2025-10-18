import { jest } from '@jest/globals';

// mockConnection será creado por el mock del módulo
let mockConnection;

await jest.unstable_mockModule('../database/database.js', () => {
  mockConnection = {
    beginTransaction: jest.fn(),
    query: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  return {
    getConnection: jest.fn(() => Promise.resolve(mockConnection)),
  };
});

let realizarRetiro;
beforeAll(async () => {
  ({ realizarRetiro } = await import('../controllers/retirosController.js'));
});

describe('retirosController - realizarRetiro', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        cuentaOrigen: '12345',
        fecha: '2025-10-13',
        monto: 100,
      },
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  it('debe realizar el retiro exitosamente', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ saldo: 200 }]]) // saldo suficiente
      .mockResolvedValueOnce({}) // insert transacción
      .mockResolvedValueOnce({}); // update saldo

    await realizarRetiro(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transacción realizada con éxito.' });
  });

  it('debe devolver error si faltan datos', async () => {
    req.body = { cuentaOrigen: '', fecha: '', monto: 0 };
    await realizarRetiro(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Datos de transacción inválidos.' });
  });

  it('debe devolver error si la cuenta no existe', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]); // cuenta no encontrada
    await realizarRetiro(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error al procesar la transacción.' })
    );
  });

  it('debe devolver error si fondos insuficientes', async () => {
    mockConnection.query.mockResolvedValueOnce([[{ saldo: 50 }]]); // saldo insuficiente
    await realizarRetiro(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error al procesar la transacción.' })
    );
  });
});
