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
});
