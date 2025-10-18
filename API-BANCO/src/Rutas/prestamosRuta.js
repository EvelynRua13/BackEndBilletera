import { Router } from 'express';
import { crearSolicitudPrestamo} from '../controllers/prestamosController.js';

const router = Router();

// Ruta para ingresos
router.post('/prestamos', crearSolicitudPrestamo);

export default router;