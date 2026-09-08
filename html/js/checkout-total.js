// Preenche o valor total da compra no checkout com base no carrinho e frete selecionado
(function() {
  function getSubtotal() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);
  }
  function getFrete() {
    const tipo = localStorage.getItem('tipoFreteSelecionado');
    if (!tipo || tipo === '-' || tipo === 'GRATIS') return 0;
    const subtotal = getSubtotal();
    if (subtotal >= 100) return 0;
    const valor = parseFloat(localStorage.getItem('valorFreteSelecionado'));
    return (!isNaN(valor) && valor > 0) ? valor : 0;
  }
  function atualizarTotalCheckout() {
    const el = document.getElementById('totalResumo');
    if (!el) return;
    const subtotal = getSubtotal();
    const frete = getFrete();
    el.textContent = (subtotal + frete).toFixed(2).replace('.', ',');
  }
  document.addEventListener('DOMContentLoaded', atualizarTotalCheckout);
  window.addEventListener('storage', function(e) {
    if (e.key === 'carrinho' || e.key === 'tipoFreteSelecionado') atualizarTotalCheckout();
  });
})();
