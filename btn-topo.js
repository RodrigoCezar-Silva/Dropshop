// Botão flutuante de voltar ao topo
(function() {
  function criarBtnTopo() {
    if (document.getElementById('btnTopo')) return;
    const btn = document.createElement('button');
    btn.id = 'btnTopo';
    btn.title = 'Voltar ao topo';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);
    btn.onclick = function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
  criarBtnTopo();
  window.addEventListener('scroll', function() {
    const btn = document.getElementById('btnTopo');
    if (!btn) return;
    if (window.scrollY > 350) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
      btn.style.display = 'none';
      setTimeout(() => { btn.style.display = ''; }, 300);
    }
  });
})();
