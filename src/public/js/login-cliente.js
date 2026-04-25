/**
 * Login do cliente.
 * Envia credenciais para o servidor, salva os dados da sessão no navegador
 * e redireciona o usuário após autenticação bem-sucedida.
 */
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("loginForm");
  const msgLogin = document.getElementById("mensagemErro");
  const usuarioInput = document.getElementById("usuario"); // campo de e-mail
  const senhaInput = document.getElementById("senha");
  const toggleSenha = document.getElementById("toggleSenha");
  const fotoEl = document.getElementById('fotoCliente');
  const nomeEl = document.getElementById('nomeCliente');
  const clienteStatusEl = document.getElementById('clienteStatus');

  function getDefaultAvatarDataUri(name) {
    const initials = (name || 'U').split(/\s+/).filter(Boolean).map(n=>n[0]).slice(0,2).join('').toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dy='0.35em' text-anchor='middle' fill='%234f46e5' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='56'>${initials}</text></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function showClienteStatus() {
    try { if (clienteStatusEl) clienteStatusEl.style.display = 'block'; } catch(e){}
  }

  function applyStoredProfileToUI() {
    try {
      const nome = localStorage.getItem('nome');
      const foto = localStorage.getItem('foto');
      if (nomeEl && nome) nomeEl.textContent = nome;
      if (fotoEl) {
        if (foto && foto.indexOf('data:image') === 0) fotoEl.src = foto;
        else if (foto) fotoEl.src = foto;
        else fotoEl.src = getDefaultAvatarDataUri(nome);
      }
      if (localStorage.getItem('tipoUsuario') === 'Cliente' && localStorage.getItem('clienteId')) {
        showClienteStatus();
      }
    } catch (e) { /* ignore */ }
  }

  // Mostrar/ocultar senha
  if (toggleSenha && senhaInput) {
    toggleSenha.addEventListener("click", () => {
      const icon = toggleSenha.querySelector('i');
      if (senhaInput.type === "password") {
        senhaInput.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        senhaInput.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  }

  // Envio do formulário de login
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dados = {
        email: usuarioInput.value.trim(),
        senha: senhaInput.value.trim()
      };

      try {
        // prefer backend from auth-config (set by auth-links.js).
        // Detect Live Server (porta 5500/5501) and forçar backend em http://localhost:3000
        const defaultBackend = `${window.location.protocol}//localhost:3000`;
        const isLiveServer = !!(window.location.port && (window.location.port === '5500' || window.location.port === '5501'));
        const apiBase = window.AUTH_SERVER || (isLiveServer ? defaultBackend : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : window.location.origin));

        let response = await fetch(`${apiBase.replace(/\/$/, '')}/login-cliente`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });

        // if the request hit the static Live Server (405), try default backend
        if (response.status === 405 && apiBase !== defaultBackend) {
          try {
            response = await fetch(`${defaultBackend}/login-cliente`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dados)
            });
          } catch (e) { /* ignore and fall through */ }
        }

        // handle non-JSON responses gracefully
        let data = {};
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.warn('login-cliente: resposta inválida (não JSON)');
          msgLogin.textContent = '❌ Erro de comunicação com o servidor (resposta inválida).';
          msgLogin.style.color = 'red';
          return;
        }

        if (response.ok && data.sucesso) {
          msgLogin.textContent = "✅ Login realizado com sucesso!";
          msgLogin.style.color = "green";

          // 🔹 Guarda dados no localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("clienteId", data.id);   // <-- ID do cliente salvo aqui
          localStorage.setItem("nome", data.nome);
          localStorage.setItem("sobrenome", data.sobrenome);
          localStorage.setItem("email", data.email);
          localStorage.setItem("dataNascimento", data.dataNascimento);
          localStorage.setItem("foto", data.foto);
          localStorage.setItem("tipoUsuario", "Cliente");

          // Atualiza pré-visualização do avatar imediatamente
          try {
            if (nomeEl && data.nome) nomeEl.textContent = data.nome;
            if (fotoEl) {
              if (data.foto && data.foto.indexOf && data.foto.indexOf('data:image') === 0) fotoEl.src = data.foto;
              else if (data.foto) fotoEl.src = data.foto;
              else fotoEl.src = getDefaultAvatarDataUri(data.nome);
            }
            showClienteStatus();
          } catch (e) { /* ignore */ }

          // 🔹 Redireciona para checkout.html se houver flag, senão para a página indicada em returnTo
          setTimeout(() => {
            if (localStorage.getItem('checkoutPendente') === '1') {
              localStorage.removeItem('checkoutPendente');
              window.location.href = "/html/checkout.html";
              return;
            }
            // verifica se a URL de login tinha parâmetro returnTo
            const params = new URLSearchParams(window.location.search);
            const returnTo = params.get('returnTo');
            if (returnTo) {
              try {
                const decoded = decodeURIComponent(returnTo);
                // segurança: permitir apenas caminhos internos
                if (decoded.startsWith('/') || decoded.startsWith(window.location.origin)) {
                  // se veio apenas o path (ex: /html/produto.html), redireciona diretamente
                  if (decoded.startsWith(window.location.origin)) {
                    window.location.href = decoded;
                  } else {
                    window.location.href = decoded;
                  }
                  return;
                }
              } catch (err) {
                // ignore e fallback
              }
            }
            // fallback padrão: em dev (npm run dev) redireciona para area-cliente
            const isDev = (window.AUTH_SERVER && window.AUTH_SERVER.includes('localhost:3000')) || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isDev) {
              window.location.href = "/html/meu-perfil.html";
            } else {
              window.location.href = "/html/index.html";
            }
          }, 800);
        } else {
          msgLogin.textContent = data.mensagem || "Erro ao fazer login!";
          msgLogin.style.color = "red";
        }
      } catch (error) {
        console.error("Erro no login cliente:", error);
        msgLogin.textContent = "❌ Erro no servidor!";
        msgLogin.style.color = "red";
      }
    });
  }
});

