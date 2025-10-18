import bcrypt from 'bcryptjs';
import { getConnection } from '../database/database.js';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import logger from '../utils/logger.js';

export const iniciarSesion = async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'El correo y la contraseña son obligatorios.' });
    }

    let connection;
    try {
        connection = await getConnection();

        // Seleccionar solo los campos necesarios
        const [rows] = await connection.query('SELECT id, nombre, email, password FROM Usuarios WHERE email = ?', [email]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const usuario = rows[0];
        const esContraseñaValida = await bcrypt.compare(password, usuario.password);
        if (!esContraseñaValida) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign({ id: usuario.id, email: usuario.email }, config.jwtSecret, { expiresIn: '1h' });
        const usuarioSinContraseña = { id: usuario.id, email: usuario.email, nombre: usuario.nombre };
        return res.status(200).json({ message: 'Inicio de sesión exitoso.', token, usuario: usuarioSinContraseña });
    } catch (error) {
        logger.error('Error al iniciar sesión:', error.message || error);
        return res.status(500).json({ message: 'Error en el servidor.' });
    } finally {
        if (connection && typeof connection.release === 'function') connection.release();
    }
};
