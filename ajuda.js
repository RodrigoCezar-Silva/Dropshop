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
});
