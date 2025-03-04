// Elementos DOM
const totalBudgetElement = document.getElementById("totalBudget");
const budgetChangeForm = document.getElementById("budget-change-form");
const budgetList = document.querySelector(".budget-list");

// URL base de la API (ajusta según tu entorno)
const API_URL = "http://localhost:5000/api/presupuestos/user/";

// Función para formatear montos como dinero
function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Función para formatear fechas
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES");
}

// Función para obtener el nombre del mes
function getMonthName(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date);
}

// Función para cargar los presupuestos
async function loadBudgets() {
  try {
    const userId = getUserId(); // Obtener el usuario_id desde sessionStorage
    const response = await fetch(`${API_URL}${userId}`);

    if (!response.ok) {
      throw new Error("Error al cargar los presupuestos");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      // Ordenar los presupuestos por fecha, del más reciente al más antiguo
      const sortedBudgets = data.sort((a, b) => {
        return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
      });

      // Obtener el presupuesto más reciente para mostrarlo en la primera card
      const currentBudget = sortedBudgets[0];
      updateCurrentBudget(currentBudget);

      // Mostrar el historial de los últimos 10 presupuestos
      const recentBudgets = sortedBudgets.slice(0, 10);
      updateBudgetHistory(recentBudgets);
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

// Función para actualizar el presupuesto actual en la primera card
function updateCurrentBudget(budget) {
  totalBudgetElement.textContent = formatMoney(budget.monto);
}

// Función para actualizar el historial de presupuestos
function updateBudgetHistory(budgets) {
  // Limpiar la lista actual
  budgetList.innerHTML = "";

  // Crear los elementos para cada presupuesto
  budgets.forEach((budget) => {
    const budgetItem = document.createElement("div");
    budgetItem.className = "budget-item";

    // Formato del texto: "Presupuesto [Mes]"
    const monthName = getMonthName(budget.fecha_asignacion);
    const budgetTitle = `Presupuesto ${
      monthName.charAt(0).toUpperCase() + monthName.slice(1)
    }`;

    budgetItem.innerHTML = `
      <span class="budget-title">${budgetTitle}</span>
      <span class="budget-amount">${formatMoney(budget.monto)}</span>
      <span class="budget-date">${formatDate(budget.fecha_asignacion)}</span>
    `;

    budgetList.appendChild(budgetItem);
  });
}

// Función para crear un nuevo presupuesto
async function createBudget(amount) {
  try {
    const newBudget = {
      usuario_id: getUserId(), // Función que debe obtener el ID del usuario actual
      monto: parseFloat(amount),
      fecha_asignacion: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
    };

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newBudget),
    });

    if (!response.ok) {
      throw new Error("Error al crear el presupuesto");
    }

    // Recargamos los presupuestos para mostrar el nuevo
    loadBudgets();

    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  return user.id; // Corregido
}

// Event listener para el formulario de cambio de presupuesto
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
    // Limpiar el formulario
    newBudgetInput.value = "";
    alert("Presupuesto actualizado correctamente");
  } else {
    alert("Error al actualizar el presupuesto");
  }
});

document.addEventListener("DOMContentLoaded", loadBudgets);
