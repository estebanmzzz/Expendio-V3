const pool = require("../models/db");

// Get all expenses
exports.getAllGastos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Gastos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

// Get an expense by ID
exports.getGastoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM Gastos WHERE gasto_id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Expense not found" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expense" });
  }
};

// Create a new expense
exports.createGasto = async (req, res) => {
  const { usuario_id, categoria_id, monto, descripcion } = req.body;

  if (!usuario_id || !categoria_id || !monto) {
    return res
      .status(400)
      .json({ error: "User ID, Category ID, and Amount are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Gastos (usuario_id, categoria_id, monto, descripcion) VALUES (?, ?, ?, ?)",
      [usuario_id, categoria_id, monto, descripcion || null]
    );

    res
      .status(201)
      .json({
        message: "Expense created successfully",
        gasto_id: result.insertId,
      });
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
};

// Update an existing expense
exports.updateGasto = async (req, res) => {
  const { id } = req.params;
  const { monto, descripcion } = req.body;

  if (!monto && !descripcion) {
    return res
      .status(400)
      .json({ error: "At least one field is required for update" });
  }

  const updates = [];
  const values = [];

  if (monto) {
    updates.push("monto = ?");
    values.push(monto);
  }
  if (descripcion !== undefined) {
    updates.push("descripcion = ?");
    values.push(descripcion || null);
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE Gastos SET ${updates.join(", ")} WHERE gasto_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({ message: "Expense updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
};

// Delete an expense
exports.deleteGasto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM Gastos WHERE gasto_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
};
