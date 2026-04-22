document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formProduto");

  if (!form) return;

  // 🔹 Cadastro de novo produto
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura os valores do formulário
    const produto = {
      id: Date.now(), // gera ID único
      nome: document.getElementById("nomeProduto").value,
      nomeDetalhes: document.getElementById("nomeDetalhes").value,
      precoAntigo: document.getElementById("precoAntigo").value,
      precoAtual: document.getElementById("precoAtual").value,
      desconto: document.getElementById("desconto").value,
      imagem: document.getElementById("imagemPrincipal").value,
      marcaDagua: document.getElementById("marcaDagua").value,
      video: document.getElementById("videoProduto").value,
      descricao: document.getElementById("descricaoProduto").value,
      imagensExtras: [
        document.getElementById("imagemExtra1").value,
        document.getElementById("imagemExtra2").value,
        document.getElementById("imagemExtra3").value,
        document.getElementById("imagemExtra4").value,
        document.getElementById("imagemExtra5").value
      ].filter(url => url && url.trim() !== "")
    };

    // 🔹 Atualiza lista de produtos no localStorage
    let produtos = JSON.parse(localStorage.getItem("loja")) || [];
    produtos.push(produto);
    localStorage.setItem("loja", JSON.stringify(produtos));

    montarVitrine(paginaAtual); // recarrega vitrine

    try {
      // Faz a requisição para o servidor
      const response = await fetch("http://localhost:3000/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token") // se estiver logado como admin
        },
        body: JSON.stringify(produto)
      });

      const data = await response.json();

      if (data.sucesso) {
        alert("✅ Produto cadastrado com sucesso! ID: " + data.id);
        console.log("Produto salvo:", data);
      } else {
        alert("❌ Erro ao salvar produto: " + data.mensagem);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("❌ Erro no servidor. Verifique a conexão.");
    }
  });

  // 🔹 Função para montar vitrine com imagem principal
  window.montarVitrine = function(pagina) {
    const container = document.getElementById("vitrine");
    container.innerHTML = "";

    let produtos = JSON.parse(localStorage.getItem("loja")) || [];

    produtos.forEach(produto => {
      const card = document.createElement("div");
      card.classList.add("produto-card");

      card.innerHTML = `
        <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-principal">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao}</p>
        <p><s>R$ ${produto.precoAntigo}</s> <strong>R$ ${produto.precoAtual}</strong></p>
        <button onclick="abrirDetalhes(${produto.id})">Ver detalhes</button>
      `;

      container.appendChild(card);
    });
  };

  // 🔹 Página de detalhes com imagens extras e vídeo
  window.abrirDetalhes = function(id) {
    let produtos = JSON.parse(localStorage.getItem("loja")) || [];
    const produto = produtos.find(p => p.id === id);

    if (!produto) return;

    const detalhes = document.getElementById("paginaDetalhes");
    detalhes.innerHTML = `
      <h2>${produto.nomeDetalhes}</h2>
      <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-principal">
      <p>${produto.descricao}</p>
      <p><s>R$ ${produto.precoAntigo}</s> <strong>R$ ${produto.precoAtual}</strong> (${produto.desconto}% OFF)</p>
      <div class="galeria-extras">
        ${produto.imagensExtras.map(img => `<img src="${img}" alt="Imagem extra">`).join("")}
      </div>
      ${produto.video ? `<video src="${produto.video}" controls></video>` : ""}
    `;

    detalhes.style.display = "block";
  };

  // 🔹 Função para abrir popup e editar produto
  window.abrirPopupEditar = function(produto) {
    const popup = document.getElementById("popupEditar");
    const formEditar = document.getElementById("formEditar");

    if (!popup || !formEditar) return;

    // Preenche os campos
    document.getElementById("editNome").value = produto.nome;
    document.getElementById("editPrecoAntigo").value = produto.precoAntigo;
    document.getElementById("editPrecoAtual").value = produto.precoAtual;
    document.getElementById("editDesconto").value = produto.desconto;
    document.getElementById("editImagem").value = produto.imagem;
    document.getElementById("editNomeDetalhes").value = produto.nomeDetalhes;
    document.getElementById("editDescricao").value = produto.descricao;

    popup.style.display = "block";

    // Salvar edição
    formEditar.onsubmit = (e) => {
      e.preventDefault();

      // Atualiza objeto
      produto.nome = document.getElementById("editNome").value;
      produto.precoAntigo = document.getElementById("editPrecoAntigo").value;
      produto.precoAtual = document.getElementById("editPrecoAtual").value;
      produto.desconto = document.getElementById("editDesconto").value;
      produto.imagem = document.getElementById("editImagem").value;
      produto.nomeDetalhes = document.getElementById("editNomeDetalhes").value;
      produto.descricao = document.getElementById("editDescricao").value;

      // Atualiza lista no localStorage
      let produtos = JSON.parse(localStorage.getItem("loja")) || [];
      const index = produtos.findIndex(p => p.id === produto.id);
      if (index !== -1) {
        produtos[index] = produto;
      } else {
        produtos.push(produto);
      }
      localStorage.setItem("loja", JSON.stringify(produtos));

      montarVitrine(paginaAtual); // recarrega vitrine
      popup.style.display = "none";
      alert("Produto salvo com sucesso!");
    };
  };
});

