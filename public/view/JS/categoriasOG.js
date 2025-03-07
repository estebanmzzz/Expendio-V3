// Variables globales
let categorias = [];
let usuario_id = null; // Esto debería venir de tu sistema de autenticación

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  return user.id; // Corregido
}

usuario_id = getUserId();

// Modifica la función obtenerCategorias para usar data.categories
function obtenerCategorias(usuario_id) {
  fetch(`http://localhost:5000/api/categorias/usuario/${usuario_id}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Datos recibidos:", data);
      // Verificar si hay categorías antes de procesarlas
      if (data.categories && Array.isArray(data.categories)) {
        procesarDatosAPI(data.categories);
      } else {
        // Si no hay categorías, inicializa categorias como un array vacío
        categorias = [];
      }
      renderizarCategorias();
    })
    .catch((error) => {
      console.error("Error al obtener categorías:", error);
    });
}

// Además, en addCategoria, asegúrate de pasar el usuario_id a obtenerCategorias
function addCategoria() {
  const nombreCategoria = prompt("Ingresa el nombre de la nueva categoría:");

  if (nombreCategoria && nombreCategoria.trim() !== "") {
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
      .then((response) => response.json())
      .then((data) => {
        console.log("Categoría creada:", data);
        // Recargar categorías después de agregar
        obtenerCategorias(usuario_id); // Pasando el usuario_id
      })
      .catch((error) => {
        console.error("Error al crear categoría:", error);
      });
  }
}

// Función para editar una categoría
function editarCategoria(categoriaId) {
  // Buscar la categoría tanto en el array local como por ID
  const categoria = categorias.find((cat) =>
    cat.subcategorias.length === 0
      ? cat.id === categoriaId
      : cat.id === categoriaId ||
        cat.subcategorias.some((sub) => sub.id === categoriaId)
  );

  if (categoria) {
    // Verificar si es una categoría por defecto (usuario_id = 0)
    if (categoria.usuario_id === 0) {
      alert("No se pueden modificar las categorías por defecto.");
      return;
    }

    const nuevoNombre = prompt(
      "Editar nombre de la categoría:",
      categoria.nombre
    );

    if (nuevoNombre && nuevoNombre.trim() !== "") {
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
          obtenerCategorias();
        })
        .catch((error) => {
          console.error("Error al actualizar categoría:", error);
          alert(
            "No se pudo actualizar la categoría. Puede que no tengas permisos para modificarla."
          );
        });
    }
  }
}

// Función para eliminar una categoría
function eliminarCategoria(categoriaId) {
  // Buscar la categoría para verificar si es por defecto
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (categoria && categoria.usuario_id === 0) {
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
        obtenerCategorias();
      })
      .catch((error) => {
        console.error("Error al eliminar categoría:", error);
        alert(
          "No se pudo eliminar la categoría. Puede que no tengas permisos para eliminarla."
        );
      });
  }
}

// Función para agregar una subcategoría
function addSubcategoria(categoriaId) {
  // Buscar la categoría principal para verificar si es por defecto
  const categoria = categorias.find((cat) => cat.id === categoriaId);

  if (categoria && categoria.usuario_id === 0) {
    alert("No se pueden agregar subcategorías a las categorías por defecto.");
    return;
  }

  const nombreSubcategoria = prompt(
    "Ingresa el nombre de la nueva subcategoría:"
  );

  if (nombreSubcategoria && nombreSubcategoria.trim() !== "") {
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
      .then((response) => response.json())
      .then((data) => {
        console.log("Subcategoría creada:", data);
        // Recargar categorías después de agregar
        obtenerCategorias();
      })
      .catch((error) => {
        console.error("Error al crear subcategoría:", error);
      });
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

// Actualizar la función procesarDatosAPI para incluir el usuario_id
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

  console.log("Categorías procesadas:", categorias);
}

/* function renderizarCategorias() {
  console.log("Renderizando categorías...");
  const contenedor = document.getElementById("categoriasContainer");

  if (!contenedor) {
    console.error("No se encontró el contenedor de categorías.");
    return;
  }

  contenedor.innerHTML = ""; // Limpiar contenedor antes de renderizar

  // Renderizar mensaje si no hay categorías
  if (categorias.length === 0) {
    const mensaje = document.createElement("div");
    mensaje.className = "no-categorias";
    mensaje.textContent = "No hay categorías disponibles.";
    contenedor.appendChild(mensaje);
    return;
  }

  // Renderizar cada categoría
  categorias.forEach((categoria) => {
    const categoriaCard = document.createElement("div");
    categoriaCard.className = "categoria-card";

    // Crear y agregar el header de la categoría
    const header = crearCategoriaHeader(categoria);
    categoriaCard.appendChild(header);

    // Crear contenedor para subcategorías si hay alguna
    if (categoria.subcategorias && categoria.subcategorias.length > 0) {
      const subcontainer = document.createElement("div");
      subcontainer.className = "subcategorias-container";

      // Renderizar cada subcategoría
      categoria.subcategorias.forEach((subcategoria) => {
        const subcard = document.createElement("div");
        subcard.className = "subcategoria-card";

        // Crear nombre de subcategoría
        const nombre = document.createElement("span");
        nombre.textContent = subcategoria.nombre;
        subcard.appendChild(nombre);

        // Mostrar botones solo si no es una subcategoría por defecto
        if (subcategoria.usuario_id !== 0) {
          const btnContainer = document.createElement("div");
          btnContainer.className = "subcategoria-btns";

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
          subcard.appendChild(btnContainer);
        }

        subcontainer.appendChild(subcard);
      });

      categoriaCard.appendChild(subcontainer);
    }

    // Crear botón de agregar subcategoría solo si no es una categoría por defecto
    if (categoria.usuario_id !== 0) {
      const addSubBtn = document.createElement("button");
      addSubBtn.className = "add-subcategoria-btn";
      addSubBtn.textContent = "Agregar Subcategoría";
      addSubBtn.onclick = () => addSubcategoria(categoria.id);
      categoriaCard.appendChild(addSubBtn);
    }

    contenedor.appendChild(categoriaCard);
  });
} */

function renderizarCategorias() {
  console.log("Renderizando categorías...");
  const contenedor = document.getElementById("categoriasContainer");

  if (!contenedor) {
    console.error("No se encontró el contenedor de categorías.");
    return;
  }

  contenedor.innerHTML = ""; // Limpiar contenedor antes de renderizar

  // Renderizar mensaje si no hay categorías
  if (categorias.length === 0) {
    const mensaje = document.createElement("div");
    mensaje.className = "no-categorias";
    mensaje.textContent = "No hay categorías disponibles.";
    contenedor.appendChild(mensaje);
    return;
  }

  // Renderizar cada categoría
  categorias.forEach((categoria) => {
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
}
