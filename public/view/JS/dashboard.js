document.addEventListener("DOMContentLoaded", function () {
  const userAvatar = document.querySelector(".user-avatar");

  if (userAvatar) {
    userAvatar.addEventListener("click", function () {
      window.location.href = "/profile";
    });
  } else {
    console.error("Elemento .user-avatar no encontrado.");
  }

  /**BUDGET CARD */

  const totalElement = document.getElementById("totalBudget");
  const gastadoElement = document.getElementById("gastadoBudget");
  const restanteElement = document.getElementById("restanteBudg");
  const progressBar = document.getElementById("progress-bar");

  function updateBudget(totalAmount, gastadoAmount) {
    totalElement.textContent = `${totalAmount} €`;
    gastadoElement.textContent = `${gastadoAmount} €`;
    restanteElement.textContent = `${totalAmount - gastadoAmount} €`;

    const progress = (gastadoAmount / totalAmount) * 100;
    const progressClamped = Math.max(0, Math.min(progress, 100));

    progressBar.style.width = `${progressClamped}%`;
    progressBar.textContent = `${progressClamped.toFixed(0)}%`;
  }

  updateBudget(2500, 750);

  /** ADD GASTO CARD */

  const subcategorias = {
    comida: ["Restaurantes", "Supermercado", "Snacks"],
    transporte: ["Gasolina", "Abono Transporte", "Taxi", "BiciMad", "Peajes"],
    entretenimiento: ["Cine", "Conciertos"],
    deporte: ["Playtomic", "Pachanga", "Entradas Estadio"],
  };

  const categoriaSelect = document.getElementById("categoria");
  const subcategoriaSelect = document.getElementById("subcategoria");
  const form = document.getElementById("gastoForm");

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    console.log("Datos del gasto:", data);

    this.reset();
  });

  /* BARRAS CARD */

  const topCategories = [
    { category: "Vivienda", amount: 990 },
    { category: "Compras", amount: 320 },
    { category: "Subscripciones", amount: 128.5 },
    { category: "Salidas", amount: 180 },
    { category: "Servicios", amount: 110 },
  ];

  const chartContainer = document.getElementById("chartContainer");
  const maxAmount = Math.max(...topCategories.map((cat) => cat.amount));

  function formatAmount(amount) {
    return amount.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  }

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

  document.querySelectorAll(".bar").forEach((bar) => {
    const finalWidth = bar.style.width;
    bar.style.width = "0";

    setTimeout(() => {
      bar.style.width = finalWidth;
    }, 10);
  });

  /* FUNCIONES DE ULTIMOS GASTOS */

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

  function formatDate(dateString) {
    const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  }

  function renderExpenses(gastos) {
    expensesList.innerHTML = gastos
      .map(
        (expense) => `
            <div class="expense-item">
                <span class="expense-title">${expense.title}</span>
                <span class="expense-amount">${formatAmount(
                  expense.amount
                )}</span>
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

  renderExpenses(recentGastos);

  seeMoreButton.addEventListener("click", () => {
    console.log("Ver más gastos...");
  });
});
