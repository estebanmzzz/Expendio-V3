// Variables globales
let currentUser = null;
let presupuestoActual = null;
let gastos = [];
let categorias = [];
let ultimosGastos = []; // Para la sección de últimos gastos

// Referencias DOM
const totalBudgetElement = document.getElementById("totalBudget");
const gastadoBudgetElement = document.getElementById("gastadoBudget");
const restanteBudgetElement = document.getElementById("restanteBudg");
const progressBarElement = document.getElementById("progress-bar");
const chartContainer = document.getElementById("chartContainer");
const expensesList = document.querySelector(".expenses-list");
const gastoForm = document.getElementById("gastoForm");
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");
const verMasButton = document.getElementById("verMasButton");

// Avatar click
const userAvatar = document.querySelector(".user-avatar");
if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, inicializando dashboard...");

  // Obtenemos el usuario de la sesión
  try {
    currentUser = JSON.parse(sessionStorage.getItem("user"));
    if (!currentUser || !currentUser.id) {
      console.error("No se encontró información de usuario en la sesión");
      window.location.href = "/login";
      return;
    }
    console.log("Usuario actual:", currentUser);
  } catch (error) {
    console.error("Error al obtener el usuario de la sesión:", error);
    window.location.href = "/login";
    return;
  }

  // Inicializamos la fecha actual en el formulario
  const fechaInput = document.getElementById("fecha_gasto");
  if (fechaInput) {
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    fechaInput.value = formattedDate;
  }

  // Inicializamos los datos
  initializeData();

  // Event listeners
  setupEventListeners();
});

// Función para inicializar los datos
async function initializeData() {
  try {
    // Cargamos los datos en paralelo para mejor rendimiento
    await Promise.all([loadCategorias(), loadPresupuesto(), loadGastos()]);

    // Calculamos las estadísticas
    updateStats();

    // Mostramos los últimos gastos
    renderUltimosGastos();

    // Creamos el gráfico
    createCategoryChart();
  } catch (error) {
    console.error("Error al inicializar datos:", error);
    showToast("Error al cargar los datos del dashboard", "error");
  }
}

// Carga las categorías del usuario
async function loadCategorias() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/categorias/usuario/${currentUser.id}`
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    categorias = data;
    console.log("Categorías cargadas:", categorias.length);

    // Populamos los selects de categorías
    populateCategoriasSelect(categoriaSelect);

    return categorias;
  } catch (error) {
    console.error("Error al cargar categorías:", error);
    showToast("Error al cargar las categorías", "error");
    return [];
  }
}

// Carga el presupuesto actual del usuario
async function loadPresupuesto() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/presupuestos/user/${currentUser.id}`
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();

    if (data && data.length > 0) {
      // Ordenamos por fecha y tomamos el más reciente
      const sortedBudgets = data.sort((a, b) => {
        return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
      });

      presupuestoActual = sortedBudgets[0];
      console.log("Presupuesto actual:", presupuestoActual);
    } else {
      presupuestoActual = null;
      console.log("No hay presupuestos disponibles");
      totalBudgetElement.textContent = "No hay presupuesto";
      showToast(
        "No tienes un presupuesto asignado. Ve a la sección de Presupuestos para crear uno.",
        "warning"
      );
    }

    return presupuestoActual;
  } catch (error) {
    console.error("Error al cargar presupuesto:", error);
    showToast("Error al cargar el presupuesto", "error");
    return null;
  }
}

