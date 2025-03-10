const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

// Rutas de usuarios:
router.get("/", usuarioController.getAllUsuarios);
router.get("/:id", usuarioController.getUsuarioById);
router.post("/", usuarioController.createUsuario);
router.put("/:id", usuarioController.updateUsuario);
router.delete("/:id", usuarioController.deleteUsuario);

// Exportar rutas:
module.exports = router;
