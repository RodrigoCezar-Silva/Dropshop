document.addEventListener("DOMContentLoaded", () => {
  const formCadastro = document.getElementById("cadastroForm");
  const senhaInput = document.getElementById("senha");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const toggleSenha = document.getElementById("toggleSenha");
  const toggleConfirmarSenha = document.getElementById("toggleConfirmarSenha");
  const msgSenha = document.getElementById("mensagemSenha");
  const strengthDiv = document.getElementById("password-strength");

  // Mostrar/ocultar senha principal
  if (toggleSenha && senhaInput) {
    toggleSenha.addEventListener("click", () => {
      const isPassword = senhaInput.type === "password";
      senhaInput.type = isPassword ? "text" : "password";
      toggleSenha.innerText = isPassword ? "🙈" : "👁️";
    });
  }

  // Mostrar/ocultar confirmar senha
  if (toggleConfirmarSenha && confirmarSenhaInput) {
    toggleConfirmarSenha.addEventListener("click", () => {
      const isPassword = confirmarSenhaInput.type === "password";
      confirmarSenhaInput.type = isPassword ? "text" : "password";
      toggleConfirmarSenha.innerText = isPassword ? "🙈" : "👁️";
    });
  }

  // Validação e força da senha
  function validarSenha() {
    const senha = senhaInput?.value || "";
    const confirmar = confirmarSenhaInput?.value || "";

    if (!strengthDiv || !msgSenha) return;

    if (senha.length < 6) {
      strengthDiv.textContent = "Senha fraca";
      strengthDiv.className = "fraca";
    } else if (/[A-Z]/.test(senha) && /[0-9]/.test(senha) && /[^A-Za-z0-9]/.test(senha)) {
      strengthDiv.textContent = "Senha forte";
      strengthDiv.className = "forte";
    } else {
      strengthDiv.textContent = "Senha média";
      strengthDiv.className = "media";
    }

    if (confirmar && confirmar !== senha) {
      msgSenha.textContent = "As senhas não coincidem!";
      msgSenha.className = "erro";
    } else if (confirmar && confirmar === senha) {
      msgSenha.textContent = "As senhas coincidem!";
      msgSenha.className = "sucesso";
    } else {
      msgSenha.textContent = "";
    }
  }

  if (senhaInput) senhaInput.addEventListener("input", validarSenha);
  if (confirmarSenhaInput) confirmarSenhaInput.addEventListener("input", validarSenha);

  // Envio do formulário de cadastro
  if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = document.getElementById("usuario")?.value.trim();
      const senha = senhaInput?.value.trim();
      const confirmar = confirmarSenhaInput?.value.trim();
      const nome = document.getElementById("nome")?.value.trim();
      const sobrenome = document.getElementById("sobrenome")?.value.trim();

      const msgCadastro = document.getElementById("mensagemCadastro");
      if (!msgCadastro) return;

      if (!usuario || !senha || !nome || !sobrenome) {
        msgCadastro.textContent = "❌ Preencha todos os campos!";
        msgCadastro.style.color = "red";
        return;
      }

      if (senha !== confirmar) {
        msgCadastro.textContent = "❌ As senhas não coincidem!";
        msgCadastro.style.color = "red";
        return;
      }

      const dados = { usuario, senha, nome, sobrenome };

      try {
        const response = await fetch("http://localhost:3000/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });

        const data = await response.json();

        if (response.ok && data.sucesso) {
          msgCadastro.textContent = "✅ Cadastro realizado com sucesso!";
          msgCadastro.style.color = "green";
          formCadastro.reset();
          if (strengthDiv) strengthDiv.textContent = "";
          if (msgSenha) msgSenha.textContent = "";
          setTimeout(() => {
            window.location.href = "./html/admin-login.html";
          }, 1200);
        } else {
          msgCadastro.textContent = data.mensagem || "Erro ao cadastrar!";
          msgCadastro.style.color = "red";
        }
      } catch (error) {
        console.error("Erro no cadastro admin:", error);
        msgCadastro.textContent = "❌ Erro no servidor!";
        msgCadastro.style.color = "red";
      }
    });
  }
});
