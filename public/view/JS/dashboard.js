let currentUser = null;
let presupuestoActual = null;
let gastos = [];
let categorias = [];
let ultimosGastos = [];

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

const userAvatar = document.querySelector(".user-avatar");
if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, inicializando dashboard...");

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

  const fechaInput = document.getElementById("fecha_gasto");
  if (fechaInput) {
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    fechaInput.value = formattedDate;
  }

  initializeData();

  setupEventListeners();
});

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

    populateCategoriasSelect(categoriaSelect);

    return categorias;
  } catch (error) {
    console.error("Error al cargar categorías:", error);
    showToast("Error al cargar las categorías", "error");
    return [];
  }
}

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

function updateStats() {
  if (!presupuestoActual) {
    totalBudgetElement.textContent = "No hay presupuesto";
    gastadoBudgetElement.textContent = formatMoney(0);
    restanteBudgetElement.textContent = formatMoney(0);
    progressBarElement.style.width = "0%";
    return;
  }

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

  let porcentajeUtilizado = (totalGastado / totalPresupuesto) * 100;
  porcentajeUtilizado = Math.min(100, porcentajeUtilizado); // Máximo 100%

  totalBudgetElement.textContent = formatMoney(totalPresupuesto);
  gastadoBudgetElement.textContent = formatMoney(totalGastado);
  restanteBudgetElement.textContent = formatMoney(totalRestante);

  progressBarElement.style.width = `${porcentajeUtilizado}%`;

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

  if (porcentajeUtilizado > 5) {
    progressBarElement.textContent = `${porcentajeUtilizado.toFixed(1)}%`;
  } else {
    progressBarElement.textContent = "";
  }
}

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

    const categoria = getCategoryById(gasto.categoria_id);
    let nombreCategoria = categoria ? categoria.nombre : "Sin categoría";

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

function createCategoryChart() {
  if (!chartContainer) {
    console.error("No se encontró el elemento #chartContainer");
    return;
  }

  chartContainer.innerHTML = "";

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

  if (gastosDelMes.length === 0) {
    chartContainer.innerHTML =
      '<div class="no-data">No hay datos para mostrar en el gráfico</div>';
    return;
  }

  const gastosPorCategoria = {};

  gastosDelMes.forEach((gasto) => {
    let categoriaId = gasto.categoria_id;

    const categoria = getCategoryById(categoriaId);
    if (categoria && categoria.categoria_padre_id) {
      categoriaId = categoria.categoria_padre_id;
    }

    if (!gastosPorCategoria[categoriaId]) {
      gastosPorCategoria[categoriaId] = 0;
    }
    gastosPorCategoria[categoriaId] += parseFloat(gasto.monto);
  });

  const categoriasArray = Object.keys(gastosPorCategoria).map((id) => {
    const categoria = getCategoryById(parseInt(id));
    return {
      id: parseInt(id),
      nombre: categoria ? categoria.nombre : "Sin categoría",
      monto: gastosPorCategoria[id],
    };
  });

  categoriasArray.sort((a, b) => b.monto - a.monto);

  const topCategorias = categoriasArray.slice(0, 4);

  const totalGastado = topCategorias.reduce((sum, cat) => sum + cat.monto, 0);

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

function setupEventListeners() {
  if (categoriaSelect) {
    categoriaSelect.addEventListener("change", updateSubcategorias);
  }

  if (verMasButton) {
    verMasButton.addEventListener("click", () => {
      window.location.href = "/gastos";
    });
  }

  if (gastoForm) {
    gastoForm.addEventListener("submit", handleGastoFormSubmit);
  }
}

async function handleGastoFormSubmit(e) {
  e.preventDefault();

  const descripcion = document.getElementById("descripcion").value;
  const monto = document.getElementById("monto").value;
  const categoriaId = subcategoriaSelect.value || categoriaSelect.value;
  const fechaGasto = document.getElementById("fecha_gasto").value;

  if (!monto || !categoriaId || !fechaGasto) {
    showToast("Por favor, completa todos los campos requeridos", "error");
    return;
  }

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

    gastoForm.reset();

    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById("fecha_gasto").value = formattedDate;

    await loadGastos();
    updateStats();
    renderUltimosGastos();
    createCategoryChart();

    showToast("Gasto añadido correctamente");

    subcategoriaSelect.disabled = true;
    subcategoriaSelect.innerHTML =
      '<option value="">Selecciona primero una categoría</option>';
    categoriaSelect.value = "";
  } catch (error) {
    console.error("Error al añadir gasto:", error);
    showToast("Error al añadir el gasto", "error");
  }
}

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

function populateCategoriasSelect(selectElement) {
  if (!selectElement) return;

  selectElement.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona una categoría";
  selectElement.appendChild(defaultOption);

  const categoriasPrincipales = categorias.filter(
    (cat) => !cat.categoria_padre_id
  );

  categoriasPrincipales.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria.categoria_id;
    option.textContent = categoria.nombre;
    selectElement.appendChild(option);
  });
}

function getCategoryById(categoryId) {
  return categorias.find((cat) => cat.categoria_id == categoryId);
}

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

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toast.classList.remove("success", "error", "warning");

  toast.classList.add(type);

  toastMessage.textContent = message;

  toast.classList.add("active");

  setTimeout(() => {
    toast.classList.remove("active");
  }, 2000);
}
