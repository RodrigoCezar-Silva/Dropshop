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
        // prefer backend from auth-config (set by auth-links.js). Fallback to localhost or origin.
        const apiBase = window.AUTH_SERVER || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : window.location.origin);

        const response = await fetch(`${apiBase.replace(/\/$/, '')}/login-cliente`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });

        // handle non-JSON responses gracefully
        let data;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          // if server returned HTML (error page), surface clearer message
          console.warn('login-cliente: expected JSON but received:', text.slice(0,200));
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
            // fallback padrão
            window.location.href = "/html/index.html";
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

