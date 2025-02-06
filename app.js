const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const presupuestoRoutes = require("./routes/presupuestoRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const gastoRoutes = require("./routes/gastoRoutes");

const app = express();
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/presupuestos", presupuestoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/gastos", gastoRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
