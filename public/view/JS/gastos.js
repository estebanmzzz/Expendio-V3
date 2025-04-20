const expensesList = document.querySelector(".expenses-list");
const addExpenseForm = document.getElementById("add-expense-form");
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");
const noExpensesMessage = document.querySelector(".no-expenses-message");

// Referencias para edición y filtros
const editModal = document.getElementById("edit-expense-modal");
const deleteModal = document.getElementById("confirm-delete-modal");
const editForm = document.getElementById("edit-expense-form");
const editCategoriaSelect = document.getElementById("edit-categoria");
const editSubcategoriaSelect = document.getElementById("edit-subcategoria");
const filterBody = document.querySelector(".filter-body");
const toggleFilterBtn = document.querySelector(".toggle-filter-btn");
const quickFilterBtns = document.querySelectorAll(".quick-filter-btn");
const customDateRange = document.querySelector(".custom-date-range");
const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");
const categoriaFilter = document.getElementById("categoria-filter");
const subcategoriaFilter = document.getElementById("subcategoria-filter");
const aplicarFiltrosBtn = document.getElementById("aplicar-filtros");
const limpiarFiltrosBtn = document.getElementById("limpiar-filtros");

// Paginación
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

// Variables para filtros y paginación
let allGastos = [];
let filteredGastos = [];
let currentPage = 1;
let itemsPerPage = 15;
let todasLasCategorias = [];
let activeFilters = {
  period: "current",
  from: null,
  to: null,
  categoria: "",
  subcategoria: "",
};

// Avatar click
const userAvatar = document.querySelector(".user-avatar");
if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

// Fecha de HOY en el campo
document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha_gasto");
  if (fechaInput) {
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    fechaInput.value = formattedDate;
  }

  // Inicializar fechas para filtros
  initializeDates();

  // Inicializar handlers de eventos
  initializeEventHandlers();

  // Cargar datos
  loadCategorias().then(() => {
    fetchGastos();
  });
});

function initializeDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Para filtros rápidos - solo la parte de fecha (YYYY-MM-DD)
  dateToInput.value = today.toISOString().split("T")[0];
  dateFromInput.value = firstDayOfMonth.toISOString().split("T")[0];

  // Para filtros predeterminados (mes actual) - objetos Date completos
  activeFilters.to = new Date(today);
  activeFilters.to.setHours(23, 59, 59, 999); // Final del día
  activeFilters.from = new Date(firstDayOfMonth);
  activeFilters.from.setHours(0, 0, 0, 0); // Inicio del día
}

function initializeEventHandlers() {
  // Toggle filtros
  toggleFilterBtn.addEventListener("click", () => {
    filterBody.classList.toggle("active");
  });

  // Quick filter buttons
  quickFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      quickFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const period = btn.dataset.period;
      activeFilters.period = period;

      if (period === "custom") {
        customDateRange.style.display = "flex";
      } else {
        customDateRange.style.display = "none";
        updateDateRangeFromPeriod(period);
      }
    });
  });

  // Aplicar filtros
  aplicarFiltrosBtn.addEventListener("click", () => {
    if (activeFilters.period === "custom") {
      const fromDate = new Date(dateFromInput.value);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(dateToInput.value);
      toDate.setHours(23, 59, 59, 999);

      activeFilters.from = fromDate;
      activeFilters.to = toDate;

      // Validar rango de fechas
      if (activeFilters.from > activeFilters.to) {
        showToast(
          "La fecha inicial no puede ser posterior a la fecha final",
          "error"
        );
        return;
      }
    }

    activeFilters.categoria = categoriaFilter.value;
    activeFilters.subcategoria = subcategoriaFilter.value;

    applyFilters();
  });

  // Limpiar filtros
  limpiarFiltrosBtn.addEventListener("click", () => {
    resetFilters();
    applyFilters();
  });

  // Modal events
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      editModal.classList.remove("active");
      deleteModal.classList.remove("active");
    });
  });

  // Cancel buttons in modals
  document.getElementById("cancel-edit").addEventListener("click", () => {
    editModal.classList.remove("active");
  });

  document.getElementById("cancel-delete").addEventListener("click", () => {
    deleteModal.classList.remove("active");
  });

  // Save edit button
  document
    .getElementById("save-edit")
    .addEventListener("click", saveEditedExpense);

  // Confirm delete button
  document
    .getElementById("confirm-delete")
    .addEventListener("click", confirmDeleteExpense);

  // Pagination
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderExpenses(filteredGastos);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderExpenses(filteredGastos);
    }
  });

  // Categoría change events
  categoriaSelect.addEventListener("change", updateSubcategorias);
  categoriaFilter.addEventListener("change", updateSubcategoriasFilter);
  editCategoriaSelect.addEventListener("change", updateEditSubcategorias);
}

