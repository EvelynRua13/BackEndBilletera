import logger from '../utils/logger.js';
import { runInTransaction, ensureSufficientFunds, insertTransactionRecord, changeBalance } from '../utils/transactionService.js';

export const realizarTransaccion = async (req, res) => {
  const { cuentaOrigen, fecha, cuentaDestino, monto } = req.body || {};

  if (!fecha || !cuentaOrigen || !cuentaDestino || monto === undefined || monto === null || Number.isNaN(Number(monto)) || Number(monto) <= 0) {
    return res.status(400).json({ message: 'Datos de transacción inválidos.' });
  }

  try {
    await runInTransaction(async (connection) => {
      await ensureSufficientFunds(connection, cuentaOrigen, monto);
      await insertTransactionRecord(connection, cuentaDestino, 'transferencia', monto, new Date());
      await changeBalance(connection, cuentaOrigen, -Number(monto));
      await changeBalance(connection, cuentaDestino, Number(monto));
    });

    return res.status(200).json({ message: 'Transacción realizada con éxito.' });
  } catch (error) {
    logger.error('Error al realizar la transacción:', error.message || error);
    return res
      .status(500)
      .json({ message: 'Error al procesar la transacción.', error: error.message || error });
  }
};
