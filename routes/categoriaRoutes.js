const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");
// Asumiendo que tienes algún middleware de autenticación
// const authMiddleware = require("../middlewares/auth");

// Define routes
router.get("/", categoriaController.getAllCategorias); // Get all categories
router.get("/:id", categoriaController.getCategoriaById); // Get category by ID
router.get("/usuario/:usuario_id", categoriaController.getCategoriasByUserId); // Get categories by user ID

// Rutas protegidas que requieren autenticación
// Idealmente estas rutas deberían estar protegidas por un middleware de autenticación
router.post("/", /* authMiddleware, */ categoriaController.createCategoria); // Create a new category
router.put("/:id", /* authMiddleware, */ categoriaController.updateCategoria); // Update an existing category
router.delete(
  "/:id",
  /* authMiddleware, */ categoriaController.deleteCategoria
); // Delete a category

module.exports = router;
