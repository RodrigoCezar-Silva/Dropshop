document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header.site-header');
  const nav = header ? header.querySelector('nav.menu') : null;
  if (!header || !nav) return;

  // Não duplicar o botão se já existir
  if (!header.querySelector('.menu-toggle')) {
    const btn = document.createElement('button');
    btn.className = 'menu-toggle';
    btn.id = 'menuToggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.innerHTML = '<span class="hamburger-line"></span><span class="sr-only">Menu</span>';

    // Inserir antes do nav
    header.insertBefore(btn, nav);

    // Toggle handler
    btn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Fechar ao clicar fora (em mobile)
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (!header.contains(e.target)) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Suporte a tecla Esc para fechar
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
