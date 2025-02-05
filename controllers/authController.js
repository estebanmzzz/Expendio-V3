const bcrypt = require("bcryptjs");
const pool = require("../models/db");

exports.register = async (req, res) => {
  const { nombre, apellido, nickname, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [usuarioResult] = await pool.query(
      "INSERT INTO Usuarios (nombre, apellido, nickname, email) VALUES (?, ?, ?, ?)",
      [nombre, apellido, nickname, email]
    );

    await pool.query(
      "INSERT INTO Auth (usuario_id, password_hash) VALUES (?, ?)",
      [usuarioResult.insertId, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios u JOIN Auth a ON u.usuario_id = a.usuario_id WHERE u.email = ?",
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};
