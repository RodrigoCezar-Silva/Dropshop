// Botão voltar ao topo
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
// Exibir botão só quando rolar
window.addEventListener('scroll', function() {
  const btn = document.getElementById('footer-top-btn');
  if (!btn) return;
  if (window.scrollY > 200) {
    btn.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
  }
});
