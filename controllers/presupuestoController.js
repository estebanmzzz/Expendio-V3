const pool = require("../models/db");

exports.getAllPresupuestos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM presupuestos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fallo al obtener presupuestos" });
  }
};

exports.getPresupuestoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM presupuestos WHERE presupuesto_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Presupuesto no encontrado" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Fallo al obtener presupuesto" });
  }
};

exports.getPresupuestosByUserId = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [userCheck] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario_id = ?",
      [usuario_id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const [budgets] = await pool.query(
      "SELECT * FROM presupuestos WHERE usuario_id = ?",
      [usuario_id]
    );

    res.status(200).json(budgets);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Fallo al obtener presupuestos del usuario" });
  }
};

exports.createPresupuesto = async (req, res) => {
  const { usuario_id, monto } = req.body;

  if (!usuario_id || !monto) {
    return res.status(400).json({
      error: "Usuario ID y monto son requeridos para crear un presupuesto",
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO presupuestos (usuario_id, monto) VALUES (?, ?)",
      [usuario_id, monto]
    );

    res.status(201).json({
      message: "Presupuesto creado exitosamente",
      presupuesto_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear presupuesto" });
  }
};

exports.updatePresupuesto = async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  if (!monto) {
    return res.status(400).json({ error: "Falta el monto" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE presupuestos SET monto = ? WHERE presupuesto_id = ?",
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

exports.deletePresupuesto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM presupuestos WHERE presupuesto_id = ?",
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
