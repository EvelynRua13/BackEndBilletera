import { Router } from 'express';
import { agregarEgreso } from '../controllers/egresosController.js';

const router = Router();

// Ruta para ingresos
router.post('/egresos', agregarEgreso);

export default router;
