document.addEventListener('DOMContentLoaded', function () {
  // Smooth scroll for hero buttons
  document.querySelectorAll('.hero-nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var target = btn.getAttribute('data-target');
      if (!target) return;
      var el = document.querySelector(target);
      if (el) {
        var y = el.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // Modal tutorial handling (open on #tutorial)
  var modal = document.getElementById('tutorialModal');
  if (!modal) return;
  var closeBtn = modal.querySelector('.modal-close');
  var backdrop = modal.querySelector('[data-close]');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    try { document.body.style.overflow = 'hidden'; } catch (err) {}
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    try { document.body.style.overflow = ''; } catch (err) {}
    // remove hash without adding history entry
    if (location.hash === '#tutorial') history.replaceState(null, '', location.pathname + location.search);
  }

  // Open if page loaded with hash
  if (location.hash === '#tutorial') openModal();

  // react to hash changes (back/forward)
  window.addEventListener('hashchange', function () {
    if (location.hash === '#tutorial') openModal();
    else closeModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Interações da seção de ajuda: destacar etapas e copiar template
  var etapas = document.querySelectorAll('.etapas-lista ol li');
  etapas.forEach(function (li, idx) {
    li.setAttribute('data-step', String(idx + 1));
    li.addEventListener('click', function () {
      etapas.forEach(function (x) { x.classList.remove('active-step'); });
      li.classList.add('active-step');
      // role: scroll para o item
      li.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Botão copiar para o template
  var copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copiar modelo';
  var exemplo = document.querySelector('.exemplo-mensagem');
  if (exemplo) {
    exemplo.appendChild(copyBtn);
    copyBtn.addEventListener('click', function () {
      var pre = exemplo.querySelector('pre');
      if (!pre) return;
      var text = pre.innerText.replace(/\u00A0/g, ' ');
      navigator.clipboard.writeText(text).then(function () {
        showToast('Modelo copiado para a área de transferência');
      }).catch(function (err) {
        showToast('Não foi possível copiar automaticamente. Selecione o texto e copie.');
        console.warn('Clipboard error', err);
      });
    });
  }

  // Toast utilitário
  function showToast(msg, time) {
    time = time || 2600;
    var t = document.querySelector('.ajuda-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'ajuda-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(t._to);
    t._to = setTimeout(function () { t.classList.remove('show'); }, time);
  }
});
