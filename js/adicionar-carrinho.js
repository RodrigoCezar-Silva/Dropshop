/**
 * Adição de itens ao carrinho.
 * Lê o produto atual pela URL, monta o objeto do carrinho
 * e salva no localStorage antes de redirecionar.
 */
document.addEventListener("DOMContentLoaded", () => {
  const btnAdicionar = document.getElementById("btnAdicionarCarrinho");
  const mensagemFrete = document.getElementById("mensagemFrete");
  const btnIrFrete = document.getElementById("btnIrFrete");
  const mensagemTexto = document.getElementById("mensagemTexto");

  if (!btnAdicionar) return;

  if (btnIrFrete) {
    btnIrFrete.addEventListener("click", () => {
      mensagemFrete.style.display = "none";
      document.getElementById("cep").scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("cep").focus();
    });
  }

  // 🔹 Função genérica para adicionar ao carrinho e redirecionar
  // Função central de persistência do carrinho.
  // Adiciona o item na lista salva e envia o usuário para a página do carrinho.
  function adicionarAoCarrinho(produto) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    carrinho.push(produto);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    // Redireciona para a página do carrinho
    window.location.href = "carrinho.html";
  }

  // Ao clicar no botão, localiza o produto atual e adiciona no carrinho.
  btnAdicionar.onclick = (event) => {
    event.preventDefault();

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    const produtos = JSON.parse(localStorage.getItem("loja")) || [];
    const produto = produtos.find(p => p.id === id);

    if (!produto) {
      mensagemTexto.textContent = "❌ Produto não encontrado.";
      mensagemFrete.style.display = "block";
      return;
    }

    // Verifica se produto de moda precisa de tamanho selecionado
    if (produto.categoria === "moda" && !window.tamanhoSelecionado) {
      mensagemTexto.textContent = "⚠️ Selecione um tamanho antes de adicionar ao carrinho.";
      mensagemFrete.style.display = "block";
      const secaoTamanho = document.getElementById("selecaoTamanho");
      if (secaoTamanho) secaoTamanho.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const precoProduto = parseFloat(
      produto.precoAtual.replace(/[^\d,]/g, "").replace(",", ".")
    );

    let imagemCarrinho = (produto.imagensExtras && produto.imagensExtras.length > 0)
      ? produto.imagensExtras[0]
      : produto.imagem || "";

    const itemCarrinho = {
      id: produto.id,
      nome: produto.nome,
      preco: precoProduto,
      imagem: imagemCarrinho,
      qtd: 1,
      tamanho: window.tamanhoSelecionado || null
    };

    // 🔹 Limpa seleção de frete ao adicionar produto (abaixo de 100 reais)
    let subtotalTemp = (carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0) + itemCarrinho.preco);
    if (subtotalTemp < 100) {
      localStorage.removeItem('tipoFreteSelecionado');
      localStorage.removeItem('calculouFrete');
    }
    adicionarAoCarrinho(itemCarrinho);
  };
});
