function abrirPopupEditar(produto) {
    // Subcategorias por categoria
    const subcategoriasPorCategoria = {
      eletronicos: ["Celulares", "Notebooks", "Acessórios", "TVs", "Áudio"],
      informatica: ["Computadores", "Periféricos", "Redes", "Armazenamento"],
      eletrica: ["Fios", "Tomadas", "Lâmpadas", "Ferramentas"],
      moda: ["Masculina", "Feminina", "Calçados", "Acessórios"],
      'moda-infantil': ["Roupas Infantis", "Calçados Infantis", "Acessórios Infantis"],
      casa: ["Cozinha", "Quarto", "Sala", "Banheiro", "Decoração"],
      esportes: ["Academia", "Ciclismo", "Futebol", "Natação"],
      beleza: ["Maquiagem", "Cabelos", "Corpo", "Perfumes"],
      brinquedos: ["Educativos", "Bonecos", "Jogos", "Ao ar livre"],
      outros: ["Diversos"]
    };

    // Função para atualizar subcategorias
    function atualizarSubcategorias() {
      const categoria = document.getElementById("editCategoria").value;
      const grupoSubcat = document.getElementById("grupoSubcategoria");
      const selectSubcat = document.getElementById("editSubcategoria");
      const grupoQuantidade = document.getElementById("grupoQuantidade");
      if (subcategoriasPorCategoria[categoria]) {
        grupoSubcat.style.display = "block";
        selectSubcat.innerHTML = subcategoriasPorCategoria[categoria].map(sub => `<option value=\"${sub}\">${sub}</option>`).join("");
        // Seleciona a subcategoria do produto, se existir
        if (produto.subcategoria && subcategoriasPorCategoria[categoria].includes(produto.subcategoria)) {
          selectSubcat.value = produto.subcategoria;
        }
        grupoQuantidade.style.display = "block";
      } else {
        grupoSubcat.style.display = "none";
        selectSubcat.innerHTML = "";
        grupoQuantidade.style.display = "none";
      }
    }

    // Atualiza subcategorias ao abrir popup
    atualizarSubcategorias();
    // Atualiza subcategorias ao trocar categoria
    document.getElementById("editCategoria").onchange = atualizarSubcategorias;
  console.log("Abrindo popup para produto:", produto); // Debug
  const popup = document.getElementById("popupEditar");
  const areaRolavelPopup = popup.querySelector(".categoria-content");
  bloquearScrollPagina();
  popup.style.display = "flex"; // 🔹 abre o popup
  configurarBotaoTopoPopup(areaRolavelPopup);
  areaRolavelPopup.scrollTo({ top: 0, behavior: "auto" });

  // 🔹 Ativar primeira categoria por padrão
  mostrarCategoria('vitrine');

  // 🔹 Preenche os campos da vitrine
  document.getElementById("editNome").value = produto.nome || "";
  document.getElementById("editPrecoAntigo").value = produto.precoAntigo || "";
  document.getElementById("editPrecoAtual").value = produto.precoAtual || "";
  document.getElementById("editDesconto").value = produto.desconto || "";

  // 🔹 Preenche categoria
  const selectCategoria = document.getElementById("editCategoria");
  if (selectCategoria) selectCategoria.value = produto.categoria || "outros";

  // 🔹 Preenche os campos de detalhes
  document.getElementById("editImagem").value = produto.imagem || "";
  document.getElementById("editNomeDetalhes").value = produto.nomeDetalhes || "";
  document.getElementById("editVideo").value = produto.video || "";
  document.getElementById("editDescricao").value = produto.descricao || "";
  document.getElementById("editPagamento").value = (produto.pagamento || []).join("\n");

  // 🔹 Preenche imagens extras (até 5)
  for (let i = 1; i <= 5; i++) {
    const campo = document.getElementById("editImagemExtra" + i);
    if (campo) campo.value = produto.imagensExtras?.[i - 1] || "";
  }

  // 🔹 Calcula desconto automaticamente quando preço muda
  function calcularDesconto() {
    const precoAntigo = parseFloat(
      document.getElementById("editPrecoAntigo").value.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const precoAtual = parseFloat(
      document.getElementById("editPrecoAtual").value.replace(/[^\d,]/g, "").replace(",", ".")
    );

    if (!isNaN(precoAntigo) && !isNaN(precoAtual) && precoAntigo > precoAtual) {
      const desconto = ((precoAntigo - precoAtual) / precoAntigo) * 100;
      document.getElementById("editDesconto").value = `-${desconto.toFixed(0)}% Desconto`;
    } else {
      document.getElementById("editDesconto").value = "";
    }
  }

  // 🔹 Garante que não acumula listeners duplicados
  document.getElementById("editPrecoAntigo").oninput = calcularDesconto;
  document.getElementById("editPrecoAtual").oninput = calcularDesconto;

  // 🔹 Configurar seleção de categorias
  configurarSelecaoCategorias();

  // 🔹 Botão salvar principal
  const btnSalvar = document.getElementById("btnSalvar");
  btnSalvar.onclick = () => {
    salvarProduto(produto);
  };

  // 🔹 Botão fechar
  document.getElementById("fecharEditar").onclick = () => {
    fecharPopupEditar();
  };
}

function bloquearScrollPagina() {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  document.documentElement.classList.add("popup-editar-aberto");
  document.body.classList.add("popup-editar-aberto");
  document.body.dataset.popupScrollY = String(scrollY);
  document.body.style.top = `-${scrollY}px`;
}

function liberarScrollPagina() {
  const scrollY = parseInt(document.body.dataset.popupScrollY || "0", 10);
  document.documentElement.classList.remove("popup-editar-aberto");
  document.body.classList.remove("popup-editar-aberto");
  document.body.style.top = "";
  delete document.body.dataset.popupScrollY;
  window.scrollTo({ top: scrollY, behavior: "auto" });
}

function configurarBotaoTopoPopup(areaRolavelPopup) {
  const btnTopoPopup = document.getElementById("btnTopoPopupEditar");
  if (!areaRolavelPopup || !btnTopoPopup) return;

  const atualizarVisibilidade = () => {
    btnTopoPopup.classList.toggle("show", areaRolavelPopup.scrollTop > 220);
  };

  areaRolavelPopup.onscroll = atualizarVisibilidade;
  btnTopoPopup.onclick = () => {
    areaRolavelPopup.scrollTo({ top: 0, behavior: "smooth" });
  };

  atualizarVisibilidade();
}

// 🔹 Função para fechar o popup
function fecharPopupEditar() {
  const popup = document.getElementById("popupEditar");
  popup.style.display = "none";
  liberarScrollPagina();
}

// 🔹 Função para configurar seleção de categorias
function configurarSelecaoCategorias() {
  const categoriaCards = document.querySelectorAll(".categoria-card");

  categoriaCards.forEach(card => {
    card.addEventListener("click", () => {
      // Remove active de todas as categorias
      categoriaCards.forEach(c => c.classList.remove("active"));
      document.querySelectorAll(".categoria-section").forEach(s => s.classList.remove("active"));

      // Adiciona active na categoria clicada
      card.classList.add("active");
      const categoriaId = card.getAttribute("data-categoria");
      document.getElementById("categoria-" + categoriaId).classList.add("active");
    });
  });
}

/**
 * Alterna visualmente entre as áreas do formulário do popup,
 * como dados da vitrine e detalhes do produto.
 */
// 🔹 Função para mostrar uma categoria específica
function mostrarCategoria(categoria) {
  // Remove active de todas as categorias
  document.querySelectorAll(".categoria-card").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".categoria-section").forEach(s => s.classList.remove("active"));

  // Adiciona active na categoria especificada
  document.querySelector(`[data-categoria="${categoria}"]`).classList.add("active");
  document.getElementById("categoria-" + categoria).classList.add("active");
}