function updateDateRangeFromPeriod(period) {
  const today = new Date();
  let fromDate;

  switch (period) {
    case "current":
      // Mes actual
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "last3":
      // Últimos 3 meses
      fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      break;
    default:
      // Por defecto mes actual
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  // Establecer hora para abarcar todo el período
  activeFilters.from = new Date(fromDate);
  activeFilters.from.setHours(0, 0, 0, 0);

  activeFilters.to = new Date(today);
  activeFilters.to.setHours(23, 59, 59, 999);

  // Actualizar inputs de fecha
  dateFromInput.value = activeFilters.from.toISOString().split("T")[0];
  dateToInput.value = activeFilters.to.toISOString().split("T")[0];
}

function resetFilters() {
  // Reset period filter
  quickFilterBtns.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.period === "current") {
      btn.classList.add("active");
    }
  });

  activeFilters.period = "current";
  updateDateRangeFromPeriod("current");

  // Reset category filters
  categoriaFilter.value = "";
  subcategoriaFilter.value = "";
  activeFilters.categoria = "";
  activeFilters.subcategoria = "";

  // Hide custom date range
  customDateRange.style.display = "none";
}

function applyFilters() {
  // Comenzar con todos los gastos
  filteredGastos = [...allGastos];

  console.log("Filtrando gastos...");
  console.log("Total antes de filtrar:", filteredGastos.length);
  console.log("Filtros activos:", activeFilters);

  // Filter by date range
  if (activeFilters.from instanceof Date && activeFilters.to instanceof Date) {
    filteredGastos = filteredGastos.filter((gasto) => {
      // Convertir la cadena de fecha a objeto Date con hora 00:00:00
      const gastoDate = new Date(gasto.fecha_gasto);

      // Ajustar para comparación (utilizando solo la fecha)
      const gastoDateOnly = new Date(
        gastoDate.getFullYear(),
        gastoDate.getMonth(),
        gastoDate.getDate()
      );
      const fromDateOnly = new Date(
        activeFilters.from.getFullYear(),
        activeFilters.from.getMonth(),
        activeFilters.from.getDate()
      );
      const toDateOnly = new Date(
        activeFilters.to.getFullYear(),
        activeFilters.to.getMonth(),
        activeFilters.to.getDate()
      );

      return gastoDateOnly >= fromDateOnly && gastoDateOnly <= toDateOnly;
    });

    console.log("Después de filtro de fechas:", filteredGastos.length);
  }

  // Filter by category
  if (activeFilters.categoria) {
    console.log("Filtrando por categoría:", activeFilters.categoria);

    filteredGastos = filteredGastos.filter((gasto) => {
      // Buscar la categoría principal para este gasto
      const categoria = getCategoryById(gasto.categoria_id);

      // Si es subcategoría, obtener su categoría padre
      if (categoria && categoria.categoria_padre_id) {
        return categoria.categoria_padre_id == activeFilters.categoria;
      }

      // Si es categoría principal
      return gasto.categoria_id == activeFilters.categoria;
    });

    console.log("Después de filtro de categoría:", filteredGastos.length);
  }

  // Filter by subcategory
  if (activeFilters.subcategoria) {
    console.log("Filtrando por subcategoría:", activeFilters.subcategoria);

    filteredGastos = filteredGastos.filter((gasto) => {
      return gasto.categoria_id == activeFilters.subcategoria;
    });

    console.log("Después de filtro de subcategoría:", filteredGastos.length);
  }

  // Reset to first page
  currentPage = 1;

  // Render filtered expenses
  renderExpenses(filteredGastos);
}

