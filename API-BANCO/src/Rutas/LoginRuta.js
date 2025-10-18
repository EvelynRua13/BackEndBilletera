import { Router } from 'express';
import { iniciarSesion } from '../controllers/loginController.js';

const router = Router();

// Ruta para iniciar sesión
router.post('/login', iniciarSesion);

export default router;
