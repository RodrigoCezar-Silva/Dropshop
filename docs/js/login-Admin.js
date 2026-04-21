document.addEventListener("DOMContentLoaded", () => {
  function getDefaultAvatarDataUri() {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3' fill='%23e6eef8'/><path d='M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6' fill='%23e6eef8'/></svg>";
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const formLogin = document.getElementById("formLogin");
  const mensagemErro = document.getElementById("mensagemErro");

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
        const base = window.AUTH_SERVER || window.location.origin;
        const response = await fetch(`${base.replace(/\/$/, '')}/login-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, senha })
        });

        const result = await response.json();

        if (response.ok && result.sucesso) {
          // guarda dados no navegador
          localStorage.setItem("token", result.token);
          localStorage.setItem("nome", result.nome);
          localStorage.setItem("sobrenome", result.sobrenome);
          localStorage.setItem("tipoUsuario", "Administrador");
          localStorage.setItem("isAdmin", "true"); // 🔹 garante compatibilidade com comentarios.js

          // redirect to admin area after successful admin login
          window.location.href = "admin-area.html";
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

