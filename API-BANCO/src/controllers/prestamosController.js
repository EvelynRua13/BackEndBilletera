import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

// Constantes para los estados de préstamo
const ESTADO_PRESTAMO = {
  PENDIENTE: 'pendiente',
  ACEPTADO: 'aceptado',
  RECHAZADO: 'rechazado',
};

// Función para actualizar el estado del préstamo
export const actualizarEstadoPrestamo = async (req, res) => {
  logger.info('Datos de actualización de préstamo recibidos:', req.body);

  const { prestamoId, nuevoEstado, usuarioId } = req.body || {};

  if (!prestamoId || !nuevoEstado || !usuarioId) {
    return res.status(400).json({ message: 'Datos incompletos para actualizar el préstamo.' });
  }

  if (!Object.values(ESTADO_PRESTAMO).includes(nuevoEstado)) {
    return res.status(400).json({ message: 'Estado de préstamo inválido.' });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [prestamoActual] = await connection.query(
      'SELECT estado FROM deudas WHERE id = ? AND cuenta_id = ?',
      [prestamoId, usuarioId]
    );

    if (prestamoActual.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Préstamo no encontrado.' });
    }

    const estadoActual = prestamoActual[0].estado;
    if (estadoActual === ESTADO_PRESTAMO.ACEPTADO || estadoActual === ESTADO_PRESTAMO.RECHAZADO) {
      await connection.rollback();
      return res.status(400).json({ message: 'No se puede modificar un préstamo ya procesado.' });
    }

    await connection.query(
      'UPDATE deudas SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [nuevoEstado, prestamoId]
    );

    await connection.commit();
    return res
      .status(200)
      .json({ message: `Préstamo ${nuevoEstado} exitosamente.`, estado: nuevoEstado });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Error al actualizar estado de préstamo:', error.message);
    return res.status(500).json({ message: 'Error al procesar la actualización.' });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};

// Función para crear una solicitud de préstamo
export const crearSolicitudPrestamo = async (req, res) => {
  logger.info('Datos de solicitud de préstamo recibidos:', req.body);

  const { cuentaId, monto, plazo } = req.body;

  // Validar datos de entrada
  if (!cuentaId || !monto || !plazo || isNaN(monto) || monto <= 0) {
    return res.status(400).json({
      message: 'Datos de solicitud inválidos.',
    });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [prestamosActivos] = await connection.query(
      'SELECT COUNT(*) as count FROM deudas WHERE cuenta_id = ? AND estado IN (?, ?)',
      [cuentaId, ESTADO_PRESTAMO.PENDIENTE, ESTADO_PRESTAMO.ACEPTADO]
    );

    if (prestamosActivos[0].count > 0) {
      throw new Error('El usuario ya tiene un préstamo activo o pendiente.');
    }

    const [resultado] = await connection.query(
      'INSERT INTO deudas (cuenta_id, monto, estado, plazo) VALUES (?, ?, ?, ?)',
      [cuentaId, Number(monto), ESTADO_PRESTAMO.PENDIENTE, Number(plazo)]
    );

    await connection.query('UPDATE usuarios SET saldo = saldo + ? WHERE numero_cuenta = ?', [
      Number(monto),
      cuentaId,
    ]);

    await connection.commit();
    return res
      .status(201)
      .json({
        message: 'Solicitud de préstamo creada exitosamente.',
        prestamoId: resultado.insertId,
      });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Error al crear la solicitud de préstamo:', error.message);
    return res
      .status(500)
      .json({ message: 'Error al procesar la solicitud de préstamo.', error: error.message });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};