/**
 * Salva o produto com todos os campos do popup,
 * atualiza o localStorage e sincroniza a vitrine com a página de detalhes.
 */
// 🔹 Função para salvar o produto completo
function salvarProduto(produto) {
  // Atualiza todos os dados do produto
  produto.nome = document.getElementById("editNome").value;
  produto.nomeDetalhes = document.getElementById("editNomeDetalhes").value;
  produto.precoAntigo = document.getElementById("editPrecoAntigo").value;
  produto.precoAtual = document.getElementById("editPrecoAtual").value;
  produto.desconto = document.getElementById("editDesconto").value;
  produto.categoria = document.getElementById("editCategoria") ? document.getElementById("editCategoria").value : (produto.categoria || "outros");
  // Salva subcategoria escolhida
  const subcatEl = document.getElementById("editSubcategoria");
  produto.subcategoria = subcatEl && subcatEl.value ? subcatEl.value : "";
  produto.imagem = document.getElementById("editImagem").value || "https://via.placeholder.com/300x200?text=Novo+Produto";
  // Salva data/hora de postagem se for novo
  if (!produto.dataCadastro) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    produto.dataCadastro = `${dataFormatada} ${horaFormatada}`;
  }
  produto.video = document.getElementById("editVideo").value;
  produto.descricao = document.getElementById("editDescricao").value;
  produto.pagamento = document.getElementById("editPagamento").value.split("\n").filter(p => p.trim());

  // Atualiza imagens extras
  produto.imagensExtras = [];
  for (let i = 1; i <= 5; i++) {
    const campo = document.getElementById("editImagemExtra" + i);
    if (campo && campo.value.trim()) {
      produto.imagensExtras.push(campo.value.trim());
    }
  }

  // 🔹 Atualiza no localStorage
  let produtos = JSON.parse(localStorage.getItem("loja")) || [];
  const index = produtos.findIndex(p => p.id === produto.id);
  if (index !== -1) {
    produtos[index] = produto; // substitui produto existente
  } else {
    produto.id = Math.max(0, ...produtos.map(p => p.id)) + 1; // gera novo ID seguro
    produtos.unshift(produto); // adiciona no início
  }

  localStorage.setItem("loja", JSON.stringify(produtos));

  // Para forçar atualizações em outras abas/páginas (produto.html)
  localStorage.setItem("produtoAtualizado", JSON.stringify({ id: produto.id, timestamp: Date.now() }));

  montarVitrine(paginaAtual); // recarrega vitrine

  // Sincroniza também com produtosLoja para o controle de estoque (garantindo nome e imagem corretos)
  let estoque = JSON.parse(localStorage.getItem('produtosLoja') || '[]');
  const idxEstoque = estoque.findIndex(p => p.id === produto.id);
  // Sempre pega nome e imagem atualizados da loja
  const produtoEstoque = {
    id: produto.id,
    nome: produto.nome,
    imagem: produto.imagem,
    precoAtual: produto.precoAtual,
    quantidade: produto.quantidade,
    dataCadastro: produto.dataCadastro,
    preco: produto.precoAtual ? Number(produto.precoAtual.toString().replace(/[^\d,\.]/g, '').replace(',', '.')) : (produto.preco ? Number(produto.preco) : 0)
  };
  if (idxEstoque !== -1) {
    estoque[idxEstoque] = { ...estoque[idxEstoque], ...produtoEstoque };
  } else {
    estoque.push({ ...produtoEstoque });
  }
  localStorage.setItem('produtosLoja', JSON.stringify(estoque));

  fecharPopupEditar();

  alert("✅ Produto salvo com sucesso!");

  // Redireciona para a página de detalhes do produto recém-atualizado
  if (produto.id) {
    window.location.href = `produto.html?id=${produto.id}`;
  }

  // Redireciona para a página de detalhes do produto recém-atualizado
  if (produto.id) {
    window.location.href = `produto.html?id=${produto.id}`;
  }
}

