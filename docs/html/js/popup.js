// Reusable styled popup helper
// Usage: showStyledPopup({ title, message, countdown, redirectUrl, buttons })
window.showStyledPopup = function(opts = {}) {
  const { title = '', message = '', countdown = 0, redirectUrl = null, buttons = [] } = opts;
  const overlay = document.createElement('div'); overlay.className = 'mix-popup-overlay'; overlay.setAttribute('aria-hidden','false');
  const box = document.createElement('div'); box.className = 'mix-popup-box';
  if (opts.small) box.classList.add('small');

  if (title) { const h = document.createElement('h3'); h.className = 'mix-popup-title'; h.textContent = title; box.appendChild(h); }
  if (message) { const p = document.createElement('p'); p.className = 'mix-popup-message'; p.innerHTML = message; box.appendChild(p); }

  let countdownEl = null; let intervalId = null; if (countdown && redirectUrl) {
    countdownEl = document.createElement('p'); countdownEl.className = 'mix-popup-countdown'; countdownEl.textContent = `Redirecionando em ${countdown}s...`;
    box.appendChild(countdownEl);
    let remaining = countdown;
    intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        try { cleanup(); window.location.href = redirectUrl; } catch(e) { cleanup(); }
      } else {
        countdownEl.textContent = `Redirecionando em ${remaining}s...`;
      }
    }, 1000);
  }

  const actions = document.createElement('div'); actions.className = 'mix-popup-actions';
  // default button when none provided
  if (!buttons || !buttons.length) {
    const btn = document.createElement('button'); btn.className = 'mix-popup-btn'; btn.textContent = 'Ir agora';
    btn.addEventListener('click', () => { cleanup(); if (redirectUrl) window.location.href = redirectUrl; });
    actions.appendChild(btn);
  } else {
    buttons.forEach(b => {
      const btn = document.createElement('button'); btn.className = 'mix-popup-btn';
      if (b.className) btn.classList.add(b.className);
      btn.textContent = b.label || 'OK';
      btn.addEventListener('click', () => {
        try { if (typeof b.onClick === 'function') b.onClick(); } catch(e) { console.warn(e); }
        if (b.close !== false) cleanup();
      });
      actions.appendChild(btn);
    });
  }

  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function cleanup() {
    try { if (intervalId) clearInterval(intervalId); overlay.remove(); } catch(e){}
  }

  return { overlay, cleanup };
};
