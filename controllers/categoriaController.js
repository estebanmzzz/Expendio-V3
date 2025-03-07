const pool = require("../models/db");

// Get all categories (filtered by user_id when provided)
exports.getAllCategorias = async (req, res) => {
  const usuario_id = req.query.usuario_id || req.user?.id;

  try {
    let query = "SELECT * FROM Categorias";
    let params = [];

    // Si se proporciona un usuario_id, filtrar por ese usuario y las categorías por defecto
    if (usuario_id) {
      query = "SELECT * FROM Categorias WHERE usuario_id = ? OR usuario_id = 0";
      params = [usuario_id];
    }

    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
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

// Get categories for a user (both default and user-created)
exports.getCategoriasByUserId = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM Categorias WHERE usuario_id = ? OR usuario_id = 0",
      [usuario_id]
    );

    if (rows.length === 0)
      return res
        .status(200)
        .json({ message: "No categories found", categories: [] });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Create a new category
exports.createCategoria = async (req, res) => {
  const { nombre, categoria_padre_id, usuario_id } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (!usuario_id) {
    return res.status(400).json({ error: "Usuario ID is required" });
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
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Update an existing category
exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_padre_id } = req.body;
  const usuario_id = req.body.usuario_id || req.user?.id; // Asumiendo que tienes middleware de autenticación

  if (!nombre && !categoria_padre_id) {
    return res
      .status(400)
      .json({ error: "At least one field is required for update" });
  }

  // Primero verificar que la categoría pertenece al usuario
  try {
    const [categoryRows] = await pool.query(
      "SELECT * FROM Categorias WHERE categoria_id = ?",
      [id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Si la categoría tiene usuario_id = 0 (default), no permitir edición
    if (categoryRows[0].usuario_id === 0) {
      return res
        .status(403)
        .json({ error: "Default categories cannot be modified" });
    }

    // Si el usuario_id no coincide con el de la categoría, no permitir edición
    if (usuario_id && categoryRows[0].usuario_id !== usuario_id) {
      return res
        .status(403)
        .json({ error: "You can only edit your own categories" });
    }
  } catch (error) {
    console.error("Error verifying category ownership:", error);
    return res.status(500).json({ error: "Error checking category" });
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
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Error updating category" });
  }
};

// Delete a category
exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.body.usuario_id || req.user?.id; // Asumiendo que tienes middleware de autenticación

  // Primero verificar que la categoría pertenece al usuario
  try {
    const [categoryRows] = await pool.query(
      "SELECT * FROM Categorias WHERE categoria_id = ?",
      [id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Si la categoría tiene usuario_id = 0 (default), no permitir eliminación
    if (categoryRows[0].usuario_id === 0) {
      return res
        .status(403)
        .json({ error: "Default categories cannot be deleted" });
    }

    // Si el usuario_id no coincide con el de la categoría, no permitir eliminación
    if (usuario_id && categoryRows[0].usuario_id !== usuario_id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own categories" });
    }
  } catch (error) {
    console.error("Error verifying category ownership:", error);
    return res.status(500).json({ error: "Error checking category" });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM Categorias WHERE categoria_id = ? AND usuario_id != 0",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Category not found or cannot be deleted" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Error deleting category" });
  }
};
