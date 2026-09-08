/**
 * Página de detalhes do produto.
 * Carrega os dados do produto cadastrado (localStorage ou API),
 * monta o carrossel moderno com miniaturas verticais à esquerda,
 * suporte a vídeos, zoom, swipe mobile e múltiplos formatos de produtos cadastrados.
 */
function inicializarPaginaProduto() {
  let produtoAtual = null;

  async function registrarVisualizacaoProduto(id) {
    try {
      const chave = `produto_visualizado_${id}`;
      if (sessionStorage.getItem(chave)) return;

      const base = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin;

      const response = await fetch(`${base}/api/produtos/${id}/visualizacao`, {
        method: "POST"
      });

      if (response.ok) {
        sessionStorage.setItem(chave, "1");
      }
    } catch (error) {
      // Silencioso em caso de erro na contagem
    }
  }

  // 🔹 Normaliza campos de imagens extras de qualquer produto cadastrado
  function extrairImagensExtras(produto) {
    let extras = [];

    const raw = produto.imagensExtras ||
                produto.imagens_extras ||
                produto.imagens_extras_json ||
                produto.fotosExtras ||
                produto.fotos ||
                produto.imagens;

    if (Array.isArray(raw)) {
      extras = raw;
    } else if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) extras = parsed;
        else extras = [raw];
      } catch (_) {
        // Pode ser lista separada por vírgula ou quebra de linha
        extras = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
    }

    // Filtra strings válidas
    return extras
      .map(s => typeof s === "string" ? s.trim() : (s?.url || s?.src || ""))
      .filter(url => url && url.length > 3 && !url.includes("undefined") && !url.includes("null"));
  }

  // 🔹 Busca produto no banco caso não esteja em cache no localStorage
  async function buscarProdutoBancoOuFallback(id) {
    try {
      const bases = [];
      const port = window.location.port;
      if (port && port !== '3000') bases.push('http://localhost:3000');
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') bases.push(window.location.origin);

      for (const base of bases) {
        try {
          const resp = await fetch(`${base}/api/produtos/${id}`, { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            if (data && (data.produto || data.sucesso)) {
              return data.produto || data;
            }
          }
        } catch (_) {}
      }

      // Tenta rota /api/produtos geral
      for (const base of bases) {
        try {
          const resp = await fetch(`${base}/api/produtos`, { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            const lista = Array.isArray(data) ? data : (data.produtos || []);
            const encontrado = lista.find(p => p.id == id || String(p.id) === String(id) || String(p._id) === String(id));
            if (encontrado) {
              // Atualiza cache local
              let lojaCache = JSON.parse(localStorage.getItem("loja") || "[]");
              const idx = lojaCache.findIndex(p => p.id == id || String(p.id) === String(id));
              if (idx >= 0) lojaCache[idx] = encontrado;
              else lojaCache.push(encontrado);
              localStorage.setItem("loja", JSON.stringify(lojaCache));
              return encontrado;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  }

  // 🔹 Carrega os dados do produto usando o parâmetro `id` da URL.
  async function carregarDadosProduto() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");

    if (!idParam) {
      console.error("ID do produto não encontrado na URL");
      return;
    }

    const id = parseInt(idParam, 10) || idParam;

    const produtos = JSON.parse(localStorage.getItem("loja")) || [];
    let produto = produtos.find(p => p.id == id || String(p.id) === String(id) || String(p._id) === String(id));

    if (!produto) {
      const produtosLoja = JSON.parse(localStorage.getItem("produtosLoja")) || [];
      produto = produtosLoja.find(p => p.id == id || String(p.id) === String(id) || String(p._id) === String(id));
    }

    if (!produto) {
      produto = await buscarProdutoBancoOuFallback(id);
    }

    // 🔹 Fallback com catálogo padrão caso o banco ou o cache estejam vazios
    if (!produto) {
      const produtosPadrao = [
        {
          id: 1,
          nome: "Camiseta Streetwear Oversized",
          nomeDetalhes: "Camiseta Streetwear Oversized 100% Algodão Premium",
          precoAntigo: "R$ 149,90",
          precoAtual: "R$ 89,90",
          desconto: "-40% DESCONTO",
          categoria: "moda",
          subcategoria: "roupas-masculinas",
          imagem: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
          imagensExtras: [
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80"
          ],
          descricao: "Camiseta streetwear premium confeccionada em algodão fio 30.1 penteado. Modelagem oversized com caimento perfeito, gola canelada e costura reforçada.",
          pagamento: ["💳 Cartão de crédito (até 12x)", "🏦 Boleto bancário", "📱 PIX com 10% OFF"]
        },
        {
          id: 2,
          nome: "Tênis Esportivo Running Ultra",
          nomeDetalhes: "Tênis Esportivo Running Ultra Amortecimento",
          precoAntigo: "R$ 399,90",
          precoAtual: "R$ 199,90",
          desconto: "-50% DESCONTO",
          categoria: "calcados",
          subcategoria: "sapatos-masculinos",
          imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
          imagensExtras: [
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80"
          ],
          descricao: "Tênis esportivo de alta performance com tecnologia de amortecimento responsivo e tecido respirável para o máximo conforto nos treinos e dia a dia.",
          pagamento: ["💳 Cartão de crédito (até 12x)", "🏦 Boleto bancário", "📱 PIX com 10% OFF"]
        },
        {
          id: 3,
          nome: "Relógio Smartwatch Pro Series",
          nomeDetalhes: "Smartwatch Pro Series Resistente à Água com Monitor Cardíaco",
          precoAntigo: "R$ 499,90",
          precoAtual: "R$ 249,90",
          desconto: "-50% DESCONTO",
          categoria: "eletronicos",
          subcategoria: "relogios",
          imagem: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
          imagensExtras: [
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
          ],
          descricao: "Smartwatch moderno com tela AMOLED, monitoramento de saúde 24h, notificações integradas, múltiplos modos esportivos e bateria de longa duração.",
          pagamento: ["💳 Cartão de crédito (até 12x)", "🏦 Boleto bancário", "📱 PIX com 10% OFF"]
        },
        {
          id: 4,
          nome: "Fone de Ouvido Bluetooth Noise Cancelling",
          nomeDetalhes: "Fone de Ouvido Sem Fio Bluetooth com Cancelamento Ativo de Ruído",
          precoAntigo: "R$ 475,75",
          precoAtual: "R$ 150,00",
          desconto: "-68% DESCONTO",
          categoria: "eletronicos",
          subcategoria: "acessorios",
          imagem: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
          imagensExtras: [
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
          ],
          descricao: "Fone de ouvido bluetooth com áudio de alta fidelidade, cancelamento ativo de ruído (ANC), microfone embutido para chamadas cristalinas e até 30 horas de autonomia de bateria.",
          pagamento: ["💳 Cartão de crédito (até 12x)", "🏦 Boleto bancário", "📱 PIX com 10% OFF"]
        }
      ];

      produto = produtosPadrao.find(p => p.id == id || String(p.id) === String(id));
      if (!produto && produtosPadrao.length > 0) {
        produto = {
          ...produtosPadrao[0],
          id: id,
          nome: `Produto #${id}`,
          nomeDetalhes: `Produto Exclusivo #${id} - Edição Especial`
        };
      }
    }

    if (!produto) {
      console.error("Produto não encontrado no sistema para o ID:", id);
      const tituloEl = document.getElementById("detalheTitulo");
      if (tituloEl) tituloEl.textContent = "Produto não encontrado";
      return;
    }

    produtoAtual = produto;
    registrarVisualizacaoProduto(id);

    // ── Preenche textos e preços ──
    const titulo = produto.nomeDetalhes || produto.nome || produto.nome_detalhes || "Produto";
    const precoAtual = produto.precoAtual || produto.preco_atual || produto.preco || "R$ 0,00";
    const precoAntigo = produto.precoAntigo || produto.preco_antigo || "";

    const elTitulo = document.getElementById("detalheTitulo");
    const elPrecoAtual = document.getElementById("detalhePreco");
    const elPrecoAntigo = document.getElementById("detalhePrecoAntigo");
    const elBreadcrumb = document.getElementById("breadcrumbProduto");
    const elDesconto = document.getElementById("detalheDesconto");
    const elFreteGratis = document.getElementById("badgeFreteGratisProduto");

    if (elTitulo) {
      elTitulo.textContent = titulo;
      elTitulo.title = titulo;
    }
    if (elPrecoAtual) elPrecoAtual.textContent = precoAtual;
    if (elPrecoAntigo) {
      if (precoAntigo) {
        elPrecoAntigo.textContent = precoAntigo;
        elPrecoAntigo.style.display = "inline-block";
      } else {
        elPrecoAntigo.style.display = "none";
      }
    }
    if (elBreadcrumb) elBreadcrumb.textContent = titulo;

    // ── Extração do valor numérico do preço para frete e desconto ──
    function extrairPreco(valor) {
      if (typeof valor === "number") return valor;
      if (!valor) return 0;
      return parseFloat(String(valor).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    }

    const precoNum = extrairPreco(precoAtual);

    // ── Selo de Desconto no formato solicitado (-50% DESCONTO) ──
    if (elDesconto) {
      let textoDesconto = "";
      const rawDesc = (produto.desconto || "").trim();
      if (rawDesc) {
        let limpo = rawDesc.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
        if (!/desconto/i.test(limpo)) {
          if (!limpo.startsWith("-")) limpo = "-" + limpo;
          if (!limpo.includes("%")) limpo = limpo + "%";
          limpo = limpo + " DESCONTO";
        }
        textoDesconto = limpo.toUpperCase();
      } else if (precoAntigo) {
        const precoAntigoNum = extrairPreco(precoAntigo);
        if (precoAntigoNum > precoNum && precoAntigoNum > 0) {
          const perc = Math.round(((precoAntigoNum - precoNum) / precoAntigoNum) * 100);
          if (perc > 0) {
            textoDesconto = `-${perc}% DESCONTO`;
          }
        }
      }

      if (textoDesconto) {
        elDesconto.textContent = textoDesconto;
        elDesconto.style.display = "inline-flex";
      } else {
        elDesconto.style.display = "none";
      }
    }

    // ── Selo de Frete Grátis (para compras/produtos a partir de R$ 100) ──
    if (elFreteGratis) {
      if (precoNum >= 99 || Math.round(precoNum) >= 100) {
        elFreteGratis.style.display = "inline-flex";
      } else {
        elFreteGratis.style.display = "none";
      }
    }

    // ── Montagem do carrossel para qualquer produto cadastrado ──
    montarCarrosselProduto(produto);

    // ── Formas de pagamento ──
    const pagamentoList = document.getElementById("detalhePagamento");
    if (pagamentoList) {
      let pagamentos = produto.pagamento || produto.pagamento_json || [];
      if (typeof pagamentos === "string") {
        try { pagamentos = JSON.parse(pagamentos); } catch(_) { pagamentos = pagamentos.split("\n"); }
      }
      if (Array.isArray(pagamentos) && pagamentos.length > 0) {
        pagamentoList.innerHTML = pagamentos.filter(Boolean).map(p => `<li>${p}</li>`).join("");
      }
    }

    // ── Descrição ──
    const descricaoElement = document.getElementById("detalheDescricao");
    if (descricaoElement && produto.descricao) {
      descricaoElement.innerHTML = produto.descricao;
    }

    // ── Seleção de tamanho (se aplicável) ──
    configurarTamanhosProduto(produto);
  }

  // 🔹 Monta o carrossel moderno (miniaturas na esquerda + imagem principal)
  function montarCarrosselProduto(produto) {
    const carrosselState = {
      index: 0,
      items: []
    };

    const imagemPrincipal = document.getElementById("imagemPrincipal");
    const videoPrincipal = document.getElementById("videoPrincipal");
    const mediaWrapper = document.getElementById("mediaWrapper");
    const carrosselPrincipal = document.querySelector(".carrossel-principal");
    const miniaturasCol = document.getElementById("miniaturasCol");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (!imagemPrincipal || !carrosselPrincipal) return;

    // Remove qualquer marca d'água antiga que possa ter ficado no DOM
    document.querySelectorAll(".carrossel-principal .marca-dagua, .miniaturas .marca-dagua").forEach(el => el.remove());

    // 1) Imagem principal
    const imgPrincipalUrl = produto.imagem || produto.foto || produto.imagem_principal || "/images/sem-imagem.svg";
    carrosselState.items.push({ type: "img", src: imgPrincipalUrl });

    // 2) Imagens extras (sem duplicar a principal)
    const extras = extrairImagensExtras(produto);
    extras.forEach(imgSrc => {
      if (imgSrc && imgSrc !== imgPrincipalUrl && !carrosselState.items.some(i => i.src === imgSrc)) {
        carrosselState.items.push({ type: "img", src: imgSrc });
      }
    });

    // 3) Vídeo do produto (se houver)
    const videoUrl = produto.video || produto.video_url || produto.videoUrl;
    if (videoUrl && typeof videoUrl === "string" && videoUrl.trim().length > 3) {
      carrosselState.items.push({ type: "video", src: videoUrl.trim() });
    }

    const totalItens = carrosselState.items.length;

    // ── Cria / obtém o contador de slides ──
    let slideCounter = carrosselPrincipal.querySelector(".slide-counter");
    if (!slideCounter) {
      slideCounter = document.createElement("span");
      slideCounter.className = "slide-counter";
      mediaWrapper.appendChild(slideCounter);
    }

    // ── Cria / obtém o container de dots ──
    let dotsContainer = carrosselPrincipal.querySelector(".galeria-dots");
    if (!dotsContainer) {
      dotsContainer = document.createElement("div");
      dotsContainer.className = "galeria-dots";
      carrosselPrincipal.appendChild(dotsContainer);
    }

    const miniLateral = document.querySelector(".miniaturas-container-lateral");

    // ── Se tiver apenas 1 mídia: oculta miniaturas, dots, setas e contador ──
    if (totalItens <= 1) {
      if (miniaturasCol) miniaturasCol.style.display = "none";
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) btnNext.style.display = "none";
      if (slideCounter) slideCounter.style.display = "none";
      if (dotsContainer) dotsContainer.style.display = "none";

      imagemPrincipal.src = carrosselState.items[0].src;
      imagemPrincipal.style.display = "block";
      if (videoPrincipal) videoPrincipal.style.display = "none";
      return;
    }

    // ── Se tiver 2 ou mais mídias: exibe todos os controles ──
    if (miniLateral) miniLateral.style.display = "flex";
    if (miniaturasCol) miniaturasCol.style.display = "flex";
    if (btnPrev) btnPrev.style.display = "flex";
    if (btnNext) btnNext.style.display = "flex";
    if (slideCounter) slideCounter.style.display = "block";
    if (dotsContainer) dotsContainer.style.display = "flex";

    // ── Renderiza as miniaturas na coluna lateral ──
    if (miniaturasCol) {
      miniaturasCol.innerHTML = "";
      carrosselState.items.forEach((item, index) => {
        const thumbItem = document.createElement("div");
        thumbItem.className = "thumb-item" + (index === 0 ? " active" : "");
        thumbItem.title = item.type === "video" ? "Vídeo do produto" : `Imagem ${index + 1}`;

        if (item.type === "video") {
          const vid = document.createElement("video");
          vid.src = item.src;
          vid.muted = true;
          vid.loop = true;
          vid.autoplay = true;
          vid.playsInline = true;
          vid.addEventListener("contextmenu", e => e.preventDefault());
          thumbItem.appendChild(vid);

          const badge = document.createElement("span");
          badge.className = "thumb-video-badge";
          badge.textContent = "▶ VÍDEO";
          thumbItem.appendChild(badge);
        } else {
          const img = document.createElement("img");
          img.src = item.src;
          img.alt = `Miniatura ${index + 1}`;
          img.draggable = false;
          img.addEventListener("contextmenu", e => e.preventDefault());
          img.addEventListener("dragstart", e => e.preventDefault());
          thumbItem.appendChild(img);
        }

        thumbItem.addEventListener("click", () => {
          if (carrosselState.index === index) return;
          const dir = index > carrosselState.index ? "forward" : "back";
          carrosselState.index = index;
          renderCarrossel(dir);
        });

        miniaturasCol.appendChild(thumbItem);
      });
    }

    // ── Renderiza as bolinhas indicadoras (dots) ──
    dotsContainer.innerHTML = "";
    carrosselState.items.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "galeria-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Slide ${i + 1}`);
      dot.addEventListener("click", () => {
        if (carrosselState.index === i) return;
        const dir = i > carrosselState.index ? "forward" : "back";
        carrosselState.index = i;
        renderCarrossel(dir);
      });
      dotsContainer.appendChild(dot);
    });

    let slideTimer = null;

    // ── Função central de renderização com transição suave ──
    const renderCarrossel = (direction = "forward") => {
      const item = carrosselState.items[carrosselState.index];
      if (!item) return;

      if (slideTimer) clearTimeout(slideTimer);

      const animOut = direction === "forward" ? "slide-out-left" : "slide-out-right";
      const animIn  = direction === "forward" ? "slide-in-right" : "slide-in-left";

      imagemPrincipal.classList.remove("slide-out-left", "slide-in-right", "slide-out-right", "slide-in-left", "zoomed");

      if (item.type === "img") {
        imagemPrincipal.classList.add(animOut);
        slideTimer = setTimeout(() => {
          imagemPrincipal.src = item.src;
          imagemPrincipal.style.display = "block";
          if (videoPrincipal) {
            videoPrincipal.style.display = "none";
            if (typeof videoPrincipal.pause === "function") videoPrincipal.pause();
          }
          imagemPrincipal.classList.remove(animOut);
          imagemPrincipal.classList.add(animIn);
          setTimeout(() => imagemPrincipal.classList.remove(animIn), 240);
        }, 120);
      } else if (item.type === "video") {
        imagemPrincipal.style.display = "none";
        if (videoPrincipal) {
          videoPrincipal.style.display = "block";
          videoPrincipal.src = item.src;
          videoPrincipal.play().catch(() => {});
        }
      }

      // Atualiza estado ativo das miniaturas e faz scroll suave até a miniatura ativa
      if (miniaturasCol) {
        const thumbs = miniaturasCol.querySelectorAll(".thumb-item");
        thumbs.forEach((el, i) => {
          const isActive = i === carrosselState.index;
          el.classList.toggle("active", isActive);
          if (isActive) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        });
      }

      // Atualiza dots
      dotsContainer.querySelectorAll(".galeria-dot").forEach((d, i) => {
        d.classList.toggle("active", i === carrosselState.index);
      });

      // Atualiza contador textual
      if (slideCounter) {
        slideCounter.textContent = `${carrosselState.index + 1} / ${totalItens}`;
      }
    };

    // ── Botões Prev e Next ──
    if (btnPrev) {
      btnPrev.onclick = () => {
        carrosselState.index = (carrosselState.index - 1 + totalItens) % totalItens;
        renderCarrossel("back");
      };
    }
    if (btnNext) {
      btnNext.onclick = () => {
        carrosselState.index = (carrosselState.index + 1) % totalItens;
        renderCarrossel("forward");
      };
    }

    // ── Navegação por teclado (quando foco no carrossel) ──
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        carrosselState.index = (carrosselState.index - 1 + totalItens) % totalItens;
        renderCarrossel("back");
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        carrosselState.index = (carrosselState.index + 1) % totalItens;
        renderCarrossel("forward");
      }
    });

    // ── Swipe para Mobile ──
    let touchStartX = 0;
    let touchStartY = 0;
    mediaWrapper.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    mediaWrapper.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) {
          carrosselState.index = (carrosselState.index + 1) % totalItens;
          renderCarrossel("forward");
        } else {
          carrosselState.index = (carrosselState.index - 1 + totalItens) % totalItens;
          renderCarrossel("back");
        }
      }
    }, { passive: true });

    // ── Zoom na imagem principal ao clicar ──
    imagemPrincipal.style.cursor = "zoom-in";
    imagemPrincipal.onclick = () => {
      const isZoomed = imagemPrincipal.classList.toggle("zoomed");
      imagemPrincipal.style.cursor = isZoomed ? "zoom-out" : "zoom-in";
    };

    // Renderiza o primeiro slide inicialmente
    renderCarrossel("forward");
  }

  // 🔹 Configuração de seleção de tamanho para roupas/calçados
  function configurarTamanhosProduto(produto) {
    const secaoTamanho = document.getElementById("selecaoTamanho");
    if (!secaoTamanho) return;

    const tamanhosPorSubcategoria = {
      'roupas-femininas': ["PP", "P", "M", "G", "GG", "XG"],
      'roupas-masculinas': ["PP", "P", "M", "G", "GG", "XG"],
      'roupas-menino': ["2", "4", "6", "8", "10", "12", "14", "16"],
      'roupas-menina': ["2", "4", "6", "8", "10", "12", "14", "16"],
      'sapatos-masculinos': ["37", "38", "39", "40", "41", "42", "43", "44"],
      'sapatos-femininos': ["34", "35", "36", "37", "38", "39", "40"],
      'calcados-menino': ["20", "22", "24", "26", "28", "30", "32", "34", "36"],
      'calcados-menina': ["20", "22", "24", "26", "28", "30", "32", "34", "36"]
    };

    const sub = produto.subcategoria || "";
    const cat = produto.categoria || "";
    let tamanhos = tamanhosPorSubcategoria[sub] || null;

    if (!tamanhos && cat === "moda") {
      tamanhos = ["P", "M", "G", "GG"];
    }

    if (tamanhos && tamanhos.length > 0) {
      secaoTamanho.style.display = "block";
      const grid = document.getElementById("tamanhosGrid");
      const label = document.getElementById("tamanhoSelecionado");
      if (grid) {
        grid.innerHTML = "";
        tamanhos.forEach(tam => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn-tamanho";
          btn.textContent = tam;
          btn.onclick = () => {
            grid.querySelectorAll(".btn-tamanho").forEach(b => b.classList.remove("selecionado"));
            btn.classList.add("selecionado");
            if (label) label.textContent = `Tamanho selecionado: ${tam}`;
            window.tamanhoSelecionadoAtual = tam;
          };
          grid.appendChild(btn);
        });
      }
    } else {
      secaoTamanho.style.display = "none";
    }
  }

  // Inicializa carregamento
  carregarDadosProduto();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarPaginaProduto);
} else {
  inicializarPaginaProduto();
}
