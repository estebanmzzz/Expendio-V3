const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");

// Main routes
router.get("/", viewController.getHomePage);
router.get("/dashboard", viewController.getDashboard);
router.get("/login", viewController.getLogin);
router.get("/register", viewController.getRegister);
router.get("/profile", viewController.getProfile);
router.get("/gastos", viewController.getGastos);
router.get("/categorias", viewController.getCategorias);
router.get("/presupuestos", viewController.getPresupuestos);

// Asset routes
router.get("/view/CSS/:file", viewController.getCSS);
router.get("/view/JS/:file", viewController.getJS);

module.exports = router;
