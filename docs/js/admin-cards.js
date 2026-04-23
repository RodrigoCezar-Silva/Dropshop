// JS de demonstração para o docs: mesmo comportamento do src/public/js/admin-cards.js
document.addEventListener('DOMContentLoaded', function () {
  var selector = '.admin-card, .admin-stat-card, .stat-card, .reclamacao-card, .pagamento-card';
  var nodes = document.querySelectorAll(selector);
  nodes.forEach(function (el) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

    el.addEventListener('mouseenter', function () { el.classList.add('is-hover'); });
    el.addEventListener('mouseleave', function () { el.classList.remove('is-hover'); });
    el.addEventListener('focus', function () { el.classList.add('is-hover'); });
    el.addEventListener('blur', function () { el.classList.remove('is-hover'); });

    el.addEventListener('touchstart', function () { el.classList.add('is-hover'); });
    el.addEventListener('touchend', function () { setTimeout(function () { el.classList.remove('is-hover'); }, 350); });
  });
});
