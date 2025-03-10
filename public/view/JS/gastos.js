const expensesList = document.querySelector(".expenses-list");
const seeMoreButton = document.querySelector(".see-more-button");
const addExpenseForm = document.getElementById("add-expense-form");
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");

const userAvatar = document.querySelector(".user-avatar");

if (userAvatar) {
  userAvatar.addEventListener("click", function () {
    window.location.href = "./profile.html";
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
});

function getUserId() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  console.log(user.id);
  return user.id;
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

// Rendereo de gastos
function renderExpenses(gastos) {
  // Ordenar gastos por fecha DESC
  const gastosOrdenados = [...gastos].sort((a, b) => {
    return new Date(b.fecha_gasto) - new Date(a.fecha_gasto);
  });

  expensesList.innerHTML = gastosOrdenados
    .map(
      (expense) => `
        <div class="expense-item">
          <span class="expense-title">${expense.descripcion}</span>
          <span class="expense-amount">${formatAmount(expense.monto)}</span>
          <div class="expense-category">
            <span class="main">${expense.categoria_nombre}</span>
            <span class="sub">${expense.subcategoria_nombre || ""}</span>
          </div>
          <span class="expense-date">${formatDate(expense.fecha_gasto)}</span>
        </div>
      `
    )
    .join("");
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
    console.log(gastos);
    renderExpenses(gastos);
  } catch (error) {
    console.error("Error fetching gastos:", error);
    expensesList.innerHTML = "<p>Aún no has cargado ningún gasto.</p>";
  }
}

let todasLasCategorias = [];

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
    console.log("Categorías cargadas:", categorias);

    todasLasCategorias = categorias;

    categoriaSelect.innerHTML =
      '<option value="">Selecciona una categoría</option>';

    const categoriasPrincipales = categorias.filter(
      (cat) => !cat.categoria_padre_id
    );

    categoriasPrincipales.forEach((categoria) => {
      const option = document.createElement("option");
      option.value = categoria.categoria_id;
      option.textContent = categoria.nombre;
      categoriaSelect.appendChild(option);
    });

    if (categoriaSelect) {
      categoriaSelect.addEventListener("change", updateSubcategorias);
    }
  } catch (error) {
    console.error("Error cargando categorías:", error);
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
      alert("Por favor, completa todos los campos requeridos");
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

      alert("Gasto añadido correctamente");
    } catch (error) {
      console.error("Error al añadir gasto:", error);
      alert("Error al añadir el gasto");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchGastos();
  if (categoriaSelect) {
    loadCategorias();
    subcategoriaSelect.disabled = true;
  }
});
