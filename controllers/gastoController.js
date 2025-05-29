// gastoController.js - VERSIÓN CORREGIDA
const pool = require("../models/db");

// Función corregida para actualizar gastos
exports.updateGasto = async (req, res) => {
  const { id } = req.params;
  // ✅ AGREGAMOS fecha_gasto a la desestructuración
  const { monto, descripcion, fecha_gasto } = req.body;

  // ✅ CORREGIMOS la validación para incluir fecha_gasto
  if (!monto && !descripcion && !fecha_gasto) {
    return res.status(400).json({
      error:
        "Sin datos para actualizar. Debe proporcionar al menos un campo: monto, descripcion o fecha_gasto",
    });
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

  // ✅ AGREGAMOS el manejo de fecha_gasto
  if (fecha_gasto) {
    updates.push("fecha_gasto = ?");
    values.push(fecha_gasto);
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE gastos SET ${updates.join(", ")} WHERE gasto_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.status(200).json({
      message: "Gasto actualizado exitosamente",
      updated_fields: updates.map((update) => update.split(" = ")[0]),
    });
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    res.status(500).json({ error: "Error al actualizar el gasto" });
  }
};

// VERSIÓN ALTERNATIVA MÁS ROBUSTA (Recomendada)
exports.updateGastoAdvanced = async (req, res) => {
  const { id } = req.params;
  const allowedFields = ["monto", "descripcion", "fecha_gasto", "categoria_id"];

  // Construir dinámicamente los campos a actualizar
  const updates = [];
  const values = [];

  // Filtrar solo los campos permitidos que están presentes en req.body
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: "No hay campos válidos para actualizar",
      allowed_fields: allowedFields,
    });
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE gastos SET ${updates.join(", ")} WHERE gasto_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.status(200).json({
      message: "Gasto actualizado exitosamente",
      updated_fields: updates.map((update) => update.split(" = ")[0]),
      affected_rows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    res.status(500).json({ error: "Error al actualizar el gasto" });
  }
};

// Resto de las funciones permanecen igual...
exports.getAllGastos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM gastos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al fetchear Gastos" });
  }
};

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
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.categoria_id
      LEFT JOIN categorias cp ON c.categoria_padre_id = cp.categoria_id
      WHERE g.usuario_id = ?
      ORDER BY g.fecha_gasto DESC, g.gasto_id DESC
    `,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Gasto no encontrado" });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener gasto:", error);
    res.status(500).json({ error: "Error al fetchear el gasto" });
  }
};

exports.createGasto = async (req, res) => {
  const { usuario_id, categoria_id, monto, descripcion, fecha_gasto } =
    req.body;

  if (!usuario_id || !categoria_id || !monto) {
    return res.status(400).json({
      error: "User ID, Category ID, y Amount son requeridos",
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO gastos (usuario_id, categoria_id, monto, descripcion, fecha_gasto) VALUES (?, ?, ?, ?, ?)",
      [
        usuario_id,
        categoria_id,
        monto,
        descripcion || null,
        fecha_gasto || new Date().toISOString().slice(0, 10),
      ]
    );

    res.status(201).json({
      message: "Gasto creado exitosamente",
      gasto_id: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear el gasto:", error);
    res.status(500).json({ error: "Error al crear el gasto" });
  }
};

exports.deleteGasto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM gastos WHERE gasto_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.status(200).json({ message: "Gasto eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
};

/* const pool = require("../models/db");

exports.getAllGastos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM gastos");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al fetchear Gastos" });
  }
};

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
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.categoria_id
      LEFT JOIN categorias cp ON c.categoria_padre_id = cp.categoria_id
      WHERE g.usuario_id = ?
      ORDER BY g.fecha_gasto DESC, g.gasto_id DESC
    `,
      [id]
    );

    console.log(rows);
    if (rows.length === 0)
      return res.status(404).json({ error: "Gasto no encontrado" });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al fetchear el gasto" });
  }
};

exports.createGasto = async (req, res) => {
  const { usuario_id, categoria_id, monto, descripcion, fecha_gasto } =
    req.body;

  if (!usuario_id || !categoria_id || !monto) {
    return res
      .status(400)
      .json({ error: "User ID, Category ID, y Amount son requeridos" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO gastos (usuario_id, categoria_id, monto, descripcion, fecha_gasto) VALUES (?, ?, ?, ?, ?)",
      [
        usuario_id,
        categoria_id,
        monto,
        descripcion || null,
        fecha_gasto || new Date().toISOString().slice(0, 10),
      ]
    );

    res.status(201).json({
      message: "Gasto creado exitosamente",
      gasto_id: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear el gasto:", error);
    res.status(500).json({ error: "Error al crear el gasto" });
  }
};

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
      `UPDATE gastos SET ${updates.join(", ")} WHERE gasto_id = ?`,
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

exports.deleteGasto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM gastos WHERE gasto_id = ?", [
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
 */
