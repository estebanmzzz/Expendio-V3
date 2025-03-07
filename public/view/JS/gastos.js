const expensesList = document.querySelector(".expenses-list");
const seeMoreButton = document.querySelector(".see-more-button");
const addExpenseForm = document.getElementById("add-expense-form");
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");

// Establecer la fecha de hoy por defecto en el campo de fecha
document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha_gasto");
  if (fechaInput) {
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    fechaInput.value = formattedDate;
  }
});

// Función para obtener el usuario_id desde sessionStorage
function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  console.log(user.id);
  return user.id;
}

// Función para formatear la fecha
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

// Función para formatear el monto
function formatAmount(amount) {
  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

// Función para renderizar los gastos
function renderExpenses(gastos) {
  // Ordenar gastos por fecha descendente (más recientes primero)
  const gastosOrdenados = [...gastos].sort((a, b) => {
    return new Date(b.fecha_gasto) - new Date(a.fecha_gasto);
  });

  expensesList.innerHTML = gastosOrdenados
    .map(
      (expense) => `
        <div class="expense-item">
          <span class="expense-title">${expense.descripcion}</span>
          <span class="expense-amount">${formatAmount(expense.monto)}</span>
          <div class="expense-category">
            <span class="main">${expense.categoria_nombre}</span>
            <span class="sub">${expense.subcategoria_nombre || ""}</span>
          </div>
          <span class="expense-date">${formatDate(expense.fecha_gasto)}</span>
        </div>
      `
    )
    .join("");
}

// Función para obtener los gastos desde la API
async function fetchGastos() {
  const userId = getUserId(); // Obtener el usuario_id desde sessionStorage

  if (!userId) {
    console.error("Usuario no encontrado en sessionStorage.");
    expensesList.innerHTML = "<p>Usuario no encontrado. Inicie sesión.</p>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/gastos/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const gastos = await response.json();
    console.log(gastos); // Verifica la estructura de la respuesta
    renderExpenses(gastos);
  } catch (error) {
    console.error("Error fetching gastos:", error);
    expensesList.innerHTML = "<p>Aún no has cargado ningún gasto.</p>";
  }
}

// Variable global para almacenar todas las categorías
let todasLasCategorias = [];

// Función para cargar las categorías en el dropdown
async function loadCategorias() {
  const userId = getUserId();

  if (!userId) {
    console.error("Usuario no encontrado en sessionStorage.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/categorias/usuario/${userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categorias = await response.json();
    console.log("Categorías cargadas:", categorias);

    // Guardar todas las categorías
    todasLasCategorias = categorias;

    // Limpiar opciones existentes
    categoriaSelect.innerHTML =
      '<option value="">Selecciona una categoría</option>';

    // Filtrar solo las categorías principales (aquellas sin categoria_padre_id o con categoria_padre_id = null)
    const categoriasPrincipales = categorias.filter(
      (cat) => !cat.categoria_padre_id
    );

    // Añadir categorías principales al select
    categoriasPrincipales.forEach((categoria) => {
      const option = document.createElement("option");
      option.value = categoria.categoria_id;
      option.textContent = categoria.nombre;
      categoriaSelect.appendChild(option);
    });

    // Escuchar cambios en la selección de categoría
    if (categoriaSelect) {
      categoriaSelect.addEventListener("change", updateSubcategorias);
    }
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

// Función para actualizar las subcategorías basándose en la categoría seleccionada
function updateSubcategorias() {
  // Limpiar opciones existentes
  subcategoriaSelect.innerHTML =
    '<option value="">Selecciona una subcategoría</option>';

  const categoriaId = categoriaSelect.value;

  if (!categoriaId) {
    subcategoriaSelect.disabled = true;
    return;
  }

  // Filtrar subcategorías basadas en la categoría seleccionada
  const subcategorias = todasLasCategorias.filter(
    (cat) => cat.categoria_padre_id == categoriaId
  );

  if (subcategorias.length > 0) {
    subcategoriaSelect.disabled = false;

    // Añadir subcategorías al select
    subcategorias.forEach((subcat) => {
      const option = document.createElement("option");
      option.value = subcat.categoria_id;
      option.textContent = subcat.nombre;
      subcategoriaSelect.appendChild(option);
    });
  } else {
    subcategoriaSelect.disabled = true;
    subcategoriaSelect.innerHTML =
      '<option value="">No hay subcategorías disponibles</option>';
  }
}

// Manejar envío del formulario
if (addExpenseForm) {
  addExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = getUserId();
    const categoriaId =
      document.getElementById("subcategoria").value ||
      document.getElementById("categoria").value; // Usar subcategoría si está seleccionada, si no usar categoría
    const monto = document.getElementById("monto").value;
    const descripcion = document.getElementById("descripcion").value;
    const fechaGasto = document.getElementById("fecha_gasto").value;

    if (!userId || !categoriaId || !monto) {
      alert("Por favor, completa todos los campos requeridos");
      return;
    }

    const expenseData = {
      usuario_id: userId,
      categoria_id: categoriaId,
      monto: parseFloat(monto),
      descripcion: descripcion,
      fecha_gasto: fechaGasto,
    };

    try {
      const response = await fetch("http://localhost:5000/api/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Gasto añadido:", result);

      // Limpiar el formulario
      addExpenseForm.reset();

      // Establecer fecha actual después de limpiar
      const today = new Date();
      const formattedDate = today.toISOString().substr(0, 10);
      document.getElementById("fecha_gasto").value = formattedDate;

      // Recargar la lista de gastos
      fetchGastos();

      // Deshabilitar el campo de subcategoría
      subcategoriaSelect.disabled = true;
      subcategoriaSelect.innerHTML =
        '<option value="">Selecciona primero una categoría</option>';

      alert("Gasto añadido correctamente");
    } catch (error) {
      console.error("Error al añadir gasto:", error);
      alert("Error al añadir el gasto");
    }
  });
}

// Inicializar: cargar gastos y categorías
document.addEventListener("DOMContentLoaded", () => {
  fetchGastos();
  if (categoriaSelect) {
    loadCategorias();
    subcategoriaSelect.disabled = true;
  }
});
