const bcrypt = require("bcryptjs");
const pool = require("../models/db");

exports.register = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [usuarioResult] = await connection.query(
        "INSERT INTO usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
        [nombre, apellido, nickname || null, email]
      );

      await connection.query(
        "INSERT INTO auth (usuario_id, password_hash) VALUES (?, ?)",
        [usuarioResult.insertId, hashedPassword]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Usuario creado exitosamente",
        usuario_id: usuarioResult.insertId,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT u.usuario_id, u.nombre, u.apellido, u.nickname, u.email, a.password_hash " +
        "FROM usuarios u " +
        "JOIN auth a ON u.usuario_id = a.usuario_id " +
        "WHERE u.email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    req.session.userId = user.usuario_id;
    req.session.userEmail = user.email;

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

exports.authenticateUser = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email FROM usuarios WHERE usuario_id = ?",
      [req.session.userId]
    );

    if (rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(500).json({ error: "Error de autenticación" });
  }
};

exports.getCurrentUser = async (req, res) => {
  res.json(req.user);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "La contraseña actual y la nueva contraseña son requeridas",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "La nueva contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT password_hash FROM auth WHERE usuario_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash
    );
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE auth SET password_hash = ? WHERE usuario_id = ?", [
      hashedPassword,
      userId,
    ]);

    res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada exitosamente" });
  });
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email es requerido" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT usuario_id FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message:
          "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      });
    }

    res.status(200).json({
      message:
        "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    });
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
};
