const express = require("express");
const router = express.Router();
const presupuestoController = require("../controllers/presupuestoController");

// Rutas de Presupuestos:
router.get("/", presupuestoController.getAllPresupuestos); 
router.get("/:id", presupuestoController.getPresupuestoById); 
router.get("/user/:usuario_id", presupuestoController.getPresupuestosByUserId); 
router.post("/", presupuestoController.createPresupuesto); 
router.put("/:id", presupuestoController.updatePresupuesto); 
router.delete("/:id", presupuestoController.deletePresupuesto); 

// Exportas rutas:
module.exports = router;
