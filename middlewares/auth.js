const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
};

module.exports = authMiddleware;
