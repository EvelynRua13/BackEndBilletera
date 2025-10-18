import { Router } from 'express';
import { registrarUsuario } from '../controllers/registroController.js';

const router = Router();

// Ruta para registrar usuarios
router.post('/usuarios', registrarUsuario);

export default router;
