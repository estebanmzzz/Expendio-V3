/* const bcrypt = require("bcryptjs");
const pool = require("../models/db");

exports.register = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  try {
    // Verificar si el email ya existe
    const [existingUser] = await pool.query(
      "SELECT * FROM Usuarios WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [usuarioResult] = await pool.query(
      "INSERT INTO Usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
      [nombre, apellido, nickname, email]
    );

    // Insertar credenciales de autenticación
    await pool.query(
      "INSERT INTO Auth (usuario_id, password_hash) VALUES (?, ?)",
      [usuarioResult.insertId, hashedPassword]
    );

    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario con información de autenticación
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios u JOIN Auth a ON u.usuario_id = a.usuario_id WHERE u.email = ?",
      [email]
    );

    // Verificar existencia del usuario
    if (rows.length === 0)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const user = rows[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: "Credenciales inválidas" });

    // Preparar datos de usuario para la sesión
    const userSessionData = {
      id: user.usuario_id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      nickname: user.nickname,
    };

    res.status(200).json({
      message: "Login exitoso",
      user: userSessionData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login fallido" });
  }
};

// Middleware para verificar autenticación (opcional, pero recomendado)
exports.authenticateUser = async (req, res, next) => {
  // En un escenario real, necesitarías implementar una verificación de sesión
  // Este es un middleware de ejemplo
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE usuario_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de autenticación" });
  }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email FROM Usuarios WHERE usuario_id = ?",
      [req.user.usuario_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener información del usuario" });
  }
};

// Logout (opcional, pero recomendado)
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.json({ message: "Sesión cerrada exitosamente" });
  });
}; */

const bcrypt = require("bcryptjs");
const pool = require("../models/db");

/**
 * Registra un nuevo usuario
 */
exports.register = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  // Validar campos requeridos
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  // Validar complejidad de contraseña (mínimo 8 caracteres)
  if (password.length < 8) {
    return res.status(400).json({
      error: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    // Verificar si el email ya existe
    const [existingUser] = await pool.query(
      "SELECT * FROM Usuarios WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Iniciar transacción para asegurar que ambas inserciones se realicen o ninguna
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insertar usuario
      const [usuarioResult] = await connection.query(
        "INSERT INTO Usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
        [nombre, apellido, nickname || null, email]
      );

      // Insertar credenciales de autenticación
      await connection.query(
        "INSERT INTO Auth (usuario_id, password_hash) VALUES (?, ?)",
        [usuarioResult.insertId, hashedPassword]
      );

      // Confirmar transacción
      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Usuario creado exitosamente",
        usuario_id: usuarioResult.insertId,
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

/**
 * Autentica un usuario y crea una sesión
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validar campos requeridos
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    // Buscar usuario con información de autenticación
    const [rows] = await pool.query(
      "SELECT u.usuario_id, u.nombre, u.apellido, u.nickname, u.email, a.password_hash " +
        "FROM Usuarios u " +
        "JOIN Auth a ON u.usuario_id = a.usuario_id " +
        "WHERE u.email = ?",
      [email]
    );

    // Verificar existencia del usuario
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Crear sesión
    req.session.userId = user.usuario_id;
    req.session.userEmail = user.email;

    // Preparar datos de usuario para la respuesta (excluir la contraseña)
    const userSessionData = {
      id: user.usuario_id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      nickname: user.nickname,
    };

    res.status(200).json({
      message: "Login exitoso",
      user: userSessionData,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Login fallido" });
  }
};

/**
 * Verifica si el usuario está autenticado
 * Este método puede usarse como middleware
 */
exports.authenticateUser = async (req, res, next) => {
  // Verificar si existe un usuario en la sesión
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    // Obtener información del usuario desde la base de datos
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email FROM Usuarios WHERE usuario_id = ?",
      [req.session.userId]
    );

    if (rows.length === 0) {
      // Limpiar la sesión si el usuario no existe
      req.session.destroy();
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Agregar la información del usuario a la solicitud
    req.user = rows[0];
    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(500).json({ error: "Error de autenticación" });
  }
};

/**
 * Obtiene la información del usuario autenticado actual
 */
exports.getCurrentUser = async (req, res) => {
  // req.user debe estar disponible gracias al middleware authenticateUser
  res.json(req.user);
};

/**
 * Actualiza la contraseña del usuario
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  // Validar campos
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "La contraseña actual y la nueva contraseña son requeridas",
    });
  }

  // Validar complejidad de contraseña
  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "La nueva contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    // Obtener el hash de la contraseña actual
    const [rows] = await pool.query(
      "SELECT password_hash FROM Auth WHERE usuario_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash
    );
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    // Generar hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.query("UPDATE Auth SET password_hash = ? WHERE usuario_id = ?", [
      hashedPassword,
      userId,
    ]);

    res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

/**
 * Cierra la sesión del usuario
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }

    // Eliminar la cookie de sesión
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada exitosamente" });
  });
};

/**
 * Solicita restablecimiento de contraseña (simulado)
 * En un entorno real, enviarías un correo con un token
 */
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email es requerido" });
  }

  try {
    // Verificar si el email existe
    const [rows] = await pool.query(
      "SELECT usuario_id FROM Usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      // Por seguridad, no revelar que el email no existe
      return res.status(200).json({
        message:
          "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      });
    }

    // En una implementación real, aquí generarías un token y enviarías un email
    // Para esta demo, simplemente retornamos éxito
    res.status(200).json({
      message:
        "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    });
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
};
