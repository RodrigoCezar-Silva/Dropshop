/**
 * Estado visual de autenticação do site.
 * Exibe informações do cliente/admin e controla logout no cabeçalho.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Cria/injeta widget de usuário no cabeçalho onde houver o botão `btnMinhaConta`
    function ensureHeaderUserWidget() {
      const header = document.querySelector('header.site-header') || document.querySelector('header');
      if (!header) return;

      // Remove qualquer bloco estático existente e substitui pelo widget padrão
      const existing = document.getElementById('clienteStatus');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      // criar estrutura do widget
      const wrapper = document.createElement('div');
      wrapper.id = 'clienteStatus';
      wrapper.className = 'header-user';

      const img = document.createElement('img');
      img.id = 'fotoCliente';
      img.className = 'header-avatar';
      img.alt = 'Foto do usuário';

      // Fallback SVG embutido para evitar 404 quando arquivo não existir
      function getDefaultAvatarDataUri() {
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3' fill='%23e6eef8'/><path d='M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6' fill='%23e6eef8'/></svg>";
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      }
      img.src = getDefaultAvatarDataUri();

      const names = document.createElement('div');
      names.className = 'nome-area';
      const nomeSpan = document.createElement('span');
      nomeSpan.id = 'nomeCliente';
      nomeSpan.className = 'nome-usuario';
      const sobreSpan = document.createElement('span');
      sobreSpan.id = 'sobrenomeCliente';
      sobreSpan.className = 'nome-usuario';
      names.appendChild(nomeSpan);
      names.appendChild(sobreSpan);

      wrapper.appendChild(img);
      wrapper.appendChild(names);

      // tenta inserir antes do botão Minha Conta se houver; senão, insere antes do ícone de carrinho ou no fim do header
      let anchor = header.querySelector('#btnMinhaConta');
      if (!anchor) anchor = header.querySelector('.cart-icon');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(wrapper, anchor);
      } else {
        header.appendChild(wrapper);
      }

      // se não existir o botão 'Minha Conta', cria um pequeno botão de acesso
      let btn = header.querySelector('#btnMinhaConta');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btnMinhaConta';
        btn.className = 'btn-minha-conta';
        btn.textContent = '👤 Minha Conta';
        wrapper.parentNode.insertBefore(btn, wrapper.nextSibling);
      }

      // cria ou garante botão 'Sair' ao lado do 'Minha Conta'
      let logoutBtn = header.querySelector('#logoutBtn');
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        // mantém estilo geral de btn-logout, e adiciona classe de posicionamento
        logoutBtn.className = 'btn-logout header-logout';
        logoutBtn.textContent = 'Sair';
        // insere logo após o btnMinhaConta
        if (btn && btn.parentNode) btn.parentNode.insertBefore(logoutBtn, btn.nextSibling);
        else wrapper.parentNode.insertBefore(logoutBtn, wrapper.nextSibling);

        // attach logout handler
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
          window.location.href = 'index.html';
        });
      }

      // Remove qualquer 'null' residual em spans de sobrenome no header
      try {
        const possibleSobrenomes = header.querySelectorAll('#sobrenomeCliente');
        possibleSobrenomes.forEach(el => {
          if (!el.textContent || el.textContent.trim().toLowerCase() === 'null') {
            el.textContent = '';
            el.style.display = 'none';
          }
        });
      } catch (e) {
        // ignore
      }
    }

    ensureHeaderUserWidget();
    // Aplicar tema salvo globalmente (mixTema) em todas as páginas
    try {
      const savedTheme = localStorage.getItem('mixTema');
      if (savedTheme === 'dark') document.body.classList.add('theme-dark');
      else document.body.classList.remove('theme-dark');
    } catch (e) { /* ignore */ }
    // Esconde/remover por padrão o widget de cliente quando não há login
    function removeClientStatusElement() {
      try {
        const el = document.getElementById('clienteStatus');
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch (e) { /* ignore */ }
      try {
        const btn = document.getElementById('btnMinhaConta');
        if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
      } catch (e) { /* ignore */ }
      try {
        const lb = document.getElementById('logoutBtn');
        if (lb && lb.parentNode) lb.parentNode.removeChild(lb);
      } catch (e) { /* ignore */ }
    }

    try {
      const rawTipo = localStorage.getItem('tipoUsuario');
      const tipoInit = (rawTipo && rawTipo !== 'null' && rawTipo !== '') ? rawTipo : null;
      if (!tipoInit) {
        removeClientStatusElement();
      }
    } catch (e) {
      removeClientStatusElement();
    }

    // Garante que o container de botões de login exista e esteja visível
    function ensureLoginButtonsExistAndShow() {
      let _loginButtons = document.getElementById('loginButtons');
      const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
      if (!_loginButtons) {
        const div = document.createElement('div');
        div.id = 'loginButtons';
        div.innerHTML = `
          <a href="login-cliente.html" class="btn-login cliente">👤 Login Cliente</a>
          <a href="admin-login.html" class="btn-login admin">👤 Login Administrativo</a>
        `;
        if (headerEl) {
          const anchor = headerEl.querySelector('.cart-icon');
          if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(div, anchor);
          else headerEl.appendChild(div);
        } else {
          document.body.insertBefore(div, document.body.firstChild);
        }
        _loginButtons = div;
      }
      try { _loginButtons.style.display = ''; } catch (e) { /* ignore */ }
      return _loginButtons;
    }
    // Esconde o botão 'Minha Conta' nas páginas de login-cliente.html e admin-login.html
    const btnMinhaConta = document.getElementById("btnMinhaConta");
    const path = window.location.pathname.toLowerCase();
    if (btnMinhaConta) {
      if (path.includes("login-cliente.html") || path.includes("admin-login.html")) {
        btnMinhaConta.style.display = "none";
      } else {
        btnMinhaConta.style.display = "inline-flex";
        btnMinhaConta.addEventListener("click", function() {
          window.location.href = "/html/meu-perfil.html";
        });
      }
    }
  const formLogin = document.getElementById("formLogin");
  const mensagemErro = document.getElementById("mensagemErro");

  // Se o formulário não existir, apenas avisa e não quebra
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = document.getElementById("usuario")?.value.trim();
      const senha = document.getElementById("senha")?.value.trim();

      if (!usuario || !senha) {
        if (mensagemErro) {
          mensagemErro.innerText = "Por favor, preencha usuário e senha.";
          mensagemErro.style.color = "red";
        }
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/login-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, senha })
        });

        const result = await response.json();

        if (response.ok && result.sucesso) {
          // guarda dados no navegador
          localStorage.setItem("token", result.token);
          // Salva nome e sobrenome corretamente, nunca 'null' como string
          localStorage.setItem("nome", result.nome ? result.nome : "");
          localStorage.setItem("sobrenome", result.sobrenome ? result.sobrenome : "");
          localStorage.setItem("tipoUsuario", "Administrador");

          // redireciona para home
          window.location.href = "index.html";
        } else {
          if (mensagemErro) {
            mensagemErro.innerText = result.mensagem || "Usuário ou senha inválidos.";
            mensagemErro.style.color = "red";
          }
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
        if (mensagemErro) {
          mensagemErro.innerText = "❌ Erro de conexão com servidor!";
          mensagemErro.style.color = "red";
        }
      }
    });
  }

  // ---------------- STATUS DE LOGIN ---------------- //
  const statusAdmin = document.getElementById("statusLogado");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const logoutAdmin = document.getElementById("logout");
  const paginaAtual = window.location.pathname.toLowerCase();

  const clienteStatus = document.getElementById("clienteStatus");
  const fotoCliente = document.getElementById("fotoCliente");
  const nomeCliente = document.getElementById("nomeCliente");
  const sobrenomeCliente = document.getElementById("sobrenomeCliente");
  const logoutCliente = document.getElementById("logoutBtn");

  const loginButtons = document.getElementById("loginButtons"); // 🔹 Botões de login

  // 🔹 Botões de administração
  const btnAddProduto = document.getElementById("btnAddProduto");
  const btnRemoverProduto = document.getElementById("btnRemoverProduto");
  const btnEditarProduto = document.getElementById("btnEditarProduto");

  // Verifica se há login armazenado (normaliza valores inválidos como 'null' ou '')
  const rawTipoUsuario = localStorage.getItem("tipoUsuario");
  const tipoUsuario = (rawTipoUsuario && rawTipoUsuario !== 'null' && rawTipoUsuario !== '') ? rawTipoUsuario : null;

  if (tipoUsuario === "Administrador") {
    // Mostra status admin
    if (statusAdmin) {
      statusAdmin.style.display = "flex";
      if (nomeUsuario) {
        const nome = localStorage.getItem("nome");
        const sobrenome = localStorage.getItem("sobrenome");
        let nomeExibicao = "";
        if (nome && nome !== "null" && nome !== null) {
          const partesNome = nome.trim().split(" ");
          nomeExibicao += partesNome[0];
        }
        if (sobrenome && sobrenome !== "null" && sobrenome !== null) {
          const partesSobrenome = sobrenome.trim().split(" ");
          nomeExibicao += nomeExibicao ? " " + partesSobrenome[partesSobrenome.length - 1] : partesSobrenome[partesSobrenome.length - 1];
        }
        nomeUsuario.textContent = nomeExibicao.trim();
        if (!nomeExibicao.trim()) nomeUsuario.textContent = "";
      }

      let statusActions = statusAdmin.querySelector(".status-admin-actions");
      if (!statusActions) {
        statusActions = document.createElement("div");
        statusActions.className = "status-admin-actions";
        statusAdmin.appendChild(statusActions);
      }

      // botão de alternar tema (aparece apenas para administradores)
      try {
        let btnToggleAdminTheme = document.getElementById('btnToggleAdminTheme');
        if (!btnToggleAdminTheme) {
          btnToggleAdminTheme = document.createElement('button');
          btnToggleAdminTheme.id = 'btnToggleAdminTheme';
          btnToggleAdminTheme.className = 'btn-theme-toggle';
          btnToggleAdminTheme.setAttribute('aria-pressed', 'false');
          btnToggleAdminTheme.title = 'Alternar tema (claro / escuro)';
          btnToggleAdminTheme.style.marginRight = '8px';
          btnToggleAdminTheme.style.padding = '6px 10px';
          btnToggleAdminTheme.style.borderRadius = '6px';
          btnToggleAdminTheme.style.border = 'none';
          btnToggleAdminTheme.style.cursor = 'pointer';
          btnToggleAdminTheme.style.background = 'linear-gradient(90deg,#0f7cc6,#0bbdc3)';
          btnToggleAdminTheme.style.color = '#fff';
          btnToggleAdminTheme.innerHTML = '<i class="fa fa-moon" aria-hidden="true"></i>&nbsp;<span style="font-weight:600">Tema</span>';
          statusActions.appendChild(btnToggleAdminTheme);

          // inicializar estado do botão
          try {
            const st = localStorage.getItem('mixTema');
            if (st === 'dark') {
              btnToggleAdminTheme.setAttribute('aria-pressed','true');
              btnToggleAdminTheme.innerHTML = '<i class="fa fa-sun" aria-hidden="true"></i>&nbsp;<span style="font-weight:600">Tema</span>';
            } else {
              btnToggleAdminTheme.setAttribute('aria-pressed','false');
              btnToggleAdminTheme.innerHTML = '<i class="fa fa-moon" aria-hidden="true"></i>&nbsp;<span style="font-weight:600">Tema</span>';
            }
          } catch(e){}

          btnToggleAdminTheme.addEventListener('click', function() {
            try {
              const isDark = document.body.classList.contains('theme-dark');
              if (!isDark) {
                document.body.classList.add('theme-dark');
                this.setAttribute('aria-pressed','true');
                this.innerHTML = '<i class="fa fa-sun" aria-hidden="true"></i>&nbsp;<span style="font-weight:600">Tema</span>';
                try { localStorage.setItem('mixTema', 'dark'); } catch(e){}
              } else {
                document.body.classList.remove('theme-dark');
                this.setAttribute('aria-pressed','false');
                this.innerHTML = '<i class="fa fa-moon" aria-hidden="true"></i>&nbsp;<span style="font-weight:600">Tema</span>';
                try { localStorage.setItem('mixTema', 'light'); } catch(e){}
              }
            } catch (e) { console.warn('Erro alternar tema', e); }
          });
        }
      } catch (e) { /* ignore */ }

      if (logoutAdmin && logoutAdmin.parentElement !== statusActions) {
        statusActions.appendChild(logoutAdmin);
      }

      // Não exibir botão "Área Admin" — apenas mostrar status e o botão Sair
      try {
        const existingAdminBtn = document.getElementById('btnAreaAdmin');
        if (existingAdminBtn && existingAdminBtn.parentNode) existingAdminBtn.parentNode.removeChild(existingAdminBtn);
      } catch (e) { /* ignore */ }
    }
    if (loginButtons) loginButtons.style.display = "none"; // 🔹 Esconde botões de login
    // Esconde botão de logout do cliente se existir (evita duplicidade)
    try { const clientLogout = document.getElementById('logoutBtn'); if (clientLogout) clientLogout.style.display = 'none'; } catch(e){}
    // garante que o widget de cliente não apareça para admin
    if (clienteStatus) clienteStatus.style.display = 'none';
    if (btnMinhaConta) btnMinhaConta.style.display = 'none';
    // Remove eventuais botões de login soltos no header
    try {
      const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
      if (headerEl) headerEl.querySelectorAll('.btn-login').forEach(el => el.remove());
    } catch (e) {
      console.warn('Não foi possível remover botões de login soltos:', e);
    }

    // Mostra botões de administração
    if (btnAddProduto) btnAddProduto.style.display = "inline-block";
    if (btnRemoverProduto) btnRemoverProduto.style.display = "inline-block";
    if (btnEditarProduto) btnEditarProduto.style.display = "inline-block";

    // Esconde elementos de Ajuda para administradores
    try {
      document.querySelectorAll('.btn-ajuda, a[href$="ajuda.html"], nav.menu a[href*="ajuda.html"]').forEach(el => el.style.display = 'none');
    } catch (e) { /* ignore */ }

    // Oculta o menu principal e botões do topo quando logado como Administrador
    try {
      const nav = document.querySelector('nav.menu');
      if (nav) nav.style.display = 'none';
      document.querySelectorAll('.top-buttons, .header-links, header .menu, header .nav, .site-nav').forEach(el => {
        try { el.style.display = 'none'; } catch(e) {}
      });
    } catch (e) { /* ignore */ }

    // Esconder o ícone do carrinho especificamente na página de 'Gerenciar Produtos'
    try {
      const heading = document.querySelector('h1, h2');
      const headingText = heading ? (heading.textContent || '').trim().toLowerCase() : '';
      const path = window.location.pathname.toLowerCase();
      const isGerenciarPage = headingText.includes('gerenciar produtos') || path.includes('admin-area') || path.includes('loja.html');
      if (isGerenciarPage) {
        document.querySelectorAll('.cart-icon').forEach(el => { try { el.style.display = 'none'; } catch(e){} });
      }
    } catch (e) { /* ignore */ }

  } else if (tipoUsuario === "Cliente") {
    // Mostra status cliente
    if (clienteStatus) {
      clienteStatus.style.display = "flex";
      const nome = localStorage.getItem("nome");
      const sobrenome = localStorage.getItem("sobrenome");

      // Exibe o nome completo (campo `nome` + `sobrenome` do banco) sem truncar
      const nomeVal = (nome && nome !== "null") ? nome.trim() : "";
      const sobrenomeVal = (sobrenome && sobrenome !== "null") ? sobrenome.trim() : "";
      const nomeCompleto = [nomeVal, sobrenomeVal].filter(Boolean).join(' ').trim();
      if (nomeCliente) nomeCliente.textContent = nomeCompleto || '';
      if (sobrenomeCliente) sobrenomeCliente.textContent = '';

      // Preferir foto do servidor quando possível, cair para base64 em localStorage ou para o avatar padrão
      try {
        const clienteId = localStorage.getItem('clienteId');
        const serverUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : window.location.origin;
        if (clienteId && fotoCliente) {
          const url = `${serverUrl}/api/cliente/${clienteId}/foto?cb=${Date.now()}`;
          fotoCliente.onerror = function () {
            // se falhar, tentar usar foto em base64 armazenada localmente
            try {
              const fb = localStorage.getItem('foto');
              if (fb && fb !== 'null') { this.onerror = null; this.src = 'data:image/png;base64,' + fb; return; }
            } catch (e) { /* ignore */ }
            try { this.onerror = null; this.src = getDefaultAvatarDataUri(); } catch (e) {}
          };
          fotoCliente.src = url;
        } else {
          const fotoBase64 = localStorage.getItem("foto");
          if (fotoBase64 && fotoCliente && fotoBase64 !== "null") {
            fotoCliente.src = "data:image/png;base64," + fotoBase64;
          } else if (fotoCliente) {
            fotoCliente.src = getDefaultAvatarDataUri();
          }
        }
      } catch (e) {
        const fotoBase64 = localStorage.getItem("foto");
        if (fotoBase64 && fotoCliente && fotoBase64 !== "null") {
          fotoCliente.src = "data:image/png;base64," + fotoBase64;
        } else if (fotoCliente) {
          fotoCliente.src = getDefaultAvatarDataUri();
        }
      }
    }
    if (loginButtons) loginButtons.style.display = "none"; // 🔹 Esconde botões de login
    // Remove eventuais botões de login soltos no header
    try {
      const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
      if (headerEl) headerEl.querySelectorAll('.btn-login').forEach(el => el.remove());
    } catch (e) {
      console.warn('Não foi possível remover botões de login soltos:', e);
    }

    // Esconde botões de administração
    if (btnAddProduto) btnAddProduto.style.display = "none";
    if (btnRemoverProduto) btnRemoverProduto.style.display = "none";
    if (btnEditarProduto) btnEditarProduto.style.display = "none";
    // garante que o menu principal esteja visível para cliente
    try { const nav = document.querySelector('nav.menu'); if (nav) nav.style.display = ''; } catch(e){}
    // garante que o botão Minha Conta e o logout do cliente fiquem visíveis
    if (btnMinhaConta) {
      btnMinhaConta.style.display = 'inline-flex';
      try {
        // botão padronizado 'Minha Conta' (sem nome do usuário)
        btnMinhaConta.classList.add('btn-minha-conta');
        btnMinhaConta.innerHTML = `<i class="fa-solid fa-user" aria-hidden="true"></i><span style="margin-left:8px">Minha Conta</span>`;
        // garantir ação de redirecionamento
        btnMinhaConta.removeEventListener && btnMinhaConta.removeEventListener('click', () => {});
        btnMinhaConta.addEventListener('click', () => { window.location.href = '/html/meu-perfil.html'; });
      } catch (e) { /* ignore */ }
    }
    if (logoutCliente) logoutCliente.style.display = 'inline-flex';
    // Esconde o botão de logout administrativo se presente para evitar dois "Sair"
    try { const adminLogout = document.getElementById('logout'); if (adminLogout) adminLogout.style.display = 'none'; } catch(e){}
  } else {
    // usuário não logado: garantir estado de 'deslogado' visível
    try {
      if (clienteStatus) clienteStatus.style.display = 'none';
      if (statusAdmin) statusAdmin.style.display = 'none';
      if (btnMinhaConta) btnMinhaConta.style.display = 'none';
      if (logoutCliente) logoutCliente.style.display = 'none';
      const lb = ensureLoginButtonsExistAndShow();
      if (lb) {
        lb.style.display = 'flex';
        lb.style.marginLeft = 'auto';
        try { const nav = document.querySelector('nav.menu'); if (nav) nav.style.display = ''; } catch(e){}
      }
    } catch (e) { /* ignore */ }
  }

  // Logout admin
