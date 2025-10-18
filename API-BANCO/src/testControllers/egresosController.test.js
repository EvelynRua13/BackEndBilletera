import { jest } from '@jest/globals';

const createMockConnection = () => ({
    query: jest.fn(),
    release: jest.fn(),
});

describe('egresosController - agregarEgreso', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
    });

    test('datos inválidos devuelve 400', async () => {
        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => createMockConnection()
        }));

        const { agregarEgreso } = await import('../controllers/egresosController.js');

        const req = { body: { cuentaOrigen: '', monto: 0 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarEgreso(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Datos de egreso inválidos.' });
    });

    test('error en la BD devuelve 500 y mensaje apropiado', async () => {
        const mockConnection = createMockConnection();
        mockConnection.query.mockRejectedValueOnce(new Error('DB failure'));

        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => mockConnection
        }));

        const { agregarEgreso } = await import('../controllers/egresosController.js');

        const req = { body: { cuentaOrigen: 'ACC100', monto: 75 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarEgreso(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error al procesar el egreso.' }));
        expect(mockConnection.release).toHaveBeenCalled();
    });

    test('registro exitoso devuelve 200', async () => {
        const mockConnection = createMockConnection();
        mockConnection.query.mockResolvedValueOnce([{}]);

        await jest.unstable_mockModule('../database/database.js', () => ({
            getConnection: async () => mockConnection
        }));

        const { agregarEgreso } = await import('../controllers/egresosController.js');

        const req = { body: { cuentaOrigen: 'ACC100', monto: 80 } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

        await agregarEgreso(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Egreso registrado con éxito.' });
        expect(mockConnection.release).toHaveBeenCalled();
    });
});
