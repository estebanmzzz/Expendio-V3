CREATE DATABASE expendio;
USE expendio;

-- Crear tabla de usuarios primero porque es referenciada por otras tablas
CREATE TABLE usuarios (
  usuario_id INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla de categorías
CREATE TABLE categorias (
  categoria_id INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  categoria_padre_id INT(11) DEFAULT NULL,
  usuario_id INT(11) NOT NULL,
  PRIMARY KEY (categoria_id),
  FOREIGN KEY (categoria_padre_id) REFERENCES categorias (categoria_id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla de autenticación después de usuarios
CREATE TABLE auth (
  auth_id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  PRIMARY KEY (auth_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla de presupuestos después de usuarios
CREATE TABLE presupuestos (
  presupuesto_id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (presupuesto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla de gastos al final, ya que depende de usuarios y categorías
CREATE TABLE gastos (
  gasto_id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  categoria_id INT(11) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  fecha_gasto TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (gasto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias (categoria_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
