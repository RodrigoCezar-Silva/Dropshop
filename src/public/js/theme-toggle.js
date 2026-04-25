// Alternador de tema do site (claro / escuro) — persiste em localStorage.mixTema
(function () {
  // Mostrar o switch em todas as páginas exceto as de administração e a área do cliente
  function shouldShowSwitch() {
    var fn = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!fn) return true; // raiz -> mostrar
    // se for visualizado em dispositivo móvel, não mostrar o switch (solicitação do usuário)
    if (isMobile()) return false;
    // páginas admin começam com 'admin'
    if (fn.indexOf('admin') === 0) return false;
    // página de perfil/área do cliente
    if (fn === 'meu-perfil.html' || fn === 'meu-perfil') return false;
    // outras páginas administrativas / específicas podem ser adicionadas aqui
    return true;
  }

  function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('theme-dark');
    else document.body.classList.remove('theme-dark');
    try { localStorage.setItem('mixTema', theme); } catch(e) {}
    updateSwitch(theme);
  }

  // Detectar dispositivo móvel de forma robusta
  function isMobile() {
    try {
      if (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true;
      if (window.matchMedia && window.matchMedia('(max-width: 800px)').matches) return true;
      // pointer:coarse indica toque em muitos dispositivos móveis
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    } catch (e) {}
    return false;
  }

  function readTheme() {
    try { var t = localStorage.getItem('mixTema'); return t === 'dark' ? 'dark' : 'light'; } catch(e) { return 'light'; }
  }

  function createSwitch() {
    var wrapper = document.createElement('div');
    wrapper.className = 'theme-switch-wrapper';

    var label = document.createElement('label');
    label.className = 'theme-switch';
    label.innerHTML = '<input id="siteThemeCheckbox" type="checkbox" aria-label="Alternar tema claro/escuro"><span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>';

    var icon = document.createElement('span');
    icon.className = 'theme-switch-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.opacity = '0';
    icon.style.transition = 'opacity 260ms ease, transform 260ms ease';
    icon.style.transform = 'translateY(-4px)';

    wrapper.appendChild(label);
    wrapper.appendChild(icon);
    return wrapper;
  }

  function updateSwitch(theme) {
    var cb = document.getElementById('siteThemeCheckbox');
    if (!cb) return;
    cb.checked = theme === 'dark';
    var label = cb.closest('.theme-switch');
    if (label) {
      label.setAttribute('title', theme === 'dark' ? 'Tema: Escuro (arraste para a esquerda para claro)' : 'Tema: Claro (arraste para a direita para escuro)');
    }
    // atualizar ícone ao lado do switch quando alterado via código
    var icon = cb && cb.closest('.theme-switch-wrapper') ? cb.closest('.theme-switch-wrapper').querySelector('.theme-switch-icon') : null;
    if (icon) {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  function showTransientIcon(wrapper, theme) {
    try {
      if (!wrapper) return;
      var icon = wrapper.querySelector('.theme-switch-icon');
      if (!icon) return;
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
      icon.style.opacity = '1';
      icon.style.transform = 'translateY(0)';
      // ocultar depois de 2.5s
      clearTimeout(icon._hideTimer);
      icon._hideTimer = setTimeout(function () {
        icon.style.opacity = '0';
        icon.style.transform = 'translateY(-4px)';
      }, 2500);
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Aplicar tema móvel automaticamente quando for um dispositivo móvel
    if (isMobile()) {
      document.body.classList.add('theme-mobile');
    }

    var initial = readTheme();
    applyTheme(initial);

    if (!shouldShowSwitch()) return;

    var logo = document.querySelector('.logo');
    if (!logo) return;

    // evitar duplicar
    if (!logo.querySelector('.theme-switch') && !document.getElementById('siteThemeCheckbox')) {
      var sw = createSwitch();
      // garantir que o header possa aceitar elementos fora do container
      if (header && header.style) header.style.display = header.style.display || '';
      // inserir fora do container `.logo`: preferencialmente antes do bloco #loginButtons
      var header = logo.parentNode || document.querySelector('header');
      var loginButtons = document.getElementById('loginButtons');
      try {
        if (header && loginButtons && header.contains(loginButtons)) {
          header.insertBefore(sw, loginButtons);
        } else if (logo && logo.parentNode) {
          // inserir logo como sibling (fora do container interno)
          logo.insertAdjacentElement('afterend', sw);
        } else {
          document.body.insertAdjacentElement('afterbegin', sw);
        }
      } catch (e) {
        // fallback: inserir imediatamente após o texto da logo
        var logoText = logo.querySelector('.logo-text') || logo;
        logoText.insertAdjacentElement('afterend', sw);
      }

      var cb = document.getElementById('siteThemeCheckbox');
      var wrapperEl = sw;
      if (cb) {
        cb.addEventListener('change', function () {
          var next = cb.checked ? 'dark' : 'light';
          applyTheme(next);
          // mostrar ícone transitório quando o usuário alterna
          showTransientIcon(wrapperEl, next);
        });
      }

      // garantir que o estado visual esteja correto e atualizar ícone inicial (sem mostrar automaticamente)
      updateSwitch(initial);
    }
  });

  // -------------------------
  // Mobile menu (hamburger) helper
  // Quando `body.theme-mobile` estiver presente, substitui os botões desktop
  // por um botão hambúrguer que abre/fecha a versão empilhada do menu.
  // -------------------------
  function ensureMobileMenuToggle() {
    try {
      if (!document.body.classList.contains('theme-mobile')) return;
      // encontrar o container do menu (padrão: .menu) e o bloco de botões (#loginButtons)
      var menu = document.querySelector('.menu');
      var loginButtons = document.getElementById('loginButtons');
      var header = document.querySelector('header') || document.querySelector('.site-header');

      if (!menu || !header) return;

      // criar botão toggle se não existir
      if (!header.querySelector('.menu-toggle')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'menu-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menu');
        btn.innerHTML = '<span class="hamburger-line"></span>';
        // inserir antes do menu para ficar visível no topo
        header.insertBefore(btn, header.firstChild);

        btn.addEventListener('click', function () {
          var open = menu.classList.toggle('open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          // ajustar label
          btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
          // mostrar/ocultar blocos que estavam à direita (loginButtons)
          try {
            if (loginButtons) {
              loginButtons.style.display = open ? 'flex' : 'none';
            }
          } catch (e) { /* ignore */ }

          // mobile panel: cria painel com links/clones para navegação em modo mobile
          try {
            var panel = document.querySelector('.mobile-panel');
            if (open) {
              if (!panel) {
                panel = document.createElement('div');
                panel.className = 'mobile-panel';
                panel.setAttribute('role','dialog');
                panel.setAttribute('aria-modal','true');

                var closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-panel-close';
                closeBtn.setAttribute('aria-label','Fechar menu');
                closeBtn.innerHTML = '×';
                closeBtn.addEventListener('click', function () { if (panel) panel.remove(); menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });

                var inner = document.createElement('div');
                inner.className = 'mobile-panel-inner';

                // clona a lista de links do menu (se existir)
                var ul = menu.querySelector('ul');
                if (ul) inner.appendChild(ul.cloneNode(true));

                // inclui blocos de login/cliente/cart como opções adicionais
                try {
                  if (loginButtons) inner.appendChild(loginButtons.cloneNode(true));
                } catch (e) {}
                try { var clienteStatus = document.getElementById('clienteStatus'); if (clienteStatus) inner.appendChild(clienteStatus.cloneNode(true)); } catch (e) {}
                try { var cart = document.querySelector('.cart-icon'); if (cart) inner.appendChild(cart.cloneNode(true)); } catch (e) {}

                panel.appendChild(closeBtn);
                panel.appendChild(inner);
                document.body.appendChild(panel);
                // clique fora do painel fecha
                panel.addEventListener('click', function (ev) { if (ev.target === panel) { panel.remove(); menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); } });
              }
              // abrir
              panel.style.display = 'flex';
              document.body.classList.add('mobile-menu-open');
            } else {
              if (panel) panel.remove();
              document.body.classList.remove('mobile-menu-open');
            }
          } catch (e) { /* ignore */ }
        });
      }
      // inicialmente ocultar loginButtons em theme-mobile se existir e não estiver aberto
      try { if (loginButtons && !menu.classList.contains('open')) loginButtons.style.display = 'none'; } catch (e) {}
    } catch (e) { /* ignore */ }
  }

  // aplica ao carregar e também em mudanças de classe no body (observer)
  document.addEventListener('DOMContentLoaded', ensureMobileMenuToggle);
  // observar mudanças na classe do body para ativar/desativar dinamicamente
  try {
    var obs = new MutationObserver(function (mut) {
      ensureMobileMenuToggle();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } catch (e) { /* ignore */ }
})();
