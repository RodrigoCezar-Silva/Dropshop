/**
 * Estado visual de autenticação do site.
 * Exibe informações do cliente/admin e controla logout no cabeçalho.
 */
// Tratamento de reinício de servidor (npm run dev) e abertura da página index
(function() {
  try {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const isIndex = path.endsWith('index.html') || path === '/' || path === '';

    // Se vier com flag de reset (passada pelo npm run dev), limpa login
    if (params.has('resetAuth') || params.has('deslogar') || params.has('logout')) {
      const keys = ['tipoUsuario','token','nome','sobrenome','isAdmin','foto','fotoMime','clienteCPF','email','clienteTelefone','clienteId'];
      keys.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      } catch (e) {}
    } else if (isIndex) {
      // Se abrir a página index e não houver uma sessão ativa iniciada nesta aba, garante deslogado
      const activeSession = sessionStorage.getItem('activeClienteSession') === '1';
      const tipo = localStorage.getItem('tipoUsuario');
      // Funcionário ou Administrador NUNCA devem permanecer logados na home (index.html)
      if (tipo === 'Funcionario' || tipo === 'Administrador' || !activeSession) {
        const keys = ['tipoUsuario','token','nome','sobrenome','isAdmin','foto','fotoMime','clienteCPF','email','clienteTelefone','clienteId'];
        keys.forEach(k => localStorage.removeItem(k));
      }
    }
  } catch (e) {}
})();

