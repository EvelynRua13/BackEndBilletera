import { jest } from '@jest/globals';

const createMockConnection = () => ({
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
});

describe('prestamosController - extra cases', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  test('actualizarEstadoPrestamo - préstamo no encontrado devuelve 404 y rollback', async () => {
    const mockConnection = createMockConnection();
    mockConnection.query.mockImplementation(async sql => {
      const s = typeof sql === 'string' ? sql : (sql?.sql ?? sql?.text ?? '');
      if (s.includes('SELECT estado')) return [[]]; // simula sin filas
      return [[]];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { prestamoId: 999, nuevoEstado: 'aceptado', usuarioId: 'ACC999' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Préstamo no encontrado.' })
    );
  });

  test('actualizarEstadoPrestamo - préstamo ya procesado devuelve 400 y rollback', async () => {
    const mockConnection = createMockConnection();
    mockConnection.query.mockImplementation(async sql => {
      const s = typeof sql === 'string' ? sql : (sql?.sql ?? sql?.text ?? '');
      if (s.includes('SELECT estado')) return [[{ estado: 'aceptado' }]];
      return [{}];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { prestamoId: 1, nuevoEstado: 'rechazado', usuarioId: 'ACC123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No se puede modificar un préstamo ya procesado.' })
    );
  });

  test('crearSolicitudPrestamo - fallo en INSERT provoca rollback y 500', async () => {
    const mockConnection = createMockConnection();
    mockConnection.query.mockImplementation(async sql => {
      const s = typeof sql === 'string' ? sql : (sql?.sql ?? sql?.text ?? '');
      if (s.includes('SELECT COUNT')) return [[{ count: 0 }]];
      if (s.includes('INSERT INTO deudas')) throw new Error('DB insert error');
      return [{}];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { crearSolicitudPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { cuentaId: 'ACC321', monto: 1500, plazo: 3 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await crearSolicitudPrestamo(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toEqual(
      expect.objectContaining({ message: 'Error al procesar la solicitud de préstamo.' })
    );
    expect(res.json.mock.calls[0][0].error).toEqual(expect.stringContaining('DB insert error'));
  });

  test('actualizarEstadoPrestamo - estado inválido devuelve 400', async () => {
    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => createMockConnection(),
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { prestamoId: 1, nuevoEstado: 'invalid_state', usuarioId: 'ACC1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Estado de préstamo inválido.' })
    );
  });

  test('actualizarEstadoPrestamo - error durante consulta provoca rollback y 500', async () => {
    const mockConnection = createMockConnection();
    mockConnection.query.mockImplementation(async sql => {
      // incluir el SQL en el mensaje de error para reutilizar el parámetro y facilitar debugging
      // Evitar coerción implícita de objetos a cadena (String(sql)) para cumplir reglas de calidad.
      const sqlText = typeof sql === 'string' ? sql : (sql?.sql ?? sql?.text ?? JSON.stringify(sql));
      throw new Error(`DB unexpected error: ${sqlText}`);
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { prestamoId: 2, nuevoEstado: 'aceptado', usuarioId: 'ACC2' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error al procesar la actualización.' })
    );
  });
});
