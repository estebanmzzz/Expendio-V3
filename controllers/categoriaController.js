const pool = require("../models/db");

exports.getAllCategorias = async (req, res) => {
  const usuario_id = req.query.usuario_id || req.user?.id;

  try {
    let query = "SELECT * FROM categorias";
    let params = [];

    if (usuario_id) {
      query = "SELECT * FROM categorias WHERE usuario_id = ? OR usuario_id = 0";
      params = [usuario_id];
    }

    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

exports.getCategoriaById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM categorias WHERE categoria_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Category not found" });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

exports.getCategoriasByUserId = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM categorias WHERE usuario_id = ? OR usuario_id = 0",
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
      "INSERT INTO categorias (nombre, categoria_padre_id, usuario_id) VALUES (?, ?, ?)",
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

exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_padre_id } = req.body;
  const usuario_id = req.body.usuario_id || req.user?.id;

  if (!nombre && !categoria_padre_id) {
    return res
      .status(400)
      .json({ error: "At least one field is required for update" });
  }

  try {
    const [categoryRows] = await pool.query(
      "SELECT * FROM categorias WHERE categoria_id = ?",
      [id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (categoryRows[0].usuario_id === 0) {
      return res
        .status(403)
        .json({ error: "Default categories cannot be modified" });
    }

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
      `UPDATE categorias SET ${updates.join(", ")} WHERE categoria_id = ?`,
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

exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.body.usuario_id || req.user?.id;

  try {
    const [categoryRows] = await pool.query(
      "SELECT * FROM categorias WHERE categoria_id = ?",
      [id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (categoryRows[0].usuario_id === 0) {
      return res
        .status(403)
        .json({ error: "Default categories cannot be deleted" });
    }

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
      "DELETE FROM categorias WHERE categoria_id = ? AND usuario_id != 0",
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
