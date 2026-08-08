/**
 * Filtro de avaliações por número de estrelas.
 * Mostra apenas os comentários que correspondem à nota escolhida pelo usuário.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Pega os botões
  const btnTudo = document.getElementById("btnTudo");
  const btn5 = document.getElementById("btn5");
  const btn4 = document.getElementById("btn4");
  const btn3 = document.getElementById("btn3");
  const btn2 = document.getElementById("btn2");
  const btn1 = document.getElementById("btn1");

  // Função para filtrar comentários
  function filtrarComentarios(nota) {
    const filtrados = window.comentarios.filter(c => c.notaProduto === nota);
    window.atualizarComentarios(filtrados);
    window.atualizarEstatisticas(filtrados);
  }

  // Eventos de clique nos botões
  if (btnTudo) btnTudo.addEventListener("click", () => {
    window.atualizarComentarios(window.comentarios);
    window.atualizarEstatisticas(window.comentarios);
  });
  if (btn5) btn5.addEventListener("click", () => filtrarComentarios(5));
  if (btn4) btn4.addEventListener("click", () => filtrarComentarios(4));
  if (btn3) btn3.addEventListener("click", () => filtrarComentarios(3));
  if (btn2) btn2.addEventListener("click", () => filtrarComentarios(2));
  if (btn1) btn1.addEventListener("click", () => filtrarComentarios(1));
});


