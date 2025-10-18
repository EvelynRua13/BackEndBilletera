import jwt from 'jsonwebtoken';
import config from '../config.js';
import logger from '../utils/logger.js';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  logger.info('Cabeceras de la solicitud:', req.headers); // Log de las cabeceras

  if (!token) {
    logger.error('Token de autenticación faltante');
    return res.status(401).json({ message: 'Token de autenticación faltante' });
  }

  logger.info('Token recibido:', token); // Log del token recibido

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      logger.error('Error de verificación del token:', err); // Log del error
      return res.status(403).json({ message: 'Token no válido' });
    }

    logger.info('Token decodificado:', decoded); // Log de los datos decodificados

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  });
};
