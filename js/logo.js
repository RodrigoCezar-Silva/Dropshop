/**
 * Interação da logo do site.
 * Permite clicar ou usar teclado para animar e voltar para a página inicial.
 */
document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");

  if (logo) {
    logo.setAttribute("role", "link");
    logo.setAttribute("tabindex", "0");

    logo.addEventListener("click", () => {
      // Adiciona uma classe de animação
      logo.classList.add("animar-logo");

      // Espera a animação terminar e redireciona
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800); // tempo em ms (igual ao tempo da animação no CSS)
    });

    logo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        logo.click();
      }
    });
  }
});
