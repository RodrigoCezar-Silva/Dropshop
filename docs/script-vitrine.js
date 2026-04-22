/**
 * Vitrine principal da loja.
 * Lê os produtos salvos, cria os cards na tela,
 * controla paginação, detalhes, edição, remoção,
 * busca, categorias e ordenação.
 */
// Carrega produtos do localStorage se existirem, senão cria lista padrão
let produtos = [];
try {
  const produtosStorage = localStorage.getItem("loja");
  if (produtosStorage) {
    produtos = JSON.parse(produtosStorage);
  }
} catch (e) {
  produtos = [];
}

// Garante que todos os produtos tenham o campo categoria
produtos.forEach(p => { if (!p.categoria) p.categoria = "outros"; });
localStorage.setItem("loja", JSON.stringify(produtos));

let paginaAtual = 1;
const itensPorPagina = 20;
let categoriaAtiva = "todos";
let termoBusca = "";
let ordenacao = "padrao";

async function carregarProdutosDoBanco() {
  try {
    const response = await fetch("http://localhost:3000/api/produtos");
    const data = await response.json();
    if (response.ok && data.sucesso && Array.isArray(data.produtos)) {
      produtos = data.produtos;
      produtos.forEach(p => { if (!p.categoria) p.categoria = "outros"; });
      localStorage.setItem("loja", JSON.stringify(produtos));
    }
  } catch (error) {
    console.error("Erro ao carregar produtos do banco:", error);
  }
}

// Retorna os produtos filtrados conforme busca, categoria, subcategoria e ordenação
function getProdutosFiltrados() {
  let filtrados = [...produtos];

  // Filtrar por categoria
  if (categoriaAtiva !== "todos") {
    filtrados = filtrados.filter(p => p.categoria === categoriaAtiva);
  }

  // Filtrar por subcategoria (se houver)
  if (window.subcategoriaAtiva && window.subcategoriaAtiva !== 'todos') {
    filtrados = filtrados.filter(p => p.subcategoria === window.subcategoriaAtiva);
  }

  // Filtrar por busca
  if (termoBusca.trim()) {
    const termo = termoBusca.toLowerCase().trim();
    filtrados = filtrados.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      (p.descricao && p.descricao.toLowerCase().includes(termo)) ||
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );
  }

  // Ordenar
  switch (ordenacao) {
    case "menor-preco":
      filtrados.sort((a, b) => extrairPreco(a.precoAtual) - extrairPreco(b.precoAtual));
      break;
    case "maior-preco":
      filtrados.sort((a, b) => extrairPreco(b.precoAtual) - extrairPreco(a.precoAtual));
      break;
    case "nome-az":
      filtrados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      break;
    case "nome-za":
      filtrados.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
      break;
    case "desconto":
      filtrados.sort((a, b) => {
        const dA = a.desconto ? parseFloat(a.desconto.replace(/[^\d]/g, "")) || 0 : 0;
        const dB = b.desconto ? parseFloat(b.desconto.replace(/[^\d]/g, "")) || 0 : 0;
        return dB - dA;
      });
      break;
  }

  return filtrados;
}

