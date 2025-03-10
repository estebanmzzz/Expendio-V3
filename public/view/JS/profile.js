document.addEventListener("DOMContentLoaded", function () {
  try {
    function getUserData() {
      const data = sessionStorage.getItem("user");
      if (!data) throw new Error("No user data found in session storage");
      return JSON.parse(data);
    }

    const user = getUserData();

    document.getElementById("nombre").innerHTML = user.nombre;
    document.getElementById("apellido").innerHTML = user.apellido;
    document.getElementById("email").innerHTML = user.email;
    document.getElementById("nickname").innerHTML = user.nickname;
  } catch (error) {
    console.error("Error retrieving user data:", error);
  }

  function logout() {
    sessionStorage.clear();
    window.location.href = "../index.html";
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  function editUserData() {
    const userData = getUserData();
    const newUserData = prompt("Introduce tus nuevos datos");
    if (newUserData) {
      userData.nombre = newUserData.nombre;
      userData.apellido = newUserData.apellido;
      userData.email = newUserData.email;
      userData.nickname = newUserData.nickname;
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  }
  document.querySelector(".edit-btn").addEventListener("click", editUserData);

  function deleteAccount() {
    if (confirm("¿Estás seguro de que quieres eliminar tu cuenta?")) {
      sessionStorage.clear();
      window.location.href = "../index.html";
    }
  }
  document.querySelector(".delete-account-btn").addEventListener("click", deleteAccount);

});
