// Intercepta clique em "Finalizar Compra" e exige login de cliente
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var btnFinalizar = document.querySelector('.btn-finalizar');
    if (!btnFinalizar) return;
    btnFinalizar.addEventListener('click', function(e) {
      const tipo = localStorage.getItem('tipoUsuario');
      // permitir administradores também
      if (!(localStorage.getItem('token') && (tipo === 'Cliente' || tipo === 'Administrador'))) {
        e.preventDefault();
        // Marca intenção de checkout
        localStorage.setItem('checkoutPendente', '1');
        // Mostra popup estiloso
        if (!document.getElementById('popupBloqueio')) {
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
        // Adiciona CSS se não estiver incluso
        if (!document.querySelector('link[href$="popup-bloqueio.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = './css/popup-bloqueio.css';
          document.head.appendChild(link);
        }
        return false;
      } else {
        // Verifica se precisa de frete e se está selecionado
        let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        let subtotal = carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);
        let tipoFrete = localStorage.getItem('tipoFreteSelecionado');
        if (subtotal < 100 && !["PAC","SEDEX","SEDEX10"].includes(tipoFrete)) {
          e.preventDefault();
            if (!document.getElementById('popupBloqueioFrete')) {
              const popup = document.createElement('div');
              popup.id = 'popupBloqueioFrete';
              popup.innerHTML = `
                <div class="popup-content" style="max-width:370px;background:#fffbe7;border:2px solid #ffe082;border-radius:18px;box-shadow:0 4px 32px #ffecb366;padding:32px 28px;text-align:center;">
                  <div style="font-size:2.5em;margin-bottom:10px;">🚚</div>
                  <h2 style="color:#b28704;font-size:1.5em;margin-bottom:10px;">Selecione o Frete</h2>
                  <p style="color:#7c6f1a;font-size:1.1em;margin-bottom:18px;">Para continuar, escolha uma opção de frete para sua entrega.<br><span style='font-size:0.95em;color:#b28704;'>Assim garantimos que seu pedido chegue direitinho até você!</span></p>
                  <button id="btnFecharPopupFrete" style="background:#ffe082;color:#7c6f1a;font-weight:bold;padding:10px 32px;border:none;border-radius:8px;font-size:1.1em;box-shadow:0 2px 8px #ffecb366;cursor:pointer;transition:background 0.2s;">OK, vou escolher</button>
                </div>
              `;
              popup.style.position = 'fixed';
              popup.style.top = '0';
              popup.style.left = '0';
              popup.style.width = '100vw';
              popup.style.height = '100vh';
              popup.style.background = 'rgba(255, 236, 130, 0.18)';
              popup.style.display = 'flex';
              popup.style.alignItems = 'center';
              popup.style.justifyContent = 'center';
              popup.style.zIndex = '9999';
              document.body.appendChild(popup);
              document.getElementById('btnFecharPopupFrete').onclick = function() {
                popup.remove();
              };
            }
          // Adiciona CSS se não estiver incluso
          if (!document.querySelector('link[href$="popup-bloqueio.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './css/popup-bloqueio.css';
            document.head.appendChild(link);
          }
          return false;
        } else {
          // Redireciona normalmente
          window.location.href = 'checkout.html';
        }
      }
    });
  });
})();
