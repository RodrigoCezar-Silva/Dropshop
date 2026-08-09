document.addEventListener("DOMContentLoaded", () => {
  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario !== "Administrador") {
    window.location.href = "admin-login.html";
    return;
  }

  const nav = document.querySelector('nav.menu');
  const loginButtons = document.getElementById('loginButtons');
  const menuToggle = document.getElementById('menuToggle');

  if (nav) nav.style.display = 'none';
  if (loginButtons) loginButtons.style.display = 'none';
  if (menuToggle) menuToggle.style.display = 'none';
});