if (logoutAdmin) {
  logoutAdmin.addEventListener("click", () => {
    // Remove apenas dados de login, mantém produtos
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    localStorage.removeItem("sobrenome");
    // garante que os botões de login reapareçam imediatamente e remove widget de cliente
    try {
      if (typeof removeClientStatusElement === 'function') removeClientStatusElement();
      if (statusAdmin) statusAdmin.style.display = 'none';
      ensureLoginButtonsExistAndShow();
    } catch (e) { /* ignore */ }
    window.location.href = "index.html";
  });
}

// Logout cliente
if (logoutCliente) {
  logoutCliente.addEventListener("click", () => {
    // Remove apenas dados de login, mantém produtos
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("nome");
    localStorage.removeItem("sobrenome");
    localStorage.removeItem("foto");
    // garante que os botões de login reapareçam imediatamente e remove widget de cliente
    try {
      if (typeof removeClientStatusElement === 'function') removeClientStatusElement();
      if (statusAdmin) statusAdmin.style.display = 'none';
      ensureLoginButtonsExistAndShow();
    } catch (e) { /* ignore */ }
    window.location.href = "index.html";
  });
}

  // Garantia final: força posição e visibilidade de #loginButtons no header
  try {
    const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
    const _login = ensureLoginButtonsExistAndShow();
    if (headerEl && _login) {
      // move #loginButtons imediatamente antes do ícone do carrinho e alinha à direita
      const cart = headerEl.querySelector('.cart-icon');
      if (cart && cart.parentNode) cart.parentNode.insertBefore(_login, cart);
      // aplica estilos defensivos para garantir visibilidade
      _login.style.display = 'flex';
      _login.style.marginLeft = 'auto';
      _login.style.gap = '8px';
      _login.style.alignItems = 'center';
      _login.style.zIndex = '999';
    }
  } catch (e) { /* ignore */ }

