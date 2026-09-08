document.addEventListener("DOMContentLoaded", () => {
  function getDefaultAvatarDataUri() {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3' fill='%23e6eef8'/><path d='M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6' fill='%23e6eef8'/></svg>";
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const formLogin = document.getElementById("formLogin");
  const mensagemErro = document.getElementById("mensagemErro");

  // helper to navigate to admin area trying common candidates
  async function navigateToAdmin() {
    const isHtmlDir = window.location.pathname.includes('/html/');
    const candidates = isHtmlDir
      ? ['admin-area.html', '/html/admin-area.html', '/admin-area.html']
      : ['html/admin-area.html', 'admin-area.html', '/html/admin-area.html', '/admin-area.html'];
    for (const p of candidates) {
      try {
        const res = await fetch(p, { method: 'HEAD' });
        if (res && res.ok) { window.location.href = p; return; }
      } catch (e) { }
    }
    window.location.href = isHtmlDir ? 'admin-area.html' : 'html/admin-area.html';
  }

  async function navigateToFuncionario() {
    const isHtmlDir = window.location.pathname.includes('/html/');
    const candidates = isHtmlDir
      ? ['funcionario-area.html', '/html/funcionario-area.html', '/funcionario-area.html']
      : ['html/funcionario-area.html', 'funcionario-area.html', '/html/funcionario-area.html', '/funcionario-area.html'];
    for (const p of candidates) {
      try {
        const res = await fetch(p, { method: 'HEAD' });
        if (res && res.ok) { window.location.href = p; return; }
      } catch (e) { }
    }
    window.location.href = isHtmlDir ? 'funcionario-area.html' : 'html/funcionario-area.html';
  }

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
        const defaultBackend = 'http://localhost:3000';
        const defaultBackend = 'http://127.0.0.1:3000';
        const hostname = window.location.hostname;
        const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || !hostname || window.location.protocol === 'file:';
        let base = window.AUTH_SERVER;
        const isPlaceholderBase = base && /SEU_API_DOMAIN|your-api|example\.com/i.test(base);
        const isInvalidAuthServer = !base || base.includes('.html') || isPlaceholderBase;
        if (isInvalidAuthServer) {
          base = (isLocalHost && window.location.port === '3000') ? window.location.origin : defaultBackend;
        }
        if (!base) base = defaultBackend;

        let response = await fetch(`${base.replace(/\/$/, '')}/login-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, senha })
        });
        const endpoints = [
          base.replace(/\/$/, ''),
          'http://127.0.0.1:3000',
          'http://localhost:3000'
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        if (response.status === 405 && base !== defaultBackend) {
        let response = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            response = await fetch(`${defaultBackend}/login-admin`, {
            const res = await fetch(`${endpoint}/login-admin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario, senha })
            });
          } catch (e) { }
            if (res && res.status !== 404) {
              response = res;
              break;
            }
          } catch (err) {
            lastError = err;
          }
        }

        if (!response) {
          throw lastError || new Error("Falha na conexão com o servidor.");
        }

        let result = {};
        try {
          const text = await response.text();
          result = text ? JSON.parse(text) : {};
        } catch (e) {
          result = {};
        }

        if (response.ok && result.sucesso) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("nome", result.nome || "");
          localStorage.setItem("sobrenome", result.sobrenome || "");
          if (result.fotoBase64) {
            localStorage.setItem('foto', result.fotoBase64);
            if (result.fotoMime) localStorage.setItem('fotoMime', result.fotoMime);
          }
          const role = (result.role || 'admin').toString().toLowerCase();
          if (role === 'funcionario') {
            localStorage.setItem("tipoUsuario", "Funcionario");
            localStorage.removeItem("isAdmin");
            await navigateToFuncionario();
          } else {
            localStorage.setItem("tipoUsuario", "Administrador");
            localStorage.setItem("isAdmin", "true");
            await navigateToAdmin();
          }
        } else {
          if (mensagemErro) {
            mensagemErro.innerText = result.mensagem || "Usuário ou senha inválidos.";
            mensagemErro.style.color = "red";
          }
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
        // se o backend não estiver acessível, tentar login mock se configurado em auth-config
        const cfg = window.AUTH_CONFIG || {};
        if (cfg.mockAdmin && cfg.mockAdmin.enabled) {
          const mockUser = cfg.mockAdmin.user || 'admin';
          const mockPass = cfg.mockAdmin.pass || 'admin';
          if (usuario === mockUser && senha === mockPass) {
            // mock successful login
            localStorage.setItem("token", "MOCK_TOKEN");
            localStorage.setItem("nome", mockUser);
            localStorage.setItem("sobrenome", "");
            localStorage.setItem("tipoUsuario", "Administrador");
            localStorage.setItem("isAdmin", "true");
            await navigateToAdmin();
            return;
          } else {
            if (mensagemErro) {
              mensagemErro.innerText = "Usuário ou senha inválidos (mock).";
              mensagemErro.style.color = "red";
            }
            return;
          }
        }

        if (mensagemErro) {
          mensagemErro.innerText = "❌ Erro de conexão com servidor!";
          mensagemErro.innerText = "❌ Erro ao conectar com o banco de dados/servidor!";
          mensagemErro.innerText = "❌ Servidor backend (porta 3000) não está respondendo. Execute 'npm run dev' no terminal.";
          mensagemErro.style.color = "red";
        }
      }
    });
  }

  // ---------------- STATUS DE LOGIN ---------------- //
  const statusAdmin = document.getElementById("statusLogado");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const logoutAdmin = document.getElementById("logout");

  const clienteStatus = document.getElementById("clienteStatus");
  const fotoCliente = document.getElementById("fotoCliente");
  const nomeCliente = document.getElementById("nomeCliente");
  const sobrenomeCliente = document.getElementById("sobrenomeCliente");
  const logoutCliente = document.getElementById("logoutBtn");

  const loginButtons = document.getElementById("loginButtons");

  const btnAddProduto = document.getElementById("btnAddProduto");
  const btnRemoverProduto = document.getElementById("btnRemoverProduto");
  const btnEditarProduto = document.getElementById("btnEditarProduto");

  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario === "Administrador") {
    if (statusAdmin) {
      statusAdmin.style.display = "flex";
      if (nomeUsuario) {
        nomeUsuario.textContent = localStorage.getItem("nome") + " " + localStorage.getItem("sobrenome");
      }
    }
    if (loginButtons) loginButtons.style.display = "none";

    if (btnAddProduto) btnAddProduto.style.display = "inline-block";
    if (btnRemoverProduto) btnRemoverProduto.style.display = "inline-block";
    if (btnEditarProduto) btnEditarProduto.style.display = "inline-block";

  } else if (tipoUsuario === "Cliente") {
    if (clienteStatus) {
      clienteStatus.style.display = "flex";
      if (nomeCliente) nomeCliente.textContent = localStorage.getItem("nome");
      if (sobrenomeCliente) sobrenomeCliente.textContent = localStorage.getItem("sobrenome");

      const fotoBase64 = localStorage.getItem("foto");
      if (fotoBase64 && fotoCliente) {
        fotoCliente.src = "data:image/png;base64," + fotoBase64;
      } else if (fotoCliente) {
        fotoCliente.src = getDefaultAvatarDataUri();
      }
    }
    if (loginButtons) loginButtons.style.display = "none";

    if (btnAddProduto) btnAddProduto.style.display = "none";
    if (btnRemoverProduto) btnRemoverProduto.style.display = "none";
    if (btnEditarProduto) btnEditarProduto.style.display = "none";
  }

  /// Logout admin
if (logoutAdmin) {
  logoutAdmin.addEventListener("click", () => {
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    localStorage.removeItem("sobrenome");
    localStorage.removeItem("isAdmin"); // 🔹 limpa flag admin

    // 🔹 Atualiza comentários para esconder botão remover
    if (typeof atualizarComentarios === "function") {
      let comentarios = JSON.parse(localStorage.getItem("comentarios")) || [];
      atualizarComentarios(comentarios);
    }

    window.location.href = "index.html";
  });
}


  // Logout cliente
if (logoutCliente) {
  logoutCliente.addEventListener("click", () => {
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("nome");
    localStorage.removeItem("sobrenome");
    localStorage.removeItem("foto");
    localStorage.removeItem("isAdmin"); // 🔹 garante que não fique marcado como admin

    if (typeof atualizarComentarios === "function") {
      let comentarios = JSON.parse(localStorage.getItem("comentarios")) || [];
      atualizarComentarios(comentarios);
    }

    window.location.href = "index.html";
  });
}

});

