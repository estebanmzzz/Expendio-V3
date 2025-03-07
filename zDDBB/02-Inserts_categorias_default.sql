-- Primero, las categorías principales:

INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Alimentación', NULL),
(0, 'Vivienda', NULL),
(0, 'Servicios', NULL),
(0, 'Transporte', NULL),
(0, 'Salud', NULL),
(0, 'Mascotas', NULL),
(0, 'Deporte', NULL),
(0, 'Entretenimiento', NULL);

-- Luego, las subcategorías:

-- Alimentación
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Supermercado', 1),
(0, 'Restaurantes', 1),
(0, 'Comida rápida', 1),
(0, 'Café', 1);

-- Vivienda
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Alquiler', 2),
(0, 'Hipoteca', 2),
(0, 'Comunidad', 2),
(0, 'Trastero', 2);

-- Servicios
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Agua', 3),
(0, 'Luz', 3),
(0, 'Gas', 3),
(0, 'Internet', 3),
(0, 'Móvil', 3);

-- Transporte
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Abono Transporte', 4),
(0, 'Gasolina', 4),
(0, 'Peajes', 4),
(0, 'Mantenimiento', 4),
(0, 'Cochera', 4),
(0, 'Parking', 4);

-- Salud
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Seguro médico', 5),
(0, 'Farmacia', 5);

-- Mascotas
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Alimento', 6),
(0, 'Seguro médico', 6),
(0, 'Paseador', 6),
(0, 'Juguetes', 6),
(0, 'Veterinario', 6);

-- Deporte
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Clases', 7),
(0, 'Gimnasio', 7);

-- Entretenimiento
INSERT INTO categorias (id_usuario, nombre_categoria, id_categoria_padre) VALUES
(0, 'Cine', 8),
(0, 'Teatro', 8),
(0, 'Concierto', 8),
(0, 'Ópera', 8),
(0, 'Show', 8),
(0, 'Otros', 8);
