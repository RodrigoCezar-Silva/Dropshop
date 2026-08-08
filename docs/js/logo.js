/**
 * Interação da logo do site.
 * Permite clicar ou usar teclado para animar e voltar para a página inicial.
 */
document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  if (!logo) return;

  // Ajusta comportamento da logo conforme tipo de usuário
  try {
    const rawTipo = localStorage.getItem('tipoUsuario');
    const tipo = (rawTipo && rawTipo !== 'null' && rawTipo !== '') ? rawTipo : null;
    if (tipo === 'Administrador') {
      const nome = (localStorage.getItem('nome') || '').trim();
      const sobrenome = (localStorage.getItem('sobrenome') || '').trim();
      const displayName = (nome || sobrenome) ? `Administrador: ${[nome, sobrenome].filter(Boolean).join(' ')}` : 'Administrador';

      const logoText = logo.querySelector('.logo-text') || logo;
      try { logoText.textContent = displayName; } catch (e) { /* ignore */ }

      // tornar não interativo quando for admin
      logo.removeAttribute('role');
      logo.removeAttribute('tabindex');
      logo.style.cursor = 'default';
      logo.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); });
      logo.addEventListener('keydown', ev => { ev.preventDefault(); ev.stopPropagation(); });
      return;
    }
  } catch (e) { /* ignore */ }

  // comportamento padrão: clicável e acessível
  logo.setAttribute("role", "link");
  logo.setAttribute("tabindex", "0");
  logo.addEventListener("click", () => {
    logo.classList.add("animar-logo");
    setTimeout(() => { window.location.href = "index.html"; }, 800);
  });

  logo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      logo.click();
    }
  });
  // Aplicar foto do cliente armazenada (quando logado) em elementos comuns
  try {
    const fotoUrl = localStorage.getItem('clienteFotoUrl');
    if (fotoUrl) {
      ['mp-avatar','fotoCliente','fotoClienteResumo','fotoClienteSidebar','fotoClienteSidebarImg'].forEach(id => {
        try { const el = document.getElementById(id); if (el) el.src = fotoUrl; } catch(e) {}
      });
    }
  } catch (e) { /* ignore */ }
});
