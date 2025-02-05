const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");

// Define routes
router.get("/", categoriaController.getAllCategorias); // Get all categories
router.get("/:id", categoriaController.getCategoriaById); // Get category by ID
router.post("/", categoriaController.createCategoria); // Create a new category
router.put("/:id", categoriaController.updateCategoria); // Update an existing category
router.delete("/:id", categoriaController.deleteCategoria); // Delete a category

module.exports = router;
