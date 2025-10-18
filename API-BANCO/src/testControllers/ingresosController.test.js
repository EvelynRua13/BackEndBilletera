import { jest } from '@jest/globals';

// Helper para crear mockConnection
const createMockConnection = () => ({
    query: jest.fn(),
    release: jest.fn(),
});

describe('ingresosController - agregarIngreso', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    });

    test('datos inválidos devuelve 400', async () => {
        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => createMockConnection()
        }));

        const { agregarIngreso } = await import('../controllers/ingresosController.js');

        const req = { body: { cuentaDestino: '', monto: 0 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarIngreso(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Datos de ingreso inválidos.' });
    });

    test('error en la BD devuelve 500 y mensaje apropiado', async () => {
        const mockConnection = createMockConnection();
        mockConnection.query.mockRejectedValueOnce(new Error('DB failure'));

        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => mockConnection
        }));

        const { agregarIngreso } = await import('../controllers/ingresosController.js');

        const req = { body: { cuentaDestino: 'ACC200', monto: 100 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarIngreso(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error al procesar el ingreso.' }));
        expect(mockConnection.release).toHaveBeenCalled();
    });

    test('registro exitoso devuelve 200', async () => {
        const mockConnection = createMockConnection();
        mockConnection.query.mockResolvedValueOnce([{}]);

        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => mockConnection
        }));

        const { agregarIngreso } = await import('../controllers/ingresosController.js');

        const req = { body: { cuentaDestino: 'ACC200', monto: 150 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarIngreso(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Ingreso registrado con éxito.' });
        expect(mockConnection.release).toHaveBeenCalled();
    });
});
