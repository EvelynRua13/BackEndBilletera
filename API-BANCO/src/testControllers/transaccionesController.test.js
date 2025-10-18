import { jest } from '@jest/globals';

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

let realizarTransaccion;
beforeAll(async () => {
  ({ realizarTransaccion } = await import('../controllers/transaccionesController.js'));
});

describe('realizarTransaccion', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { cuentaOrigen: '100', fecha: '2025-10-13', cuentaDestino: '200', monto: 50 } };
    res = { status: jest.fn(() => res), json: jest.fn() };
    // reset mock methods
    mockConnection.beginTransaction = jest.fn();
    mockConnection.query = jest.fn();
    mockConnection.commit = jest.fn();
    mockConnection.rollback = jest.fn();
    mockConnection.release = jest.fn();
    jest.clearAllMocks();
  });

  it('debe retornar 400 para datos inválidos', async () => {
    req.body = { fecha: '', cuentaDestino: '', monto: 0 };
    await realizarTransaccion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Datos de transacción inválidos.' });
  });

  it('debe devolver 500 si la cuenta origen no encontrada', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]); // select saldo devuelve vacío
    await realizarTransaccion(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error al procesar la transacción.' }));
  });

  it('Retornar 500 para manejar fondos insuficientes', async () => {
    mockConnection.query.mockResolvedValueOnce([[{ saldo: 10 }]]); // saldo insuficiente
    await realizarTransaccion(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('debe devolver 200 al realizar la transacción exitosamente', async () => {
    // select origen
    mockConnection.query
      .mockResolvedValueOnce([[{ saldo: 100 }]])
      .mockResolvedValueOnce({}) // insert transaccion
      .mockResolvedValueOnce({}) // update origen
      .mockResolvedValueOnce({}); // update destino

    await realizarTransaccion(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transacción realizada con éxito.' });
  });

  it('debe retornar 500 si hay error en BD', async () => {
    mockConnection.query.mockRejectedValueOnce(new Error('DB error'));
    await realizarTransaccion(req, res);
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
