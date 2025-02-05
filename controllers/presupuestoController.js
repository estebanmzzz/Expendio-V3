const pool = require("../models/db");

// Get all budgets
exports.getAllPresupuestos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Presupuestos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fallo al obtener presupuestos" });
  }
};

// Get a budget by ID
exports.getPresupuestoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Presupuestos WHERE presupuesto_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Presupuesto no encontrado" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Fallo al obtener presupuesto" });
  }
};

// Create a new budget
exports.createPresupuesto = async (req, res) => {
  const { usuario_id, monto } = req.body;

  if (!usuario_id || !monto) {
    return res.status(400).json({
      error: "Usuario ID y monto son requeridos para crear un presupuesto",
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Presupuestos (usuario_id, monto) VALUES (?, ?)",
      [usuario_id, monto]
    );

    res.status(201).json({
      message: "Prsupuesto creado existosamente",
      presupuesto_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear presupuesto" });
  }
};

// Update an existing budget
exports.updatePresupuesto = async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  if (!monto) {
    return res.status(400).json({ error: "Falta el monto" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE Presupuestos SET monto = ? WHERE presupuesto_id = ?",
      [monto, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    res.status(200).json({ message: "Presupuesto actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar presupuesto" });
  }
};

// Delete a budget
exports.deletePresupuesto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM Presupuestos WHERE presupuesto_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    res.status(200).json({ message: "Presupuesto eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar presupuesto" });
  }
};
