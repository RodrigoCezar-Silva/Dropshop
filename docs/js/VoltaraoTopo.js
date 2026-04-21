document.addEventListener("DOMContentLoaded", () => {
  // Cria o botão dinamicamente
  const btnTopo = document.createElement("button");
  btnTopo.id = "btnTopo";
  btnTopo.textContent = "⬆️";
  btnTopo.style.position = "fixed";
  btnTopo.style.bottom = "20px";
  btnTopo.style.right = "20px";
  btnTopo.style.padding = "10px 15px";
  btnTopo.style.background = "green";
  btnTopo.style.color = "white";
  btnTopo.style.border = "none";
  btnTopo.style.borderRadius = "5px";
  btnTopo.style.cursor = "pointer";
  btnTopo.style.display = "none"; // começa escondido
  btnTopo.style.zIndex = "9999";

  document.body.appendChild(btnTopo);

  // Mostra/esconde o botão conforme o scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      btnTopo.style.display = "block";
    } else {
      btnTopo.style.display = "none";
    }
  });

  // Ação de voltar ao topo
  btnTopo.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
