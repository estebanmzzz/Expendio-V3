const pool = require("../models/db");

// Get all categories
exports.getAllCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Categorias");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get a category by ID
exports.getCategoriaById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Categorias WHERE categoria_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Category not found" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

// Create a new category
exports.createCategoria = async (req, res) => {
  const { nombre, categoria_padre_id, usuario_id } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Categorias (nombre, categoria_padre_id, usuario_id) VALUES (?, ?, ?)",
      [nombre, categoria_padre_id || null, usuario_id]
    );

    res.status(201).json({
      message: "Category created successfully",
      categoria_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Update an existing category
exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_padre_id } = req.body;

  if (!nombre && !categoria_padre_id) {
    return res
      .status(400)
      .json({ error: "At least one field is required for update" });
  }

  const updates = [];
  const values = [];

  if (nombre) {
    updates.push("nombre = ?");
    values.push(nombre);
  }
  if (categoria_padre_id !== undefined) {
    updates.push("categoria_padre_id = ?");
    values.push(categoria_padre_id || null);
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE Categorias SET ${updates.join(", ")} WHERE categoria_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category no encontrada" });
    }

    res.status(200).json({ message: "Categoria updated exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la categoria" });
  }
};

// Delete a category
exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM Categorias WHERE categoria_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category no encontrada" });
    }

    res.status(200).json({ message: "Categoria deleted exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la categoria" });
  }
};
