import express from 'express';
import { getUserData } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddlewar.js';

const router = express.Router();

router.get('/user', authenticateToken, getUserData);

export default router;
