import { Router } from 'express';
import { realizarTransaccion } from '../controllers/transaccionesController.js';

const router = Router();

// Ruta para registrar transacciones
router.post('/transacciones', realizarTransaccion);

export default router;
