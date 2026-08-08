/* ============================================================
   LOGIN SOCIAL — Google, Facebook e Instagram
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const msgSocial = document.getElementById("mensagemSocial");
  const btnGoogle = document.getElementById("btnGoogle");
  const btnFacebook = document.getElementById("btnFacebook");
  const btnInstagram = document.getElementById("btnInstagram");

  // ========== UTILIDADES ==========
  function mostrarMsg(texto, cor) {
    if (!msgSocial) return;
    msgSocial.textContent = texto;
    msgSocial.style.color = cor;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add("loading");
      btn.querySelector("i").className = "fa-solid fa-spinner";
    } else {
      btn.classList.remove("loading");
      // restaurar ícone original
      if (btn.classList.contains("google")) btn.querySelector("i").className = "fa-brands fa-google";
      if (btn.classList.contains("facebook")) btn.querySelector("i").className = "fa-brands fa-facebook-f";
      if (btn.classList.contains("instagram")) btn.querySelector("i").className = "fa-brands fa-instagram";
    }
  }

  // Envia dados sociais ao servidor
  async function loginSocial(provider, perfil, btn) {
    setLoading(btn, true);
    mostrarMsg("Conectando...", "#555");

    try {
      const response = await fetch("http://localhost:3000/login/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          nome: perfil.nome || "",
          sobrenome: perfil.sobrenome || "",
          email: perfil.email || "",
          foto: perfil.foto || null
        })
      });

      const data = await response.json();

      if (data.sucesso) {
        const emoji = data.novaConta ? "🎉" : "✅";
        const txt = data.novaConta
          ? "Conta criada e login feito com sucesso!"
          : "Login realizado com sucesso!";
        mostrarMsg(`${emoji} ${txt}`, "green");

        // Salvar dados no localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("clienteId", data.id);
        localStorage.setItem("nome", data.nome);
        localStorage.setItem("sobrenome", data.sobrenome);
        localStorage.setItem("email", data.email);
        localStorage.setItem("dataNascimento", data.dataNascimento || "");
        localStorage.setItem("foto", data.foto || "");
        localStorage.setItem("tipoUsuario", "Cliente");

        setTimeout(() => {
          if (localStorage.getItem("checkoutPendente") === "1") {
            localStorage.removeItem("checkoutPendente");
            window.location.href = "checkout.html";
          } else {
            window.location.href = "index.html";
          }
        }, 2000);
      } else {
        mostrarMsg(data.mensagem || "Erro ao conectar!", "red");
      }
    } catch (err) {
      console.error("Erro login social:", err);
      mostrarMsg("❌ Erro no servidor!", "red");
    } finally {
      setLoading(btn, false);
    }
  }

  // ========== GOOGLE ==========
  // Decodificar JWT do Google (payload base64)
  function decodeJwtPayload(token) {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch { return null; }
  }

  // Callback do Google Identity Services
  window.handleGoogleLogin = function(response) {
    const payload = decodeJwtPayload(response.credential);
    if (!payload || !payload.email) {
      mostrarMsg("❌ Não foi possível obter dados do Google.", "red");
      return;
    }
    loginSocial("google", {
      nome: payload.given_name || payload.name || "",
      sobrenome: payload.family_name || "",
      email: payload.email,
      foto: payload.picture || null
    }, btnGoogle);
  };

  if (btnGoogle) {
    btnGoogle.addEventListener("click", () => {
      // Verificar se o Google Identity Services carregou
      if (typeof google === "undefined" || !google.accounts) {
        mostrarMsg("⚠️ Google SDK não carregou. Configure o Client ID.", "#e67e22");
        return;
      }
      google.accounts.id.initialize({
        client_id: "SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // 🔹 TROCAR PELO SEU CLIENT ID
        callback: handleGoogleLogin
      });
      google.accounts.id.prompt(); // Exibe o popup do Google
    });
  }

  // ========== FACEBOOK ==========
  function initFacebookSDK() {
    if (typeof FB !== "undefined") {
      FB.init({
        appId: "SEU_FACEBOOK_APP_ID", // 🔹 TROCAR PELO SEU APP ID
        cookie: true,
        xfbml: true,
        version: "v19.0"
      });
    }
  }

  // Inicializar Facebook SDK quando disponível
  window.fbAsyncInit = function() {
    initFacebookSDK();
  };

  if (btnFacebook) {
    btnFacebook.addEventListener("click", () => {
      if (typeof FB === "undefined") {
        mostrarMsg("⚠️ Facebook SDK não carregou. Configure o App ID.", "#e67e22");
        return;
      }
      initFacebookSDK();

      FB.login(function(response) {
        if (response.authResponse) {
          FB.api("/me", { fields: "first_name,last_name,email,picture.width(200)" }, function(user) {
            if (!user || !user.email) {
              mostrarMsg("⚠️ Permita acesso ao email no Facebook.", "#e67e22");
              return;
            }
            loginSocial("facebook", {
              nome: user.first_name || "",
              sobrenome: user.last_name || "",
              email: user.email,
              foto: user.picture && user.picture.data ? user.picture.data.url : null
            }, btnFacebook);
          });
        } else {
          mostrarMsg("Login com Facebook cancelado.", "#888");
        }
      }, { scope: "public_profile,email" });
    });
  }

  // ========== INSTAGRAM (via Facebook/Meta) ==========
  if (btnInstagram) {
    btnInstagram.addEventListener("click", () => {
      if (typeof FB === "undefined") {
        mostrarMsg("⚠️ Facebook SDK não carregou. Configure o App ID.", "#e67e22");
        return;
      }
      initFacebookSDK();

      // Instagram usa o mesmo fluxo do Facebook (Meta)
      FB.login(function(response) {
        if (response.authResponse) {
          FB.api("/me", { fields: "first_name,last_name,email,picture.width(200)" }, function(user) {
            if (!user || !user.email) {
              mostrarMsg("⚠️ Permita acesso ao email.", "#e67e22");
              return;
            }
            loginSocial("instagram", {
              nome: user.first_name || "",
              sobrenome: user.last_name || "",
              email: user.email,
              foto: user.picture && user.picture.data ? user.picture.data.url : null
            }, btnInstagram);
          });
        } else {
          mostrarMsg("Login com Instagram cancelado.", "#888");
        }
      }, { scope: "public_profile,email" });
    });
  }
});
