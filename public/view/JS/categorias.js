// Estructura de datos para almacenar las categorías y subcategorías
let categorias = [];

// Función para obtener las categorías desde la API
function obtenerCategorias() {
  fetch("http://localhost:5000/api/categorias/")
    .then((response) => response.json())
    .then((data) => {
      console.log("Datos recibidos:", data);
      procesarDatosAPI(data);
      renderizarCategorias();
    })
    .catch((error) => {
      console.error("Error al obtener categorías:", error);
    });
}

// Función para procesar los datos de la API y convertirlos al formato requerido
function procesarDatosAPI(data) {
  // Resetear categorías
  categorias = [];

  // Primero identificar todas las categorías principales (las que tienen categoria_padre_id = null)
  const categoriasPrincipales = data.filter(
    (cat) => cat.categoria_padre_id === null
  );

  // Para cada categoría principal, crear un objeto con el formato requerido
  categoriasPrincipales.forEach((catPrincipal) => {
    const subcategorias = data
      .filter((item) => item.categoria_padre_id === catPrincipal.categoria_id)
      .map((subcat) => {
        return {
          id: subcat.categoria_id,
          nombre: subcat.nombre,
        };
      });

    const categoria = {
      id: catPrincipal.categoria_id,
      nombre: catPrincipal.nombre,
      subcategorias: subcategorias,
    };

    categorias.push(categoria);
  });

  console.log("Categorías procesadas:", categorias);
}

// Función para generar IDs únicos
function generarID() {
  return Date.now();
}

// Función para agregar una nueva categoría
function addCategoria() {
  const nombreCategoria = prompt("Ingresa el nombre de la nueva categoría:");

  if (nombreCategoria && nombreCategoria.trim() !== "") {
    const nuevaCategoria = {
      id: generarID(),
      nombre: nombreCategoria.trim(),
      subcategorias: [],
    };

    categorias.push(nuevaCategoria);
    renderizarCategorias();

    // Aquí podrías añadir código para enviar la nueva categoría al servidor
    // mediante una petición POST a tu API
  }
}

// Función para editar una categoría
function editarCategoria(categoriaId) {
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (categoria) {
    const nuevoNombre = prompt(
      "Editar nombre de la categoría:",
      categoria.nombre
    );

    if (nuevoNombre && nuevoNombre.trim() !== "") {
      categoria.nombre = nuevoNombre.trim();
      renderizarCategorias();

      // Aquí podrías añadir código para actualizar la categoría en el servidor
      // mediante una petición PUT a tu API
    }
  }
}

// Función para eliminar una categoría
function eliminarCategoria(categoriaId) {
  if (
    confirm(
      "¿Estás seguro de que deseas eliminar esta categoría y todas sus subcategorías?"
    )
  ) {
    categorias = categorias.filter((cat) => cat.id !== categoriaId);
    renderizarCategorias();

    // Aquí podrías añadir código para eliminar la categoría en el servidor
    // mediante una petición DELETE a tu API
  }
}

// Función para agregar una subcategoría
function addSubcategoria(categoriaId) {
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (categoria) {
    const nombreSubcategoria = prompt(
      "Ingresa el nombre de la nueva subcategoría:"
    );

    if (nombreSubcategoria && nombreSubcategoria.trim() !== "") {
      const nuevaSubcategoria = {
        id: generarID(),
        nombre: nombreSubcategoria.trim(),
      };

      categoria.subcategorias.push(nuevaSubcategoria);
      renderizarCategorias();

      // Aquí podrías añadir código para enviar la nueva subcategoría al servidor
      // mediante una petición POST a tu API
    }
  }
}

// Función para editar una subcategoría
function editarSubcategoria(categoriaId, subcategoriaId) {
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (categoria) {
    const subcategoria = categoria.subcategorias.find(
      (sub) => sub.id === subcategoriaId
    );

    if (subcategoria) {
      const nuevoNombre = prompt(
        "Editar nombre de la subcategoría:",
        subcategoria.nombre
      );

      if (nuevoNombre && nuevoNombre.trim() !== "") {
        subcategoria.nombre = nuevoNombre.trim();
        renderizarCategorias();

        // Aquí podrías añadir código para actualizar la subcategoría en el servidor
        // mediante una petición PUT a tu API
      }
    }
  }
}

// Función para eliminar una subcategoría
function eliminarSubcategoria(categoriaId, subcategoriaId) {
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (
    categoria &&
    confirm("¿Estás seguro de que deseas eliminar esta subcategoría?")
  ) {
    categoria.subcategorias = categoria.subcategorias.filter(
      (sub) => sub.id !== subcategoriaId
    );
    renderizarCategorias();

    // Aquí podrías añadir código para eliminar la subcategoría en el servidor
    // mediante una petición DELETE a tu API
  }
}

