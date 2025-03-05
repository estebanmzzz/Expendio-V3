const expensesList = document.querySelector(".expenses-list");
const seeMoreButton = document.querySelector(".see-more-button");

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
  expensesList.innerHTML = gastos
    .map(
      (expense) => `
        <div class="expense-item">
          <span class="expense-title">${expense.descripcion}</span>
          <span class="expense-amount">${formatAmount(expense.monto)}</span>
          <div class="expense-category">
            <span class="main">${expense.categoria_nombre}</span>
            <span class="sub"></span>
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

// Obtener los gastos al cargar la página
fetchGastos();
