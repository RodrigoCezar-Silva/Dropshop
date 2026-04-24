// Exibe o nome do frete selecionado e valor no checkout, incluindo frete grátis
(function() {
  function getResumoFrete() {
    const tipo = localStorage.getItem('tipoFreteSelecionado');
    if (!tipo || tipo === '-') return 'Frete não selecionado';
    if (tipo === 'GRATIS') return 'Frete Grátis (acima de R$ 100,00)';
    // Ler valor calculado por região do localStorage
    const valor = parseFloat(localStorage.getItem('valorFreteSelecionado'));
    if (valor && !isNaN(valor)) {
      return tipo + ' - R$ ' + valor.toFixed(2).replace('.', ',');
    }
    return tipo + ' - Valor não calculado';
  }
  function atualizarResumoFreteCheckout() {
    const el = document.getElementById('resumoFreteCheckout');
    if (el) el.textContent = getResumoFrete();
  }
  document.addEventListener('DOMContentLoaded', atualizarResumoFreteCheckout);
  window.addEventListener('storage', function(e) {
    if (e.key === 'tipoFreteSelecionado' || e.key === 'carrinho' || e.key === 'valorFreteSelecionado') atualizarResumoFreteCheckout();
  });
})();
