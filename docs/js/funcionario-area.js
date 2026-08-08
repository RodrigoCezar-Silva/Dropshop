document.addEventListener('DOMContentLoaded', () => {
  const tipoUsuario = localStorage.getItem('tipoUsuario');
  if (tipoUsuario !== 'Funcionario') {
    window.location.href = 'admin-login.html';
    return;
  }

  const nomeUsuario = document.getElementById('nomeUsuario');
  if (nomeUsuario) {
    const nome = localStorage.getItem('nome') || '';
    const sobrenome = localStorage.getItem('sobrenome') || '';
    nomeUsuario.textContent = [nome, sobrenome].filter(Boolean).join(' ').trim() || 'Funcionário';
  }
  // mostrar foto enviada (base64) se existir
  const fotoEl = document.getElementById('fotoFuncionario');
  try {
    const fotoBase64 = localStorage.getItem('foto');
    const fotoMime = localStorage.getItem('fotoMime') || 'image/jpeg';
    if (fotoEl && fotoBase64) {
      fotoEl.src = `data:${fotoMime};base64,${fotoBase64}`;
      fotoEl.style.display = '';
    }
  } catch (e) { /* ignore */ }

  const logoutButtons = [
    document.getElementById('btnLogoutInline'),
    document.getElementById('btnExitNearStatus'),
    document.getElementById('btnExitRight'),
    document.getElementById('logout')
  ];

  logoutButtons.forEach(button => {
    if (!button) return;
    button.addEventListener('click', () => {
      localStorage.removeItem('tipoUsuario');
      localStorage.removeItem('token');
      localStorage.removeItem('nome');
      localStorage.removeItem('sobrenome');
      localStorage.removeItem('isAdmin');
      window.location.href = 'index.html';
    });
  });
});
