const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const presupuestoRoutes = require("./routes/presupuestoRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const gastoRoutes = require("./routes/gastoRoutes");

/* Puede crear conflicto
 */ const session = require("express-session");

const app = express();
require("dotenv").config();

// Configuración de sesiones
app.use(
  session({
    secret: "tu_secreto_super_seguro", // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Cambia a true si usas HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/presupuestos", presupuestoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/gastos", gastoRoutes);

// Rutas de autenticación
/* app.post("/api/login", authController.login);
app.post("/api/register", authController.register);
app.get(
  "/api/user",
  authController.authenticateUser,
  authController.getCurrentUser
);
app.post("/api/logout", authController.logout); */

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
