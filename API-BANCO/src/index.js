import app from './app.js';
import logger from './utils/logger.js';
import { getConnection } from './database/database.js';

//Funcion main
const main = async () => {
  // Prueba de conexión a MySQL antes de iniciar el servidor
  try {
    const conn = await getConnection();
    logger.info('Conexión a MySQL exitosa');
    conn.release();
  } catch (err) {
    logger.error('Error de conexión a MySQL:', err);
    // Si no hay conexión a la BD, propagar el error para evitar terminar bruscamente
    throw err;
  }

  app.listen(app.get('port'));
  logger.info('El puerto es el: ', app.get('port'));
};

main();
