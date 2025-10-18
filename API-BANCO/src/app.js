import express from 'express';
import cors from 'cors';
import RegistrarRuta from './Rutas/RegistrarRuta.js';
import LoginRuta from './Rutas/LoginRuta.js';
import userRoutes from './Rutas/userRoutes.js';
import transaccionesRuta from './Rutas/transaccionesRuta.js';
import ingresosRuta from './Rutas/ingresosRuta.js';
import egresosRuta from './Rutas/egresosRuta.js';
import retirosRuta from './Rutas/retirosRuta.js';
import realizarDeposito from './Rutas/depositosRuta.js';
import crearSolicitudPrestamo from './Rutas/prestamosRuta.js';
import { getConnection } from './database/database.js';
import logger from './utils/logger.js';

import dotenv from 'dotenv';
dotenv.config();

// Prueba de conexión a MySQL
getConnection()
  .then(conn => {
    logger.info('Conexión a MySQL exitosa');
    conn.release();
  })
  .catch(err => {
    logger.error('Error de conexión a MySQL:', err);
  });

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Bienvenido al API del Banco');
});

app.use('/api', RegistrarRuta);
app.use('/api', LoginRuta);
app.use('/api', userRoutes);
app.use('/api', transaccionesRuta);
app.use('/api', ingresosRuta);
app.use('/api', egresosRuta);
app.use('/api', retirosRuta);
app.use('/api', realizarDeposito);
app.use('/api', crearSolicitudPrestamo);

app.set('port', process.env.PORT || 3000);

export default app;
