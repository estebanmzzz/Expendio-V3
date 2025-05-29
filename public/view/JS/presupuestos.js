const totalBudgetElement = document.getElementById("totalBudget");
const budgetChangeForm = document.getElementById("budget-change-form");
const budgetList = document.querySelector(".budget-list");

const API_URL = "http://localhost:3000/api/presupuestos/user/";

const userAvatar = document.querySelector(".user-avatar");

// Variables para el filtrado
let currentPeriod = "month";
let currentDate = new Date();

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "/profile";
  });
} else {
  console.error("Elemento .user-avatar no encontrado.");
}

function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES");
}

function getMonthName(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date);
}

// Inicializar los controles de filtrado
function initializeFilters() {
  const periodBtns = document.querySelectorAll(".period-btn");
  const filterDateInput = document.getElementById("filter-date");

  // Formato YYYY-MM para el input de tipo month
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  filterDateInput.value = `${year}-${month}`;

  // Eventos para los botones de período
  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Quitar la clase active de todos los botones
      periodBtns.forEach((b) => b.classList.remove("active"));

      // Añadir la clase active al botón clickeado
      btn.classList.add("active");

      // Actualizar el período actual
      currentPeriod = btn.dataset.period;

      // Recargar datos con el nuevo filtro
      loadFilteredBudgets();
    });
  });

  // Evento para el cambio de fecha
  filterDateInput.addEventListener("change", () => {
    const [year, month] = filterDateInput.value.split("-");
    currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);

    // Recargar datos con la nueva fecha
    loadFilteredBudgets();
  });
}

// Cargar presupuestos filtrados
async function loadFilteredBudgets() {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}${userId}`);

    if (!response.ok) {
      throw new Error("Error al cargar los presupuestos");
    }

    const allBudgets = await response.json();

    if (!allBudgets || allBudgets.length === 0) {
      totalBudgetElement.textContent = "No hay presupuestos disponibles";
      budgetList.innerHTML =
        '<p class="text-center">No hay historial de presupuestos</p>';
      return;
    }

    // Filtrar presupuestos según el período seleccionado
    const filteredBudgets = filterBudgetsByPeriod(
      allBudgets,
      currentPeriod,
      currentDate
    );

    // Actualizar la visualización
    if (filteredBudgets.length > 0) {
      const mostRecentBudget = filteredBudgets[0];
      updateCurrentBudget(mostRecentBudget);
      updateBudgetHistory(filteredBudgets);

      // Actualizar gráfico
      loadExpensesAndCreateChart(currentPeriod, currentDate);
    } else {
      totalBudgetElement.textContent = "No hay presupuestos para este período";
      budgetList.innerHTML =
        '<p class="text-center">No hay presupuestos para el período seleccionado</p>';
    }
  } catch (error) {
    console.error("Error:", error);
    totalBudgetElement.textContent = "Error al cargar datos";
  }
}

// Filtrar presupuestos por período
function filterBudgetsByPeriod(budgets, period, date) {
  // Ordenar por fecha descendente
  const sortedBudgets = [...budgets].sort((a, b) => {
    return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
  });

  const year = date.getFullYear();
  const month = date.getMonth();

  return sortedBudgets.filter((budget) => {
    const budgetDate = new Date(budget.fecha_asignacion);
    const budgetYear = budgetDate.getFullYear();
    const budgetMonth = budgetDate.getMonth();

    if (period === "month") {
      // Filtrar por mes específico
      return budgetYear === year && budgetMonth === month;
    } else if (period === "quarter") {
      // Filtrar por trimestre (mes actual y dos meses anteriores)
      const quarterStart = new Date(year, month - 2, 1);
      return budgetDate >= quarterStart && budgetDate <= date;
    } else if (period === "year") {
      // Filtrar por año
      return budgetYear === year;
    }

    return true;
  });
}

async function loadBudgets() {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}${userId}`);

    if (!response.ok) {
      throw new Error("Error al cargar los presupuestos");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const sortedBudgets = data.sort((a, b) => {
        return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
      });

      const currentBudget = sortedBudgets[0];
      updateCurrentBudget(currentBudget);

      const recentBudgets = sortedBudgets.slice(0, 10);
      updateBudgetHistory(recentBudgets);

      // Cargar el gráfico después de actualizar la información del presupuesto
      loadExpensesAndCreateChart();
    } else {
      totalBudgetElement.textContent = "No hay presupuestos disponibles";
      budgetList.innerHTML =
        '<p class="text-center">No hay historial de presupuestos</p>';
    }
  } catch (error) {
    console.error("Error:", error);
    totalBudgetElement.textContent = "Error al cargar datos";
  }
}

