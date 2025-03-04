const pool = require("../models/db");

// Get all expenses
exports.getAllGastos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Gastos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al fetchear Gastos" });
  }
};

// Get an expense by ID
exports.getGastoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        g.gasto_id, 
        g.usuario_id, 
        g.categoria_id, 
        g.monto, 
        g.descripcion, 
        g.fecha_gasto, 
        c.nombre AS categoria_nombre, 
        cp.nombre AS subcategoria_nombre
      FROM Gastos g
      LEFT JOIN Categorias c ON g.categoria_id = c.categoria_id
      LEFT JOIN Categorias cp ON c.categoria_padre_id = cp.categoria_id
      WHERE g.usuario_id = ?
    `,
      [id]
    );

    console.log(rows); // Verifica los datos obtenidos de la base de datos
    if (rows.length === 0)
      return res.status(404).json({ error: "Gasto no encontrado" });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al fetchear el gasto" });
  }
};

// Create a new expense
exports.createGasto = async (req, res) => {
  const { usuario_id, categoria_id, monto, descripcion } = req.body;

  if (!usuario_id || !categoria_id || !monto) {
    return res
      .status(400)
      .json({ error: "User ID, Category ID, y Amount son requeridos" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Gastos (usuario_id, categoria_id, monto, descripcion) VALUES (?, ?, ?, ?)",
      [usuario_id, categoria_id, monto, descripcion || null]
    );

    res.status(201).json({
      message: "Gasto creado exitosamente",
      gasto_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el gasto" });
  }
};

// Update an existing expense
exports.updateGasto = async (req, res) => {
  const { id } = req.params;
  const { monto, descripcion } = req.body;

  if (!monto && !descripcion) {
    return res
      .status(400)
      .json({ error: "Sin datos para updatear, no hay update" });
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
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.status(200).json({ message: "Gasto actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Fallo al actualizar el gasto" });
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
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.status(200).json({ message: "Gasto eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
};
