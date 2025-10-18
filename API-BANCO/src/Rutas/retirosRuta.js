import { Router } from 'express';
import { realizarRetiro } from '../controllers/retirosController.js';

const router = Router();

// Ruta para realizar retiros
router.post('/retiros', realizarRetiro);

export default router;