// Carga los gastos del usuario
async function loadGastos() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/gastos/${currentUser.id}`
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    gastos = await response.json();
    console.log("Gastos cargados:", gastos.length);

    // Filtramos los gastos para obtener los del mes actual
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const gastosDelMes = gastos.filter((gasto) => {
      const gastoDate = new Date(gasto.fecha_gasto);
      return (
        gastoDate.getMonth() === currentMonth &&
        gastoDate.getFullYear() === currentYear
      );
    });

    // Ordenamos por fecha (más recientes primero) y tomamos los últimos 5
    ultimosGastos = gastos
      .sort((a, b) => new Date(b.fecha_gasto) - new Date(a.fecha_gasto))
      .slice(0, 5);

    console.log("Últimos gastos:", ultimosGastos.length);

    return gastosDelMes;
  } catch (error) {
    console.error("Error al cargar gastos:", error);
    showToast("Error al cargar los gastos", "error");
    return [];
  }
}

// Actualiza las estadísticas en el dashboard
function updateStats() {
  if (!presupuestoActual) {
    totalBudgetElement.textContent = "No hay presupuesto";
    gastadoBudgetElement.textContent = formatMoney(0);
    restanteBudgetElement.textContent = formatMoney(0);
    progressBarElement.style.width = "0%";
    return;
  }

  // Calculamos el total gastado en el mes actual
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const gastosDelMes = gastos.filter((gasto) => {
    const gastoDate = new Date(gasto.fecha_gasto);
    return (
      gastoDate.getMonth() === currentMonth &&
      gastoDate.getFullYear() === currentYear
    );
  });

  const totalGastado = gastosDelMes.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto),
    0
  );
  const totalPresupuesto = parseFloat(presupuestoActual.monto);
  const totalRestante = Math.max(0, totalPresupuesto - totalGastado);

  // Calculamos el porcentaje de presupuesto utilizado
  let porcentajeUtilizado = (totalGastado / totalPresupuesto) * 100;
  porcentajeUtilizado = Math.min(100, porcentajeUtilizado); // Máximo 100%

  // Actualizamos los elementos del DOM
  totalBudgetElement.textContent = formatMoney(totalPresupuesto);
  gastadoBudgetElement.textContent = formatMoney(totalGastado);
  restanteBudgetElement.textContent = formatMoney(totalRestante);

  // Actualizamos la barra de progreso
  progressBarElement.style.width = `${porcentajeUtilizado}%`;

  // Cambiar el color de la barra según el porcentaje
  if (porcentajeUtilizado < 60) {
    progressBarElement.style.background =
      "linear-gradient(to right, var(--secondary), #0d9668)";
  } else if (porcentajeUtilizado < 85) {
    progressBarElement.style.background =
      "linear-gradient(to right, var(--warning), #d97706)";
  } else {
    progressBarElement.style.background =
      "linear-gradient(to right, var(--danger), #b91c1c)";
  }

  // Mostrar el porcentaje en la barra si es mayor a 5%
  if (porcentajeUtilizado > 5) {
    progressBarElement.textContent = `${porcentajeUtilizado.toFixed(1)}%`;
  } else {
    progressBarElement.textContent = "";
  }
}

// Renderiza la lista de últimos gastos
function renderUltimosGastos() {
  if (!expensesList) {
    console.error("No se encontró el elemento .expenses-list");
    return;
  }

  expensesList.innerHTML = "";

  if (ultimosGastos.length === 0) {
    expensesList.innerHTML =
      '<div class="no-gastos">No tienes gastos registrados</div>';
    return;
  }

  ultimosGastos.forEach((gasto) => {
    const expenseItem = document.createElement("div");
    expenseItem.className = "expense-item";

    // Buscar nombre de categoría
    const categoria = getCategoryById(gasto.categoria_id);
    let nombreCategoria = categoria ? categoria.nombre : "Sin categoría";

    // Determinar si es subcategoría
    let nombreSubcategoria = "";
    if (categoria && categoria.categoria_padre_id) {
      const categoriaPadre = getCategoryById(categoria.categoria_padre_id);
      if (categoriaPadre) {
        nombreSubcategoria = nombreCategoria;
        nombreCategoria = categoriaPadre.nombre;
      }
    }

    expenseItem.innerHTML = `
      <div class="expense-title">${gasto.descripcion || "Sin descripción"}</div>
      <div class="expense-amount">${formatMoney(gasto.monto)}</div>
      <div class="expense-category">
        <span class="main">${nombreCategoria}</span>
        ${
          nombreSubcategoria
            ? `<span class="sub">${nombreSubcategoria}</span>`
            : ""
        }
      </div>
      <div class="expense-date">${formatDate(gasto.fecha_gasto)}</div>
    `;

    expensesList.appendChild(expenseItem);
  });
}

// Crea el gráfico de gastos por categorías
function createCategoryChart() {
  if (!chartContainer) {
    console.error("No se encontró el elemento #chartContainer");
    return;
  }

  chartContainer.innerHTML = "";

  // Obtenemos los gastos del mes actual
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const gastosDelMes = gastos.filter((gasto) => {
    const gastoDate = new Date(gasto.fecha_gasto);
    return (
      gastoDate.getMonth() === currentMonth &&
      gastoDate.getFullYear() === currentYear
    );
  });

  // Si no hay gastos, mostramos un mensaje
  if (gastosDelMes.length === 0) {
    chartContainer.innerHTML =
      '<div class="no-data">No hay datos para mostrar en el gráfico</div>';
    return;
  }

  // Agrupamos los gastos por categoría principal (incluso si son subcategorías)
  const gastosPorCategoria = {};

  gastosDelMes.forEach((gasto) => {
    let categoriaId = gasto.categoria_id;

    // Si es una subcategoría, obtenemos la categoría principal
    const categoria = getCategoryById(categoriaId);
    if (categoria && categoria.categoria_padre_id) {
      categoriaId = categoria.categoria_padre_id;
    }

    // Sumamos el gasto a la categoría
    if (!gastosPorCategoria[categoriaId]) {
      gastosPorCategoria[categoriaId] = 0;
    }
    gastosPorCategoria[categoriaId] += parseFloat(gasto.monto);
  });

  // Convertimos el objeto a un array para ordenarlo
  const categoriasArray = Object.keys(gastosPorCategoria).map((id) => {
    const categoria = getCategoryById(parseInt(id));
    return {
      id: parseInt(id),
      nombre: categoria ? categoria.nombre : "Sin categoría",
      monto: gastosPorCategoria[id],
    };
  });

  // Ordenamos por monto (mayor a menor)
  categoriasArray.sort((a, b) => b.monto - a.monto);

  // Tomamos las 4 categorías con mayor gasto
  const topCategorias = categoriasArray.slice(0, 4);

  // Calculamos el total para obtener porcentajes
  const totalGastado = topCategorias.reduce((sum, cat) => sum + cat.monto, 0);

  // Creamos las barras para cada categoría
  topCategorias.forEach((categoria) => {
    const porcentaje = (categoria.monto / totalGastado) * 100;

    const barGroup = document.createElement("div");
    barGroup.className = "bar-group";

    barGroup.innerHTML = `
      <div class="bar-label">${categoria.nombre}</div>
      <div class="bar-container">
        <div class="bar" style="width: ${porcentaje}%"></div>
        <div class="bar-value">${formatMoney(categoria.monto)}</div>
      </div>
    `;

    chartContainer.appendChild(barGroup);
  });

  // Si hay más categorías, añadimos una barra para "Otros"
  if (categoriasArray.length > 4) {
    const otrosMonto = categoriasArray
      .slice(4)
      .reduce((sum, cat) => sum + cat.monto, 0);
    const otrosPorcentaje = (otrosMonto / totalGastado) * 100;

    const barGroup = document.createElement("div");
    barGroup.className = "bar-group";

    barGroup.innerHTML = `
      <div class="bar-label">Otros</div>
      <div class="bar-container">
        <div class="bar" style="width: ${otrosPorcentaje}%; background: linear-gradient(to right, var(--text-light), var(--accent))"></div>
        <div class="bar-value">${formatMoney(otrosMonto)}</div>
      </div>
    `;

    chartContainer.appendChild(barGroup);
  }
}

// Configura los event listeners
function setupEventListeners() {
  // Categoría change (para actualizar subcategorías)
  if (categoriaSelect) {
    categoriaSelect.addEventListener("change", updateSubcategorias);
  }

  // Ver más gastos
  if (verMasButton) {
    verMasButton.addEventListener("click", () => {
      window.location.href = "/gastos";
    });
  }

  // Formulario de gastos
  if (gastoForm) {
    gastoForm.addEventListener("submit", handleGastoFormSubmit);
  }
}

// Maneja el envío del formulario de gastos
async function handleGastoFormSubmit(e) {
  e.preventDefault();

  // Obtener los valores del formulario
  const descripcion = document.getElementById("descripcion").value;
  const monto = document.getElementById("monto").value;
  const categoriaId = subcategoriaSelect.value || categoriaSelect.value;
  const fechaGasto = document.getElementById("fecha_gasto").value;

  // Validar campos
  if (!monto || !categoriaId || !fechaGasto) {
    showToast("Por favor, completa todos los campos requeridos", "error");
    return;
  }

  // Crear objeto con los datos del gasto
  const gastoData = {
    usuario_id: currentUser.id,
    categoria_id: categoriaId,
    monto: parseFloat(monto),
    descripcion: descripcion,
    fecha_gasto: fechaGasto,
  };

  try {
    const response = await fetch("http://localhost:3000/api/gastos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gastoData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Gasto añadido:", result);

    // Limpiar formulario
    gastoForm.reset();

    // Actualizar fecha actual
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById("fecha_gasto").value = formattedDate;

    // Recargar datos
    await loadGastos();
    updateStats();
    renderUltimosGastos();
    createCategoryChart();

    showToast("Gasto añadido correctamente");

    // Resetear subcategorías
    subcategoriaSelect.disabled = true;
    subcategoriaSelect.innerHTML =
      '<option value="">Selecciona primero una categoría</option>';
    categoriaSelect.value = "";
  } catch (error) {
    console.error("Error al añadir gasto:", error);
    showToast("Error al añadir el gasto", "error");
  }
}

// Actualiza las subcategorías en base a la categoría seleccionada
function updateSubcategorias() {
  subcategoriaSelect.innerHTML =
    '<option value="">Selecciona una subcategoría</option>';

  const categoriaId = categoriaSelect.value;

  if (!categoriaId) {
    subcategoriaSelect.disabled = true;
    return;
  }

  const subcategorias = categorias.filter(
    (cat) => cat.categoria_padre_id == categoriaId
  );

  if (subcategorias.length > 0) {
    subcategoriaSelect.disabled = false;

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

// Llena el select de categorías
function populateCategoriasSelect(selectElement) {
  if (!selectElement) return;

  // Limpiar opciones actuales
  selectElement.innerHTML = "";

  // Añadir opción por defecto
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona una categoría";
  selectElement.appendChild(defaultOption);

  // Obtener categorías principales (sin padre)
  const categoriasPrincipales = categorias.filter(
    (cat) => !cat.categoria_padre_id
  );

  // Añadir opciones para categorías principales
  categoriasPrincipales.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria.categoria_id;
    option.textContent = categoria.nombre;
    selectElement.appendChild(option);
  });
}

// Busca una categoría por su ID
function getCategoryById(categoryId) {
  return categorias.find((cat) => cat.categoria_id == categoryId);
}

// Formatea un monto como moneda
function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Formatea una fecha
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

// Muestra una notificación toast
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  // Eliminar clases existentes
  toast.classList.remove("success", "error", "warning");

  // Añadir clase apropiada
  toast.classList.add(type);

  // Establecer mensaje
  toastMessage.textContent = message;

  // Mostrar toast
  toast.classList.add("active");

  // Ocultar después de 3 segundos
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}
