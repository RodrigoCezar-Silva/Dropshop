/**
 * Envio de foto no cadastro do cliente.
 * Captura os dados do formulário e envia para o backend com suporte à imagem.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastroForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const cliente = {
        nome: document.getElementById("nome").value.trim(),
        
        email: document.getElementById("email").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        senha: document.getElementById("senha").value.trim(),
        rua: document.getElementById("rua").value.trim(),
        bairro: document.getElementById("bairro").value.trim(),
        numero: document.getElementById("numero").value.trim(),
        complemento: document.getElementById("complemento").value.trim(),
        estado: document.getElementById("estado").value.trim()
      };

      try {
        const response = await fetch("http://localhost:3000/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cliente)
        });

        const data = await response.json();
        const msgCadastro = document.getElementById("mensagemCadastro");

        if (data.sucesso) {
          msgCadastro.textContent = "✅ Cadastro realizado com sucesso! Agora faça login para acessar sua conta.";
          msgCadastro.style.color = "green";
          form.reset();
        } else {
          msgCadastro.textContent = data.mensagem || "Erro ao cadastrar!";
          msgCadastro.style.color = "red";
        }
      } catch (error) {
        console.error("Erro no cadastro cliente:", error);
        const msgCadastro = document.getElementById("mensagemCadastro");
        msgCadastro.textContent = "❌ Erro no servidor!";
        msgCadastro.style.color = "red";
      }
    });
  }
});
