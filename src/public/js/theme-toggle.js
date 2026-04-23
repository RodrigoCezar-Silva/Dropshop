// Alternador de tema do site (claro / escuro) — persiste em localStorage.mixTema
(function () {
  // Mostrar o switch em todas as páginas exceto as de administração e a área do cliente
  function shouldShowSwitch() {
    var fn = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!fn) return true; // raiz -> mostrar
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
})();
