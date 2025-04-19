const pool = require("../models/db");
const bcrypt = require("bcryptjs");

exports.getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email, fecha_registro FROM usuarios"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, apellido, nickname, email, fecha_registro FROM usuarios WHERE usuario_id = ?",
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

exports.createUsuario = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
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

    const [usuarioResult] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
      [nombre, apellido, nickname || null, email]
    );

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

exports.updateUsuario = async (req, res) => {
  const { id } = req.params;

  console.log(`updateUsuario called with id: ${id}`);
  console.log("Request body:", req.body);

  if (!id || id === "undefined") {
    console.error("Invalid user ID provided:", id);
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  const { nombre, apellido, nickname, email } = req.body;

  if (!nombre && !apellido && !nickname && !email) {
    console.log("No valid update fields provided");
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
    try {
      const [existingUser] = await pool.query(
        "SELECT * FROM usuarios WHERE email = ? AND usuario_id != ?",
        [email, id]
      );

      if (existingUser.length > 0) {
        console.log(`Email ${email} already in use by another user`);
        return res.status(400).json({ error: "El email ya está en uso" });
      }

      updates.push("email = ?");
      values.push(email);
    } catch (error) {
      console.error("Error checking existing email:", error);
      return res.status(500).json({ error: "Error al verificar el email" });
    }
  }

  values.push(id);

  const updateQuery = `UPDATE usuarios SET ${updates.join(
    ", "
  )} WHERE usuario_id = ?`;
  console.log("Update query:", updateQuery);
  console.log("Query values:", values);

  try {
    const [result] = await pool.query(updateQuery, values);

    console.log("Update result:", result);

    if (result.affectedRows === 0) {
      console.log(`No user found with ID: ${id}`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`Successfully updated user with ID: ${id}`);
    res.status(200).json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  console.log(`deleteUsuario called with id: ${id}`);

  if (!id || id === "undefined") {
    console.error("Invalid user ID provided:", id);
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  try {
    console.log(`Deleting auth records for user ID: ${id}`);
    await pool.query("DELETE FROM auth WHERE usuario_id = ?", [id]);

    console.log(`Deleting user with ID: ${id}`);
    const [result] = await pool.query(
      "DELETE FROM usuarios WHERE usuario_id = ?",
      [id]
    );

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      console.log(`No user found with ID: ${id}`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`Successfully deleted user with ID: ${id}`);
    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
