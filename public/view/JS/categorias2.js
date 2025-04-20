let categorias = [];
let usuario_id = null;

const userAvatar = document.querySelector(".user-avatar");

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

const addCategoryButton = document.getElementById("addCategoryButton");

if (addCategoryButton) {
  addCategoryButton.addEventListener("click", () => addCategoria());
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente cargado");

  const container = document.getElementById("categoriasContainer");
  console.log("Contenedor encontrado:", container);

  if (!container) {
    console.error(
      "Error crítico: No se encontró el contenedor #categoriasContainer en el DOM"
    );
    return;
  }

  // Agregar botones de acción masiva
  agregarBotonesAccionMasiva();

  try {
    usuario_id = getUserId();
    console.log("ID de usuario obtenido:", usuario_id);

    obtenerCategorias(usuario_id);
  } catch (error) {
    console.error("Error al inicializar:", error);

    const errorMsg = document.createElement("div");
    errorMsg.className = "error-message";
    errorMsg.textContent =
      "Error al cargar las categorías. Por favor, inicia sesión nuevamente.";
    container.appendChild(errorMsg);
  }
});

// Función para agregar botones de acción masiva
function agregarBotonesAccionMasiva() {
  const sectionHeader = document.querySelector(".section-header");

  if (!sectionHeader) {
    console.error("No se encontró el encabezado de sección");
    return;
  }

  const botonesContainer = document.createElement("div");
  botonesContainer.className = "bulk-actions";

  botonesContainer.innerHTML = `
    <button id="expandirTodoBtn" class="bulk-action-btn">
      <span class="material-symbols-outlined">unfold_more</span>
      Expandir todas
    </button>
    <button id="colapsarTodoBtn" class="bulk-action-btn">
      <span class="material-symbols-outlined">unfold_less</span>
      Colapsar todas
    </button>
  `;

  // Insertar después de los botones de héroe
  const heroButtons = sectionHeader.querySelector(".hero-buttons");
  if (heroButtons) {
    heroButtons.parentNode.insertBefore(
      botonesContainer,
      heroButtons.nextSibling
    );
  } else {
    sectionHeader.appendChild(botonesContainer);
  }

  // Agregar event listeners
  document
    .getElementById("expandirTodoBtn")
    .addEventListener("click", expandirTodasCategorias);
  document
    .getElementById("colapsarTodoBtn")
    .addEventListener("click", colapsarTodasCategorias);
}

function expandirTodasCategorias() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.add("active");
  });
}

function colapsarTodasCategorias() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.remove("active");
  });
}

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) {
    throw new Error("No se encontró información de usuario en la sesión");
  }
  return user.id;
}

function obtenerCategorias(usuario_id) {
  console.log("Obteniendo categorías para usuario:", usuario_id);

  fetch(`http://localhost:3000/api/categorias/usuario/${usuario_id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error en la respuesta del servidor: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      console.log("Datos recibidos:", data);

      if (Array.isArray(data)) {
        procesarDatosAPI(data);
      } else {
        console.log("No se encontraron categorías en la respuesta");
        categorias = [];
      }
      renderizarCategorias();
    })
    .catch((error) => {
      console.error("Error al obtener categorías:", error);
      const container = document.getElementById("categoriasContainer");
      if (container) {
        container.innerHTML = `<div class="error-fetch">Error al cargar las categorías: ${error.message}</div>`;
      }
    });
}

function addCategoria() {
  const nombreCategoria = prompt("Ingresa el nombre de la nueva categoría:");

  if (nombreCategoria && nombreCategoria.trim() !== "") {
    console.log("Creando nueva categoría:", nombreCategoria.trim());

    const categoriaData = {
      nombre: nombreCategoria.trim(),
      categoria_padre_id: null,
      usuario_id: usuario_id,
    };

    fetch("http://localhost:3000/api/categorias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoriaData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error en la respuesta del servidor: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Categoría creada con éxito:", data);
        obtenerCategorias(usuario_id);
      })
      .catch((error) => {
        console.error("Error al crear categoría:", error);
        alert(`Error al crear la categoría: ${error.message}`);
      });
  } else {
    console.log("Creación de categoría cancelada o nombre vacío");
  }
}

function editarCategoria(categoriaId) {
  console.log("Editando categoría con ID:", categoriaId);

  const categoriaEncontrada = buscarCategoriaEnArbol(categoriaId);

  if (!categoriaEncontrada) {
    console.error("No se encontró la categoría con ID:", categoriaId);
    alert("No se pudo encontrar la categoría para editar.");
    return;
  }

  if (categoriaEncontrada.usuario_id === 0) {
    console.log("Intento de editar categoría por defecto rechazado");
    alert("No se pueden modificar las categorías por defecto.");
    return;
  }

  const nuevoNombre = prompt(
    "Editar nombre de la categoría:",
    categoriaEncontrada.nombre
  );

  if (nuevoNombre && nuevoNombre.trim() !== "") {
    console.log("Actualizando nombre a:", nuevoNombre.trim());

    const categoriaData = {
      nombre: nuevoNombre.trim(),
      usuario_id: usuario_id,
    };

    fetch(`http://localhost:3000/api/categorias/${categoriaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoriaData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Categoría actualizada:", data);
        obtenerCategorias(usuario_id);
      })
      .catch((error) => {
        console.error("Error al actualizar categoría:", error);
        alert(
          "No se pudo actualizar la categoría. Puede que no tengas permisos para modificarla."
        );
      });
  } else {
    console.log("Edición de categoría cancelada o nombre vacío");
  }
}

