/**
 * Página de detalhes do produto.
 * Este arquivo carrega os dados salvos no localStorage,
 * monta o carrossel de mídia, aplica zoom e atualiza a tela.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se existe sessão de administrador ativa.
  let isAdmin = localStorage.getItem("isAdmin") === "true";

  // Guarda em memória o produto aberto no momento.
  let produtoAtual = null;

  async function registrarVisualizacaoProduto(id) {
    try {
      const chave = `produto_visualizado_${id}`;
      if (sessionStorage.getItem(chave)) return;

      const response = await fetch(`http://localhost:3000/api/produtos/${id}/visualizacao`, {
        method: "POST"
      });

      if (response.ok) {
        sessionStorage.setItem(chave, "1");
      }
    } catch (error) {
      console.error("Erro ao registrar visualizacao do produto:", error);
    }
  }

  // 🔹 Carrega os dados do produto usando o parâmetro `id` da URL.
  // Exemplo: `produto.html?id=3`
  function carregarDadosProduto() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));

    if (!id) {
      console.error("ID do produto não encontrado na URL");
      return;
    }

    const produtos = JSON.parse(localStorage.getItem("loja")) || [];
    const produto = produtos.find(p => p.id === id);

    if (!produto) {
      console.error("Produto não encontrado");
      return;
    }

    produtoAtual = produto;
    registrarVisualizacaoProduto(id);


    // Preencher os elementos da página com os dados do produto
    document.getElementById("detalheTitulo").textContent = produto.nomeDetalhes || produto.nome;
    document.getElementById("detalhePreco").textContent = produto.precoAtual;
    document.getElementById("detalhePrecoAntigo").textContent = produto.precoAntigo;

    // Breadcrumb
    const breadcrumb = document.getElementById("breadcrumbProduto");
    if (breadcrumb) breadcrumb.textContent = produto.nomeDetalhes || produto.nome;

    // Desconto
    const descontoElement = document.getElementById("detalheDesconto");
    if (produto.desconto) {
      descontoElement.textContent = produto.desconto;
      descontoElement.style.display = "block";
    } else {
      descontoElement.style.display = "none";
    }

      // Carrossel dinâmico (imagens e vídeo + miniaturas + botões)
    // Estado do carrossel: controla qual mídia está ativa
    // e quais imagens/vídeos podem ser navegados.
    const carrosselState = {
      index: 0,
      items: []
    };

    const wrapper = document.getElementById("mediaWrapper");
    const imagemPrincipal = document.getElementById("imagemPrincipal");
    const videoPrincipal = document.getElementById("videoPrincipal");
    const marcaDagua = document.querySelector(".carrossel-principal .marca-dagua");

    marcaDagua.textContent = "MIX-PROMOÇÃO";

    carrosselState.items.push({type: "img", src: produto.imagem || "https://via.placeholder.com/400x300?text=Produto"});

    if (produto.imagensExtras && produto.imagensExtras.length > 0) {
      produto.imagensExtras.forEach(imgSrc => {
        if (imgSrc) carrosselState.items.push({type: "img", src: imgSrc});
      });
    }

    if (produto.video) {
      carrosselState.items.push({type: "video", src: produto.video});
    }

    // Renderiza a mídia atual no destaque principal.
    // Se for imagem, mostra a foto; se for vídeo, mostra o player.
    const renderCarrossel = () => {
      const item = carrosselState.items[carrosselState.index];
      if (!item) return;

      if (item.type === "img") {
        imagemPrincipal.style.display = "block";
        videoPrincipal.style.display = "none";
        imagemPrincipal.src = item.src;
        imagemPrincipal.alt = produto.nome || "Produto";
      } else if (item.type === "video") {
        imagemPrincipal.style.display = "none";
        videoPrincipal.style.display = "block";
        videoPrincipal.src = item.src;
        videoPrincipal.play().catch(() => {});
      }

      document.querySelectorAll(".miniaturas .thumb").forEach((thumb, i) => {
        thumb.classList.toggle("active", i === carrosselState.index);
      });
    };

    const miniaturas = document.querySelector(".miniaturas");
    miniaturas.innerHTML = "";

    carrosselState.items.forEach((item, index) => {
      let thumb;
      if (item.type === "video") {
        thumb = document.createElement("video");
        thumb.muted = true;
        thumb.loop = true;
        thumb.autoplay = true;
        thumb.playsInline = true;
        thumb.src = item.src;
        thumb.className = "thumb thumb-video";
        thumb.title = "Vídeo";
      } else {
        thumb = document.createElement("img");
        thumb.src = item.src;
        thumb.alt = `Miniatura ${index + 1}`;
        thumb.className = "thumb";
        thumb.title = "Imagem";
      }

      thumb.addEventListener("click", () => {
        carrosselState.index = index;
        renderCarrossel();
      });
      thumb.addEventListener("contextmenu", (e) => e.preventDefault());
      thumb.addEventListener("dragstart", (e) => e.preventDefault());

      miniaturas.appendChild(thumb);
    });

    document.getElementById("btnPrev").addEventListener("click", () => {
      carrosselState.index = (carrosselState.index - 1 + carrosselState.items.length) % carrosselState.items.length;
      renderCarrossel();
    });
    document.getElementById("btnNext").addEventListener("click", () => {
      carrosselState.index = (carrosselState.index + 1) % carrosselState.items.length;
      renderCarrossel();
    });

    imagemPrincipal.style.cursor = "zoom-in";
    imagemPrincipal.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey) {
        const srcPrincipal = imagemPrincipal.src;
        const fotos = carrosselState.items
          .filter(i => i.type === "img")
          .map(i => i.src);
        if (typeof abrirMediaPopup === "function") {
          abrirMediaPopup({ fotos }, "img", srcPrincipal);
        }
        return;
      }

      const zoomed = imagemPrincipal.classList.toggle("zoomed");
      imagemPrincipal.style.cursor = zoomed ? "zoom-out" : "zoom-in";
    });

    renderCarrossel();

    // Formas de pagamento
    const pagamentoList = document.getElementById("detalhePagamento");
    if (produto.pagamento && produto.pagamento.length > 0) {
      pagamentoList.innerHTML = produto.pagamento.map(p => `<li>${p}</li>`).join("");
    }

    // Descrição
    const descricaoElement = document.getElementById("detalheDescricao");
    if (produto.descricao) {
      descricaoElement.innerHTML = produto.descricao;
    }

    // Seleção de tamanho — exibe para moda (roupa) ou sapatos/sandálias
    const secaoTamanho = document.getElementById("selecaoTamanho");
    if (secaoTamanho) {
      // Centraliza os tamanhos por subcategoria
      const tamanhosPorSubcategoria = {
        // Moda adulto
        'roupas-femininas': ["PP", "P", "M", "G", "GG", "XG"],
        'roupas-masculinas': ["PP", "P", "M", "G", "GG", "XG"],
        'sapatos-masculinos': [37, 38, 39, 40, 41, 42, 43, 44],
        'sapatos-femininos': [33, 34, 35, 36, 37, 38, 39, 40],
        'sandalia-feminina': [33, 34, 35, 36, 37, 38, 39, 40],
        'sandalias-femininas': [33, 34, 35, 36, 37, 38, 39, 40],
        'bolsas': [], // Não exibe tamanho
        // Moda infantil
        'roupas-menino': ["1", "2", "4", "6", "8", "10", "12", "14", "16"],
        'roupas-menina': ["1", "2", "4", "6", "8", "10", "12", "14", "16"],
        'calcados-menino': [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
        'calcados-menina': [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
        'bolsa-infantil': [],
        'acessorios-infantil': [],
      };
      if (produto.categoria === "moda" && produto.subcategoria && tamanhosPorSubcategoria[produto.subcategoria]) {
        const tamanhos = tamanhosPorSubcategoria[produto.subcategoria];
        if (tamanhos.length > 0) {
          secaoTamanho.style.display = "block";
          const tamanhosGrid = document.getElementById("tamanhosGrid");
          tamanhosGrid.innerHTML = tamanhos.map(t => `<button class=\"btn-tamanho\" data-tamanho=\"${t}\">${t}</button>`).join("");
          const textoSelecionado = document.getElementById("tamanhoSelecionadoTexto");
          if (textoSelecionado) textoSelecionado.textContent = "";
          window.tamanhoSelecionado = null;
          tamanhosGrid.querySelectorAll(".btn-tamanho").forEach(btn => {
            btn.addEventListener("click", () => {
              tamanhosGrid.querySelectorAll(".btn-tamanho").forEach(b => b.classList.remove("selecionado"));
              btn.classList.add("selecionado");
              window.tamanhoSelecionado = btn.dataset.tamanho;
              if (textoSelecionado) {
                textoSelecionado.textContent = "Tamanho selecionado: " + btn.dataset.tamanho;
              }
            });
          });
        } else {
          secaoTamanho.style.display = "none";
          window.tamanhoSelecionado = null;
        }
      } else if (produto.categoria === "moda") {
        // fallback para moda sem subcategoria específica
        secaoTamanho.style.display = "block";
        const tamanhosRoupa = ["PP", "P", "M", "G", "GG", "XG"];
        const tamanhosGrid = document.getElementById("tamanhosGrid");
        tamanhosGrid.innerHTML = tamanhosRoupa.map(t => `<button class=\"btn-tamanho\" data-tamanho=\"${t}\">${t}</button>`).join("");
        const textoSelecionado = document.getElementById("tamanhoSelecionadoTexto");
        if (textoSelecionado) textoSelecionado.textContent = "";
        window.tamanhoSelecionado = null;
        tamanhosGrid.querySelectorAll(".btn-tamanho").forEach(btn => {
          btn.addEventListener("click", () => {
            tamanhosGrid.querySelectorAll(".btn-tamanho").forEach(b => b.classList.remove("selecionado"));
            btn.classList.add("selecionado");
            window.tamanhoSelecionado = btn.dataset.tamanho;
            if (textoSelecionado) {
              textoSelecionado.textContent = "Tamanho selecionado: " + btn.dataset.tamanho;
            }
          });
        });
      } else {
        secaoTamanho.style.display = "none";
        window.tamanhoSelecionado = null;
      }
    }

    console.log("Dados do produto carregados:", produto);
  }

  // Chamar a função para carregar dados do produto
  carregarDadosProduto();

  // Atualiza automaticamente os dados desta página quando
  // o produto é editado em outra aba da aplicação.
  window.addEventListener("storage", (event) => {
    if (event.key === "produtoAtualizado" || event.key === "loja") {
      const params = new URLSearchParams(window.location.search);
      const id = parseInt(params.get("id"));
      if (id && event.newValue) {
        const changed = JSON.parse(event.newValue);
        if (!changed || changed.id === id) {
          carregarDadosProduto();
        }
      }
    }
  });

  const btnComentar = document.getElementById("btnComentar");
  const btnAvaliar = document.querySelector(".btn-avaliar");
  const popup = document.getElementById("popupComentario");
  const fecharPopup = document.getElementById("fecharPopup");
  const fotosInput = document.getElementById("fotosComentario");
  const previewDiv = document.getElementById("previewFotos");
  const videoInput = document.getElementById("videoComentario");
  const previewVideo = document.getElementById("previewVideo");
  const formComentario = document.getElementById("formComentario");

});