async function salvarProduto(produto) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Faça login como administrador para salvar produtos.");
    return;
  }

  produto.nome = document.getElementById("editNome").value.trim();
  produto.nomeDetalhes = document.getElementById("editNomeDetalhes").value.trim();
  produto.precoAntigo = document.getElementById("editPrecoAntigo").value.trim();
  produto.precoAtual = document.getElementById("editPrecoAtual").value.trim();
  produto.desconto = document.getElementById("editDesconto").value.trim();
  produto.categoria = document.getElementById("editCategoria") ? document.getElementById("editCategoria").value : (produto.categoria || "outros");
  produto.subcategoria = document.getElementById("editSubcategoria")?.value || "";
  produto.imagem = document.getElementById("editImagem").value.trim() || "https://via.placeholder.com/300x200?text=Novo+Produto";
  produto.video = document.getElementById("editVideo").value.trim();
  produto.descricao = document.getElementById("editDescricao").value.trim();
  produto.pagamento = document.getElementById("editPagamento").value.split("\n").filter(item => item.trim());
  produto.quantidade = Number(document.getElementById("editQuantidade")?.value) || produto.quantidade || 1;

  if (!produto.dataCadastro) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR");
    const horaFormatada = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    produto.dataCadastro = `${dataFormatada} ${horaFormatada}`;
  }

  produto.imagensExtras = [];
  for (let i = 1; i <= 5; i++) {
    const campo = document.getElementById("editImagemExtra" + i);
    if (campo && campo.value.trim()) {
      produto.imagensExtras.push(campo.value.trim());
    }
  }

  try {
    const produtoJaExiste = !!produto.id && !produto.isNovo;
    const url = produtoJaExiste
      ? `http://localhost:3000/api/produtos/${produto.id}`
      : "http://localhost:3000/api/produtos";

    const response = await fetch(url, {
      method: produtoJaExiste ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(produto)
    });

    const data = await response.json();
    if (!response.ok || !data.sucesso || !data.produto) {
      throw new Error(data.mensagem || "Nao foi possivel salvar o produto.");
    }

    const produtoSalvo = data.produto;
    delete produto.isNovo;
    const listaProdutos = JSON.parse(localStorage.getItem("loja")) || [];
    const index = listaProdutos.findIndex(item => String(item.id) === String(produtoSalvo.id));
    if (index !== -1) {
      listaProdutos[index] = produtoSalvo;
    } else {
      listaProdutos.unshift(produtoSalvo);
    }
    localStorage.setItem("loja", JSON.stringify(listaProdutos));
    localStorage.setItem("produtoAtualizado", JSON.stringify({ id: produtoSalvo.id, timestamp: Date.now() }));

    const estoque = JSON.parse(localStorage.getItem("produtosLoja") || "[]");
    const idxEstoque = estoque.findIndex(item => String(item.id) === String(produtoSalvo.id));
    const produtoEstoque = {
      id: produtoSalvo.id,
      nome: produtoSalvo.nome,
      imagem: produtoSalvo.imagem,
      precoAtual: produtoSalvo.precoAtual,
      quantidade: produtoSalvo.quantidade,
      dataCadastro: produtoSalvo.dataCadastro,
      preco: produtoSalvo.precoAtual ? Number(produtoSalvo.precoAtual.toString().replace(/[^\d,\.]/g, "").replace(",", ".")) : 0
    };
    if (idxEstoque !== -1) {
      estoque[idxEstoque] = { ...estoque[idxEstoque], ...produtoEstoque };
    } else {
      estoque.push(produtoEstoque);
    }
    localStorage.setItem("produtosLoja", JSON.stringify(estoque));

    if (typeof produtos !== "undefined") {
      const idxGlobal = produtos.findIndex(item => String(item.id) === String(produtoSalvo.id));
      if (idxGlobal !== -1) {
        produtos[idxGlobal] = produtoSalvo;
      } else {
        produtos.unshift(produtoSalvo);
      }
    }

    if (typeof paginaAtual !== "undefined") {
      paginaAtual = 1;
    }
    montarVitrine(typeof paginaAtual !== "undefined" ? paginaAtual : 1);
    fecharPopupEditar();
    alert("Produto salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    alert(error.message || "Erro ao salvar produto.");
  }
}
