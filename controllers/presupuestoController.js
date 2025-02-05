const pool = require("../models/db");

// Get all budgets
exports.getAllPresupuestos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Presupuestos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
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
      return res.status(404).json({ error: "Budget not found" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budget" });
  }
};

// Create a new budget
exports.createPresupuesto = async (req, res) => {
  const { usuario_id, monto } = req.body;

  if (!usuario_id || !monto) {
    return res
      .status(400)
      .json({ error: "Usuario ID and amount are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Presupuestos (usuario_id, monto) VALUES (?, ?)",
      [usuario_id, monto]
    );

    res.status(201).json({
      message: "Budget created successfully",
      presupuesto_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create budget" });
  }
};

// Update an existing budget
exports.updatePresupuesto = async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  if (!monto) {
    return res.status(400).json({ error: "Amount is required for update" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE Presupuestos SET monto = ? WHERE presupuesto_id = ?",
      [monto, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.status(200).json({ message: "Budget updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update budget" });
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
      return res.status(404).json({ error: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete budget" });
  }
};
