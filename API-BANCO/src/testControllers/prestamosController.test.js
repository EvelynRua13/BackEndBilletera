import { jest } from '@jest/globals';

// Mocks y helper por prueba
const createMockConnection = () => ({
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
});

describe('prestamosController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Ensure modules are reloaded so mocks applied by jest.unstable_mockModule take effect
    jest.resetModules();
  });

  test('crearSolicitudPrestamo - datos inválidos devuelve 400', async () => {
    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => createMockConnection(),
    }));

    const { crearSolicitudPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { cuentaId: null, monto: 0, plazo: 0 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await crearSolicitudPrestamo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Datos de solicitud inválidos.' })
    );
  });

  test('crearSolicitudPrestamo - usuario con préstamo activo produce error (500) y rollback', async () => {
    const mockConnection = createMockConnection();
    // Implementación más robusta que responde según el SQL
    mockConnection.query.mockImplementation(async sql => {
      if (sql?.toString()?.includes('SELECT COUNT')) {
        return [[{ count: 1 }]]; // filas en primera posición
      }
      return [[]];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { crearSolicitudPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { cuentaId: 'ACC123', monto: 5000, plazo: 12 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await crearSolicitudPrestamo(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error al procesar la solicitud de préstamo.' })
    );
    // error.message debe contener la razón original
    expect(res.json.mock.calls[0][0].error).toEqual(
      expect.stringContaining('El usuario ya tiene un préstamo activo')
    );
  });

  test('crearSolicitudPrestamo - éxito devuelve 201 con prestamoId', async () => {
    const mockConnection = createMockConnection();
    // Implementación por SQL para este escenario
    mockConnection.query.mockImplementation(async sql => {
      const s = sql?.toString();
      if (s?.includes('SELECT COUNT')) return [[{ count: 0 }]];
      if (s?.includes('INSERT INTO deudas')) return [{ insertId: 55 }];
      if (s?.includes('UPDATE usuarios')) return [{}];
      return [[]];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { crearSolicitudPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { cuentaId: 'ACC123', monto: 2000, plazo: 6 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await crearSolicitudPrestamo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Solicitud de préstamo creada exitosamente.',
        prestamoId: 55,
      })
    );
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('actualizarEstadoPrestamo - datos faltantes devuelve 400', async () => {
    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => createMockConnection(),
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = { body: { prestamoId: null, nuevoEstado: null, usuarioId: null } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Datos incompletos para actualizar el préstamo.' })
    );
  });

  test('actualizarEstadoPrestamo - transición válida: éxito y commit', async () => {
    const mockConnection = createMockConnection();
    // Implementación por SQL para simular SELECT y siguientes queries
    mockConnection.query.mockImplementation(async sql => {
      const s = sql?.toString();
      if (s?.includes('SELECT estado')) return [[{ estado: 'pendiente', monto: 1000 }]];
      // cualquier UPDATE/INSERT siguiente devuelve estructura genérica
      if (s?.includes('UPDATE deudas') || s?.includes('INSERT INTO deudas')) return [{}];
      return [[]];
    });

    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: async () => mockConnection,
    }));

    const { actualizarEstadoPrestamo } = await import('../controllers/prestamosController.js');

    const req = {
      body: { prestamoId: 1, nuevoEstado: 'aceptado', usuarioId: 'ACC123', monto: 1000 },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await actualizarEstadoPrestamo(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: 'aceptado' }));
  });
});
