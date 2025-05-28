const path = require("path");

exports.getHomePage = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "index.html"));
};

exports.getDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "view", "Dashboard.html"));
};

exports.getLogin = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "view", "Login.html"));
};

exports.getRegister = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "view", "Register.html"));
};

exports.getProfile = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "view", "Profile.html"));
};

exports.getGastos = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "view", "Gastos.html"));
};

exports.getCategorias = (req, res) => {
  res.sendFile(
    path.join(__dirname, "../", "public", "view", "Categorias.html")
  );
};

exports.getPresupuestos = (req, res) => {
  res.sendFile(
    path.join(__dirname, "../", "public", "view", "Presupuestos.html")
  );
};

exports.getCSS = (req, res) => {
  const cssFile = req.params.file;
  res.sendFile(path.join(__dirname, "../", "public", "view", "CSS", cssFile));
};

exports.getJS = (req, res) => {
  const jsFile = req.params.file;
  res.sendFile(path.join(__dirname, "../", "public", "view", "JS", jsFile));
};