function extrairPreco(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

async function registrarVisualizacaoProduto(id) {
  try {
    const chave = `produto_visualizado_${id}`;
    if (sessionStorage.getItem(chave)) return;

    const response = await fetch(`http://localhost:3000/api/produtos/${id}/visualizacao`, {
      method: "POST",
      keepalive: true
    });

    if (response.ok) {
      sessionStorage.setItem(chave, "1");
    }
  } catch (error) {
    console.error("Erro ao registrar visualizacao do produto:", error);
  }
}

// Monta visualmente os cards da vitrine conforme a página atual.
function montarVitrine(pagina = 1) {
  const container = document.getElementById("vitrine-container");
  if (!container) return;

  container.innerHTML = "";

  const filtrados = getProdutosFiltrados();
  const semResultados = document.getElementById("semResultados");
  const contadorEl = document.getElementById("contadorProdutos");

  // Atualiza contador
  if (contadorEl) {
    contadorEl.textContent = `${filtrados.length} produto${filtrados.length !== 1 ? "s" : ""}`;
  }

  // Atualiza hero
  const heroTotal = document.getElementById("heroTotalProdutos");
  if (heroTotal) heroTotal.textContent = produtos.length;

  // Sem resultados
  if (filtrados.length === 0) {
    if (semResultados) semResultados.style.display = "block";
    const paginacaoDiv = document.getElementById("paginacao");
    if (paginacaoDiv) paginacaoDiv.innerHTML = "";
    return;
  }
  if (semResultados) semResultados.style.display = "none";

  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const produtosPagina = filtrados.slice(inicio, fim);

  // Cria um card visual para cada produto da página atual.
  produtosPagina.forEach(produto => {
    const card = document.createElement("div");
    card.classList.add("card-produto");
    card.dataset.id = produto.id;

    const precoNum = parseFloat((produto.precoAtual || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    const freteGratisBadge = precoNum >= 100 ? '<div class="badge-frete-gratis"><span class="frete-icon">🚚</span><span class="frete-texto">Frete Grátis</span></div>' : '';

    card.innerHTML = `
      ${produto.desconto ? `<div class="desconto">${produto.desconto}</div>` : ""}
      ${freteGratisBadge}
      <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-principal">
      <div class="card-produto-info">
        <h3>${produto.nome}</h3>
        <span class="preco-antigo">${produto.precoAntigo}</span>
        <span class="preco">${produto.precoAtual}</span>
        <div class="pagamento-info">
          <ul>${produto.pagamento.map(p => `<li>${p}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="botoes-produto">
        <button class="btn-detalhes"><i class="fa-solid fa-eye"></i> Ver Detalhes</button>
        <button class="btn-editar" data-id="${produto.id}"><i class="fa-solid fa-pen-to-square"></i> Editar Produto</button>
        <button class="btn-remover" data-id="${produto.id}"><i class="fa-solid fa-trash-can"></i> Remover Produto</button>
      </div>
    `;

    // Botão detalhes
    card.querySelector(".btn-detalhes").addEventListener("click", async () => {
      await registrarVisualizacaoProduto(produto.id);
      window.location.href = `produto.html?id=${produto.id}`;
    });

    // Botão editar
    const btnEditar = card.querySelector(".btn-editar");
    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        abrirPopupEditar(produto);
      });
    }

    // Botão remover
    card.querySelector(".btn-remover").addEventListener("click", () => {
      if (confirm("Tem certeza que deseja remover este produto?")) {
        produtos = produtos.filter(p => p.id !== produto.id);
        localStorage.setItem("loja", JSON.stringify(produtos));
        montarVitrine(paginaAtual);
        alert("Produto removido com sucesso!");
      }
    });

    // Atualiza quantidade ao digitar
    const inputQtd = card.querySelector('.input-quantidade');
    if (inputQtd) {
      inputQtd.addEventListener('change', function() {
        const novaQtd = Number(this.value);
        const idx = produtos.findIndex(p => p.id === produto.id);
        if (idx !== -1) {
          produtos[idx].quantidade = novaQtd;
          localStorage.setItem('loja', JSON.stringify(produtos));
        }
      });
    }

    container.appendChild(card);
  });

  montarPaginacao();
  atualizarBotoesEditar();
}

// 🔹 Função de paginação
function montarPaginacao() {
  const paginacaoDiv = document.getElementById("paginacao");
  if (!paginacaoDiv) return;

  paginacaoDiv.innerHTML = "";
  const filtrados = getProdutosFiltrados();
  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);

  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === paginaAtual) ? "pagina-ativa" : "";
    btn.addEventListener("click", () => {
      paginaAtual = i;
      montarVitrine(paginaAtual);
      window.scrollTo({ top: document.querySelector(".vitrine-home").offsetTop - 20, behavior: "smooth" });
    });
    paginacaoDiv.appendChild(btn);
  }
}

// Ajusta a interface conforme o tipo de usuário logado.
// Admin vê botões de editar/remover; cliente vê apenas navegação comum.
function atualizarBotoesEditar() {
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  console.log("🔍 Verificando login - Tipo de usuário:", tipoUsuario);
  console.log("🔍 Cliente ID:", localStorage.getItem("clienteId"));
  console.log("🔍 Nome:", localStorage.getItem("nome"));
  const botoesEditar = document.querySelectorAll(".btn-editar");
  const botoesRemover = document.querySelectorAll(".btn-remover");
  const btnNovaVitrine = document.getElementById("btnNovaVitrine");

  // Mostrar/ocultar status de login
  const statusLogado = document.getElementById("statusLogado");
  const clienteStatus = document.getElementById("clienteStatus");
  const loginButtons = document.getElementById("loginButtons");
  const adminLojaHero = document.getElementById("adminLojaHero");
  const adminHeroNovoProduto = document.getElementById("adminHeroNovoProduto");

  if (tipoUsuario === "Administrador") {
    document.body.classList.add("admin-loja-mode");
    if (statusLogado) {
      const nome = localStorage.getItem("nome") || "Admin";
      const sobrenome = localStorage.getItem("sobrenome") || "";
      const nomeUsuarioEl = document.getElementById("nomeUsuario");
      if (nomeUsuarioEl) nomeUsuarioEl.textContent = `${nome} ${sobrenome}`.trim();
      statusLogado.style.display = "flex";
    }
    if (adminLojaHero) adminLojaHero.style.display = "flex";
    if (clienteStatus) clienteStatus.style.display = "none";
    if (loginButtons) loginButtons.style.display = "none";
  } else if (localStorage.getItem("clienteId")) {
    document.body.classList.remove("admin-loja-mode");
    // Cliente logado
    if (clienteStatus) {
      const nomeCliente = localStorage.getItem("nome") || "";
      const sobrenomeCliente = localStorage.getItem("sobrenome") || "";
      const nomeClienteEl = document.getElementById("nomeCliente");
      if (nomeClienteEl) nomeClienteEl.textContent = nomeCliente;
      const sobrenomeClienteEl = document.getElementById("sobrenomeCliente");
      if (sobrenomeClienteEl) sobrenomeClienteEl.textContent = sobrenomeCliente;
      clienteStatus.style.display = "flex";
    }
    if (adminLojaHero) adminLojaHero.style.display = "none";
    if (adminLojaHero) adminLojaHero.style.display = "none";
    if (statusLogado) statusLogado.style.display = "none";
    if (loginButtons) loginButtons.style.display = "none";
  } else {
    document.body.classList.remove("admin-loja-mode");
    // Não logado
    if (statusLogado) statusLogado.style.display = "none";
    if (clienteStatus) clienteStatus.style.display = "none";
    if (loginButtons) loginButtons.style.display = "flex";
  }

  botoesEditar.forEach(btn => {
    btn.style.display = (tipoUsuario === "Administrador") ? "inline-block" : "none";
  });

  botoesRemover.forEach(btn => {
    btn.style.display = (tipoUsuario === "Administrador") ? "inline-block" : "none";
  });

  if (btnNovaVitrine) {
    btnNovaVitrine.style.display = (tipoUsuario === "Administrador") ? "inline-block" : "none";
  }

  if (adminHeroNovoProduto) {
    adminHeroNovoProduto.style.display = (tipoUsuario === "Administrador") ? "inline-flex" : "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarProdutosDoBanco();
  montarVitrine(paginaAtual);
  atualizarBotoesEditar();

  // Busca de produtos
  const inputBusca = document.getElementById("buscaProduto");
  if (inputBusca) {
    let debounceTimer;
    inputBusca.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        termoBusca = inputBusca.value;
        paginaAtual = 1;
        montarVitrine(paginaAtual);
      }, 300);
    });
  }

  // Filtro por categoria
  const categoriaBtns = document.querySelectorAll(".categoria-btn");
  categoriaBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoriaBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      categoriaAtiva = btn.dataset.categoria;
      paginaAtual = 1;
      montarVitrine(paginaAtual);
    });
  });

  // Ordenação
  const selectOrdenar = document.getElementById("ordenarPor");
  if (selectOrdenar) {
    selectOrdenar.addEventListener("change", () => {
      ordenacao = selectOrdenar.value;
      paginaAtual = 1;
      montarVitrine(paginaAtual);
    });
  }

  const btnNovaVitrine = document.getElementById("btnNovaVitrine");
  const adminHeroNovoProduto = document.getElementById("adminHeroNovoProduto");
  const abrirCadastroNovoProduto = () => {
      const novoProduto = {
        id: null,
        isNovo: true,
        nome: "",
        nomeDetalhes: "",
        imagem: "https://via.placeholder.com/300x200?text=Novo+Produto",
        precoAntigo: "",
        precoAtual: "",
        desconto: "",
        categoria: "outros",
        pagamento: [
          "💳 Cartão de crédito (até 12x)",
          "🏦 Boleto bancário",
          "📱 PIX com 10% OFF"
        ],
        descricao: "",
        imagensExtras: []
      };

      abrirPopupEditar(novoProduto);
    };
  if (btnNovaVitrine) {
    btnNovaVitrine.addEventListener("click", abrirCadastroNovoProduto);
  }
  if (adminHeroNovoProduto) {
    adminHeroNovoProduto.addEventListener("click", abrirCadastroNovoProduto);
  }

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("tipoUsuario");
      localStorage.removeItem("nome");
      localStorage.removeItem("sobrenome");
      localStorage.removeItem("clienteId");
      atualizarBotoesEditar();
      window.location.reload(); // Recarregar página após logout
    });
  }

  const logoutBtnCliente = document.getElementById("logoutBtn");
  if (logoutBtnCliente) {
    logoutBtnCliente.addEventListener("click", () => {
      localStorage.removeItem("clienteId");
      localStorage.removeItem("nome");
      localStorage.removeItem("sobrenome");
      atualizarBotoesEditar();
      window.location.reload(); // Recarregar página após logout
    });
  }
});

// Função para abrir o popup de edição e preencher campos
function abrirPopupEditar(produto) {
  const popup = document.getElementById('popupEditar');
  if (!popup) return;
  popup.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Preencher campos
  document.getElementById('editNome').value = produto.nome || '';
  document.getElementById('editCategoria').value = produto.categoria || 'outros';
  if (document.getElementById('editSubcategoria')) {
    document.getElementById('editSubcategoria').value = produto.subcategoria || '';
  }
  document.getElementById('editPrecoAntigo').value = produto.precoAntigo || '';
  document.getElementById('editPrecoAtual').value = produto.precoAtual || '';
  document.getElementById('editDesconto').value = produto.desconto || '';
  document.getElementById('editImagem').value = produto.imagem || '';
  document.getElementById('editNomeDetalhes').value = produto.nomeDetalhes || '';
  document.getElementById('editVideo').value = produto.video || '';
  document.getElementById('editDescricao').value = produto.descricao || '';
  document.getElementById('editPagamento').value = (produto.pagamento || []).join('\n');
  // Campo de quantidade
  if (document.getElementById('editQuantidade')) {
    document.getElementById('editQuantidade').value = produto.quantidade || 1;
  }
  // Imagens extras
  for (let i = 1; i <= 5; i++) {
    if (document.getElementById('editImagemExtra'+i)) {
      document.getElementById('editImagemExtra'+i).value = (produto.imagensExtras && produto.imagensExtras[i-1]) || '';
    }
  }

  // Salvar alterações
  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.onclick = function() {
    produto.nome = document.getElementById('editNome').value;
    produto.categoria = document.getElementById('editCategoria').value;
    if (document.getElementById('editSubcategoria')) {
      produto.subcategoria = document.getElementById('editSubcategoria').value;
    }
    produto.precoAntigo = document.getElementById('editPrecoAntigo').value;
    produto.precoAtual = document.getElementById('editPrecoAtual').value;
    produto.desconto = document.getElementById('editDesconto').value;
    produto.imagem = document.getElementById('editImagem').value;
    produto.nomeDetalhes = document.getElementById('editNomeDetalhes').value;
    produto.video = document.getElementById('editVideo').value;
    produto.descricao = document.getElementById('editDescricao').value;
    produto.pagamento = document.getElementById('editPagamento').value.split('\n');
    // Salvar quantidade
    if (document.getElementById('editQuantidade')) {
      produto.quantidade = Number(document.getElementById('editQuantidade').value) || 1;
    }
    // Imagens extras
    produto.imagensExtras = [];
    for (let i = 1; i <= 5; i++) {
      if (document.getElementById('editImagemExtra'+i)) {
        const val = document.getElementById('editImagemExtra'+i).value;
        if (val) produto.imagensExtras.push(val);
      }
    }
    // Atualiza no array principal
    const idx = produtos.findIndex(p => p.id === produto.id);
    if (idx !== -1) {
      produtos[idx] = produto;
    } else {
      produtos.push(produto);
    }
    localStorage.setItem('loja', JSON.stringify(produtos));

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

    montarVitrine(paginaAtual);
    popup.style.display = 'none';
    document.body.style.overflow = '';
  };

  // Fechar popup
  document.getElementById('fecharEditar').onclick = function() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
  };
}


