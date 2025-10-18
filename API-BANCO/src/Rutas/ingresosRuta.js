import { Router } from 'express';
import { agregarIngreso } from '../controllers/ingresosController.js';

const router = Router();

// Ruta para ingresos
router.post('/ingresos', agregarIngreso);

export default router;