const pool = require("../models/db");

// Funcion Obtener Todos los Usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Usuarios");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fallo al buscar todos los usuarios" });
  }
};

// Funcion Obtener Usuario por ID
exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE usuario_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Fallo en el fetch de usuario" });
  }
};

// Funcion Crear Usuario
exports.createUsuario = async (req, res) => {
  const { nombre, apellido, nickname, email } = req.body;

  if (!nombre || !apellido || !nickname || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
      [nombre, apellido, nickname, email]
    );

    res.status(201).json({
      message: "User created successfully",
      usuario_id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Duplicate entry. Nickname or email already exists." });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Funcion Update Usuario
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, nickname, email } = req.body;

  if (!nombre && !apellido && !nickname && !email) {
    return res
      .status(400)
      .json({ error: "Sin datos para updatear, no hay update" });
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
  if (nickname) {
    updates.push("nickname = ?");
    values.push(nickname);
  }
  if (email) {
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
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Duplicado. Ese correo o nickname ya existen." });
    }
    res.status(500).json({ error: "Fallo al actualizar usuario" });
  }
};

exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM Usuarios WHERE usuario_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Fallo al eliminar usuario" });
  }
};