function updateCurrentBudget(budget) {
  totalBudgetElement.textContent = formatMoney(budget.monto);
}

function updateBudgetHistory(budgets) {
  // Limpiar la lista actual
  budgetList.innerHTML = "";

  budgets.forEach((budget) => {
    const budgetItem = document.createElement("div");
    budgetItem.className = "budget-item";
    budgetItem.dataset.id = budget.presupuesto_id; // Añadimos el ID como atributo de datos

    const monthName = getMonthName(budget.fecha_asignacion);
    const budgetTitle = `Presupuesto ${
      monthName.charAt(0).toUpperCase() + monthName.slice(1)
    }`;

    budgetItem.innerHTML = `
      <span class="budget-title">${budgetTitle}</span>
      <span class="budget-amount">${formatMoney(budget.monto)}</span>
      <span class="budget-date">${formatDate(budget.fecha_asignacion)}</span>
      <div class="budget-actions">
        <button class="action-btn edit-btn">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="action-btn delete-btn">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    // Añadir eventos a los botones
    const editBtn = budgetItem.querySelector(".edit-btn");
    const deleteBtn = budgetItem.querySelector(".delete-btn");

    editBtn.addEventListener("click", () =>
      editBudget(budget.presupuesto_id, budget.monto)
    );
    deleteBtn.addEventListener("click", () =>
      deleteBudget(budget.presupuesto_id)
    );

    budgetList.appendChild(budgetItem);
  });
}

async function createBudget(amount) {
  try {
    const newBudget = {
      usuario_id: getUserId(),
      monto: parseFloat(amount),
      fecha_asignacion: new Date().toISOString().split("T")[0],
    };

    const response = await fetch("http://localhost:3000/api/presupuestos/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newBudget),
    });

    if (!response.ok) {
      throw new Error("Error al crear el presupuesto");
    }

    loadFilteredBudgets();

    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

// Función para editar presupuesto
async function editBudget(id, currentAmount) {
  const newAmount = prompt("Ingrese el nuevo monto:", currentAmount);

  if (!newAmount || isNaN(newAmount) || parseFloat(newAmount) <= 0) {
    alert("Por favor, ingrese un monto válido mayor a cero");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/presupuestos/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monto: parseFloat(newAmount) }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al actualizar el presupuesto");
    }

    alert("Presupuesto actualizado correctamente");
    loadFilteredBudgets(); // Recargar la lista
  } catch (error) {
    console.error("Error:", error);
    alert("Error al actualizar el presupuesto");
  }
}

// Función para eliminar presupuesto
async function deleteBudget(id) {
  if (!confirm("¿Está seguro que desea eliminar este presupuesto?")) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/presupuestos/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Error al eliminar el presupuesto");
    }

    alert("Presupuesto eliminado correctamente");
    loadFilteredBudgets(); // Recargar la lista
  } catch (error) {
    console.error("Error:", error);
    alert("Error al eliminar el presupuesto");
  }
}

// Nueva función para cargar gastos y crear el gráfico
async function loadExpensesAndCreateChart(period = "month", date = new Date()) {
  try {
    const userId = getUserId();
    const response = await fetch(`http://localhost:3000/api/gastos/${userId}`);

    if (!response.ok) {
      throw new Error("Error al cargar los gastos");
    }

    const expenses = await response.json();

    const budgetResponse = await fetch(`${API_URL}${userId}`);
    if (!budgetResponse.ok) {
      throw new Error("Error al cargar los presupuestos");
    }

    const budgetsData = await budgetResponse.json();
    if (!budgetsData || budgetsData.length === 0) {
      return;
    }

    const filteredBudgets = filterBudgetsByPeriod(budgetsData, period, date);

    if (filteredBudgets.length === 0) return;

    const currentBudget = filteredBudgets[0];

    const filteredExpenses = filterExpensesByPeriod(expenses, period, date);

    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.monto),
      0
    );

    createBudgetVsExpensesChart(currentBudget.monto, totalExpenses);
  } catch (error) {
    console.error("Error:", error);
  }
}

