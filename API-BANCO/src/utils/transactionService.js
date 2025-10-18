import { getConnection } from '../database/database.js';
import logger from './logger.js';

export async function runInTransaction(handler) {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        logger.warn('Error during rollback:', e.message || e);
      }
    }
    // rethrow so callers can respond appropriately
    throw error;
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
}

export async function ensureSufficientFunds(connection, cuentaOrigen, monto) {
  const [rows] = await connection.query(
    'SELECT saldo FROM usuarios WHERE numero_cuenta = ?',
    [cuentaOrigen]
  );
  if (!rows || rows.length === 0) {
    throw new Error('Cuenta de origen no encontrada.');
  }
  const saldo = rows[0].saldo;
  if (saldo < Number(monto)) {
    throw new Error('Fondos insuficientes en la cuenta origen.');
  }
  return saldo;
}

export async function insertTransactionRecord(connection, cuentaId, tipo, monto, fecha) {
  await connection.query(
    'INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, ?, ?, ?)',
    [cuentaId, tipo, Number(monto), fecha]
  );
}

export async function changeBalance(connection, cuentaNumero, delta) {
  await connection.query('UPDATE usuarios SET saldo = saldo + ? WHERE numero_cuenta = ?', [
    Number(delta),
    cuentaNumero,
  ]);
}
