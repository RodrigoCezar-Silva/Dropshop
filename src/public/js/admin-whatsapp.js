document.addEventListener("DOMContentLoaded", () => {
  // Verificar se é admin
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  if (tipoUsuario !== "Administrador") {
    alert("Acesso restrito a administradores.");
    window.location.href = "admin-login.html";
    return;
  }

  // ===== Elementos do DOM =====
  const listaClientesEl = document.getElementById("wppListaClientes");
  const buscaInput = document.getElementById("wppBuscaCliente");
  const btnSelecionarTodos = document.getElementById("wppBtnSelecionarTodos");
  const contagemEl = document.getElementById("wppContagemSelecionados");
  const mensagemInput = document.getElementById("wppMensagem");
  const charCountEl = document.getElementById("wppCharCount");
  const btnPreview = document.getElementById("wppBtnPreview");
  const previewEl = document.getElementById("wppPreview");
  const previewTexto = document.getElementById("wppPreviewTexto");
  const previewImagens = document.getElementById("wppPreviewImagens");
  const fecharPreview = document.getElementById("wppFecharPreview");
  const btnEnviar = document.getElementById("wppBtnEnviar");
  const btnEnviarImagens = document.getElementById("wppBtnEnviarImagens");
  const statusEl = document.getElementById("wppStatus");
  const listaHistoricoEl = document.getElementById("wppListaHistorico");

  // Imagens
  const uploadArea = document.getElementById("wppUploadArea");
  const inputImagens = document.getElementById("wppInputImagens");
  const imagensPreviewEl = document.getElementById("wppImagensPreview");

  // Link loja
  const linkLojaInput = document.getElementById("wppLinkLoja");
  const btnLinkPadrao = document.getElementById("wppBtnLinkPadrao");

  // Logo
  const logoCanvas = document.getElementById("wppLogoCanvas");
  const logoAtivo = document.getElementById("wppLogoAtivo");
  const logoMiniPreview = document.getElementById("wppLogoMiniPreview");
  const previewLogo = document.getElementById("wppPreviewLogo");

  // Composer dest
  const composerDestLista = document.getElementById("wppComposerDestLista");
  const composerDestCount = document.getElementById("wppComposerDestCount");
  const composerDestTags = document.getElementById("wppComposerDestTags");
  const inputAddTelefone = document.getElementById("wppInputAddTelefone");
  const btnAddTelefone = document.getElementById("wppBtnAddTelefone");

  // IA
  const iaListaProdutos = document.getElementById("wppIaListaProdutos");
  const iaBuscaProduto = document.getElementById("wppIaBuscaProduto");
  const iaTagsEl = document.getElementById("wppIaTagsSelecionados");
  const btnGerarIA = document.getElementById("wppBtnGerarIA");
  const btnRefazerIA = document.getElementById("wppBtnRefazerIA");
  const btnUsarIA = document.getElementById("wppBtnUsarIA");
  const iaLoading = document.getElementById("wppIaLoading");
  const iaLoadingMsg = document.getElementById("wppIaLoadingMsg");
  const iaResultado = document.getElementById("wppIaResultado");
  const iaCorpoGerado = document.getElementById("wppIaCorpoGerado");

  let clientes = [];
  let selecionados = new Set();
  let telefonesManuais = [];
  let imagensBase64 = [];
  let videosData = []; // { src: objectURL, thumbnail: base64, file: File, duracao: number }

  let produtosLoja = JSON.parse(localStorage.getItem("loja") || "[]");
  let iaProdutosSelecionados = new Set();
  let iaTomAtual = "urgente";
  let iaCampanhaAtual = "desconto";

  // Link padrão da loja
  const LINK_LOJA_PADRAO = window.location.origin + "/html/loja.html";
  linkLojaInput.value = LINK_LOJA_PADRAO;

  btnLinkPadrao.addEventListener("click", () => {
    linkLojaInput.value = LINK_LOJA_PADRAO;
  });

  // ===== Logo MIX-PROMOÇÃO via Canvas =====
  let logoBase64 = "";

  function gerarLogoCanvas() {
    const canvas = logoCanvas;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // Fundo gradiente escuro
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#00060c");
    grad.addColorStop(0.5, "#0a1628");
    grad.addColorStop(1, "#00060c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Brilhos decorativos
    ctx.save();
    ctx.globalAlpha = 0.07;
    const brilhoGrad = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, 160);
    brilhoGrad.addColorStop(0, "#00c6ff");
    brilhoGrad.addColorStop(1, "transparent");
    ctx.fillStyle = brilhoGrad;
    ctx.fillRect(0, 0, w, h);

    const brilhoGrad2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, 140);
    brilhoGrad2.addColorStop(0, "#ff00c8");
    brilhoGrad2.addColorStop(1, "transparent");
    ctx.fillStyle = brilhoGrad2;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Linha decorativa superior
    const lineGrad = ctx.createLinearGradient(40, 0, w - 40, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.2, "#00c6ff");
    lineGrad.addColorStop(0.5, "#00ff9d");
    lineGrad.addColorStop(0.8, "#ff00c8");
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(w - 40, 20);
    ctx.stroke();

    // Ícone carrinho 🛒
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.fillText("🛒", 70, 115);

    // Texto MIX
    ctx.save();
    const mixGrad = ctx.createLinearGradient(100, 70, 260, 130);
    mixGrad.addColorStop(0, "#00c6ff");
    mixGrad.addColorStop(0.5, "#0072ff");
    mixGrad.addColorStop(1, "#00ff9d");
    ctx.fillStyle = mixGrad;
    ctx.font = "bold 62px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("MIX", 100, 100);
    ctx.restore();

    // Texto PROMOÇÃO
    ctx.save();
    const promoGrad = ctx.createLinearGradient(245, 70, 530, 130);
    promoGrad.addColorStop(0, "#00ff9d");
    promoGrad.addColorStop(0.5, "#ff00c8");
    promoGrad.addColorStop(1, "#ff6b6b");
    ctx.fillStyle = promoGrad;
    ctx.font = "bold 62px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("PROMOÇÃO", 240, 100);
    ctx.restore();

    // Subtítulo
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "500 14px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("As melhores ofertas com os melhores preços!", w / 2, 150);

    // Linha decorativa inferior
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, h - 20);
    ctx.lineTo(w - 40, h - 20);
    ctx.stroke();

    // WhatsApp badge no canto
    ctx.save();
    ctx.fillStyle = "#25d366";
    ctx.beginPath();
    ctx.roundRect(w - 115, h - 42, 100, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📱 WhatsApp", w - 65, h - 24);
    ctx.restore();

    logoBase64 = canvas.toDataURL("image/png");
  }

  // Gerar logo ao carregar
  gerarLogoCanvas();

  // Toggle logo
  logoAtivo.addEventListener("change", () => {
    logoMiniPreview.style.display = logoAtivo.checked ? "flex" : "none";
  });

  function escaparHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== GERADOR IA =====
  function renderizarProdutosIA(filtro = "") {
    const filtroLower = filtro.toLowerCase();
    const filtrados = produtosLoja.filter(p =>
      p.nome.toLowerCase().includes(filtroLower)
    );

    if (filtrados.length === 0) {
      iaListaProdutos.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:20px;font-size:0.85rem;">Nenhum produto encontrado.</p>`;
      return;
    }

    iaListaProdutos.innerHTML = filtrados.map(p => {
      const sel = iaProdutosSelecionados.has(p.id);
      const temVideo = p.video && p.video.trim() !== "";
      return `
        <div class="ia-produto-item ${sel ? "selecionado" : ""}" data-id="${p.id}">
          <input type="checkbox" ${sel ? "checked" : ""} data-id="${p.id}">
          <img src="${escaparHtml(p.imagem)}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.style.display='none'">
          <div>
            <div style="font-weight:700;font-size:0.9rem">${escaparHtml(p.nome)} ${temVideo ? '<i class="fa-solid fa-video" style="color:#f59e0b;font-size:0.7rem" title="Tem vídeo"></i>' : ""}</div>
            <span style="font-size:0.8rem;color:#25d366;font-weight:700">${escaparHtml(p.precoAtual)}</span>
            ${p.desconto ? ` <span style="font-size:0.75rem;color:#ef4444;font-weight:700">${escaparHtml(p.desconto)}</span>` : ""}
          </div>
        </div>`;
    }).join("");

    iaListaProdutos.querySelectorAll(".ia-produto-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT") return;
        const id = Number(el.dataset.id);
        if (iaProdutosSelecionados.has(id)) {
          iaProdutosSelecionados.delete(id);
        } else {
          iaProdutosSelecionados.add(id);
        }
        renderizarProdutosIA(iaBuscaProduto.value);
        renderizarTagsIA();
      });

      el.querySelector("input").addEventListener("change", (e) => {
        const id = Number(e.target.dataset.id);
        if (e.target.checked) {
          iaProdutosSelecionados.add(id);
        } else {
          iaProdutosSelecionados.delete(id);
        }
        renderizarProdutosIA(iaBuscaProduto.value);
        renderizarTagsIA();
      });
    });
  }

  function renderizarTagsIA() {
    if (iaProdutosSelecionados.size === 0) {
      iaTagsEl.innerHTML = "";
      return;
    }
    const tags = [...iaProdutosSelecionados].map(id => {
      const p = produtosLoja.find(x => x.id === id);
      if (!p) return "";
      return `<span class="ia-tag">${escaparHtml(p.nome)} <button data-id="${id}">&times;</button></span>`;
    }).join("");
    iaTagsEl.innerHTML = tags;

    iaTagsEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        iaProdutosSelecionados.delete(Number(btn.dataset.id));
        renderizarProdutosIA(iaBuscaProduto.value);
        renderizarTagsIA();
      });
    });
  }

  iaBuscaProduto.addEventListener("input", () => {
    renderizarProdutosIA(iaBuscaProduto.value);
  });

  // Tom e campanha
  document.querySelectorAll(".wpp-ia-tom-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".wpp-ia-tom-btn.ativo").classList.remove("ativo");
      btn.classList.add("ativo");
      iaTomAtual = btn.dataset.tom;
    });
  });

  document.querySelectorAll(".wpp-ia-campanha-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".wpp-ia-campanha-btn.ativo").classList.remove("ativo");
      btn.classList.add("ativo");
      iaCampanhaAtual = btn.dataset.campanha;
    });
  });

  // Gerar promoção IA
  function gerarPromocaoIA() {
    const prods = [...iaProdutosSelecionados].map(id => produtosLoja.find(x => x.id === id)).filter(Boolean);

    if (prods.length === 0) {
      alert("Selecione pelo menos um produto para gerar a promoção!");
      return null;
    }

    const nomesstr = prods.map(p => p.nome).join(", ");
    const menorPreco = prods.reduce((min, p) => {
      const v = parseFloat(p.precoAtual.replace(/[^\d,]/g, "").replace(",", "."));
      return v < min ? v : min;
    }, Infinity);
    const maiorDesconto = prods.reduce((max, p) => {
      if (!p.desconto) return max;
      const d = parseInt(p.desconto.replace(/[^\d]/g, ""));
      return d > max ? d : max;
    }, 0);
    const qtd = prods.length;

    const intros = {
      urgente: [
        "🔥 *ÚLTIMA CHANCE!* Não perca nem mais um minuto! Essa promoção está com os minutos contados!",
        "🚨 *ALERTA!* Os preços despencaram e essa é a sua chance de economizar MUITO!",
        "⚡ *OFERTA RELÂMPAGO!* Quem chegar primeiro, leva!",
      ],
      elegante: [
        "✨ *Seleção Especial* — Preparamos ofertas cuidadosamente selecionadas para você.",
        "🌟 *Curadoria MIX-PROMOÇÃO* — Qualidade e bom preço caminham juntos.",
        "💎 *Elegância e Economia* — Descubra nossas ofertas diferenciadas.",
      ],
      divertido: [
        "😍 *PARA TUDO!* Sabe aquele produto que você tava de olho? Os preços estão absurdos!",
        "🎉 *Festa de Promoções!* Bora fazer umas comprinhas espetaculares?",
        "🤑 *Seu bolso vai agradecer!* Até a gente ficou surpreso com esses preços!",
      ],
      exclusivo: [
        "👑 *Oferta VIP!* Você tem acesso antecipado a ofertas exclusivas!",
        "🔐 *Só Para Clientes Especiais* — Essa promoção é reservada para você!",
        "⭐ *Convite Exclusivo* — Ofertas personalizadas chegaram!",
      ]
    };

    const campanhaTextos = {
      desconto: `${maiorDesconto > 0 ? `Descontos de até *${maiorDesconto}%*` : "Preços especiais"} em ${qtd > 1 ? "diversos produtos" : nomesstr}!`,
      lancamento: `${qtd > 1 ? "Novos produtos" : nomesstr} acabou de chegar com preço de lançamento!`,
      frete: `Aproveite *FRETE GRÁTIS* em ${qtd > 1 ? "todos estes produtos" : nomesstr}! 🚚`,
      flash: `⏰ *FLASH SALE* — Válido apenas nas próximas 24h! Preço de Black Friday!`,
    };

    const ctas = {
      urgente: "⏰ Corra porque o estoque é limitado! Responda esta mensagem para garantir o seu!",
      elegante: "Responda esta mensagem e aproveite essas condições especiais.",
      divertido: "Bora lá! Responde aqui que a gente te ajuda! 🛒✨",
      exclusivo: "Responda agora e aproveite as condições reservadas para você.",
    };

    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const intro = rand(intros[iaTomAtual]);
    const campanha = campanhaTextos[iaCampanhaAtual];
    const cta = ctas[iaTomAtual];

    let listaProdutos = "\n\n📦 *PRODUTOS EM DESTAQUE:*\n";
    prods.forEach(p => {
      listaProdutos += `\n• *${p.nome}*`;
      if (p.precoAntigo && p.precoAntigo.trim() !== "") listaProdutos += ` ~de ${p.precoAntigo}~`;
      if (p.precoAtual) listaProdutos += ` por *${p.precoAtual}*`;
      if (p.desconto && p.desconto.trim() !== "") listaProdutos += ` 🏷️ ${p.desconto}`;
    });

    const corpo = `${intro}\n\n🎯 ${campanha}${listaProdutos}\n\n${cta}\n\n🔗 *Acesse nossa loja:*\n${linkLojaInput.value.trim() || LINK_LOJA_PADRAO}\n\n———\n🛒 *MIX-PROMOÇÃO*\nAs melhores ofertas com os melhores preços!`;

    return corpo;
  }

  async function animarLoading() {
    const msgs = [
      "🔍 Analisando seus produtos...",
      "🧠 Criando texto para WhatsApp...",
      "✍️ Escolhendo as melhores palavras...",
      "📱 Formatando para WhatsApp...",
      "✅ Finalizando mensagem...",
    ];
    iaLoading.style.display = "flex";
    iaResultado.style.display = "none";

    for (const msg of msgs) {
      iaLoadingMsg.textContent = msg;
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    }

    iaLoading.style.display = "none";
  }

  async function executarGeracaoIA() {
    const resultado = gerarPromocaoIA();
    if (!resultado) return;

    await animarLoading();

    iaCorpoGerado.textContent = resultado;
    iaResultado.style.display = "block";
  }

  btnGerarIA.addEventListener("click", executarGeracaoIA);
  btnRefazerIA.addEventListener("click", executarGeracaoIA);

  btnUsarIA.addEventListener("click", async () => {
    mensagemInput.value = iaCorpoGerado.textContent;
    charCountEl.textContent = mensagemInput.value.length;

    // Adicionar imagens e vídeos dos produtos selecionados
    const prods = [...iaProdutosSelecionados].map(id => produtosLoja.find(x => x.id === id)).filter(Boolean);
    const videosParaProcessar = [];

    prods.forEach(p => {
      const totalMidias = imagensBase64.length + videosData.length + videosParaProcessar.length;
      if (p.imagem && totalMidias < 5 && !p.imagem.includes("placeholder")) {
        imagensBase64.push(p.imagem);
      }
      if (p.imagensExtras && p.imagensExtras.length > 0) {
        p.imagensExtras.forEach(img => {
          const total = imagensBase64.length + videosData.length + videosParaProcessar.length;
          if (img && total < 5 && !img.includes("placeholder")) {
            imagensBase64.push(img);
          }
        });
      }
      // Adicionar vídeo do produto se existir
      if (p.video && p.video.trim() !== "") {
        const total = imagensBase64.length + videosData.length + videosParaProcessar.length;
        if (total < 5) {
          videosParaProcessar.push(p.video);
        }
      }
    });

    renderizarImagensPreviews();
    atualizarBtnMidias();

    // Processar vídeos de produtos (async — gerar thumbnails)
    if (videosParaProcessar.length > 0) {
      mostrarStatus("sucesso", "🎬 Carregando vídeos dos produtos...");
      for (const videoUrl of videosParaProcessar) {
        if (imagensBase64.length + videosData.length >= 5) break;
        const vData = await gerarThumbnailVideoURL(videoUrl);
        videosData.push(vData);
      }
      renderizarImagensPreviews();
      atualizarBtnMidias();
    }

    document.querySelector(".wpp-composer").scrollIntoView({ behavior: "smooth", block: "start" });
    iaResultado.style.display = "none";
    const totalMidias = imagensBase64.length + videosData.length;
    const tiposMidia = [];
    if (imagensBase64.length > 0) tiposMidia.push(`${imagensBase64.length} imagem(ns)`);
    if (videosData.length > 0) tiposMidia.push(`${videosData.length} vídeo(s)`);
    mostrarStatus("sucesso", `✅ Mensagem da IA aplicada${totalMidias > 0 ? ` com ${tiposMidia.join(" e ")}` : ""}! Revise e envie.`);
  });

  // Init produtos IA
  renderizarProdutosIA();

  // ===== Upload de imagens =====
  uploadArea.addEventListener("click", () => inputImagens.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    processarArquivos(e.dataTransfer.files);
  });
  inputImagens.addEventListener("change", () => {
    processarArquivos(inputImagens.files);
    inputImagens.value = "";
  });

  function processarArquivos(files) {
    const totalMidias = imagensBase64.length + videosData.length;
    const restante = 5 - totalMidias;
    const arquivos = Array.from(files).slice(0, restante);
    for (const file of arquivos) {
      if (imagensBase64.length + videosData.length >= 5) break;

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagensBase64.push(e.target.result);
          renderizarImagensPreviews();
          atualizarBtnMidias();
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        gerarThumbnailVideo(file).then(data => {
          videosData.push(data);
          renderizarImagensPreviews();
          atualizarBtnMidias();
        });
      }
    }
  }

  function gerarThumbnailVideo(file) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const src = URL.createObjectURL(file);
      video.src = src;

      video.addEventListener("loadeddata", () => {
        video.currentTime = Math.min(1, video.duration / 2);
      });

      video.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth, 320);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
        resolve({ src, thumbnail, file, duracao: Math.round(video.duration) });
      });

      // Fallback se não conseguir seek
      video.addEventListener("error", () => {
        resolve({ src, thumbnail: "", file, duracao: 0 });
      });
    });
  }

  // Gerar thumbnail de vídeo a partir de URL (produtos da loja)
  function gerarThumbnailVideoURL(videoUrl) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.src = videoUrl;

      video.addEventListener("loadeddata", () => {
        video.currentTime = Math.min(1, video.duration / 2);
      });

      video.addEventListener("seeked", () => {
        let thumbnail = "";
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(video.videoWidth || 320, 320);
          canvas.height = Math.round(canvas.width * ((video.videoHeight || 180) / (video.videoWidth || 320)));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnail = canvas.toDataURL("image/jpeg", 0.7);
        } catch (e) {
          // CORS pode impedir canvas — usa thumbnail vazio
        }

        // Buscar o vídeo como blob para poder compartilhar
        fetch(videoUrl)
          .then(r => r.blob())
          .then(blob => {
            const file = new File([blob], "video-produto.mp4", { type: blob.type || "video/mp4" });
            resolve({ src: videoUrl, thumbnail, file, duracao: Math.round(video.duration) });
          })
          .catch(() => {
            resolve({ src: videoUrl, thumbnail, file: null, duracao: Math.round(video.duration) });
          });
      });

      video.addEventListener("error", () => {
        resolve({ src: videoUrl, thumbnail: "", file: null, duracao: 0 });
      });

      // Timeout para não travar
      setTimeout(() => {
        resolve({ src: videoUrl, thumbnail: "", file: null, duracao: 0 });
      }, 8000);
    });
  }

  function formatarDuracao(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function renderizarImagensPreviews() {
    let html = "";
    imagensBase64.forEach((src, i) => {
      html += `
        <div class="img-preview-item">
          <img src="${src}" alt="Imagem ${i + 1}">
          <button class="btn-remover-img" data-idx="${i}" data-tipo="img" title="Remover">&times;</button>
        </div>`;
    });
    videosData.forEach((v, i) => {
      const thumbSrc = v.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23334155' width='80' height='80'/%3E%3Ctext x='40' y='44' text-anchor='middle' fill='%23fff' font-size='12'%3EVideo%3C/text%3E%3C/svg%3E";
      html += `
        <div class="img-preview-item">
          <img src="${thumbSrc}" alt="Vídeo ${i + 1}">
          <span class="video-play-badge"><i class="fa-solid fa-play"></i></span>
          ${v.duracao ? `<span class="video-duration-badge">${formatarDuracao(v.duracao)}</span>` : ""}
          <button class="btn-remover-img" data-idx="${i}" data-tipo="vid" title="Remover">&times;</button>
        </div>`;
    });
    imagensPreviewEl.innerHTML = html;

    imagensPreviewEl.querySelectorAll(".btn-remover-img").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        if (btn.dataset.tipo === "vid") {
          URL.revokeObjectURL(videosData[idx].src);
          videosData.splice(idx, 1);
        } else {
          imagensBase64.splice(idx, 1);
        }
        renderizarImagensPreviews();
        atualizarBtnMidias();
      });
    });
  }

  function atualizarBtnMidias() {
    btnEnviarImagens.style.display = (imagensBase64.length + videosData.length) > 0 ? "flex" : "none";
  }

  // ===== Carregar clientes do banco =====
  async function carregarClientes() {
    try {
      const res = await fetch("http://localhost:3000/api/clientes");
      const data = await res.json();
      if (data.sucesso) {
        clientes = data.clientes;
      } else {
        clientes = [];
      }
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
      clientes = [];
    }
    renderizarClientes();
  }

  function renderizarClientes(filtro = "") {
    const filtroLower = filtro.toLowerCase();
    const filtrados = clientes.filter(c => {
      const texto = `${c.nome} ${c.sobrenome} ${c.telefone || ""}`.toLowerCase();
      return texto.includes(filtroLower);
    });

    if (filtrados.length === 0) {
      listaClientesEl.innerHTML = `<p class="wpp-dest-carregando" style="animation:none"><i class="fa-solid fa-user-slash"></i> Nenhum cliente encontrado.</p>`;
      return;
    }

    let html = "";
    for (const c of filtrados) {
      const temTel = c.telefone && c.telefone.trim() !== "";
      const selClass = selecionados.has(c.id) ? "selecionado" : "";
      const semTelClass = !temTel ? "wpp-dest-lista .cliente-sem-tel" : "";

      html += `
        <div class="cliente-item ${selClass} ${!temTel ? "cliente-sem-tel" : ""}" data-id="${c.id}" ${!temTel ? 'title="Cliente sem telefone cadastrado"' : ""}>
          <div class="cliente-check"><i class="fa-solid fa-check"></i></div>
          <div class="cliente-info">
            <span class="cliente-nome">${escaparHtml(c.nome)} ${escaparHtml(c.sobrenome || "")}</span>
            <span class="cliente-telefone">${temTel ? escaparHtml(c.telefone) : "Sem telefone"}</span>
          </div>
        </div>`;
    }

    listaClientesEl.innerHTML = html;

    listaClientesEl.querySelectorAll(".cliente-item:not(.cliente-sem-tel)").forEach(el => {
      el.addEventListener("click", () => {
        const id = Number(el.dataset.id);
        if (selecionados.has(id)) {
          selecionados.delete(id);
        } else {
          selecionados.add(id);
        }
        atualizarContagem();
        renderizarClientes(buscaInput.value);
      });
    });
  }

  function atualizarContagem() {
    contagemEl.textContent = `${selecionados.size} selecionado${selecionados.size !== 1 ? "s" : ""}`;
    atualizarComposerDest();
  }

  // ===== Telefone manual =====
  function formatarTelefone(tel) {
    return tel.replace(/\D/g, "");
  }

  function adicionarTelefoneManual() {
    const tel = formatarTelefone(inputAddTelefone.value);
    if (!tel || tel.length < 10) {
      inputAddTelefone.style.borderColor = "#ef4444";
      setTimeout(() => { inputAddTelefone.style.borderColor = ""; }, 1500);
      return;
    }

    if (telefonesManuais.includes(tel)) {
      inputAddTelefone.value = "";
      return;
    }

    // Verificar se já está nos clientes selecionados
    const jaEmCliente = [...selecionados].some(id => {
      const c = clientes.find(x => x.id === id);
      return c && formatarTelefone(c.telefone || "") === tel;
    });
    if (jaEmCliente) {
      inputAddTelefone.value = "";
      return;
    }

    telefonesManuais.push(tel);
    inputAddTelefone.value = "";
    atualizarComposerDest();
  }

  btnAddTelefone.addEventListener("click", adicionarTelefoneManual);
  inputAddTelefone.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarTelefoneManual();
    }
  });

  function atualizarComposerDest() {
    const totalDest = selecionados.size + telefonesManuais.length;
    composerDestCount.textContent = totalDest;

    if (totalDest === 0) {
      composerDestLista.innerHTML = `<span class="wpp-composer-dest-vazio">Adicione destinatários acima ou selecione na lista ao lado.</span>`;
      composerDestTags.innerHTML = "";
      return;
    }

    // Tags de clientes do banco
    let tags = [...selecionados].map(id => {
      const c = clientes.find(x => x.id === id);
      if (!c) return "";
      return `<span class="dest-tag">
        <i class="fa-solid fa-user"></i>
        ${escaparHtml(c.nome)} ${escaparHtml(c.sobrenome || "")}
        <span class="remover-tag" data-id="${id}">&times;</span>
      </span>`;
    }).join("");

    // Tags de telefones manuais
    tags += telefonesManuais.map(tel => {
      return `<span class="dest-tag">
        <i class="fa-solid fa-phone"></i>
        ${escaparHtml(tel)}
        <span class="remover-tag-manual" data-tel="${escaparHtml(tel)}">&times;</span>
      </span>`;
    }).join("");

    composerDestTags.innerHTML = tags;
    composerDestLista.innerHTML = "";

    composerDestTags.querySelectorAll(".remover-tag").forEach(btn => {
      btn.addEventListener("click", () => {
        selecionados.delete(Number(btn.dataset.id));
        atualizarContagem();
        renderizarClientes(buscaInput.value);
      });
    });

    composerDestTags.querySelectorAll(".remover-tag-manual").forEach(btn => {
      btn.addEventListener("click", () => {
        telefonesManuais = telefonesManuais.filter(t => t !== btn.dataset.tel);
        atualizarComposerDest();
      });
    });
  }

  buscaInput.addEventListener("input", () => {
    renderizarClientes(buscaInput.value);
  });

  btnSelecionarTodos.addEventListener("click", () => {
    const comTelefone = clientes.filter(c => c.telefone && c.telefone.trim() !== "");
    if (selecionados.size === comTelefone.length) {
      selecionados.clear();
    } else {
      comTelefone.forEach(c => selecionados.add(c.id));
    }
    atualizarContagem();
    renderizarClientes(buscaInput.value);
  });

  // ===== Contador de caracteres =====
  mensagemInput.addEventListener("input", () => {
    charCountEl.textContent = mensagemInput.value.length;
  });

  // ===== Preview WhatsApp =====
  btnPreview.addEventListener("click", () => {
    const msg = mensagemInput.value.trim();
    if (!msg) {
      mostrarStatus("erro", "❌ Escreva uma mensagem para pré-visualizar!");
      return;
    }

    // Mostrar logo no preview
    if (logoAtivo.checked && logoBase64) {
      previewLogo.innerHTML = `<img src="${logoBase64}" alt="Logo MIX-PROMOÇÃO">`;
      previewLogo.style.display = "block";
    } else {
      previewLogo.innerHTML = "";
      previewLogo.style.display = "none";
    }

    // Mostrar imagens e vídeos no preview
    const temMidias = imagensBase64.length > 0 || videosData.length > 0;
    if (temMidias) {
      let midiasHtml = "";
      imagensBase64.forEach(src => {
        midiasHtml += `<img src="${src}" alt="Produto">`;
      });
      videosData.forEach(v => {
        const thumbSrc = v.thumbnail || "";
        midiasHtml += `
          <div class="preview-video-thumb">
            <img src="${thumbSrc}" alt="Vídeo">
            <div class="preview-play-overlay"><i class="fa-solid fa-play"></i></div>
          </div>`;
      });
      previewImagens.innerHTML = midiasHtml;
      previewImagens.style.display = "flex";
    } else {
      previewImagens.innerHTML = "";
      previewImagens.style.display = "none";
    }

    // Formatar texto WhatsApp: *bold*, _italic_, ~strike~
    let formatted = escaparHtml(msg);
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>");

    // Converter URLs em links clicáveis
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');

    previewTexto.innerHTML = formatted.replace(/\n/g, "<br>");

    // Atualizar hora
    const agora = new Date();
    const hora = agora.getHours().toString().padStart(2, "0") + ":" + agora.getMinutes().toString().padStart(2, "0");
    previewEl.querySelector(".wpp-preview-hora").textContent = hora;

    previewEl.style.display = "block";
  });

  fecharPreview.addEventListener("click", () => {
    previewEl.style.display = "none";
  });

  // ===== Enviar via WhatsApp =====

  // Converter base64 em File para compartilhamento
  async function base64ToFile(base64, filename) {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  }

  // Enviar mídias via Web Share API (celular)
  btnEnviarImagens.addEventListener("click", async () => {
    const totalMidias = imagensBase64.length + videosData.length;
    if (totalMidias === 0) {
      mostrarStatus("erro", "❌ Nenhuma mídia para enviar!");
      return;
    }

    if (navigator.canShare) {
      try {
        const files = [];

        // Logo como primeira mídia
        if (logoAtivo.checked && logoBase64) {
          const logoFile = await base64ToFile(logoBase64, "mix-promocao-logo.png");
          files.push(logoFile);
        }

        for (let i = 0; i < imagensBase64.length; i++) {
          const file = await base64ToFile(imagensBase64[i], `promo-${i + 1}.jpg`);
          files.push(file);
        }
        for (let i = 0; i < videosData.length; i++) {
          if (videosData[i].file) {
            files.push(videosData[i].file);
          }
        }

        const shareData = { files };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          mostrarStatus("sucesso", "✅ Mídias compartilhadas! Agora envie a mensagem de texto.");
          return;
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Erro ao compartilhar:", e);
        }
      }
    }

    // Fallback: abrir mídias em nova aba para salvar
    mostrarStatus("erro", "📱 O compartilhamento de mídias funciona melhor no celular. Salve manualmente e envie pelo WhatsApp.");
  });

  btnEnviar.addEventListener("click", () => {
    let msg = mensagemInput.value.trim();

    if (selecionados.size === 0 && telefonesManuais.length === 0) {
      mostrarStatus("erro", "❌ Adicione pelo menos um destinatário!");
      return;
    }

    if (!msg) {
      mostrarStatus("erro", "❌ Escreva a mensagem antes de enviar!");
      return;
    }

    // Adicionar link da loja no final se tiver e não estiver já na mensagem
    const linkLoja = linkLojaInput.value.trim();
    if (linkLoja && !msg.includes(linkLoja)) {
      msg += `\n\n🔗 *Acesse nossa loja:*\n${linkLoja}`;
    }

    // Montar lista de telefones
    const telefones = [];

    [...selecionados].forEach(id => {
      const c = clientes.find(x => x.id === id);
      if (c && c.telefone) {
        const tel = formatarTelefone(c.telefone);
        telefones.push({ nome: `${c.nome} ${c.sobrenome || ""}`.trim(), telefone: tel });
      }
    });

    telefonesManuais.forEach(tel => {
      telefones.push({ nome: tel, telefone: tel });
    });

    if (telefones.length === 0) {
      mostrarStatus("erro", "❌ Nenhum destinatário com telefone válido!");
      return;
    }

    // Aviso sobre mídias
    if (imagensBase64.length > 0 || videosData.length > 0) {
      mostrarStatus("sucesso", `📸 Dica: Clique em "Enviar Mídias Primeiro" para compartilhar fotos e vídeos pelo WhatsApp antes da mensagem!`);
    }

    // Abrir WhatsApp para cada destinatário
    const msgEncoded = encodeURIComponent(msg);
    let abertos = 0;

    telefones.forEach((dest, i) => {
      const tel = dest.telefone.startsWith("55") ? dest.telefone : "55" + dest.telefone;
      const url = `https://wa.me/${tel}?text=${msgEncoded}`;

      setTimeout(() => {
        window.open(url, "_blank");
        abertos++;

        if (abertos === telefones.length) {
          mostrarStatus("sucesso", `✅ WhatsApp aberto para ${telefones.length} destinatário(s)!`);
        }
      }, i * 800);
    });

    // Salvar no histórico
    const historicoItem = {
      id: Date.now(),
      mensagem: msg,
      temImagens: imagensBase64.length,
      temVideos: videosData.length,
      temLogo: logoAtivo.checked,
      linkLoja: linkLoja || null,
      destinatarios: telefones,
      data: new Date().toLocaleString("pt-BR")
    };

    const historico = JSON.parse(localStorage.getItem("mixWhatsappPromo") || "[]");
    historico.unshift(historicoItem);
    localStorage.setItem("mixWhatsappPromo", JSON.stringify(historico));

    // Limpar formulário
    mensagemInput.value = "";
    charCountEl.textContent = "0";
    imagensBase64 = [];
    videosData.forEach(v => URL.revokeObjectURL(v.src));
    videosData = [];
    renderizarImagensPreviews();
    atualizarBtnMidias();
    selecionados.clear();
    telefonesManuais = [];
    atualizarContagem();
    atualizarComposerDest();
    renderizarClientes(buscaInput.value);
    previewEl.style.display = "none";

    renderizarHistorico();
  });

  function mostrarStatus(tipo, msg) {
    statusEl.className = `wpp-status ${tipo}`;
    statusEl.textContent = msg;
    statusEl.style.display = "block";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 5000);
  }

  // ===== Histórico =====
  function renderizarHistorico() {
    const historico = JSON.parse(localStorage.getItem("mixWhatsappPromo") || "[]");

    if (historico.length === 0) {
      listaHistoricoEl.innerHTML = `<p class="wpp-historico-vazio"><i class="fab fa-whatsapp"></i> Nenhuma mensagem enviada ainda.</p>`;
      return;
    }

    let html = "";
    for (const item of historico) {
      const nomes = item.destinatarios.map(d => d.nome).join(", ");
      const msgResumo = item.mensagem.length > 120 ? item.mensagem.substring(0, 120) + "..." : item.mensagem;
      const imgBadge = item.temImagens ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ecfdf5;color:#064e36;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;margin-left:6px"><i class="fa-solid fa-images"></i> ${item.temImagens}</span>` : "";
      const vidBadge = item.temVideos ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;margin-left:4px"><i class="fa-solid fa-video"></i> ${item.temVideos}</span>` : "";
      const logoBadge = item.temLogo ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ede9fe;color:#6d28d9;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;margin-left:4px"><i class="fa-solid fa-image"></i> Logo</span>` : "";
      const linkBadge = item.linkLoja ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;margin-left:4px"><i class="fa-solid fa-link"></i> Link</span>` : "";

      html += `
        <div class="historico-item">
          <div class="historico-icone"><i class="fab fa-whatsapp"></i></div>
          <div class="historico-info">
            <div class="historico-data"><i class="fa-regular fa-calendar"></i> ${escaparHtml(item.data)} ${logoBadge} ${imgBadge} ${vidBadge} ${linkBadge}</div>
            <div class="historico-msg">${escaparHtml(msgResumo)}</div>
            <div class="historico-dest"><i class="fa-solid fa-users"></i> ${escaparHtml(nomes)} (${item.destinatarios.length} destinatário${item.destinatarios.length > 1 ? "s" : ""})</div>
          </div>
        </div>`;
    }

    listaHistoricoEl.innerHTML = html;
  }

  // ===== Init =====
  carregarClientes();
  renderizarHistorico();
});
