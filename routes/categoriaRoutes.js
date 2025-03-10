const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");
// const authMiddleware = require("../middlewares/auth");

// Definir rutas de categorias:
router.get("/", categoriaController.getAllCategorias); 
router.get("/:id", categoriaController.getCategoriaById); 
router.get("/usuario/:usuario_id", categoriaController.getCategoriasByUserId); 

// Rutas protegidas que requieren autenticación
router.post("/", /* authMiddleware, */ categoriaController.createCategoria); 
router.put("/:id", /* authMiddleware, */ categoriaController.updateCategoria); 
router.delete(
  "/:id",
  /* authMiddleware, */ categoriaController.deleteCategoria
); 

// Exportar rutas:
module.exports = router;
