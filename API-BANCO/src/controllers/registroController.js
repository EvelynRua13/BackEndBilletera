import bcrypt from 'bcryptjs';
import { getConnection } from '../database/database.js';
import logger from '../utils/logger.js';

export const registrarUsuario = async (req, res) => {
  const { nombre, email, password, numero_cuenta, tipo } = req.body;

  // Validar que todos los campos estén completos
  if (!nombre || !email || !password || !numero_cuenta || !tipo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si ya existe un usuario con el mismo correo o número de cuenta
    const [rows] = await connection.query(
      'SELECT * FROM Usuarios WHERE email = ? OR numero_cuenta = ?',
      [email, numero_cuenta]
    );

    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: 'El correo o el número de cuenta ya están registrados.' });
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    await connection.query(
      'INSERT INTO Usuarios (nombre, email, password, numero_cuenta, tipo, saldo) VALUES (?, ?, ?, ?, ?, 0)',
      [nombre, email, hashedPassword, numero_cuenta, tipo]
    );

    // Enviar respuesta exitosa
    return res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (error) {
    logger.error('Error al registrar el usuario:', error.message || error);
    return res.status(500).json({ message: 'Error en el servidor.' });
  } finally {
    if (connection && typeof connection.release === 'function') connection.release();
  }
};
