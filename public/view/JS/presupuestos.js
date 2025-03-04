// Elementos DOM
const totalBudgetElement = document.getElementById("totalBudget");
const budgetChangeForm = document.getElementById("budget-change-form");
const budgetList = document.querySelector(".budget-list");

// URL base de la API (ajusta según tu entorno)
const API_URL = "http://localhost:5000/api/presupuestos/";

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
    const response = await fetch(`${API_URL}`);

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

// Función para obtener el ID del usuario actual
// Esta función debe ser implementada según tu sistema de autenticación
function getUserId() {
  // Por ahora, devolvemos un ID fijo para pruebas
  return 1;

  // En producción, podrías obtener el ID del usuario de:
  // - Una cookie
  // - localStorage
  // - Un estado global de la aplicación
  // - Un token JWT decodificado
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

// Cargar los presupuestos al iniciar la página
document.addEventListener("DOMContentLoaded", loadBudgets);

// Función para simular datos en caso de desarrollo local
/* function loadMockData() {
  // Esta función es útil para desarrollo sin backend
  const mockData = [
    {
      presupuesto_id: 1,
      usuario_id: 1,
      monto: 15000,
      fecha_asignacion: "2024-03-01",
    },
    {
      presupuesto_id: 2,
      usuario_id: 1,
      monto: 14500,
      fecha_asignacion: "2024-02-01",
    },
    {
      presupuesto_id: 3,
      usuario_id: 1,
      monto: 13800,
      fecha_asignacion: "2024-01-01",
    },
    {
      presupuesto_id: 4,
      usuario_id: 1,
      monto: 12000,
      fecha_asignacion: "2023-12-01",
    },
    {
      presupuesto_id: 5,
      usuario_id: 1,
      monto: 12500,
      fecha_asignacion: "2023-11-01",
    },
  ];

  // Sobreescribir la función fetch global para pruebas
  window.fetch = function (url, options) {
    return new Promise((resolve) => {
      // Simular una pequeña latencia de red
      setTimeout(() => {
        if (url.includes("/presupuestos")) {
          if (options && options.method === "POST") {
            // Agregar el nuevo presupuesto al inicio del array
            const newBudget = JSON.parse(options.body);
            newBudget.presupuesto_id = mockData.length + 1;
            mockData.unshift(newBudget);

            resolve({
              ok: true,
              json: () => Promise.resolve(newBudget),
            });
          } else {
            // GET request - devolver todos los presupuestos
            resolve({
              ok: true,
              json: () => Promise.resolve(mockData),
            });
          }
        }
      }, 300);
    });
  };

  // Cargar datos simulados
  loadBudgets();
} */

// Descomentar la siguiente línea para usar datos de prueba durante el desarrollo
//loadMockData();
