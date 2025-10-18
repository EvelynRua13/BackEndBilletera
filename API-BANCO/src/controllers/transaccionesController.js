import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

export const realizarTransaccion = async (req, res) => {
  const { cuentaOrigen, fecha, cuentaDestino, monto } = req.body || {};

  if (
    !fecha ||
    !cuentaOrigen ||
    !cuentaDestino ||
    monto === undefined ||
    monto === null ||
    isNaN(monto) ||
    Number(monto) <= 0
  ) {
    return res.status(400).json({ message: 'Datos de transacción inválidos.' });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [origenData] = await connection.query(
      'SELECT saldo FROM usuarios WHERE numero_cuenta = ?',
      [cuentaOrigen]
    );
    if (origenData.length === 0) {
      throw new Error('Cuenta de origen no encontrada.');
    }

    const saldoOrigen = origenData[0].saldo;
    if (saldoOrigen < Number(monto)) {
      throw new Error('Fondos insuficientes en la cuenta origen.');
    }

    await connection.query(
      'INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, ?, ?, ?)',
      [cuentaDestino, 'transferencia', Number(monto), new Date()]
    );
    await connection.query('UPDATE usuarios SET saldo = saldo - ? WHERE numero_cuenta = ?', [
      Number(monto),
      cuentaOrigen,
    ]);
    await connection.query('UPDATE usuarios SET saldo = saldo + ? WHERE numero_cuenta = ?', [
      Number(monto),
      cuentaDestino,
    ]);

    await connection.commit();
    return res.status(200).json({ message: 'Transacción realizada con éxito.' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        /* ignore */
      }
    }
    logger.error('Error al realizar la transacción:', error.message || error);
    return res
      .status(500)
      .json({ message: 'Error al procesar la transacción.', error: error.message || error });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};
