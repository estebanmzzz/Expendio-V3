// Variables globales
let categorias = [];
let usuario_id = null; // Esto debería venir de tu sistema de autenticación

const userAvatar = document.querySelector(".user-avatar");

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "./profile.html";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

// Función principal que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente cargado");

  // Verificar que el contenedor existe
  const container = document.getElementById("categoriasContainer");
  console.log("Contenedor encontrado:", container);

  if (!container) {
    console.error(
      "Error crítico: No se encontró el contenedor #categoriasContainer en el DOM"
    );
    return;
  }

  // Obtener ID de usuario e inicializar datos
  try {
    usuario_id = getUserId();
    console.log("ID de usuario obtenido:", usuario_id);

    // Obtener categorías del servidor
    obtenerCategorias(usuario_id);
  } catch (error) {
    console.error("Error al inicializar:", error);
    // Manejo de error si no hay usuario en sesión
    const errorMsg = document.createElement("div");
    errorMsg.className = "error-message";
    errorMsg.textContent =
      "Error al cargar las categorías. Por favor, inicia sesión nuevamente.";
    container.appendChild(errorMsg);
  }
});

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) {
    throw new Error("No se encontró información de usuario en la sesión");
  }
  return user.id;
}

// Modifica la función obtenerCategorias para usar data.categories
function obtenerCategorias(usuario_id) {
  console.log("Obteniendo categorías para usuario:", usuario_id);

  fetch(`http://localhost:5000/api/categorias/usuario/${usuario_id}`)
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
      // Verificar si hay categorías antes de procesarlas
      //      if (data.categories && Array.isArray(data.categories)) {
      if (Array.isArray(data)) {
        //procesarDatosAPI(data.categories);
        procesarDatosAPI(data);
      } else {
        console.log("No se encontraron categorías en la respuesta");
        // Si no hay categorías, inicializa categorias como un array vacío
        categorias = [];
      }
      renderizarCategorias();
    })
    .catch((error) => {
      console.error("Error al obtener categorías:", error);
      // Mostrar mensaje de error en la interfaz
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

    // Crear objeto con datos para enviar al servidor
    const categoriaData = {
      nombre: nombreCategoria.trim(),
      categoria_padre_id: null,
      usuario_id: usuario_id,
    };

    // Enviar datos al servidor
    fetch("http://localhost:5000/api/categorias", {
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
        // Recargar categorías después de agregar
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

// Función para editar una categoría
function editarCategoria(categoriaId) {
  console.log("Editando categoría con ID:", categoriaId);

  // Buscar la categoría tanto en el array local como por ID
  const categoriaEncontrada = buscarCategoriaEnArbol(categoriaId);

  if (!categoriaEncontrada) {
    console.error("No se encontró la categoría con ID:", categoriaId);
    alert("No se pudo encontrar la categoría para editar.");
    return;
  }

  // Verificar si es una categoría por defecto (usuario_id = 0)
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

    // Crear objeto con datos para enviar al servidor
    const categoriaData = {
      nombre: nuevoNombre.trim(),
      usuario_id: usuario_id,
    };

    // Enviar datos al servidor
    fetch(`http://localhost:5000/api/categorias/${categoriaId}`, {
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
        // Recargar categorías después de editar
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

// Función auxiliar para buscar una categoría en todo el árbol
function buscarCategoriaEnArbol(categoriaId) {
  // Primero buscamos en las categorías principales
  let categoriaEncontrada = categorias.find((cat) => cat.id === categoriaId);

  // Si no la encontramos, buscamos en las subcategorías
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

// Función para eliminar una categoría
function eliminarCategoria(categoriaId) {
  console.log("Eliminando categoría con ID:", categoriaId);

  // Buscar la categoría para verificar si es por defecto
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
    // Enviar solicitud de eliminación al servidor
    fetch(`http://localhost:5000/api/categorias/${categoriaId}`, {
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
        // Recargar categorías después de eliminar
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

// Función para agregar una subcategoría
function addSubcategoria(categoriaId) {
  console.log("Agregando subcategoría a categoría con ID:", categoriaId);

  // Buscar la categoría principal para verificar si es por defecto
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

    // Crear objeto con datos para enviar al servidor
    const subcategoriaData = {
      nombre: nombreSubcategoria.trim(),
      categoria_padre_id: categoriaId,
      usuario_id: usuario_id,
    };

    // Enviar datos al servidor
    fetch("http://localhost:5000/api/categorias", {
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
        // Recargar categorías después de agregar
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

// Función para crear el header de la tarjeta de categoría
function crearCategoriaHeader(categoria) {
  const header = document.createElement("div");
  header.className = "categoria-card-header";

  // Crear el título de la categoría
  const titulo = document.createElement("h3");
  titulo.className = "categoria-name";
  titulo.textContent = categoria.nombre;

  // Agregar un indicador visual si es una categoría por defecto
  if (categoria.usuario_id === 0) {
    titulo.classList.add("categoria-default");
    // También puedes agregar un pequeño badge o icono
    const defaultBadge = document.createElement("span");
    defaultBadge.className = "default-badge";
    defaultBadge.textContent = "Default";
    titulo.appendChild(defaultBadge);
  }

  // Crear el contenedor de botones
  const botonesContainer = document.createElement("div");
  botonesContainer.className = "categoria-btns-container";

  // Mostrar botones solo si no es una categoría por defecto
  if (categoria.usuario_id !== 0) {
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
  }

  // Agregar elementos al header
  header.appendChild(titulo);
  header.appendChild(botonesContainer);

  return header;
}

// Función para crear un icono material-symbols
function crearIcono(nombre, clase, onClick) {
  const icono = document.createElement("span");
  icono.className = `material-symbols-outlined ${clase}`;
  icono.textContent = nombre;
  if (onClick) {
    icono.addEventListener("click", onClick);
    icono.style.cursor = "pointer";
  }
  return icono;
}

// Actualizar la función procesarDatosAPI para incluir el usuario_id
function procesarDatosAPI(data) {
  console.log("Procesando datos de API:", data.length, "elementos");

  // Resetear categorías
  categorias = [];

  // Primero identificar todas las categorías principales (las que tienen categoria_padre_id = null)
  const categoriasPrincipales = data.filter(
    (cat) => cat.categoria_padre_id === null
  );

  console.log(
    "Categorías principales encontradas:",
    categoriasPrincipales.length
  );

  // Para cada categoría principal, crear un objeto con el formato requerido
  categoriasPrincipales.forEach((catPrincipal) => {
    const subcategorias = data
      .filter((item) => item.categoria_padre_id === catPrincipal.categoria_id)
      .map((subcat) => {
        return {
          id: subcat.categoria_id,
          nombre: subcat.nombre,
          usuario_id: subcat.usuario_id, // Importante: Incluir el usuario_id
        };
      });

    const categoria = {
      id: catPrincipal.categoria_id,
      nombre: catPrincipal.nombre,
      usuario_id: catPrincipal.usuario_id, // Importante: Incluir el usuario_id
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

function renderizarCategorias() {
  console.log("Renderizando categorías...");
  const contenedor = document.getElementById("categoriasContainer");

  if (!contenedor) {
    console.error("No se encontró el contenedor de categorías.");
    return;
  }

  console.log("Contenedor encontrado, limpiando contenido anterior");
  contenedor.innerHTML = ""; // Limpiar contenedor antes de renderizar

  // Renderizar mensaje si no hay categorías
  if (categorias.length === 0) {
    console.log("No hay categorías para mostrar");
    const mensaje = document.createElement("div");
    mensaje.className = "no-categorias";
    mensaje.textContent = "No hay categorías disponibles.";
    contenedor.appendChild(mensaje);
    return;
  }

  console.log(`Renderizando ${categorias.length} categorías`);

  // Renderizar cada categoría
  categorias.forEach((categoria) => {
    console.log(
      `Renderizando categoría: ${categoria.nombre} con ${categoria.subcategorias.length} subcategorías`
    );

    const categoriaCard = document.createElement("div");
    categoriaCard.className = "categoria-card";

    // Crear y agregar el header de la categoría
    const header = crearCategoriaHeader(categoria);
    categoriaCard.appendChild(header);

    // Crear contenedor para subcategorías
    const subcontainer = document.createElement("div");
    subcontainer.className = "subcategorias-container";
    categoriaCard.appendChild(subcontainer);

    // Renderizar subcategorías si hay alguna
    if (categoria.subcategorias && categoria.subcategorias.length > 0) {
      console.log(
        `Renderizando ${categoria.subcategorias.length} subcategorías para ${categoria.nombre}`
      );

      categoria.subcategorias.forEach((subcategoria) => {
        const subItem = document.createElement("div");
        subItem.className = "subcategoria";

        // Crear nombre de subcategoría
        const nombre = document.createElement("p");
        nombre.className = "subcategoria-name";
        nombre.textContent = subcategoria.nombre;
        subItem.appendChild(nombre);

        // Mostrar botones solo si no es una subcategoría por defecto
        if (subcategoria.usuario_id !== 0) {
          const btnContainer = document.createElement("div");
          btnContainer.className = "subcategoria-btns-container";

          // Botón editar
          const editBtn = crearIcono("edit", "edit-btn", () =>
            editarCategoria(subcategoria.id)
          );

          // Botón eliminar
          const deleteBtn = crearIcono("delete", "delete-btn", () =>
            eliminarCategoria(subcategoria.id)
          );

          btnContainer.appendChild(editBtn);
          btnContainer.appendChild(deleteBtn);
          subItem.appendChild(btnContainer);
        }

        subcontainer.appendChild(subItem);
      });
    }

    // Crear botón de agregar subcategoría
    const btnContainer = document.createElement("div");
    btnContainer.className = "categoria-card-btn-container";

    const addBtn = crearIcono("add", "add-btn", () =>
      addSubcategoria(categoria.id)
    );

    btnContainer.appendChild(addBtn);
    categoriaCard.appendChild(btnContainer);

    contenedor.appendChild(categoriaCard);
  });

  console.log("Renderización de categorías completada");
}

// Log inicial para verificar que el script se cargó correctamente
console.log("Script de categorías cargado correctamente");
