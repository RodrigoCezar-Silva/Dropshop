document.addEventListener("DOMContentLoaded", () => {
  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario !== "Administrador") {
    window.location.href = "admin-login.html";
  }
});