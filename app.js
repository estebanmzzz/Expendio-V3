const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const viewRoutes = require("./routes/viewRoutes");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const presupuestoRoutes = require("./routes/presupuestoRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const gastoRoutes = require("./routes/gastoRoutes");

// Puede crear conflicto:
const session = require("express-session");

const app = express();
require("dotenv").config();

// Configuración de sesiones
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/", viewRoutes);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/presupuestos", presupuestoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/gastos", gastoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
