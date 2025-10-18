import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RegistrarRuta from './Rutas/RegistrarRuta.js';
import LoginRuta from './Rutas/LoginRuta.js';
import userRoutes from './Rutas/userRoutes.js';
import transaccionesRuta from './Rutas/transaccionesRuta.js';
import ingresosRuta from './Rutas/ingresosRuta.js';
import egresosRuta from './Rutas/egresosRuta.js';
import retirosRuta from './Rutas/retirosRuta.js';
import realizarDeposito from './Rutas/depositosRuta.js';
import crearSolicitudPrestamo from './Rutas/prestamosRuta.js';
// Note: DB connection check and logger usage moved to index.js to avoid side-effects on import

import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Security: hide implementation details and add common security headers
app.disable('x-powered-by');
app.use(helmet());

// CORS: allowed origins from environment variable (comma separated). If not set, allow all.
const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()) : [];
const corsOptions = allowedOrigins.length
  ? { origin: (origin, callback) => (allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))) }
  : {};

app.use(express.json());
app.use(cors(corsOptions));

// Rate limiter: limit repeated requests to public APIs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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
