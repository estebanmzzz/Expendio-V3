// Variables globales
let categorias = [];
let usuario_id = null; // Esto debería venir de tu sistema de autenticación

// Función para obtener las categorías desde la API
function obtenerCategorias() {
  // Obtener el ID del usuario de alguna parte (localStorage, sessionStorage, etc.)
  usuario_id = localStorage.getItem("usuario_id") || 1; // Ejemplo, ajusta según tu sistema

  fetch(`http://localhost:5000/api/categorias/usuario/${usuario_id}`)
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

// Función para agregar una nueva categoría
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
        obtenerCategorias();
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
