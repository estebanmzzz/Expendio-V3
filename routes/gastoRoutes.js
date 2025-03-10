const express = require("express");
const router = express.Router();
const gastoController = require("../controllers/gastoController");

// Rutas de gastos:
router.get("/", gastoController.getAllGastos); 
router.get("/:id", gastoController.getGastoById); 
router.post("/", gastoController.createGasto); 
router.put("/:id", gastoController.updateGasto); 
router.delete("/:id", gastoController.deleteGasto); 

// Exportar rutas:
module.exports = router;
