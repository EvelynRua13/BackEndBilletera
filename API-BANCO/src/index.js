import app from './app.js';
import logger from './utils/logger.js';

//Funcion main
const main = () => {
  app.listen(app.get('port'));
  logger.info('El puerto es el: ', app.get('port'));
};

main();