function filterExpensesByPeriod(expenses, period, date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.fecha_gasto);
    const expenseYear = expenseDate.getFullYear();
    const expenseMonth = expenseDate.getMonth();

    if (period === "month") {
      return expenseYear === year && expenseMonth === month;
    } else if (period === "quarter") {
      const quarterStart = new Date(year, month - 2, 1);
      return expenseDate >= quarterStart && expenseDate <= date;
    } else if (period === "year") {
      return expenseYear === year;
    }

    return true;
  });
}

function createBudgetVsExpensesChart(budgetAmount, expensesAmount) {
  const chartContainer = document.getElementById("budgetVsExpensesChart");
  if (!chartContainer) return;

  chartContainer.innerHTML = "";

  const percentageUsed = Math.min(100, (expensesAmount / budgetAmount) * 100);

  const budgetBar = document.createElement("div");
  budgetBar.className = "budget-vs-expenses-container";

  const labels = document.createElement("div");
  labels.className = "budget-vs-expenses-labels";
  labels.innerHTML = `
    <div class="budget-label">Presupuesto: ${formatMoney(budgetAmount)}</div>
    <div class="expenses-label">Gastos: ${formatMoney(expensesAmount)}</div>
  `;

  const progressContainer = document.createElement("div");
  progressContainer.className = "budget-progress-container";

  const progressBar = document.createElement("div");
  progressBar.className = "budget-progress-bar";
  progressBar.style.width = `${percentageUsed}%`;

  if (percentageUsed < 70) {
    progressBar.style.backgroundColor = "#10b981"; 
  } else if (percentageUsed < 90) {
    progressBar.style.backgroundColor = "#f59e0b"; 
  } else {
    progressBar.style.backgroundColor = "#ef4444"; 
  }

  progressBar.textContent = `${percentageUsed.toFixed(1)}%`;

  progressContainer.appendChild(progressBar);
  budgetBar.appendChild(labels);
  budgetBar.appendChild(progressContainer);

  const statusMessage = document.createElement("div");
  statusMessage.className = "budget-status-message";

  if (percentageUsed < 70) {
    statusMessage.textContent = "¡Vas bien! Sigues dentro del presupuesto.";
    statusMessage.style.color = "#10b981";
  } else if (percentageUsed < 90) {
    statusMessage.textContent =
      "¡Precaución! Te estás acercando al límite de tu presupuesto.";
    statusMessage.style.color = "#f59e0b";
  } else if (percentageUsed < 100) {
    statusMessage.textContent =
      "¡Alerta! Estás muy cerca de tu límite presupuestario.";
    statusMessage.style.color = "#ef4444";
  } else {
    statusMessage.textContent = "¡Has excedido tu presupuesto este mes!";
    statusMessage.style.color = "#ef4444";
  }

  chartContainer.appendChild(budgetBar);
  chartContainer.appendChild(statusMessage);
}

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  return user.id;
}

budgetChangeForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const newBudgetInput = document.getElementById("new-budget");
  const newAmount = newBudgetInput.value.trim();

  if (!newAmount || isNaN(newAmount) || parseFloat(newAmount) <= 0) {
    alert("Por favor, ingrese un monto válido mayor a cero");
    return;
  }

  const success = await createBudget(newAmount);

  if (success) {
    newBudgetInput.value = "";
    alert("Presupuesto actualizado correctamente");
  } else {
    alert("Error al actualizar el presupuesto");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initializeFilters();
  loadFilteredBudgets();
});
