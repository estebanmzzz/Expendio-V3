document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing profile page...");

  // Get user data
  let userData;
  let userId; // Necesitamos guardar el ID del usuario

  try {
    console.log("Attempting to get user data from sessionStorage...");
    const data = sessionStorage.getItem("user");
    console.log("Raw data from sessionStorage:", data);

    if (data) {
      userData = JSON.parse(data);
      console.log("Parsed user data:", userData);

      // Log all available properties
      console.log("Available properties in user data:");
      for (const key in userData) {
        console.log(`- ${key}: ${userData[key]}`);
      }

      // Try to get the user ID using different possible property names
      userId = userData.usuario_id;
      console.log("First attempt - userId from usuario_id:", userId);

      if (userId === undefined) {
        userId = userData.id;
        console.log("Second attempt - userId from id:", userId);
      }

      if (userId === undefined) {
        // Try other potential ID field names
        const possibleIdFields = ["usuarioId", "user_id", "uid", "idUsuario"];
        for (const field of possibleIdFields) {
          if (userData[field] !== undefined) {
            userId = userData[field];
            console.log(
              `Found userId in alternative field '${field}':`,
              userId
            );
            break;
          }
        }
      }

      // If we still don't have a userId, log an error
      if (userId === undefined) {
        console.error("⚠️ User ID not found in session data:", userData);
        console.log("Session data keys available:", Object.keys(userData));
        showToast("Error: No se pudo encontrar el ID de usuario");
      } else {
        console.log("✅ Successfully found user ID:", userId);
      }

      // Display user data
      console.log("Setting display fields with user data...");
      document.getElementById("nombre").textContent = userData.nombre || "";
      document.getElementById("apellido").textContent = userData.apellido || "";
      document.getElementById("email").textContent = userData.email || "";
      document.getElementById("nickname").textContent = userData.nickname || "";

      // Update profile greeting
      document.getElementById("profile-greeting").textContent = `Hola, ${
        userData.nickname || "usuario"
      }`;

      console.log("User profile data display completed");
    } else {
      console.warn(
        "No user data found in sessionStorage, redirecting to login..."
      );
      window.location.href = "/";
      return;
    }
  } catch (error) {
    console.error("❌ Error retrieving or processing user data:", error);
    console.error("Error stack:", error.stack);
    window.location.href = "/";
    return;
  }

  console.log("Setting up UI elements and event listeners...");

  // Modal elements
  const editModal = document.getElementById("edit-modal");
  const deleteModal = document.getElementById("delete-modal");
  const toast = document.getElementById("toast-notification");

  // Check if all UI elements exist
  const requiredElements = {
    "edit-modal": editModal,
    "delete-modal": deleteModal,
    "toast-notification": toast,
    "profile-greeting": document.getElementById("profile-greeting"),
    nombre: document.getElementById("nombre"),
    apellido: document.getElementById("apellido"),
    email: document.getElementById("email"),
    nickname: document.getElementById("nickname"),
    password: document.getElementById("password"),
  };

  // Check if any elements are missing
  for (const [id, element] of Object.entries(requiredElements)) {
    if (!element) {
      console.error(`❌ Required element #${id} not found in the DOM!`);
    }
  }

  // Variables to track current field being edited
  let currentField = "";
  let currentValue = "";

  // Edit field functionality
  console.log("Setting up edit icons...");
  const editIcons = document.querySelectorAll(".edit-icon");
  console.log(`Found ${editIcons.length} edit icons`);

  editIcons.forEach((icon) => {
    const field = icon.getAttribute("data-field");
    console.log(`Setting up listener for edit icon with data-field="${field}"`);

    icon.addEventListener("click", function () {
      // Get field to edit
      currentField = this.getAttribute("data-field");
      currentValue = document.getElementById(currentField).textContent;
      console.log(
        `Edit clicked for field: ${currentField}, current value: ${currentValue}`
      );

      // Update modal
      document.getElementById("edit-field-label").textContent =
        getFieldLabel(currentField);

      const standardField = document.querySelector(".standard-field");
      const passwordFields = document.querySelector(".password-fields");

      if (currentField === "password") {
        // Show password fields, hide standard field
        standardField.style.display = "none";
        passwordFields.style.display = "block";

        // Clear password fields
        document.getElementById("current-password-input").value = "";
        document.getElementById("new-password-input").value = "";
        document.getElementById("confirm-password-input").value = "";
      } else {
        // Show standard field, hide password fields
        standardField.style.display = "block";
        passwordFields.style.display = "none";
        document.getElementById("edit-field-input").value = currentValue;
      }

      // Show modal
      console.log("Opening edit modal");
      editModal.classList.add("active");
    });
  });

  // Close edit modal
  document.getElementById("close-modal").addEventListener("click", function () {
    console.log("Closing edit modal via close button");
    editModal.classList.remove("active");
  });

  document.getElementById("cancel-edit").addEventListener("click", function () {
    console.log("Closing edit modal via cancel button");
    editModal.classList.remove("active");
  });

  // Save edit - Updated to handle password change
  document
    .getElementById("save-edit")
    .addEventListener("click", async function () {
      console.log("Save edit button clicked");

      if (currentField === "password") {
        savePasswordChange();
      } else {
        saveNormalField();
      }
    });

  async function saveNormalField() {
    const newValue = document.getElementById("edit-field-input").value;
    console.log(`Attempting to update ${currentField} to: ${newValue}`);

    // Verificar que tenemos un ID de usuario válido
    if (!userId) {
      console.error("❌ Cannot update: userId is undefined or null");
      showToast("Error: No se pudo encontrar el ID de usuario");
      return;
    }

    // Crear objeto con el campo a actualizar
    const updateData = {};
    updateData[currentField] = newValue;
    console.log("Update payload:", JSON.stringify(updateData));
    console.log(`API endpoint: http://localhost:3000/api/usuarios/${userId}`);

    try {
      console.log("Sending PUT request...");
      // Llamar a la API para actualizar el usuario
      const response = await fetch(
        `http://localhost:3000/api/usuarios/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        [...response.headers].map((h) => `${h[0]}: ${h[1]}`).join(", ")
      );

      // Try to get response text first to debug any JSON parse errors
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        // Convert text back to JSON if possible
        data = responseText ? JSON.parse(responseText) : {};
        console.log("Parsed response data:", data);
      } catch (jsonError) {
        console.error("❌ Failed to parse response JSON:", jsonError);
        console.log("Invalid JSON response:", responseText);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        console.error(`❌ Server returned error: ${response.status}`);
        throw new Error(
          data.error || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Actualizar el valor mostrado
      console.log(`Updating displayed ${currentField} to: ${newValue}`);
      document.getElementById(currentField).textContent = newValue;

      // Actualizar datos de usuario en sessionStorage
      userData[currentField] = newValue;
      sessionStorage.setItem("user", JSON.stringify(userData));
      console.log("Updated sessionStorage with new data");

      // Actualizar saludo del perfil si se cambió el nickname
      if (currentField === "nickname") {
        console.log("Updating profile greeting for new nickname");
        document.getElementById(
          "profile-greeting"
        ).textContent = `Hola, ${newValue}`;
      }

      // Cerrar modal
      console.log("Closing edit modal after successful update");
      editModal.classList.remove("active");

      // Mostrar notificación de éxito
      showToast("Cambios guardados exitosamente");
      console.log("✅ Update completed successfully");
    } catch (error) {
      console.error("❌ Error updating user:", error);
      console.error("Error stack:", error.stack);
      showToast(error.message || "Error al guardar los cambios");
    }
  }

  async function savePasswordChange() {
    const currentPassword = document.getElementById(
      "current-password-input"
    ).value;
    const newPassword = document.getElementById("new-password-input").value;
    const confirmPassword = document.getElementById(
      "confirm-password-input"
    ).value;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Por favor, completa todos los campos", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    try {
      console.log("Enviando solicitud para cambiar contraseña...");

      const response = await fetch(
        `http://localhost:3000/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cambiar la contraseña");
      }

      // Cerrar modal
      editModal.classList.remove("active");

      // Mostrar notificación de éxito
      showToast("Contraseña actualizada correctamente");
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      showToast(error.message || "Error al cambiar la contraseña", "error");
    }
  }

  // Delete account functionality - Updated to use deleteUsuario controller
  document
    .getElementById("delete-account-btn")
    .addEventListener("click", function () {
      console.log("Delete account button clicked");
      deleteModal.classList.add("active");
    });

  document
    .getElementById("close-delete-modal")
    .addEventListener("click", function () {
      console.log("Closing delete modal via close button");
      deleteModal.classList.remove("active");
    });

  document
    .getElementById("cancel-delete")
    .addEventListener("click", function () {
      console.log("Closing delete modal via cancel button");
      deleteModal.classList.remove("active");
    });

  document
    .getElementById("confirm-delete")
    .addEventListener("click", async function () {
      console.log("Confirm delete button clicked");

      // Verificar que tenemos un ID de usuario válido
      if (!userId) {
        console.error("❌ Cannot delete: userId is undefined or null");
        showToast("Error: No se pudo encontrar el ID de usuario");
        return;
      }

      console.log(`Attempting to delete user with ID: ${userId}`);
      console.log(`API endpoint: http://localhost:3000/api/usuarios/${userId}`);

      try {
        console.log("Sending DELETE request...");
        // Llamar a la API para eliminar la cuenta
        const response = await fetch(
          `http://localhost:3000/api/usuarios/${userId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        // Try to get response text first to debug any JSON parse errors
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        let data;
        try {
          // Convert text back to JSON if possible
          data = responseText ? JSON.parse(responseText) : {};
          console.log("Parsed response data:", data);
        } catch (jsonError) {
          console.error("❌ Failed to parse response JSON:", jsonError);
          console.log("Invalid JSON response:", responseText);
          throw new Error("Error al procesar la respuesta del servidor");
        }

        if (!response.ok) {
          console.error(`❌ Server returned error: ${response.status}`);
          throw new Error(
            data.error || `Error ${response.status}: ${response.statusText}`
          );
        }

        // Limpiar sessionStorage
        console.log("Clearing session storage");
        sessionStorage.clear();
        showToast("Cuenta eliminada exitosamente");

        // Redirigir después de un breve retraso
        console.log("Redirecting to login page in 2 seconds...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (error) {
        console.error("❌ Error deleting account:", error);
        console.error("Error stack:", error.stack);
        showToast(error.message || "Error al eliminar la cuenta");
        deleteModal.classList.remove("active");
      }
    });

  // Logout functionality
  document.getElementById("logout-btn").addEventListener("click", function () {
    console.log("Logout button clicked");
    console.log("Clearing session storage");
    sessionStorage.clear();
    console.log("Redirecting to login page");
    window.location.href = "/";
  });

  // Get label based on field name
  function getFieldLabel(field) {
    const labels = {
      nombre: "Nombre",
      apellido: "Apellido",
      email: "Email",
      nickname: "Nickname",
      password: "Contraseña",
    };
    return labels[field] || "Campo";
  }

  // Toast notification function
  function showToast(message, type = "success") {
    console.log(`Showing toast notification: "${message}"`);
    toast.textContent = message;

    // Remove existing classes and add appropriate type class
    toast.className = "toast";
    if (type === "error") {
      toast.classList.add("error");
    } else if (type === "warning") {
      toast.classList.add("warning");
    }

    toast.classList.add("active");

    setTimeout(() => {
      console.log("Hiding toast notification");
      toast.classList.remove("active");
    }, 3000);
  }

  console.log("✅ Profile page initialization complete");
});
