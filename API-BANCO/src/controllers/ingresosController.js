import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

export const agregarIngreso = async (req, res) => {
  const { cuentaDestino, monto } = req.body || {};

  if (
    !cuentaDestino ||
    monto === undefined ||
    monto === null ||
    isNaN(monto) ||
    Number(monto) <= 0
  ) {
    return res.status(400).json({ message: 'Datos de ingreso inválidos.' });
  }

  let connection;
  try {
    connection = await getConnection();

    await connection.query('INSERT INTO ingresos (usuario_id, monto, fecha) VALUES (?, ?, ?)', [
      cuentaDestino,
      Number(monto),
      new Date(),
    ]);

    return res.status(200).json({ message: 'Ingreso registrado con éxito.' });
  } catch (error) {
    logger.error('Error al agregar el ingreso:', error.message);
    return res.status(500).json({ message: 'Error al procesar el ingreso.', error: error.message });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};
