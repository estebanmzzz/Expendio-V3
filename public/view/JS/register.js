document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {
      nombre: formData.get("nombre").trim(),
      apellido: formData.get("apellido").trim(),
      nickname: formData.get("nickname").trim(),
      email: formData.get("email").trim(),
      password: formData.get("password"),
      confirmPassword: document.getElementById("userConfirmPassword").value,
      termsAccepted: document.getElementById("terms").checked,
    };
    console.log(data);

    let isValid = validateForm(data);
    if (!isValid) return;

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          apellido: data.apellido,
          nickname: data.nickname,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Usuario registrado exitosamente");
        //form.reset();
        window.location.href = "/public/view/Login.html"; // EVALUAR
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error en la conexión con el servidor");
    }
  });
});

function validateForm(data) {
  let isValid = true;

  isValid &= toggleError("userNombre", data.nombre !== "");
  isValid &= toggleError("userApellido", data.apellido !== "");
  isValid &= toggleError("userNickname", data.nickname !== "");
  isValid &= toggleError("userEmail", isValidEmail(data.email));
  isValid &= toggleError("userPassword", data.password.length >= 8);
  isValid &= toggleError(
    "userConfirmPassword",
    data.password === data.confirmPassword
  );
  isValid &= toggleError("terms", data.termsAccepted);

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
