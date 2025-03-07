let categorias = [];
let usuario_id = null;

const userAvatar = document.querySelector(".user-avatar");

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "./profile.html";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
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

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) {
    throw new Error("No se encontró información de usuario en la sesión");
  }
  return user.id;
}

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

function crearCategoriaHeader(categoria) {
  const header = document.createElement("div");
  header.className = "categoria-card-header";

  const titulo = document.createElement("h3");
  titulo.className = "categoria-name";
  titulo.textContent = categoria.nombre;

  if (categoria.usuario_id === 0) {
    titulo.classList.add("categoria-default");
    const defaultBadge = document.createElement("span");
    defaultBadge.className = "default-badge";
    defaultBadge.textContent = "Default";
    titulo.appendChild(defaultBadge);
  }

  const botonesContainer = document.createElement("div");
  botonesContainer.className = "categoria-btns-container";

  if (categoria.usuario_id !== 0) {
    const botonEditar = crearIcono("edit", "edit-btn", () =>
      editarCategoria(categoria.id)
    );

    const botonEliminar = crearIcono("delete", "delete-btn", () =>
      eliminarCategoria(categoria.id)
    );

    botonesContainer.appendChild(botonEditar);
    botonesContainer.appendChild(botonEliminar);
  }

  header.appendChild(titulo);
  header.appendChild(botonesContainer);

  return header;
}

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

  categorias.forEach((categoria) => {
    console.log(
      `Renderizando categoría: ${categoria.nombre} con ${categoria.subcategorias.length} subcategorías`
    );

    const categoriaCard = document.createElement("div");
    categoriaCard.className = "categoria-card";

    const header = crearCategoriaHeader(categoria);
    categoriaCard.appendChild(header);

    const subcontainer = document.createElement("div");
    subcontainer.className = "subcategorias-container";
    categoriaCard.appendChild(subcontainer);

    if (categoria.subcategorias && categoria.subcategorias.length > 0) {
      console.log(
        `Renderizando ${categoria.subcategorias.length} subcategorías para ${categoria.nombre}`
      );

      categoria.subcategorias.forEach((subcategoria) => {
        const subItem = document.createElement("div");
        subItem.className = "subcategoria";

        const nombre = document.createElement("p");
        nombre.className = "subcategoria-name";
        nombre.textContent = subcategoria.nombre;
        subItem.appendChild(nombre);

        if (subcategoria.usuario_id !== 0) {
          const btnContainer = document.createElement("div");
          btnContainer.className = "subcategoria-btns-container";

          const editBtn = crearIcono("edit", "edit-btn", () =>
            editarCategoria(subcategoria.id)
          );

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

console.log("Script de categorías cargado correctamente");
