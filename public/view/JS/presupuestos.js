const totalBudgetElement = document.getElementById("totalBudget");
const budgetChangeForm = document.getElementById("budget-change-form");
const budgetList = document.querySelector(".budget-list");

const API_URL = "http://localhost:3000/api/presupuestos/user/";

const userAvatar = document.querySelector(".user-avatar");

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "./profile.html";
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

    loadBudgets();

    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
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

document.addEventListener("DOMContentLoaded", loadBudgets);
