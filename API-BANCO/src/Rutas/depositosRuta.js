import { Router } from 'express';
import { realizarDeposito } from '../controllers/depositosController.js';

const router = Router();

// Ruta para depositos
router.post('/depositos', realizarDeposito);

export default router;
