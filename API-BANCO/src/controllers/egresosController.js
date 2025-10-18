import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

export const agregarEgreso = async (req, res) => {
  const { cuentaOrigen, monto } = req.body || {};

  // Validación básica
  if (
    !cuentaOrigen ||
    monto === undefined ||
    monto === null ||
    Number.isNaN(Number(monto)) ||
    Number(monto) <= 0
  ) {
    return res.status(400).json({ message: 'Datos de egreso inválidos.' });
  }

  let connection;
  try {
    connection = await getConnection();

    await connection.query('INSERT INTO egresos (usuario_id, monto, fecha) VALUES (?, ?, ?)', [
      cuentaOrigen,
      Number(monto),
      new Date(),
    ]);

    return res.status(200).json({ message: 'Egreso registrado con éxito.' });
  } catch (error) {
    logger.error('Error al agregar el egreso:', error.message);
    return res.status(500).json({ message: 'Error al procesar el egreso.', error: error.message });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};
