// Versão para docs: mesmo comportamento do src
(function () {
  // Mostrar o switch em todas as páginas exceto as de administração e a área do cliente
  function shouldShowSwitch() {
    var fn = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!fn) return true;
    if (fn.indexOf('admin') === 0) return false;
    if (fn === 'meu-perfil.html' || fn === 'meu-perfil') return false;
    return true;
  }
  function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('theme-dark');
    else document.body.classList.remove('theme-dark');
    try { localStorage.setItem('mixTema', theme); } catch(e) {}
    updateSwitch(theme);
  }
  function readTheme() { try { var t = localStorage.getItem('mixTema'); return t === 'dark' ? 'dark' : 'light'; } catch(e) { return 'light'; } }
  function createSwitch() { var label = document.createElement('label'); label.className = 'theme-switch'; label.innerHTML = '<input id="siteThemeCheckbox" type="checkbox" aria-label="Alternar tema claro/escuro"><span class="switch-track" aria-hidden="true"><span class="switch-knob"></span></span>'; return label; }
  function updateSwitch(theme) { var cb = document.getElementById('siteThemeCheckbox'); if (!cb) return; cb.checked = theme === 'dark'; var label = cb.closest('.theme-switch'); if (label) label.setAttribute('title', theme === 'dark' ? 'Tema: Escuro' : 'Tema: Claro'); }
  // showTip removed by request (no balloon should be shown)
  document.addEventListener('DOMContentLoaded', function () {
    var initial = readTheme();
    applyTheme(initial);
    if (!shouldShowSwitch()) return;
    var logo = document.querySelector('.logo');
    if (!logo) return;
    if (!logo.querySelector('.theme-switch') && !document.getElementById('siteThemeCheckbox')) {
      var sw = createSwitch();
      if (!logo.style.position) logo.style.position = logo.style.position || 'relative';
      var header = logo.parentNode || document.querySelector('header');
      var loginButtons = document.getElementById('loginButtons');
      try {
        if (header && loginButtons && header.contains(loginButtons)) {
          header.insertBefore(sw, loginButtons);
        } else if (logo && logo.parentNode) {
          logo.insertAdjacentElement('afterend', sw);
        } else {
          document.body.insertAdjacentElement('afterbegin', sw);
        }
      } catch (e) {
        var logoText = logo.querySelector('.logo-text') || logo;
        logoText.insertAdjacentElement('afterend', sw);
      }

      var cb = document.getElementById('siteThemeCheckbox');
      if (cb) cb.addEventListener('change', function () { var next = cb.checked ? 'dark' : 'light'; applyTheme(next); });
        // showTip removed by request (no balloon should be shown)
    }
  });
})();
