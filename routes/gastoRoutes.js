const express = require("express");
const router = express.Router();
const gastoController = require("../controllers/gastoController");

// Define routes
router.get("/", gastoController.getAllGastos); // Get all expenses
router.get("/:id", gastoController.getGastoById); // Get expense by ID
router.post("/", gastoController.createGasto); // Create a new expense
router.put("/:id", gastoController.updateGasto); // Update an existing expense
router.delete("/:id", gastoController.deleteGasto); // Delete an expense

module.exports = router;
