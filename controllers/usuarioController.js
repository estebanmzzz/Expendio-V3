const pool = require("../models/db");
const bcrypt = require("bcryptjs");

// Get all users
exports.getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email, fecha_registro FROM Usuarios"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Get a user by ID
exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email, fecha_registro FROM Usuarios WHERE usuario_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

// Create a new user
exports.createUsuario = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
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

    // Insertar usuario
    const [usuarioResult] = await pool.query(
      "INSERT INTO Usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
      [nombre, apellido, nickname || null, email]
    );

    // Insertar credenciales de autenticación
    await pool.query(
      "INSERT INTO Auth (usuario_id, password_hash) VALUES (?, ?)",
      [usuarioResult.insertId, hashedPassword]
    );

    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario_id: usuarioResult.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

// Update an existing user
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, nickname, email } = req.body;

  if (!nombre && !apellido && !nickname && !email) {
    return res.status(400).json({ error: "No hay datos para actualizar" });
  }

  const updates = [];
  const values = [];

  if (nombre) {
    updates.push("nombre = ?");
    values.push(nombre);
  }
  if (apellido) {
    updates.push("apellido = ?");
    values.push(apellido);
  }
  if (nickname !== undefined) {
    updates.push("nickname = ?");
    values.push(nickname || null);
  }
  if (email) {
    // Verificar si el email ya existe (si está cambiando)
    const [existingUser] = await pool.query(
      "SELECT * FROM Usuarios WHERE email = ? AND usuario_id != ?",
      [email, id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El email ya está en uso" });
    }

    updates.push("email = ?");
    values.push(email);
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE Usuarios SET ${updates.join(", ")} WHERE usuario_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// Delete a user
exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // Primero eliminar registros relacionados en Auth
    await pool.query("DELETE FROM Auth WHERE usuario_id = ?", [id]);

    // Luego eliminar el usuario
    const [result] = await pool.query(
      "DELETE FROM Usuarios WHERE usuario_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
