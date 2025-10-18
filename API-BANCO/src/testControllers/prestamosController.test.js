import { jest } from '@jest/globals';

// Mocks y helper por prueba
const createMockConnection = () => ({
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
});

// Helper to extract SQL text safely from different possible shapes
function sqlToString(sql) {
  if (typeof sql === 'string') return sql;
  if (sql && typeof sql.sql === 'string') return sql.sql;
  if (sql && typeof sql.text === 'string') return sql.text;
  return JSON.stringify(sql || '');
}

// Create a responder for mockConnection.query from a map: key -> returnValue
function createSqlResponder(map, defaultValue = [[]]) {
  return async function (sql) {
    const s = sqlToString(sql);
    for (const key of Object.keys(map)) {
      if (s.includes(key)) return map[key];
    }
    return defaultValue;
  };
}

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
    mockConnection.query.mockImplementation(
      createSqlResponder({ 'SELECT COUNT': [[{ count: 1 }]] }, [[]])
    );

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
  mockConnection.query.mockImplementation(
    createSqlResponder(
      {
        'SELECT COUNT': [[{ count: 0 }]],
        'INSERT INTO deudas': [{ insertId: 55 }],
        'UPDATE usuarios': [{}],
      },
      [[]]
    )
  );

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
    mockConnection.query.mockImplementation(
      createSqlResponder(
        {
          'SELECT estado': [[{ estado: 'pendiente', monto: 1000 }]],
          'UPDATE deudas': [{}],
          'INSERT INTO deudas': [{}],
        },
        [[]]
      )
    );

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
