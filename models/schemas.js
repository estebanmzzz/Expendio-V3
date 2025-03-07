const { DataTypes } = require("mysql2");

module.exports = {
  UsuarioSchema: {
    nombre: DataTypes.STRING(100),
    apellido: DataTypes.STRING(100),
    nickname: DataTypes.STRING(50),
    email: DataTypes.STRING(255),
    fecha_registro: DataTypes.DATE,
  },
  AuthSchema: {
    password_hash: DataTypes.STRING(255),
  },
  PresupuestoSchema: {
    monto: DataTypes.DECIMAL(10, 2),
    fecha_asignacion: DataTypes.DATE,
  },
  CategoriaSchema: {
    nombre: DataTypes.STRING(100),
    categoria_padre_id: DataTypes.INTEGER,
    usuario_id: DataTypes.INTEGER,
  },
  GastoSchema: {
    monto: DataTypes.DECIMAL(10, 2),
    descripcion: DataTypes.TEXT,
    fecha_gasto: DataTypes.DATE,
    //    usuario_id: DataTypes.INTEGER,
  },
};
