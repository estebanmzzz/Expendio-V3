const bcrypt = require("bcryptjs");
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
      nickname: user.nickname
    };

    res.status(200).json({ 
      message: "Login exitoso", 
      user: userSessionData 
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
};