// Mostrar/ocultar blocos "Contato" no rodapé conforme estado de login
(function toggleFooterContato() {
  try {
    const allFooterLinks = Array.from(document.querySelectorAll('.footer-links'));
    const contatoBlocks = allFooterLinks.filter(el => {
      const h4 = el.querySelector('h4');
      return h4 && h4.textContent.trim().toLowerCase() === 'contato';
    });

    // Mostrar 'Ajuda' apenas para clientes (não para administradores)
    const isLogged = tipoUsuario === 'Cliente';
    contatoBlocks.forEach(el => {
      el.style.display = isLogged ? '' : 'none';
    });

    // Mostrar/ocultar link 'Ajuda' no menu principal conforme estado de login
    try {
      const ajudaLink = document.querySelector('nav.menu a[href="ajuda.html"], nav.menu a[href="/html/ajuda.html"]');
      if (ajudaLink) ajudaLink.style.display = isLogged ? '' : 'none';
    } catch (e) { /* ignore */ }
  } catch (e) {
    console.warn('toggleFooterContato falhou:', e);
  }
})();

  // Garante que o link 'Ajuda' esteja posicionado logo após 'Trocas e Devoluções' quando logado
  function ensureHelpPosition(isLogged) {
    try {
      const nav = document.querySelector('nav.menu');
      if (!nav) return;
      const ul = nav.querySelector('ul');
      if (!ul) return;

      // procura o <li> com o link de trocas
      const trocasAnchor = ul.querySelector('a[href="trocas-devolucoes.html"], a[href="/html/trocas-devolucoes.html"]');
      const ajudaAnchor = ul.querySelector('a[href="ajuda.html"], a[href="/html/ajuda.html"]');

      if (!isLogged) {
        // esconder ou remover ajuda
        if (ajudaAnchor && ajudaAnchor.parentElement) {
          ajudaAnchor.parentElement.style.display = 'none';
        }
        return;
      }

      // quando logado, garantir que exista o item Ajuda
      let ajudaLi;
      if (ajudaAnchor && ajudaAnchor.parentElement) {
        ajudaLi = ajudaAnchor.parentElement;
        ajudaLi.style.display = '';
      } else {
        // criar li > a
        ajudaLi = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'ajuda.html';
        a.innerHTML = '<i class="fa-solid fa-circle-question menu-link-icon" aria-hidden="true"></i><span>Ajuda</span>';
        a.className = '';
        ajudaLi.appendChild(a);
      }

      // inserir após o elemento de trocas se possível
      if (trocasAnchor && trocasAnchor.parentElement && trocasAnchor.parentElement.parentElement === ul) {
        const trocasLi = trocasAnchor.parentElement;
        if (trocasLi.nextSibling) ul.insertBefore(ajudaLi, trocasLi.nextSibling);
        else ul.appendChild(ajudaLi);
      } else {
        // fallback: manter no final do menu
        if (!ul.contains(ajudaLi)) ul.appendChild(ajudaLi);
      }
    } catch (e) {
      // ignore
    }
  }

  // Mostrar/ocultar global do botão Ajuda: apenas clientes devem ver
  try {
    const isCliente = tipoUsuario === 'Cliente';
    document.querySelectorAll('.btn-ajuda, a[href$="ajuda.html"], nav.menu a[href*="ajuda.html"]').forEach(el => {
      el.style.display = isCliente ? '' : 'none';
    });
  } catch (e) { /* ignore */ }

  // chamar inicialmente com o estado atual
  try { ensureHelpPosition(!!tipoUsuario); } catch (e) { /* ignore */ }

  // Destacar link do menu correspondente à página atual
  (function markCurrentMenuLink() {
    try {
      const path = window.location.pathname.split('/').pop().toLowerCase();
      if (!path) return;
      document.querySelectorAll('nav.menu a').forEach(a => {
        const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
        if (!href) return;
        if (href === path || (path === 'index.html' && (href === 'index.html' || href === '/'))) {
          a.classList.add('menu-active');
        }
      });
    } catch (e) { /* ignore */ }
  })();

  // Retry/enforce login buttons in case other scripts modify header after load
  (function enforceLoginButtonsRetry() {
    let attempts = 0;
    const maxAttempts = 8;
    const interval = 120; // ms
    const id = setInterval(() => {
      attempts++;
      try {
        const lb = ensureLoginButtonsExistAndShow();
        if (lb) {
          lb.style.display = 'flex';
          lb.style.marginLeft = 'auto';
          lb.style.gap = '8px';
          lb.style.alignItems = 'center';
          lb.style.zIndex = '999';
        }
        // stop early if header has the cart and login buttons placed
        const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
        const cart = headerEl ? headerEl.querySelector('.cart-icon') : null;
        if (lb && cart && cart.previousSibling === lb) {
          clearInterval(id);
          return;
        }
      } catch (e) { /* ignore */ }
      if (attempts >= maxAttempts) clearInterval(id);
    }, interval);
  })();

});