// Función para crear un icono con texto
function crearIcono(texto, clase, funcionOnClick) {
  const span = document.createElement("span");
  span.className = `material-symbols-outlined ${clase}`;
  span.textContent = texto;

  if (funcionOnClick) {
    span.onclick = funcionOnClick;
  }

  return span;
}

// Función para crear el header de la tarjeta de categoría
function crearCategoriaHeader(categoria) {
  const header = document.createElement("div");
  header.className = "categoria-card-header";

  // Crear el título de la categoría
  const titulo = document.createElement("h3");
  titulo.className = "categoria-name";
  titulo.textContent = categoria.nombre;

  // Crear el contenedor de botones
  const botonesContainer = document.createElement("div");
  botonesContainer.className = "categoria-btns-container";

  // Botón de editar
  const botonEditar = crearIcono("edit", "edit-btn", () =>
    editarCategoria(categoria.id)
  );

  // Botón de eliminar
  const botonEliminar = crearIcono("delete", "delete-btn", () =>
    eliminarCategoria(categoria.id)
  );

  // Agregar botones al contenedor
  botonesContainer.appendChild(botonEditar);
  botonesContainer.appendChild(botonEliminar);

  // Agregar elementos al header
  header.appendChild(titulo);
  header.appendChild(botonesContainer);

  return header;
}

// Función para crear una subcategoría
function crearSubcategoria(categoria, subcategoria) {
  const subcategoriaDiv = document.createElement("div");
  subcategoriaDiv.className = "subcategoria";
  subcategoriaDiv.dataset.id = subcategoria.id;

  // Nombre de la subcategoría
  const nombre = document.createElement("p");
  nombre.className = "subcategoria-name";
  nombre.textContent = subcategoria.nombre;

  // Contenedor de botones
  const botonesContainer = document.createElement("div");
  botonesContainer.className = "subcategoria-btns-container";

  // Botón de editar
  const botonEditar = crearIcono("edit", "edit-btn", () =>
    editarSubcategoria(categoria.id, subcategoria.id)
  );

  // Botón de eliminar
  const botonEliminar = crearIcono("delete", "delete-btn", () =>
    eliminarSubcategoria(categoria.id, subcategoria.id)
  );

  // Agregar botones al contenedor
  botonesContainer.appendChild(botonEditar);
  botonesContainer.appendChild(botonEliminar);

  // Agregar elementos a la subcategoría
  subcategoriaDiv.appendChild(nombre);
  subcategoriaDiv.appendChild(botonesContainer);

  return subcategoriaDiv;
}

// Función para crear el contenedor de subcategorías
function crearSubcategoriasContainer(categoria) {
  const container = document.createElement("div");
  container.className = "subcategorias-container";

  // Agregar cada subcategoría
  categoria.subcategorias.forEach((subcategoria) => {
    const subcategoriaElement = crearSubcategoria(categoria, subcategoria);
    container.appendChild(subcategoriaElement);
  });

  return container;
}

// Función para crear el botón de agregar subcategoría
function crearBotonAgregarSubcategoria(categoriaId) {
  const container = document.createElement("div");
  container.className = "categoria-card-btn-container";

  const botonAgregar = crearIcono("add", "add-btn", () =>
    addSubcategoria(categoriaId)
  );

  container.appendChild(botonAgregar);

  return container;
}

// Función para crear una tarjeta de categoría completa
function crearCategoriaCard(categoria) {
  const card = document.createElement("div");
  card.className = "categoria-card";
  card.dataset.id = categoria.id;

  // Crear y agregar el header
  const header = crearCategoriaHeader(categoria);
  card.appendChild(header);

  // Crear y agregar el contenedor de subcategorías
  const subcategoriasContainer = crearSubcategoriasContainer(categoria);
  card.appendChild(subcategoriasContainer);

  // Crear y agregar el botón para agregar subcategorías
  const botonAgregar = crearBotonAgregarSubcategoria(categoria.id);
  card.appendChild(botonAgregar);

  return card;
}

// Función principal para renderizar todas las categorías
function renderizarCategorias() {
  const contenedor = document.querySelector(".categorias-cards-container");
  contenedor.innerHTML = ""; // Limpiar el contenedor

  // Crear y agregar cada tarjeta de categoría
  categorias.forEach((categoria) => {
    const categoriaCard = crearCategoriaCard(categoria);
    contenedor.appendChild(categoriaCard);
  });
}

// Al cargar la página, obtener categorías de la API
document.addEventListener("DOMContentLoaded", () => {
  obtenerCategorias();

  // Agregar event listener para el botón de agregar categoría
  const addCategoriaBtn = document.getElementById("addCategoriaBtn");
  if (addCategoriaBtn) {
    addCategoriaBtn.addEventListener("click", addCategoria);
  }
});
