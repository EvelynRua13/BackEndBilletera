import { jest } from '@jest/globals';

let mockConnection;

jest.unstable_mockModule('../database/database.js', () => {
  mockConnection = {
    beginTransaction: jest.fn(),
    query: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  return { getConnection: jest.fn(() => Promise.resolve(mockConnection)) };
});

let realizarDeposito;
beforeAll(async () => {
  ({ realizarDeposito } = await import('../controllers/depositosController.js'));
});

describe('realizarDeposito', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { cuentaDestino: '200', fecha: '2025-10-13', monto: 100 } };
    res = { status: jest.fn(() => res), json: jest.fn() };
  });

  it('debe retornar 400 para datos inválidos', async () => {
    req.body = { cuentaDestino: '', fecha: '', monto: 0 };
    await realizarDeposito(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Datos de depósito inválidos.' });
  });

  it('debe retornar 500 para manejar cuenta destino no encontrada', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]);
    await realizarDeposito(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('debe devolver 200 al realizar depósito exitosamente', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ saldo: 0 }]]) // select destino
      .mockResolvedValueOnce({}) // insert transaccion
      .mockResolvedValueOnce({}); // update saldo

    await realizarDeposito(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Depósito realizado con éxito.' });
  });

  it('debe retornar 500 si hay error en BD', async () => {
    mockConnection.query.mockRejectedValueOnce(new Error('DB error'));
    await realizarDeposito(req, res);
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('debe manejar error durante rollback y registrar el error', async () => {
    // Simula error primario en query y fallo en rollback
    mockConnection.query.mockRejectedValueOnce(new Error('DB error'));
    mockConnection.rollback.mockRejectedValueOnce(new Error('rollback failed'));

    await realizarDeposito(req, res);

    // Asegurar que intentó rollback incluso si rollback falló
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