function getUserId() {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user && user.id ? parseInt(user.id) : null;
  } catch (error) {
    console.error("Error al obtener ID de usuario:", error);
    return null;
  }
}

// Formateo de fecha
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

// Formateo de monto
function formatAmount(amount) {
  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

// Rendereo de gastos con paginación
function renderExpenses(gastos) {
  // Clear the container
  expensesList.innerHTML = "";

  if (gastos.length === 0) {
    noExpensesMessage.style.display = "block";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageInfo.textContent = "No hay gastos";
    return;
  }

  noExpensesMessage.style.display = "none";

  // Calculate pagination
  const totalPages = Math.ceil(gastos.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, gastos.length);
  const paginatedGastos = gastos.slice(start, end);

  // Update pagination controls
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  // Render paginated expenses
  paginatedGastos.forEach((expense) => {
    const expenseItem = document.createElement("div");
    expenseItem.className = "expense-item";
    expenseItem.dataset.id = expense.gasto_id;

    // Find category and subcategory names
    const categoria = getCategoryById(expense.categoria_id);
    const categoriaName = categoria ? categoria.nombre : "Sin categoría";
    const subcategoriaName = expense.subcategoria_nombre || "";

    expenseItem.innerHTML = `
      <div class="expense-title">${
        expense.descripcion || "Sin descripción"
      }</div>
      <div class="expense-amount">${formatAmount(expense.monto)}</div>
      <div class="expense-category">
        <span class="category-badge">${categoriaName}</span>
        ${
          subcategoriaName
            ? `<span class="subcategory-badge">${subcategoriaName}</span>`
            : ""
        }
      </div>
      <div class="expense-date">${formatDate(expense.fecha_gasto)}</div>
      <div class="expense-actions">
        <button class="action-btn edit-btn" title="Editar">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="action-btn delete-btn" title="Eliminar">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    // Add event listeners for edit and delete buttons
    const editBtn = expenseItem.querySelector(".edit-btn");
    const deleteBtn = expenseItem.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => openEditModal(expense));
    deleteBtn.addEventListener("click", () =>
      openDeleteModal(expense.gasto_id)
    );

    expensesList.appendChild(expenseItem);
  });
}

function openEditModal(expense) {
  const editGastoId = document.getElementById("edit-gasto-id");
  const editDescripcion = document.getElementById("edit-descripcion");
  const editMonto = document.getElementById("edit-monto");
  const editFechaGasto = document.getElementById("edit-fecha-gasto");

  // Fill form with expense data
  editGastoId.value = expense.gasto_id;
  editDescripcion.value = expense.descripcion || "";
  editMonto.value = expense.monto;

  // Format date correctly (YYYY-MM-DD)
  let fechaValue = expense.fecha_gasto;
  if (fechaValue.includes("T")) {
    fechaValue = fechaValue.split("T")[0];
  }
  editFechaGasto.value = fechaValue;

  // Load categories
  loadEditCategories();

  // Select the right category and subcategory
  setTimeout(() => {
    const categoria = getCategoryById(expense.categoria_id);

    if (categoria && categoria.categoria_padre_id) {
      // Es una subcategoría
      editCategoriaSelect.value = categoria.categoria_padre_id;

      // Trigger change event to load subcategories
      const event = new Event("change");
      editCategoriaSelect.dispatchEvent(event);

      // After subcategories are loaded, select the correct one
      setTimeout(() => {
        editSubcategoriaSelect.value = expense.categoria_id;
      }, 100);
    } else {
      // Es una categoría principal
      editCategoriaSelect.value = expense.categoria_id;

      // Trigger change event to load subcategories
      const event = new Event("change");
      editCategoriaSelect.dispatchEvent(event);
    }
  }, 100);

  // Show modal
  editModal.classList.add("active");
}

function saveEditedExpense() {
  const gastoId = document.getElementById("edit-gasto-id").value;
  const descripcion = document.getElementById("edit-descripcion").value;
  const monto = document.getElementById("edit-monto").value;
  const categoriaId = editSubcategoriaSelect.value || editCategoriaSelect.value;
  const fechaGasto = document.getElementById("edit-fecha-gasto").value;

  if (!monto || !categoriaId || !fechaGasto) {
    showToast("Por favor, complete todos los campos requeridos", "error");
    return;
  }

  const updatedData = {
    descripcion: descripcion,
    monto: parseFloat(monto),
    categoria_id: categoriaId,
    fecha_gasto: fechaGasto,
  };

  updateExpense(gastoId, updatedData);
}

async function updateExpense(gastoId, updatedData) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/gastos/${gastoId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Close modal
    editModal.classList.remove("active");

    // Show success message
    showToast("Gasto actualizado correctamente");

    // Refresh expenses
    fetchGastos();
  } catch (error) {
    console.error("Error updating expense:", error);
    showToast("Error al actualizar el gasto", "error");
  }
}

function openDeleteModal(gastoId) {
  // Store the ID for later use
  deleteModal.dataset.gastoId = gastoId;

  // Show modal
  deleteModal.classList.add("active");
}

function confirmDeleteExpense() {
  const gastoId = deleteModal.dataset.gastoId;

  if (!gastoId) {
    showToast("ID de gasto no válido", "error");
    return;
  }

  deleteExpense(gastoId);
}

async function deleteExpense(gastoId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/gastos/${gastoId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Close modal
    deleteModal.classList.remove("active");

    // Show success message
    showToast("Gasto eliminado correctamente");

    // Refresh expenses
    fetchGastos();
  } catch (error) {
    console.error("Error deleting expense:", error);
    showToast("Error al eliminar el gasto", "error");
  }
}

// FETCH DE GASTOS
async function fetchGastos() {
  const userId = getUserId();

  if (!userId) {
    console.error("Usuario no encontrado en sessionStorage.");
    expensesList.innerHTML = "<p>Usuario no encontrado. Inicie sesión.</p>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/gastos/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const gastos = await response.json();

    // Sort by date (newest first)
    allGastos = gastos.sort(
      (a, b) => new Date(b.fecha_gasto) - new Date(a.fecha_gasto)
    );

    console.log("Gastos cargados:", allGastos.length);

    // Apply filters
    applyFilters();
  } catch (error) {
    console.error("Error fetching gastos:", error);
    expensesList.innerHTML = "<p>Error al cargar los gastos.</p>";
    showToast("Error al cargar los gastos", "error");
  }
}

async function loadCategorias() {
  const userId = getUserId();

  if (!userId) {
    console.error("Usuario no encontrado en sessionStorage.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/categorias/usuario/${userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categorias = await response.json();
    todasLasCategorias = categorias;

    console.log("Categorías cargadas:", todasLasCategorias.length);

    // Populate main category selectors
    populateCategoriasSelect(categoriaSelect);
    populateCategoriasSelect(categoriaFilter, true);
  } catch (error) {
    console.error("Error cargando categorías:", error);
    showToast("Error al cargar las categorías", "error");
  }
}

function populateCategoriasSelect(selectElement, includeAllOption = false) {
  if (!selectElement) return;

  // Clear current options
  selectElement.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = includeAllOption
    ? "Todas las categorías"
    : "Selecciona una categoría";
  selectElement.appendChild(defaultOption);

  // Get main categories (no parent category)
  const categoriasPrincipales = todasLasCategorias.filter(
    (cat) => !cat.categoria_padre_id
  );

  // Add options for main categories
  categoriasPrincipales.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria.categoria_id;
    option.textContent = categoria.nombre;
    selectElement.appendChild(option);
  });
}

function updateSubcategorias() {
  subcategoriaSelect.innerHTML =
    '<option value="">Selecciona una subcategoría</option>';

  const categoriaId = categoriaSelect.value;

  if (!categoriaId) {
    subcategoriaSelect.disabled = true;
    return;
  }

  const subcategorias = todasLasCategorias.filter(
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

function updateSubcategoriasFilter() {
  subcategoriaFilter.innerHTML =
    '<option value="">Todas las subcategorías</option>';

  const categoriaId = categoriaFilter.value;

  if (!categoriaId) {
    subcategoriaFilter.disabled = true;
    return;
  }

  const subcategorias = todasLasCategorias.filter(
    (cat) => cat.categoria_padre_id == categoriaId
  );

  if (subcategorias.length > 0) {
    subcategoriaFilter.disabled = false;

    subcategorias.forEach((subcat) => {
      const option = document.createElement("option");
      option.value = subcat.categoria_id;
      option.textContent = subcat.nombre;
      subcategoriaFilter.appendChild(option);
    });
  } else {
    subcategoriaFilter.disabled = true;
    subcategoriaFilter.innerHTML =
      '<option value="">No hay subcategorías disponibles</option>';
  }
}

function updateEditSubcategorias() {
  editSubcategoriaSelect.innerHTML =
    '<option value="">Selecciona una subcategoría</option>';

  const categoriaId = editCategoriaSelect.value;

  if (!categoriaId) {
    editSubcategoriaSelect.disabled = true;
    return;
  }

  const subcategorias = todasLasCategorias.filter(
    (cat) => cat.categoria_padre_id == categoriaId
  );

  if (subcategorias.length > 0) {
    editSubcategoriaSelect.disabled = false;

    subcategorias.forEach((subcat) => {
      const option = document.createElement("option");
      option.value = subcat.categoria_id;
      option.textContent = subcat.nombre;
      editSubcategoriaSelect.appendChild(option);
    });
  } else {
    editSubcategoriaSelect.disabled = true;
    editSubcategoriaSelect.innerHTML =
      '<option value="">No hay subcategorías disponibles</option>';
  }
}

function loadEditCategories() {
  populateCategoriasSelect(editCategoriaSelect);
}

// Add expense form submission
if (addExpenseForm) {
  addExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = getUserId();
    const categoriaId =
      document.getElementById("subcategoria").value ||
      document.getElementById("categoria").value;
    const monto = document.getElementById("monto").value;
    const descripcion = document.getElementById("descripcion").value;
    const fechaGasto = document.getElementById("fecha_gasto").value;

    if (!userId || !categoriaId || !monto) {
      showToast("Por favor, completa todos los campos requeridos", "error");
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
      const response = await fetch("http://localhost:3000/api/gastos", {
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

      addExpenseForm.reset();

      const today = new Date();
      const formattedDate = today.toISOString().substr(0, 10);
      document.getElementById("fecha_gasto").value = formattedDate;

      fetchGastos();

      subcategoriaSelect.disabled = true;
      subcategoriaSelect.innerHTML =
        '<option value="">Selecciona primero una categoría</option>';

      showToast("Gasto añadido correctamente");
    } catch (error) {
      console.error("Error al añadir gasto:", error);
      showToast("Error al añadir el gasto", "error");
    }
  });
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  // Remove existing classes
  toast.classList.remove("success", "error", "warning");

  // Add appropriate class
  toast.classList.add(type);

  // Set message
  toastMessage.textContent = message;

  // Show toast
  toast.classList.add("active");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

// Helper function for category names
function getCategoryById(categoryId) {
  return todasLasCategorias.find((cat) => cat.categoria_id == categoryId);
}
