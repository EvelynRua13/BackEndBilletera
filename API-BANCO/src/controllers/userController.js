import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

export const getUserData = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const userEmail = req.user.email; // Extrae el email del usuario del token

        const [rows] = await connection.query('SELECT nombre, numero_cuenta, saldo, tipo FROM Usuarios WHERE email = ?', [userEmail]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        res.json(user);
    } catch (error) {
        logger.error('Error al obtener los datos del usuario:', error.message || error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        if (connection && typeof connection.release === 'function') connection.release();
    }
};
