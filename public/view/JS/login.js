document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {
      email: formData.get("email").trim(),
      password: formData.get("password"),
    };

    let isValid = validateForm(data);
    if (!isValid) return;

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        sessionStorage.setItem("user", JSON.stringify(result.user));

        alert("Login exitoso");

        window.location.href = "./Dashboard.html";
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Error en la conexión con el servidor");
    }
  });
});

function validateForm(data) {
  let isValid = true;

  isValid &= toggleError("email", isValidEmail(data.email));
  isValid &= toggleError("password", data.password.length >= 8);

  return !!isValid;
}

function toggleError(inputId, condition) {
  const inputElement = document.getElementById(inputId);
  if (condition) {
    inputElement.classList.remove("error");
    return true;
  } else {
    inputElement.classList.add("error");
    return false;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
