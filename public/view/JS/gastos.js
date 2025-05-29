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
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

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

const userAvatar = document.querySelector(".user-avatar");
if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha_gasto");
  if (fechaInput) {
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    fechaInput.value = formattedDate;
  }

  initializeDates();

  initializeEventHandlers();

  loadCategorias().then(() => {
    fetchGastos();
  });
});

function initializeDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  dateToInput.value = today.toISOString().split("T")[0];
  dateFromInput.value = firstDayOfMonth.toISOString().split("T")[0];

  activeFilters.to = new Date(today);
  activeFilters.to.setHours(23, 59, 59, 999); 
  activeFilters.from = new Date(firstDayOfMonth);
  activeFilters.from.setHours(0, 0, 0, 0); 
}

function initializeEventHandlers() {
  toggleFilterBtn.addEventListener("click", () => {
    filterBody.classList.toggle("active");
  });

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

  aplicarFiltrosBtn.addEventListener("click", () => {
    if (activeFilters.period === "custom") {
      const fromDate = new Date(dateFromInput.value);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(dateToInput.value);
      toDate.setHours(23, 59, 59, 999);

      activeFilters.from = fromDate;
      activeFilters.to = toDate;

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

  limpiarFiltrosBtn.addEventListener("click", () => {
    resetFilters();
    applyFilters();
  });

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      editModal.classList.remove("active");
      deleteModal.classList.remove("active");
    });
  });

  document.getElementById("cancel-edit").addEventListener("click", () => {
    editModal.classList.remove("active");
  });

  document.getElementById("cancel-delete").addEventListener("click", () => {
    deleteModal.classList.remove("active");
  });

  document
    .getElementById("save-edit")
    .addEventListener("click", saveEditedExpense);

  document
    .getElementById("confirm-delete")
    .addEventListener("click", confirmDeleteExpense);

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

  categoriaSelect.addEventListener("change", updateSubcategorias);
  categoriaFilter.addEventListener("change", updateSubcategoriasFilter);
  editCategoriaSelect.addEventListener("change", updateEditSubcategorias);
}

function updateDateRangeFromPeriod(period) {
  const today = new Date();
  let fromDate;

  switch (period) {
    case "current":
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "last3":
      fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      break;
    default:
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  activeFilters.from = new Date(fromDate);
  activeFilters.from.setHours(0, 0, 0, 0);

  activeFilters.to = new Date(today);
  activeFilters.to.setHours(23, 59, 59, 999);

  dateFromInput.value = activeFilters.from.toISOString().split("T")[0];
  dateToInput.value = activeFilters.to.toISOString().split("T")[0];
}

function resetFilters() {
  quickFilterBtns.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.period === "current") {
      btn.classList.add("active");
    }
  });

  activeFilters.period = "current";
  updateDateRangeFromPeriod("current");

  categoriaFilter.value = "";
  subcategoriaFilter.value = "";
  activeFilters.categoria = "";
  activeFilters.subcategoria = "";

  customDateRange.style.display = "none";
}

function applyFilters() {
  filteredGastos = [...allGastos];

  console.log("Filtrando gastos...");
  console.log("Total antes de filtrar:", filteredGastos.length);
  console.log("Filtros activos:", activeFilters);

  if (activeFilters.from instanceof Date && activeFilters.to instanceof Date) {
    filteredGastos = filteredGastos.filter((gasto) => {
      const gastoDate = new Date(gasto.fecha_gasto);

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

  if (activeFilters.categoria) {
    console.log("Filtrando por categoría:", activeFilters.categoria);

    filteredGastos = filteredGastos.filter((gasto) => {
      const categoria = getCategoryById(gasto.categoria_id);

      if (categoria && categoria.categoria_padre_id) {
        return categoria.categoria_padre_id == activeFilters.categoria;
      }

      return gasto.categoria_id == activeFilters.categoria;
    });

    console.log("Después de filtro de categoría:", filteredGastos.length);
  }

  if (activeFilters.subcategoria) {
    console.log("Filtrando por subcategoría:", activeFilters.subcategoria);

    filteredGastos = filteredGastos.filter((gasto) => {
      return gasto.categoria_id == activeFilters.subcategoria;
    });

    console.log("Después de filtro de subcategoría:", filteredGastos.length);
  }

  currentPage = 1;

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

function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

function formatAmount(amount) {
  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function renderExpenses(gastos) {
  expensesList.innerHTML = "";

  if (gastos.length === 0) {
    noExpensesMessage.style.display = "block";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageInfo.textContent = "No hay gastos";
    return;
  }

  noExpensesMessage.style.display = "none";

  const totalPages = Math.ceil(gastos.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, gastos.length);
  const paginatedGastos = gastos.slice(start, end);

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  paginatedGastos.forEach((expense) => {
    const expenseItem = document.createElement("div");
    expenseItem.className = "expense-item";
    expenseItem.dataset.id = expense.gasto_id;

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

  editGastoId.value = expense.gasto_id;
  editDescripcion.value = expense.descripcion || "";
  editMonto.value = expense.monto;

  let fechaValue = expense.fecha_gasto;
  if (fechaValue.includes("T")) {
    fechaValue = fechaValue.split("T")[0];
  }
  editFechaGasto.value = fechaValue;

  loadEditCategories();

  setTimeout(() => {
    const categoria = getCategoryById(expense.categoria_id);

    if (categoria && categoria.categoria_padre_id) {
      editCategoriaSelect.value = categoria.categoria_padre_id;

      const event = new Event("change");
      editCategoriaSelect.dispatchEvent(event);

      setTimeout(() => {
        editSubcategoriaSelect.value = expense.categoria_id;
      }, 100);
    } else {
      editCategoriaSelect.value = expense.categoria_id;

      const event = new Event("change");
      editCategoriaSelect.dispatchEvent(event);
    }
  }, 100);

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
    console.log("Enviando datos de actualización:", updatedData); 

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
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log("Respuesta del servidor:", result);

    editModal.classList.remove("active");

    showToast("Gasto actualizado correctamente");

    fetchGastos();
  } catch (error) {
    console.error("Error updating expense:", error);
    showToast(`Error al actualizar el gasto: ${error.message}`, "error");
  }
}

function openDeleteModal(gastoId) {
  deleteModal.dataset.gastoId = gastoId;

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

    deleteModal.classList.remove("active");

    showToast("Gasto eliminado correctamente");

    fetchGastos();
  } catch (error) {
    console.error("Error deleting expense:", error);
    showToast("Error al eliminar el gasto", "error");
  }
}

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

    allGastos = gastos.sort(
      (a, b) => new Date(b.fecha_gasto) - new Date(a.fecha_gasto)
    );

    console.log("Gastos cargados:", allGastos.length);

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

    populateCategoriasSelect(categoriaSelect);
    populateCategoriasSelect(categoriaFilter, true);
  } catch (error) {
    console.error("Error cargando categorías:", error);
    showToast("Error al cargar las categorías", "error");
  }
}

function populateCategoriasSelect(selectElement, includeAllOption = false) {
  if (!selectElement) return;

  selectElement.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = includeAllOption
    ? "Todas las categorías"
    : "Selecciona una categoría";
  selectElement.appendChild(defaultOption);

  const categoriasPrincipales = todasLasCategorias.filter(
    (cat) => !cat.categoria_padre_id
  );

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

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toast.classList.remove("success", "error", "warning");

  toast.classList.add(type);

  toastMessage.textContent = message;

  toast.classList.add("active");

  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

function getCategoryById(categoryId) {
  return todasLasCategorias.find((cat) => cat.categoria_id == categoryId);
}
