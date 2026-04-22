/**
 * Controle visual do menu principal.
 * Marca o link ativo e simula o comportamento de login/logout no cabeçalho.
 */
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".menu ul li a");
  const areaLogin = document.getElementById("areaLogin");
  const areaUsuario = document.getElementById("areaUsuario");
  const logoutBtn = document.getElementById("logout");

  // Efeito de "ativo" no menu
  links.forEach(link => {
    link.addEventListener("click", () => {
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Simulação de login (exemplo)
  // Aqui você pode integrar com sua API de autenticação
  if (localStorage.getItem("usuarioLogado")) {
    areaLogin.style.display = "none";
    areaUsuario.style.display = "block";
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    areaLogin.style.display = "block";
    areaUsuario.style.display = "none";
  });
});
