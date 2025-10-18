import { getConnection } from '../database/database.js';

export const realizarDeposito = async (req, res) => {
    const { cuentaDestino, fecha, monto } = req.body || {};

    // Validación básica
    if (!fecha || !cuentaDestino || monto === undefined || monto === null || isNaN(monto) || Number(monto) <= 0) {
        return res.status(400).json({ message: 'Datos de depósito inválidos.' });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Verificar si la cuenta destino existe
        const [destinoRows] = await connection.query(
            'SELECT saldo FROM usuarios WHERE numero_cuenta = ?',
            [cuentaDestino]
        );

        if (!Array.isArray(destinoRows) || destinoRows.length === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Cuenta de destino no encontrada.' });
        }

        // Insertar la transacción
        await connection.query(
            'INSERT INTO Transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, ?, ?, ?)',
            [cuentaDestino, 'deposito', Number(monto), new Date()]
        );

        // Actualizar saldo de la cuenta destino
        await connection.query(
            'UPDATE usuarios SET saldo = saldo + ? WHERE numero_cuenta = ?',
            [Number(monto), cuentaDestino]
        );

        await connection.commit();
        return res.status(200).json({ message: 'Depósito realizado con éxito.' });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (e) {
                // ignorar error en rollback
            }
        }
        return res.status(500).json({ message: 'Error al procesar el depósito.' });
    } finally {
        if (connection && typeof connection.release === 'function') connection.release();
    }
};