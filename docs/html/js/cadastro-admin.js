document.removeEventListener && document.removeEventListener('DOMContentLoaded', ()=>{});
// Restaurando versão anterior a partir de docs/cadastro-admin.js
document.addEventListener("DOMContentLoaded", () => {
  const formCadastro = document.getElementById("cadastroForm");
  const senhaInput = document.getElementById("senha");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const toggleSenha = document.getElementById("toggleSenha");
  const toggleConfirmarSenha = document.getElementById("toggleConfirm");
  const msgSenha = document.getElementById("senhaMsg");
  const strengthDiv = document.getElementById("passwordStrength");
  const popupSuccess = document.getElementById("popupSuccess");
  const popupClose = document.getElementById("popupClose");

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

      function showPopup() {
        if (!popupSuccess) return;
        popupSuccess.classList.remove("hidden");
        popupSuccess.setAttribute("aria-hidden", "false");
      }

      function hidePopup() {
        if (!popupSuccess) return;
        popupSuccess.classList.add("hidden");
        popupSuccess.setAttribute("aria-hidden", "true");
      }

      if (popupClose) {
        popupClose.addEventListener("click", () => {
          hidePopup();
        });
      }

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

      const role = document.getElementById('role')?.value || 'admin';
      const avatarInput = document.getElementById('inputAvatar');
      const apiUrl = 'http://localhost:3000/admins';
      const formData = new FormData();
      formData.append('usuario', usuario);
      formData.append('senha', senha);
      formData.append('nome', nome);
      formData.append('sobrenome', sobrenome);
      formData.append('role', role);
      if (avatarInput?.files?.length) {
        formData.append('foto', avatarInput.files[0]);
      }

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          mode: "cors",
          body: formData
        });

        let data = null;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn('Resposta não é JSON válido:', jsonError);
        }

        if (response.ok && data?.sucesso) {
          msgCadastro.textContent = "Cadastro realizado com sucesso!";
          msgCadastro.style.color = "#0f5132";
          msgCadastro.style.background = "#d1e7dd";
          msgCadastro.style.border = "1px solid #badbcc";
          msgCadastro.style.padding = "12px 14px";
          msgCadastro.style.borderRadius = "12px";
          formCadastro.reset();
          if (strengthDiv) strengthDiv.textContent = "";
          if (msgSenha) msgSenha.textContent = "";
          showPopup();
          setTimeout(() => {
            hidePopup();
            window.location.href = "./admin-login.html";
          }, 2200);
        } else {
          const errorMessage = data?.mensagem || `Erro ao cadastrar! Status ${response.status}`;
          msgCadastro.textContent = errorMessage;
          msgCadastro.style.color = "#842029";
          msgCadastro.style.background = "#f8d7da";
          msgCadastro.style.border = "1px solid #f5c2c7";
          msgCadastro.style.padding = "12px 14px";
          msgCadastro.style.borderRadius = "12px";
        }
      } catch (error) {
        console.error("Erro no cadastro admin:", error);
        msgCadastro.textContent = "❌ Erro no servidor!";
        msgCadastro.style.color = "red";
      }
    });
  }
});
