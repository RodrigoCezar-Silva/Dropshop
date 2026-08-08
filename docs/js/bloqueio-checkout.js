// Bloqueia acesso ao checkout se não estiver logado como cliente
(function() {
  function isClienteLogado() {
    const tipo = localStorage.getItem('tipoUsuario');
    // permitir administradores também (não bloquear admin)
    return localStorage.getItem('token') && (tipo === 'Cliente' || tipo === 'Administrador');
  }
  function mostrarPopup() {
    if (document.getElementById('popupBloqueio')) return;
    const popup = document.createElement('div');
    popup.id = 'popupBloqueio';
    popup.innerHTML = `
      <div class="popup-content">
        <h2>Acesso Restrito</h2>
        <p>Você precisa estar <b>logado como cliente</b> para finalizar a compra!</p>
        <button id="btnIrLoginCliente">OK</button>
      </div>
    `;
    document.body.appendChild(popup);
    document.getElementById('btnIrLoginCliente').onclick = function() {
      window.location.href = 'login-cliente.html';
    };
  }
  if (!isClienteLogado()) {
    document.addEventListener('DOMContentLoaded', function() {
      // Adiciona CSS se não estiver incluso
      if (!document.querySelector('link[href$="popup-bloqueio.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/popup-bloqueio.css';
        document.head.appendChild(link);
      }
      mostrarPopup();
    });
    // Impede qualquer ação na página
    window.onload = function() {
      document.body.style.overflow = 'hidden';
    };
  }
})();
