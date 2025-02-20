/**
 * FUNCIONES DE BUDGET CARD
 */
/**
 * Seleccion los elementos del componente que deben ser actualizados
 * dinamicamente por los datos del usuario.
 */
const totalElement = document.getElementById("totalBudget");
const gastadoElement = document.getElementById("gastadoBudget");
const restanteElement = document.getElementById("restanteBudg");
const progressBar = document.getElementById("progress-bar");

function updateBudget(totalAmount, gastadoAmount) {
  // Actualizar los valores en la interfaz
  totalElement.textContent = `${totalAmount} €`;
  gastadoElement.textContent = `${gastadoAmount} €`;
  restanteElement.textContent = `${totalAmount - gastadoAmount} €`;

  // Calcular el porcentaje de presupuesto
  const progress = (gastadoAmount / totalAmount) * 100;

  // Asegurar que el porcentaje vaya 0 y 100
  const progressClamped = Math.max(0, Math.min(progress, 100));

  // Actualizar la barra de progreso
  progressBar.style.width = `${progressClamped}%`;
  progressBar.textContent = `${progressClamped.toFixed(0)}%`;
}

// Numeros de prueba
updateBudget(2500, 750);




/**
 * FUNCIONES DE ADD GASTO CARD
 */

// Objeto de prueba para tener opciones por ahora.
const subcategorias = {
  comida: ["Restaurantes", "Supermercado", "Snacks"],
  transporte: ["Gasolina", "Abono Transporte", "Taxi", "BiciMad", "Peajes"],
  entretenimiento: ["Cine", "Conciertos"],
  deporte: ["Playtomic", "Pachanga", "Entradas Estadio"],
};

// Elementos del DOM
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");
const form = document.getElementById("gastoForm");

// Cambia las subs dependiendo de las cats
categoriaSelect.addEventListener("change", function () {
  const categoria = this.value;
  subcategoriaSelect.innerHTML =
    '<option value="">Selecciona una subcategoría</option>';

  if (categoria && subcategorias[categoria]) {
    subcategorias[categoria].forEach((subCat) => {
      const option = document.createElement("option");
      option.value = subCat.toLowerCase();
      option.textContent = subCat;
      subcategoriaSelect.appendChild(option);
    });
  }
});

// Envio de formuladio
form.addEventListener("submit", function (e) {
  // Evita que se envíe el formulario
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  console.log("Datos del gasto:", data);

  // Falta agregar la lógica para enviar los datos a la DDBB

  this.reset();
});

/* BARRAS CARD */
// Datos de ejemplo con las 5 categorías de mayor gasto
// Proximo paso: agregar la lógica para obtener los datos de la DB

const topCategories = [
  { category: "Vivienda", amount: 990 },
  { category: "Compras", amount: 320 },
  { category: "Subscripciones", amount: 128.5 },
  { category: "Salidas", amount: 180 },
  { category: "Servicios", amount: 110 },
];

const chartContainer = document.getElementById("chartContainer");

// Encontrar el valor máximo para calcular porcentajes
const maxAmount = Math.max(...topCategories.map((cat) => cat.amount));

// Función para formatear montos
function formatAmount(amount) {
  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

// Crear las barras
topCategories.forEach((category) => {
  const percentage = (category.amount / maxAmount) * 100;

  const barGroup = document.createElement("div");
  barGroup.className = "bar-group";

  barGroup.innerHTML = `
        <div class="bar-label">${category.category}</div>
        <div class="bar-container">
            <div class="bar" style="width: ${percentage}%"></div>
            <span class="bar-value">${formatAmount(category.amount)}</span>
        </div>
    `;

  chartContainer.appendChild(barGroup);
});

// Animación de entrada de las barras
document.querySelectorAll(".bar").forEach((bar) => {
  const finalWidth = bar.style.width;
  bar.style.width = "0";

  setTimeout(() => {
    bar.style.width = finalWidth;
  }, 10);
});




/* FUNCIONES DE ULTIMOS GASTOS */

// Datos de ejemplo
const recentGastos = [
  {
    id: 1,
    title: "Compras supermercado",
    amount: 156.5,
    category: "Comida",
    subcategory: "Supermercado",
    date: "2024-01-29",
  },
  {
    id: 2,
    title: "Taxi aeropuerto",
    amount: 45.0,
    category: "Transporte",
    subcategory: "Taxi",
    date: "2024-01-28",
  },
  {
    id: 3,
    title: "Cine fin de semana",
    amount: 32.8,
    category: "Entretenimiento",
    subcategory: "Cine",
    date: "2024-01-27",
  },
  {
    id: 4,
    title: "Almuerzo restaurante",
    amount: 25.9,
    category: "Comida",
    subcategory: "Restaurantes",
    date: "2024-01-26",
  },
];

const expensesList = document.querySelector(".expenses-list");
const seeMoreButton = document.querySelector(".see-more-button");

// Función para formatear la fecha
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

// Función para renderizar los gastos
function renderExpenses(gastos) {
  expensesList.innerHTML = gastos
    .map(
      (expense) => `
        <div class="expense-item">
            <span class="expense-title">${expense.title}</span>
            <span class="expense-amount">${formatAmount(expense.amount)}</span>
            <div class="expense-category">
                <span class="main">${expense.category}</span>
                <span class="sub">${expense.subcategory}</span>
            </div>
            <span class="expense-date">${formatDate(expense.date)}</span>
        </div>
    `
    )
    .join("");
}

// Mostrar los gastos de ejemplo
renderExpenses(recentGastos);

// Manejar el click en "Ver más"
seeMoreButton.addEventListener("click", () => {
  console.log("Ver más gastos...");
  // Aquí puedes agregar la lógica para cargar más gastos
});
