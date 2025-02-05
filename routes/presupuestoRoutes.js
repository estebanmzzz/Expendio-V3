const express = require("express");
const router = express.Router();
const presupuestoController = require("../controllers/presupuestoController");

// Define routes
router.get("/", presupuestoController.getAllPresupuestos); // Get all budgets
router.get("/:id", presupuestoController.getPresupuestoById); // Get budget by ID
router.post("/", presupuestoController.createPresupuesto); // Create a new budget
router.put("/:id", presupuestoController.updatePresupuesto); // Update an existing budget
router.delete("/:id", presupuestoController.deletePresupuesto); // Delete a budget

module.exports = router;