function buscarCategoriaEnArbol(categoriaId) {
  let categoriaEncontrada = categorias.find((cat) => cat.id === categoriaId);

  if (!categoriaEncontrada) {
    for (const categoria of categorias) {
      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        const subEncontrada = categoria.subcategorias.find(
          (sub) => sub.id === categoriaId
        );
        if (subEncontrada) {
          return subEncontrada;
        }
      }
    }
  }

  return categoriaEncontrada;
}

function eliminarCategoria(categoriaId) {
  console.log("Eliminando categoría con ID:", categoriaId);

  const categoriaEncontrada = buscarCategoriaEnArbol(categoriaId);

  if (!categoriaEncontrada) {
    console.error("No se encontró la categoría con ID:", categoriaId);
    alert("No se pudo encontrar la categoría para eliminar.");
    return;
  }

  if (categoriaEncontrada.usuario_id === 0) {
    console.log("Intento de eliminar categoría por defecto rechazado");
    alert("No se pueden eliminar las categorías por defecto.");
    return;
  }

  if (
    confirm(
      "¿Estás seguro de que deseas eliminar esta categoría y todas sus subcategorías?"
    )
  ) {
    fetch(`http://localhost:3000/api/categorias/${categoriaId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usuario_id: usuario_id }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Categoría eliminada:", data);
        obtenerCategorias(usuario_id);
      })
      .catch((error) => {
        console.error("Error al eliminar categoría:", error);
        alert(
          "No se pudo eliminar la categoría. Puede que no tengas permisos para eliminarla."
        );
      });
  } else {
    console.log("Eliminación de categoría cancelada por el usuario");
  }
}

function addSubcategoria(categoriaId) {
  console.log("Agregando subcategoría a categoría con ID:", categoriaId);

  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (!categoria) {
    console.error("No se encontró la categoría padre con ID:", categoriaId);
    alert("No se pudo encontrar la categoría padre.");
    return;
  }

  if (categoria.usuario_id === 0) {
    console.log(
      "Intento de agregar subcategoría a categoría por defecto rechazado"
    );
    alert("No se pueden agregar subcategorías a las categorías por defecto.");
    return;
  }

  const nombreSubcategoria = prompt(
    "Ingresa el nombre de la nueva subcategoría:"
  );

  if (nombreSubcategoria && nombreSubcategoria.trim() !== "") {
    console.log("Creando nueva subcategoría:", nombreSubcategoria.trim());

    const subcategoriaData = {
      nombre: nombreSubcategoria.trim(),
      categoria_padre_id: categoriaId,
      usuario_id: usuario_id,
    };

    fetch("http://localhost:3000/api/categorias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subcategoriaData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error en la respuesta del servidor: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Subcategoría creada:", data);
        obtenerCategorias(usuario_id);
      })
      .catch((error) => {
        console.error("Error al crear subcategoría:", error);
        alert(`Error al crear la subcategoría: ${error.message}`);
      });
  } else {
    console.log("Creación de subcategoría cancelada o nombre vacío");
  }
}

function crearBoton(nombreIcono, clase, onClick) {
  const boton = document.createElement("button");
  boton.className = clase;

  const icono = document.createElement("span");
  icono.className = "material-symbols-outlined";
  icono.textContent = nombreIcono;

  boton.appendChild(icono);

  if (onClick) {
    boton.addEventListener("click", onClick);
  }

  return boton;
}

function procesarDatosAPI(data) {
  console.log("Procesando datos de API:", data.length, "elementos");

  categorias = [];

  const categoriasPrincipales = data.filter(
    (cat) => cat.categoria_padre_id === null
  );

  console.log(
    "Categorías principales encontradas:",
    categoriasPrincipales.length
  );

  categoriasPrincipales.forEach((catPrincipal) => {
    const subcategorias = data
      .filter((item) => item.categoria_padre_id === catPrincipal.categoria_id)
      .map((subcat) => {
        return {
          id: subcat.categoria_id,
          nombre: subcat.nombre,
          usuario_id: subcat.usuario_id,
        };
      });

    const categoria = {
      id: catPrincipal.categoria_id,
      nombre: catPrincipal.nombre,
      usuario_id: catPrincipal.usuario_id,
      subcategorias: subcategorias,
    };

    categorias.push(categoria);
  });

  console.log(
    "Categorías procesadas:",
    categorias.length,
    "con estructura:",
    categorias.map(
      (c) => `${c.nombre} (${c.subcategorias.length} subcategorías)`
    )
  );
}

function crearCategoriaHeader(categoria) {
  const header = document.createElement("div");
  header.className = "category-card-header";

  // Crear contenedor flexible para título y acciones
  const headerContent = document.createElement("div");
  headerContent.className = "header-content";
  header.appendChild(headerContent);

  // Añadir título
  const titulo = document.createElement("h3");
  titulo.className = "category-title";
  titulo.textContent = categoria.nombre;

  if (categoria.usuario_id === 0) {
    titulo.classList.add("categoria-default");
    const defaultBadge = document.createElement("span");
    defaultBadge.className = "default-badge";
    defaultBadge.textContent = "Predefinida";
    titulo.appendChild(defaultBadge);
  }

  headerContent.appendChild(titulo);

  // Agregar botones de editar/eliminar para categorías que no son por defecto
  if (categoria.usuario_id !== 0) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "category-actions";

    const editBtn = crearBoton("edit", "category-btn edit-btn", (e) => {
      e.stopPropagation(); // Evitar que se propague el clic al header
      editarCategoria(categoria.id);
    });

    const deleteBtn = crearBoton("delete", "category-btn delete-btn", (e) => {
      e.stopPropagation(); // Evitar que se propague el clic al header
      eliminarCategoria(categoria.id);
    });

    actionsContainer.appendChild(editBtn);
    actionsContainer.appendChild(deleteBtn);
    headerContent.appendChild(actionsContainer);
  }

  // Añadir flecha de expansión
  const expandIcon = document.createElement("span");
  expandIcon.className = "expand-icon material-symbols-outlined";
  expandIcon.textContent = "expand_more";
  header.appendChild(expandIcon);

  // Añadir evento de clic para expandir/colapsar
  header.addEventListener("click", function () {
    // Alternar la clase active en esta categoría
    const card = header.parentElement;
    card.classList.toggle("active");

    // Cambiar el icono según el estado
    expandIcon.textContent = card.classList.contains("active")
      ? "expand_less"
      : "expand_more";
  });

  return header;
}

function renderizarCategorias() {
  console.log("Renderizando categorías...");
  const contenedor = document.getElementById("categoriasContainer");

  if (!contenedor) {
    console.error("No se encontró el contenedor de categorías.");
    return;
  }

  console.log("Contenedor encontrado, limpiando contenido anterior");
  contenedor.innerHTML = "";

  if (categorias.length === 0) {
    console.log("No hay categorías para mostrar");
    const mensaje = document.createElement("div");
    mensaje.className = "no-categorias";
    mensaje.textContent = "No hay categorías disponibles.";
    contenedor.appendChild(mensaje);
    return;
  }

  console.log(`Renderizando ${categorias.length} categorías`);

  // Separar categorías del usuario y categorías predefinidas
  const categoriasUsuario = categorias.filter((cat) => cat.usuario_id !== 0);
  const categoriasPredefinidas = categorias.filter(
    (cat) => cat.usuario_id === 0
  );

  // Crear contenedor de columnas
  const columnContainer = document.createElement("div");
  columnContainer.className = "category-columns";
  contenedor.appendChild(columnContainer);

  // Crear columna para categorías del usuario
  const columnaUsuario = document.createElement("div");
  columnaUsuario.className = "category-column user-categories-column";
  columnContainer.appendChild(columnaUsuario);

  // Crear encabezado para columna de usuario
  const encabezadoUsuario = document.createElement("div");
  encabezadoUsuario.className = "column-header";
  encabezadoUsuario.innerHTML =
    '<h2 class="categories-section-title">Tus Categorías</h2>';
  columnaUsuario.appendChild(encabezadoUsuario);

  // Crear grid para categorías de usuario
  const gridUsuario = document.createElement("div");
  gridUsuario.className = "categories-grid";
  columnaUsuario.appendChild(gridUsuario);

  // Renderizar categorías del usuario
  if (categoriasUsuario.length === 0) {
    const mensaje = document.createElement("div");
    mensaje.className = "no-categorias";
    mensaje.textContent = "No has creado categorías personalizadas todavía.";
    gridUsuario.appendChild(mensaje);
  } else {
    categoriasUsuario.forEach((categoria) => {
      const categoriaCard = crearTarjetaCategoria(categoria);
      gridUsuario.appendChild(categoriaCard);
    });
  }

  // Crear columna para categorías predefinidas
  const columnaPredefinidas = document.createElement("div");
  columnaPredefinidas.className =
    "category-column predefined-categories-column";
  columnContainer.appendChild(columnaPredefinidas);

  // Crear encabezado para columna de predefinidas
  const encabezadoPredefinidas = document.createElement("div");
  encabezadoPredefinidas.className = "column-header predefined-header";

  const tituloPredefinidas = document.createElement("h2");
  tituloPredefinidas.className = "categories-section-title";
  tituloPredefinidas.textContent = "Categorías Predefinidas";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "toggle-predefined-btn";
  toggleBtn.innerHTML =
    '<span class="material-symbols-outlined">expand_more</span>';
  toggleBtn.addEventListener("click", () => {
    columnaPredefinidas.classList.toggle("expanded");
    toggleBtn.querySelector(".material-symbols-outlined").textContent =
      columnaPredefinidas.classList.contains("expanded")
        ? "expand_less"
        : "expand_more";
  });

  encabezadoPredefinidas.appendChild(tituloPredefinidas);
  encabezadoPredefinidas.appendChild(toggleBtn);
  columnaPredefinidas.appendChild(encabezadoPredefinidas);

  // Crear grid para categorías predefinidas
  const gridPredefinidas = document.createElement("div");
  gridPredefinidas.className = "categories-grid predefined-grid";
  columnaPredefinidas.appendChild(gridPredefinidas);

  // Renderizar categorías predefinidas
  categoriasPredefinidas.forEach((categoria) => {
    const categoriaCard = crearTarjetaCategoria(categoria);
    gridPredefinidas.appendChild(categoriaCard);
  });
}

function crearTarjetaCategoria(categoria) {
  const categoriaCard = document.createElement("div");
  categoriaCard.className = "category-card";

  if (categoria.usuario_id === 0) {
    categoriaCard.classList.add("predefined-card");
  }

  // Crear header
  const header = crearCategoriaHeader(categoria);
  categoriaCard.appendChild(header);

  // Crear contenedor de subcategorías
  const subcontainer = document.createElement("div");
  subcontainer.className = "subcategories-container";
  categoriaCard.appendChild(subcontainer);

  if (categoria.subcategorias && categoria.subcategorias.length > 0) {
    console.log(
      `Renderizando ${categoria.subcategorias.length} subcategorías para ${categoria.nombre}`
    );

    categoria.subcategorias.forEach((subcategoria) => {
      const subItem = document.createElement("div");
      subItem.className = "subcategory";

      if (subcategoria.usuario_id === 0) {
        subItem.classList.add("predefined-subcategory");
      }

      // Crear nombre de subcategoría
      const nombre = document.createElement("span");
      nombre.className = "subcategory-name";
      nombre.textContent = subcategoria.nombre;
      subItem.appendChild(nombre);

      if (subcategoria.usuario_id !== 0) {
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "subcategory-actions";

        const editBtn = crearBoton("edit", "subcategory-btn edit-btn", () =>
          editarCategoria(subcategoria.id)
        );

        const deleteBtn = crearBoton(
          "delete",
          "subcategory-btn delete-btn",
          () => eliminarCategoria(subcategoria.id)
        );

        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);
        subItem.appendChild(actionsContainer);
      } else {
        // Para subcategorías predefinidas, añadir un indicador visual
        const predefinedBadge = document.createElement("span");
        predefinedBadge.className = "subcategory-badge";
        predefinedBadge.textContent = "Predefinida";
        subItem.appendChild(predefinedBadge);
      }

      subcontainer.appendChild(subItem);
    });
  } else if (categoria.usuario_id !== 0) {
    // Solo mostrar mensaje de "No hay subcategorías" para categorías del usuario
    const mensaje = document.createElement("div");
    mensaje.className = "no-subcategories";
    mensaje.textContent = "No hay subcategorías";
    subcontainer.appendChild(mensaje);
  }

  // Solo añadir el botón de añadir subcategoría si la categoría no es por defecto
  if (categoria.usuario_id !== 0) {
    const addContainer = document.createElement("div");
    addContainer.className = "category-add-container";

    const addBtn = document.createElement("button");
    addBtn.className = "category-add-btn";
    addBtn.addEventListener("click", () => addSubcategoria(categoria.id));

    const addIcon = document.createElement("span");
    addIcon.className = "material-symbols-outlined";
    addIcon.textContent = "add";

    addBtn.appendChild(addIcon);
    addBtn.appendChild(document.createTextNode(" add"));

    addContainer.appendChild(addBtn);
    categoriaCard.appendChild(addContainer);
  }

  return categoriaCard;
}

console.log("Script de categorías cargado correctamente");