document.addEventListener("DOMContentLoaded", () => {
    // Cria/injeta widget de usuário no cabeçalho onde houver o botão `btnMinhaConta`
    function ensureHeaderUserWidget() {
      const header = document.querySelector('header.site-header') || document.querySelector('header');
      if (!header) return;

      const path = window.location.pathname.toLowerCase();
      if (path.includes('funcionario-area') || path.includes('admin-area') || path.includes('controle-estoque') || path.includes('cadastro-') || path.includes('/funcionario-') || path.includes('admin-estatisticas') || path.includes('admin-avaliacoes')) {
        return;
      }

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

      const greetingSpan = document.createElement('span');
      greetingSpan.className = 'user-greeting';
      greetingSpan.textContent = 'Olá,';
      names.appendChild(greetingSpan);

      const nomeSpan = document.createElement('span');
      nomeSpan.id = 'nomeCliente';
      nomeSpan.className = 'nome-usuario';
      names.appendChild(nomeSpan);

      const sobreSpan = document.createElement('span');
      sobreSpan.id = 'sobrenomeCliente';
      sobreSpan.className = 'nome-usuario';
      sobreSpan.style.display = 'none';
      names.appendChild(sobreSpan);

      wrapper.appendChild(img);
      wrapper.appendChild(names);
      wrapper.title = 'Acessar Meu Perfil';
      wrapper.style.cursor = 'pointer';
      wrapper.addEventListener('click', () => {
        window.location.href = '/html/meu-perfil.html';
      });

      // tenta inserir antes do botão Minha Conta se houver; senão, insere antes do ícone de carrinho ou no fim do header
      let anchor = header.querySelector('#btnMinhaConta');
      if (!anchor) anchor = header.querySelector('.cart-icon');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(wrapper, anchor);
      } else {
        header.appendChild(wrapper);
      }

      // Remove qualquer botão 'Minha Conta' existente no header
      header.querySelectorAll('#btnMinhaConta, .btn-minha-conta').forEach(el => el.remove());

      // cria ou garante botão 'Sair' ao lado do widget de usuário
      let logoutBtn = header.querySelector('#logoutBtn');
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-logout header-logout';
        logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sair</span>';
        wrapper.parentNode.insertBefore(logoutBtn, wrapper.nextSibling);

        // attach logout handler
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const currentTipo = localStorage.getItem('tipoUsuario');
          if (currentTipo === 'Funcionario') {
            localStorage.removeItem('tipoUsuario');
            localStorage.removeItem('token');
            localStorage.removeItem('nome');
            localStorage.removeItem('sobrenome');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('foto');
            localStorage.removeItem('fotoMime');
            localStorage.removeItem('clienteId');
            sessionStorage.removeItem('activeClienteSession');
            const isHtmlDir = window.location.pathname.includes('/html/');
            window.location.href = isHtmlDir ? '../index.html' : './index.html';
            return;
          }
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
          localStorage.removeItem('clienteId');
          sessionStorage.removeItem('activeClienteSession');
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
        try { localStorage.removeItem('clienteId'); } catch(e) {}
      }
    } catch (e) {
      removeClientStatusElement();
    }

    // Garante que o container de botões de login exista e esteja visível
    function ensureLoginButtonsExistAndShow() {
      const tipoAtual = localStorage.getItem('tipoUsuario');
      let _loginButtons = document.getElementById('loginButtons');
      if (tipoAtual && tipoAtual !== 'null' && tipoAtual !== '') {
        if (_loginButtons) {
          try { _loginButtons.style.display = 'none'; } catch (e) { /* ignore */ }
        }
        return _loginButtons;
      }
      const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
      if (!_loginButtons) {
        const div = document.createElement('div');
        div.id = 'loginButtons';
        div.innerHTML = `
          <a href="login-cliente.html" class="btn-login cliente">👤 Login Cliente</a>
          <a href="admin-login.html" class="btn-login admin">👤 Login Administrativo</a>
          <a href="login-funcionario.html" class="btn-login admin">👤 Login Funcionário</a>
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
  // Remover bloco de status apenas em páginas administrativas (por exemplo: admin-area, cadastro-admin, controle-estoque)
  const pathname = window.location.pathname.toLowerCase();
  const isAdminPage = pathname.includes('/html/admin') || pathname.includes('admin-area') || pathname.includes('cadastro-admin') || pathname.includes('controle-estoque') || pathname.includes('/admin-');
  // Não remover mais o bloco de status automaticamente em páginas admin.
  // Mantemos o elemento para permitir mostrar o botão ao lado do status.
  // Botão ao lado do status (pequeno) — mostrar quando status estiver visível
  try {
    const btnExitNear = document.getElementById('btnExitNearStatus');
    if (btnExitNear) {
      if (tipoUsuario === 'Administrador' && !isAdminPage) {
        btnExitNear.style.display = 'inline-flex';
      } else {
        btnExitNear.style.display = 'none';
      }
      btnExitNear.addEventListener('click', function () {
        try {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
        } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
      });
    }
  } catch (e) { /* ignore */ }

  // Botão pequeno à direita do status — aparece quando o status está visível
  try {
    const btnExitRight = document.getElementById('btnExitRight');
    if (btnExitRight) {
      // mostrar quando for administrador (em páginas públicas e admin-area também)
      if (tipoUsuario === 'Administrador') {
        btnExitRight.style.display = 'inline-flex';
      } else {
        btnExitRight.style.display = 'none';
      }
      btnExitRight.addEventListener('click', function () {
        try {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
        } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
      });
    }
  } catch (e) { /* ignore */ }

  // Botão externo (maior) para aparecer fora do bloco de status, à direita
  try {
    let btnOutside = document.getElementById('btnExitOutside');
    if (!btnOutside) {
      btnOutside = document.createElement('button');
      btnOutside.id = 'btnExitOutside';
      btnOutside.className = 'btn-exit-outside';
      btnOutside.textContent = 'Sair';
      const header = document.querySelector('header.site-header') || document.querySelector('header');
      // insert into header for absolute positioning
      if (header) header.appendChild(btnOutside);

      btnOutside.addEventListener('click', function () {
        try {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
        } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
      });

      // position it to the right outside the status box
      function positionBtnOutside() {
        try {
          const headerRect = header.getBoundingClientRect();
          const statusRect = statusAdmin ? statusAdmin.getBoundingClientRect() : null;
          if (!statusRect) return;
          // compute left relative to header
          const left = statusRect.right - headerRect.left + 12; // 12px gap
          const top = statusRect.top - headerRect.top + (statusRect.height/2) - (btnOutside.offsetHeight/2);
          btnOutside.style.position = 'absolute';
          btnOutside.style.left = `${left}px`;
          btnOutside.style.top = `${Math.max(top, 8)}px`;
          btnOutside.style.zIndex = 1500;
        } catch (e) { /* ignore */ }
      }

      window.addEventListener('resize', positionBtnOutside);
      // small delay to allow layout
      setTimeout(positionBtnOutside, 120);
    }
    try {
      if (btnOutside) btnOutside.style.display = (tipoUsuario === 'Administrador') ? 'inline-flex' : 'none';
    } catch (e) {}
  } catch (e) { /* ignore */ }
  // Garantir remoção de botão duplicado de saída em páginas admin
  try {
    const duplicateExit = document.getElementById('btnExitAdminPage');
    if (duplicateExit && duplicateExit.parentNode) {
      duplicateExit.parentNode.removeChild(duplicateExit);
    }
  } catch (e) { /* ignore */ }

  // Configura botão de logout do cabeçalho (visível quando houver usuário logado)
  try {
    const btnLogoutHeader = document.getElementById('btnLogoutHeader');
    if (btnLogoutHeader) {
      btnLogoutHeader.style.display = 'none';

      btnLogoutHeader.addEventListener('click', function () {
        try {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
        } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
      });
    }
  } catch (e) { /* ignore */ }
  // Botão de logout inline (lado esquerdo do status)
  try {
    const btnLogoutInline = document.getElementById('btnLogoutInline');
    if (btnLogoutInline) {
      // exibir somente quando for administrador e não estiver em páginas admin (evita duplicidade)
      if (tipoUsuario === 'Administrador' && !isAdminPage) {
        btnLogoutInline.style.display = 'inline-flex';
      } else {
        btnLogoutInline.style.display = 'none';
      }

      btnLogoutInline.addEventListener('click', function () {
        try {
          localStorage.removeItem('tipoUsuario');
          localStorage.removeItem('token');
          localStorage.removeItem('nome');
          localStorage.removeItem('sobrenome');
          localStorage.removeItem('foto');
        } catch (e) { /* ignore */ }
        // Recarrega página inicial após sair do modo admin
        window.location.href = 'index.html';
      });
    }
  } catch (e) { /* ignore */ }
  const nomeUsuario = document.getElementById("nomeUsuario");
  const logoutAdmin = document.getElementById("logout");
  const paginaAtual = window.location.pathname.toLowerCase();
  const isIndexPage = paginaAtual.endsWith('index.html') || paginaAtual === '/' || paginaAtual === '';

  const clienteStatus = document.getElementById("clienteStatus");
  const fotoCliente = document.getElementById("fotoCliente");
  const nomeCliente = document.getElementById("nomeCliente");
  const sobrenomeCliente = document.getElementById("sobrenomeCliente");
  const nomeCompletoEl = document.getElementById('nomeCompleto');
  const logoutCliente = document.getElementById("logoutBtn");

  const loginButtons = document.getElementById("loginButtons"); // 🔹 Botões de login

  // 🔹 Botões de administração
  const btnAddProduto = document.getElementById("btnAddProduto");
  const btnRemoverProduto = document.getElementById("btnRemoverProduto");
  const btnEditarProduto = document.getElementById("btnEditarProduto");

  // Verifica se há login armazenado (normaliza valores inválidos como 'null' ou '')
  const rawTipoUsuario = localStorage.getItem("tipoUsuario");
  let tipoUsuario = (rawTipoUsuario && rawTipoUsuario !== 'null' && rawTipoUsuario !== '') ? rawTipoUsuario : null;

  // Na página inicial (index.html), NUNCA exibe funcionário ou admin, e requer activeClienteSession
  if (isIndexPage) {
    const activeSession = sessionStorage.getItem('activeClienteSession') === '1';
    if (!activeSession || tipoUsuario === 'Funcionario' || tipoUsuario === 'Administrador') {
      tipoUsuario = null;
    }
  }

  // Marca o documento quando for administrador para permitir CSS de alto impacto
  try {
    if (tipoUsuario === 'Administrador') {
      document.body.classList.add('is-admin-mode');
    } else {
      document.body.classList.remove('is-admin-mode');
    }
  } catch (e) { /* ignore */ }

  // Tornar o nome/logo clicável para voltar à área administrativa
  try {
    if (tipoUsuario === 'Administrador') {
      const adminTargetSelectors = [
        '.logo-text.admin-name',
        '.logo .logo-text',
        '#nomeUsuario',
        '#statusLogado .status-text',
        '.logo-text'
      ];
      const redirectToAdmin = function () { window.location.href = '/html/admin-area.html'; };
      adminTargetSelectors.forEach(sel => {
        try {
          const el = document.querySelector(sel);
          if (el) {
            el.style.cursor = 'pointer';
            // remove previous handler guard
            try { el.removeEventListener && el.removeEventListener('click', redirectToAdmin); } catch(e){}
            el.addEventListener('click', redirectToAdmin);
          }
        } catch (e) { /* ignore */ }
      });
    }
  } catch (e) { /* ignore */ }

  if (tipoUsuario === "Administrador") {
    // Não mostrar o bloco grande de status como "login"; usar badge discreto no header
    if (statusAdmin) {
      try { statusAdmin.style.display = "none"; } catch (e) {}
      if (nomeUsuario) {
        const nome = localStorage.getItem("nome");
        const sobrenome = localStorage.getItem("sobrenome");
        const nomeVal = (nome && nome !== 'null') ? nome.trim() : '';
        const sobrenomeVal = (sobrenome && sobrenome !== 'null') ? sobrenome.trim() : '';
        const fullName = [nomeVal, sobrenomeVal].filter(Boolean).join(' ').trim() || 'Rodrigo Cezar';
        nomeUsuario.textContent = fullName;
        // Criar apenas o botão 'Sair' no header (sem badge de texto)
        try {
          const header = document.querySelector('header.site-header') || document.querySelector('header');
          if (header) {
            // Remove qualquer botão duplicado de saída que possa ter sido injetado
            header.querySelectorAll('#btnExitAdminPage, #btnExitOutside, .btn-exit-admin:not(#adminBadgeExit)').forEach(el => el.remove());

            let adminBadgeExit = document.getElementById('adminBadgeExit');
            if (!adminBadgeExit) {
              adminBadgeExit = document.createElement('button');
              adminBadgeExit.id = 'adminBadgeExit';
              adminBadgeExit.className = 'admin-badge-exit';
              adminBadgeExit.type = 'button';
              adminBadgeExit.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sair</span>';
              header.appendChild(adminBadgeExit);
              adminBadgeExit.addEventListener('click', function () {
                try {
                  localStorage.removeItem('tipoUsuario');
                  localStorage.removeItem('token');
                  localStorage.removeItem('nome');
                  localStorage.removeItem('sobrenome');
                  localStorage.removeItem('foto');
                } catch (e) { /* ignore */ }
                window.location.href = 'index.html';
              });
            } else {
              adminBadgeExit.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sair</span>';
            }
            // garantir visibilidade apenas para administrador
            adminBadgeExit.style.display = (tipoUsuario === 'Administrador') ? 'inline-flex' : 'none';
          }
        } catch (e) { /* ignore */ }
      }

      let statusActions = statusAdmin.querySelector(".status-admin-actions");
      if (!statusActions) {
        statusActions = document.createElement("div");
        statusActions.className = "status-admin-actions";
        statusAdmin.appendChild(statusActions);
      }

      // botão de alternar tema (aparece apenas para administradores) —
      // NÃO criar na página index.html quando logado como admin
      try {
        // se estivermos na página index, não adicionamos o botão
        if (!isIndexPage) {
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
        } else {
          // se estivermos na index.html, remover qualquer instância existente do botão de tema
          try { const existingThemeBtn = document.getElementById('btnToggleAdminTheme'); if (existingThemeBtn && existingThemeBtn.parentNode) existingThemeBtn.parentNode.removeChild(existingThemeBtn); } catch(e){}
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
    try { const headerLogout = document.getElementById('btnLogoutHeader'); if (headerLogout) headerLogout.style.display = 'none'; } catch(e) {}
    // Esconde botão de logout do cliente se existir (evita duplicidade)
    try { const clientLogout = document.getElementById('logoutBtn'); if (clientLogout) clientLogout.style.display = 'none'; } catch(e){}
    // garante que o widget de cliente não apareça para admin
    if (clienteStatus) {
      try { clienteStatus.classList.remove('show'); } catch(e) { clienteStatus.style.display = 'none'; }
    }
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
      try { clienteStatus.classList.add('show'); } catch(e) { clienteStatus.style.display = 'flex'; }
      const nome = localStorage.getItem("nome");
      const sobrenome = localStorage.getItem("sobrenome");

      // Formata nome para exibição elegante no chip (ex: Rodrigo Cezar)
      const nomeVal = (nome && nome !== "null") ? nome.trim() : "";
      const sobrenomeVal = (sobrenome && sobrenome !== "null") ? sobrenome.trim() : "";
      const partesNome = [nomeVal, sobrenomeVal].filter(Boolean).join(' ').trim().split(/\s+/);
      let nomeFormatado = partesNome[0] || 'Cliente';
      if (partesNome.length > 1) {
        nomeFormatado += ' ' + partesNome[1]; // Ex: "Rodrigo Cezar"
      }
      if (nomeCompletoEl) {
        nomeCompletoEl.textContent = nomeFormatado;
      } else {
        if (nomeCliente) nomeCliente.textContent = nomeFormatado;
        if (sobrenomeCliente) {
          sobrenomeCliente.textContent = '';
          sobrenomeCliente.style.display = 'none';
        }
      }

      // Preferir foto do servidor quando possível, cair para base64 em localStorage ou para o avatar padrão
      try {
        const clienteId = localStorage.getItem('clienteId');
        // Evitar apontar automaticamente para :3000 quando a página está em Live Server
        const explicitApiBase = (typeof window.__API_BASE__ !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : null;
        const serverUrl = explicitApiBase || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (!location.port || location.port === '3000') ? `${window.location.protocol}//${window.location.hostname}:3000` : window.location.origin);
        if (clienteId && fotoCliente) {
          const url = (serverUrl && serverUrl.indexOf(':3000')>-1) ? `${serverUrl}/api/cliente/${clienteId}/foto?cb=${Date.now()}` : null;
          fotoCliente.onerror = function () {
            // se falhar, tentar usar foto em base64 armazenada localmente
            try {
              const fb = localStorage.getItem('foto');
              if (fb && fb !== 'null') { this.onerror = null; this.src = 'data:image/png;base64,' + fb; return; }
            } catch (e) { /* ignore */ }
            try { this.onerror = null; this.src = getDefaultAvatarDataUri(); } catch (e) {}
          };
          // Não atribuir src se não formos apontar para o backend (evita ERR_CONNECTION_REFUSED)
          if (url) fotoCliente.src = url; else {
            try {
              const fb = localStorage.getItem('foto');
              if (fb && fb !== 'null') { fotoCliente.src = 'data:image/png;base64,' + fb; }
              else fotoCliente.src = getDefaultAvatarDataUri();
            } catch (e) { fotoCliente.src = getDefaultAvatarDataUri(); }
          }
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
    // Esconde o botão Minha Conta (o acesso ao perfil é feito pelo clique no próprio status do cliente)
    if (btnMinhaConta) btnMinhaConta.style.display = 'none';
    try {
      const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
      if (headerEl) headerEl.querySelectorAll('#btnMinhaConta, .btn-minha-conta').forEach(el => el.remove());
    } catch(e){}

    // Garante que o status do cliente redirecione para a Área do Cliente ao ser clicado
    if (clienteStatus) {
      clienteStatus.style.cursor = 'pointer';
      clienteStatus.title = 'Acessar Área do Cliente';
      clienteStatus.onclick = () => {
        const isHtmlDir = window.location.pathname.includes('/html/');
        window.location.href = isHtmlDir ? 'meu-perfil.html' : './html/meu-perfil.html';
      };
    }
    if (logoutCliente) {
      logoutCliente.style.display = 'inline-flex';
      logoutCliente.innerHTML = `<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sair</span>`;
    }
    // Esconde o botão de logout administrativo se presente para evitar dois "Sair"
    try { const adminLogout = document.getElementById('logout'); if (adminLogout) adminLogout.style.display = 'none'; } catch(e){}
  } else if (tipoUsuario === "Funcionario") {
    const isAreaPage = paginaAtual.includes('funcionario-area') || paginaAtual.includes('admin-area') || paginaAtual.includes('controle-estoque') || paginaAtual.includes('cadastro-') || paginaAtual.includes('/funcionario-');
    if (isAreaPage) {
      if (clienteStatus) {
        try { clienteStatus.classList.remove('show'); } catch(e) {}
        clienteStatus.style.display = 'none';
      }
      if (statusAdmin) statusAdmin.style.display = 'none';
      if (btnMinhaConta) btnMinhaConta.style.display = 'none';
      if (logoutCliente) logoutCliente.style.display = 'none';
      if (loginButtons) loginButtons.style.display = 'none';
      try {
        const nav = document.querySelector('nav.menu');
        if (nav) nav.style.display = 'none';
      } catch (e) {}

      // Garante que o logotipo mostre "Funcionário: <Nome>" no topo
      try {
        const logo = document.querySelector('.logo');
        if (logo) {
          const nome = (localStorage.getItem('nome') || '').trim();
          const sobrenome = (localStorage.getItem('sobrenome') || '').trim();
          const fullName = [nome, sobrenome].filter(Boolean).join(' ').trim() || 'Funcionário';
          const logoText = logo.querySelector('.logo-text') || logo;
          logoText.textContent = `Funcionário: ${fullName}`;
        }
      } catch (e) {}

      try {
        const headerEl = document.querySelector('header.site-header') || document.querySelector('header');
        if (headerEl) {
          headerEl.querySelectorAll('#logoutBtn, #adminBadgeExit, #btnLogoutHeader, #btnLogoutInline, #btnExitNearStatus, #btnExitRight, #logout, .header-logout, .admin-badge-exit, .btn-exit-admin, #clienteStatus, #statusLogado, .status-admin, .header-user').forEach(el => el.remove());

          // Garante que o botão Sair oficial esteja posicionado à direita
          let btnExitHeader = document.getElementById('btnExitHeader');
          if (!btnExitHeader) {
            btnExitHeader = document.createElement('button');
            btnExitHeader.id = 'btnExitHeader';
            btnExitHeader.className = 'btn-header-exit';
            btnExitHeader.type = 'button';
            btnExitHeader.title = 'Sair do modo funcionário';
            btnExitHeader.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Sair</span>';
            headerEl.appendChild(btnExitHeader);
          }
          btnExitHeader.style.display = 'inline-flex';
          btnExitHeader.onclick = function(e) {
            e.preventDefault();
            localStorage.removeItem("tipoUsuario");
            localStorage.removeItem("token");
            localStorage.removeItem("nome");
            localStorage.removeItem("sobrenome");
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("foto");
            localStorage.removeItem("fotoMime");
            const isHtmlDir = window.location.pathname.includes('/html/');
            window.location.href = isHtmlDir ? '../index.html' : './index.html';
          };
        }
      } catch (e) {}
      return;
    }

    // 🔹 Mostra status funcionário apenas em páginas públicas (como index.html, loja.html)
    if (clienteStatus) {
      try { clienteStatus.classList.add('show'); } catch(e) { clienteStatus.style.display = 'flex'; }
      const nome = localStorage.getItem("nome");
      const sobrenome = localStorage.getItem("sobrenome");

      const nomeVal = (nome && nome !== "null") ? nome.trim() : "";
      const sobrenomeVal = (sobrenome && sobrenome !== "null") ? sobrenome.trim() : "";
      const nomeCompleto = [nomeVal, sobrenomeVal].filter(Boolean).join(' ').trim() || "Funcionário";
      if (nomeCompletoEl) {
        nomeCompletoEl.textContent = nomeCompleto;
      } else {
        if (nomeCliente) nomeCliente.textContent = nomeCompleto;
        if (sobrenomeCliente) sobrenomeCliente.textContent = '';
      }

      const fotoBase64 = localStorage.getItem("foto");
      const fotoMime = localStorage.getItem("fotoMime") || "image/jpeg";
      if (fotoBase64 && fotoCliente && fotoBase64 !== "null") {
        fotoCliente.src = fotoBase64.startsWith('data:') ? fotoBase64 : `data:${fotoMime};base64,${fotoBase64}`;
      } else if (fotoCliente) {
        fotoCliente.src = getDefaultAvatarDataUri();
      }
    }

    if (loginButtons) loginButtons.style.display = "none";
    if (statusAdmin) statusAdmin.style.display = "none";
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

    // Garante menu visível
    try { const nav = document.querySelector('nav.menu'); if (nav) nav.style.display = ''; } catch(e){}

    // Esconde botão "Minha Conta" (exclusivo para cliente)
    if (btnMinhaConta) btnMinhaConta.style.display = 'none';

    // Garante que o botão Sair do funcionário esteja visível e estilizado
    let btnSairFuncionario = document.getElementById('logoutBtn');
    if (!btnSairFuncionario) {
      btnSairFuncionario = document.createElement('button');
      btnSairFuncionario.id = 'logoutBtn';
      const header = document.querySelector('header.site-header') || document.querySelector('header');
      const cart = header ? header.querySelector('.cart-icon') : null;
      if (cart && cart.parentNode) {
        cart.parentNode.insertBefore(btnSairFuncionario, cart);
      } else if (header) {
        header.appendChild(btnSairFuncionario);
      }
    }

    if (btnSairFuncionario) {
      btnSairFuncionario.style.display = 'inline-flex';
      btnSairFuncionario.className = 'btn-logout header-logout btn-logout-funcionario';
      btnSairFuncionario.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span style="margin-left:6px;">Sair</span>';
      btnSairFuncionario.title = 'Sair e voltar para a tela de login';
      btnSairFuncionario.onclick = function(e) {
        e.preventDefault();
        localStorage.removeItem("tipoUsuario");
        localStorage.removeItem("token");
        localStorage.removeItem("nome");
        localStorage.removeItem("sobrenome");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("foto");
        localStorage.removeItem("fotoMime");
        const isHtmlDir = window.location.pathname.includes('/html/');
        window.location.href = isHtmlDir ? '../index.html' : './index.html';
      };
    }

    try { const adminLogout = document.getElementById('logout'); if (adminLogout) adminLogout.style.display = 'none'; } catch(e){}
  } else {
    // usuário não logado: garantir estado de 'deslogado' visível
    try {
      if (clienteStatus) { try { clienteStatus.classList.remove('show'); } catch(e) { clienteStatus.style.display = 'none'; } }
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

    // Garantir que o badge de admin não seja mostrado para usuários não-admin
    try {
      const adminBadge = document.getElementById('adminBadge');
      if (adminBadge && tipoUsuario !== 'Administrador') {
        adminBadge.style.display = 'none';
      }
    } catch (e) { /* ignore */ }

  // Logout admin
if (logoutAdmin) {
  logoutAdmin.addEventListener("click", () => {
    const currentTipo = localStorage.getItem("tipoUsuario");
    if (currentTipo === "Funcionario") {
      localStorage.removeItem("tipoUsuario");
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      localStorage.removeItem("sobrenome");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("foto");
      localStorage.removeItem("fotoMime");
      const isHtmlDir = window.location.pathname.includes('/html/');
      window.location.href = isHtmlDir ? '../index.html' : './index.html';
      return;
    }
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

// Logout cliente e funcionário
if (logoutCliente) {
  logoutCliente.addEventListener("click", (e) => {
    e.preventDefault();
    const currentTipo = localStorage.getItem("tipoUsuario");
    if (currentTipo === "Funcionario") {
      localStorage.removeItem("tipoUsuario");
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      localStorage.removeItem("sobrenome");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("foto");
      localStorage.removeItem("fotoMime");
      try {
        if (typeof removeClientStatusElement === 'function') removeClientStatusElement();
        if (statusAdmin) statusAdmin.style.display = 'none';
        ensureLoginButtonsExistAndShow();
      } catch (e) { /* ignore */ }
      const isHtmlDir = window.location.pathname.includes('/html/');
      window.location.href = isHtmlDir ? '../index.html' : './index.html';
      return;
    }
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
    if (!tipoUsuario && headerEl && _login) {
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
    if (tipoUsuario) return;
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


