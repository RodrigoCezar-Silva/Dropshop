document.addEventListener("DOMContentLoaded", () => {
  // Verificar se é admin
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  if (tipoUsuario !== "Administrador") {
    alert("Acesso restrito a administradores.");
    window.location.href = "admin-login.html";
    return;
  }

  const listaClientesEl = document.getElementById("listaClientes");
  const buscaInput = document.getElementById("buscaCliente");
  const btnSelecionarTodos = document.getElementById("btnSelecionarTodos");
  const contagemEl = document.getElementById("contagemSelecionados");
  const inputImagens = document.getElementById("inputImagens");
  const uploadArea = document.getElementById("uploadArea");
  const imagensPreviewEl = document.getElementById("imagensPreview");
  const assuntoInput = document.getElementById("emailAssunto");
  const corpoInput = document.getElementById("emailCorpo");
  const btnPreview = document.getElementById("btnPreview");
  const emailPreview = document.getElementById("emailPreview");
  const previewBody = document.getElementById("previewBody");
  const fecharPreview = document.getElementById("fecharPreview");
  const btnEnviar = document.getElementById("btnEnviarEmail");
  const statusEl = document.getElementById("emailStatus");
  const listaHistoricoEl = document.getElementById("listaHistorico");
  const inputVideo = document.getElementById("inputVideo");

  let clientes = [];
  let selecionados = new Set();
  let imagensBase64 = [];

  // ===== GERADOR IA =====
  const iaListaProdutos = document.getElementById("iaListaProdutos");
  const iaBuscaProduto = document.getElementById("iaBuscaProduto");
  const iaTagsEl = document.getElementById("iaTagsSelecionados");
  const btnGerarIA = document.getElementById("btnGerarIA");
  const btnRefazerIA = document.getElementById("btnRefazerIA");
  const btnUsarIA = document.getElementById("btnUsarIA");
  const iaLoading = document.getElementById("iaLoading");
  const iaLoadingMsg = document.getElementById("iaLoadingMsg");
  const iaResultado = document.getElementById("iaResultado");
  const iaAssuntoGerado = document.getElementById("iaAssuntoGerado");
  const iaCorpoGerado = document.getElementById("iaCorpoGerado");

  let produtosLoja = JSON.parse(localStorage.getItem("loja") || "[]");
  let iaProdutosSelecionados = new Set();
  let iaTomAtual = "urgente";
  let iaCampanhaAtual = "desconto";

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
      return `
        <div class="ia-produto-item ${sel ? "selecionado" : ""}" data-id="${p.id}">
          <input type="checkbox" ${sel ? "checked" : ""} data-id="${p.id}">
          <img class="ia-produto-img" src="${escaparHtml(p.imagem)}" alt="" onerror="this.style.display='none'">
          <div class="ia-produto-info">
            <div class="ia-produto-nome">${escaparHtml(p.nome)}</div>
            <span class="ia-produto-preco">${escaparHtml(p.precoAtual)}</span>
            ${p.desconto ? `<span class="ia-produto-desconto">${escaparHtml(p.desconto)}</span>` : ""}
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
  document.querySelectorAll(".ia-tom-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".ia-tom-btn.ativo").classList.remove("ativo");
      btn.classList.add("ativo");
      iaTomAtual = btn.dataset.tom;
    });
  });

  document.querySelectorAll(".ia-campanha-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".ia-campanha-btn.ativo").classList.remove("ativo");
      btn.classList.add("ativo");
      iaCampanhaAtual = btn.dataset.campanha;
    });
  });

  // Gerador IA (templates inteligentes)
  function gerarPromocaoIA() {
    const prods = [...iaProdutosSelecionados].map(id => produtosLoja.find(x => x.id === id)).filter(Boolean);

    if (prods.length === 0) {
      alert("Selecione pelo menos um produto para gerar a promoção!");
      return null;
    }

    const nomesstr = prods.map(p => p.nome).join(", ");
    const temDesconto = prods.some(p => p.desconto && p.desconto.trim() !== "");
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

    // Templates por tom
    const assuntos = {
      urgente: [
        `🔥 ÚLTIMA CHANCE! ${maiorDesconto > 0 ? `Até ${maiorDesconto}% OFF` : "Preços Imperdíveis"} - Corra!`,
        `⚡ OFERTA RELÂMPAGO! ${qtd > 1 ? qtd + " produtos" : nomesstr} com desconto ABSURDO!`,
        `🚨 ATENÇÃO! Promoção que ACABA HOJE - Não perca!`,
        `💥 EXPLOSÃO DE OFERTAS! A partir de R$ ${menorPreco.toFixed(2).replace(".", ",")}`,
      ],
      elegante: [
        `✨ Seleção Especial: ${qtd > 1 ? "Produtos Premium" : nomesstr} com Condições Exclusivas`,
        `🌟 Curadoria MIX-PROMOÇÃO: O Melhor em Ofertas Para Você`,
        `💎 Elegância e Economia: Descubra Nossas Ofertas Selecionadas`,
        `🎁 Uma Oportunidade Refinada Espera Por Você`,
      ],
      divertido: [
        `😍 PARA TUDO! ${maiorDesconto > 0 ? `${maiorDesconto}% OFF` : "Precinhos maravilhosos"} que vão te fazer sorrir!`,
        `🎉 Festa de Promoções! ${qtd > 1 ? qtd + " produtos" : nomesstr} esperando por você!`,
        `🤑 Seu bolso vai agradecer! Olha só essas ofertas!`,
        `🎊 É promoção que não acaba mais! Vem conferir!`,
      ],
      exclusivo: [
        `👑 Oferta VIP: Acesso Antecipado a ${qtd > 1 ? "Produtos Exclusivos" : nomesstr}`,
        `🔐 Só Para Clientes Especiais: ${maiorDesconto > 0 ? `${maiorDesconto}% de Desconto` : "Preços Diferenciados"}`,
        `⭐ Convite Exclusivo: Promoção Reservada Para Você`,
        `💫 Membro Especial: Suas Ofertas Personalizadas Chegaram`,
      ]
    };

    const intros = {
      urgente: [
        "Não perca nem mais um minuto! Essa promoção está com os minutos contados e os produtos estão voando do estoque!",
        "ALERTA VERMELHO: Os preços despencaram e essa é a sua chance de economizar MUITO!",
        "Essa é daquelas promoções que só acontecem uma vez. Quem chegar primeiro, leva!",
      ],
      elegante: [
        "Preparamos uma seleção cuidadosa dos melhores produtos com condições especiais pensadas exclusivamente para você.",
        "Na MIX-PROMOÇÃO, acreditamos que qualidade e bom preço caminham juntos. Confira nossas ofertas selecionadas.",
        "É com grande satisfação que apresentamos ofertas diferenciadas em produtos de destaque da nossa loja.",
      ],
      divertido: [
        "E aí, preparado(a) pra surtar com esses preços?! 😱 Porque a gente caprichou nas ofertas!",
        "Sabe aquele produto que você tava de olho? Pois é, ele tá com um precinho que é um presente! 🎁",
        "Bora fazer umas comprinhas espetaculares? Os preços estão tão bons que até a gente ficou surpreso! 😄",
      ],
      exclusivo: [
        "Como cliente especial da MIX-PROMOÇÃO, você tem acesso antecipado a ofertas que ainda não estão disponíveis para o público geral.",
        "Você faz parte de um seleto grupo de clientes que recebe nossas melhores ofertas em primeira mão.",
        "Esta é uma oportunidade exclusiva preparada especialmente para nossos clientes mais fiéis como você.",
      ]
    };

    const campanhaTextos = {
      desconto: `${maiorDesconto > 0 ? `Descontos de até ${maiorDesconto}%` : "Preços especiais"} em ${qtd > 1 ? "diversos produtos" : nomesstr}!`,
      lancamento: `${qtd > 1 ? "Novos produtos" : nomesstr} acabou de chegar na nossa loja com preço de lançamento!`,
      frete: `Aproveite FRETE GRÁTIS em ${qtd > 1 ? "todos estes produtos" : nomesstr}! Entrega rápida direto na sua casa.`,
      flash: `⏰ FLASH SALE - Válido apenas nas próximas 24h! ${qtd > 1 ? "Vários produtos" : nomesstr} com preço de Black Friday!`,
    };

    const ctas = {
      urgente: "⏰ Corra porque o estoque é limitado! Acesse agora mesmo a nossa loja e garanta o seu!",
      elegante: "Visite nossa loja virtual e aproveite essas condições especiais enquanto estão disponíveis.",
      divertido: "Bora lá! É só clicar e garantir o seu antes que acabe! 🛒✨",
      exclusivo: "Acesse agora com sua conta e aproveite as condições reservadas exclusivamente para você.",
    };

    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const assunto = rand(assuntos[iaTomAtual]);
    const intro = rand(intros[iaTomAtual]);
    const campanha = campanhaTextos[iaCampanhaAtual];
    const cta = ctas[iaTomAtual];

    let listaProdutos = "\n\n📦 PRODUTOS EM DESTAQUE:\n";
    prods.forEach(p => {
      listaProdutos += `\n• ${p.nome}`;
      if (p.precoAntigo && p.precoAntigo.trim() !== "") listaProdutos += `  (de ${p.precoAntigo}`;
      if (p.precoAtual) listaProdutos += ` por ${p.precoAtual})`;
      else if (p.precoAntigo) listaProdutos += `)`;
      if (p.desconto && p.desconto.trim() !== "") listaProdutos += ` 🏷️ ${p.desconto}`;
    });

    const corpo = `${intro}\n\n🎯 ${campanha}${listaProdutos}\n\n${cta}\n\n---\nMIX-PROMOÇÃO 🛒\nAs melhores ofertas com os melhores preços!`;

    return { assunto, corpo };
  }

  async function animarLoading() {
    const msgs = [
      "🔍 Analisando seus produtos...",
      "🧠 Gerando texto promocional...",
      "✍️ Escolhendo as melhores palavras...",
      "🎨 Aplicando estilo de comunicação...",
      "✅ Finalizando promoção...",
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

    iaAssuntoGerado.textContent = resultado.assunto;
    iaCorpoGerado.textContent = resultado.corpo;
    iaResultado.style.display = "block";
  }

  btnGerarIA.addEventListener("click", executarGeracaoIA);
  btnRefazerIA.addEventListener("click", executarGeracaoIA);

  btnUsarIA.addEventListener("click", () => {
    assuntoInput.value = iaAssuntoGerado.textContent;
    corpoInput.value = iaCorpoGerado.textContent;

    // Adicionar imagens dos produtos selecionados (principal + extras)
    const prods = [...iaProdutosSelecionados].map(id => produtosLoja.find(x => x.id === id)).filter(Boolean);
    prods.forEach(p => {
      // Imagem principal
      if (p.imagem && imagensBase64.length < 5 && !p.imagem.includes("placeholder")) {
        imagensBase64.push(p.imagem);
      }
      // Imagens extras (carrossel)
      if (p.imagensExtras && p.imagensExtras.length > 0) {
        p.imagensExtras.forEach(img => {
          if (img && imagensBase64.length < 5 && !img.includes("placeholder")) {
            imagensBase64.push(img);
          }
        });
      }
    });
    renderizarPreviews();

    // Adicionar vídeo do primeiro produto que tiver
    const prodComVideo = prods.find(p => p.video && p.video.trim() !== "");
    if (prodComVideo && !inputVideo.value.trim()) {
      inputVideo.value = prodComVideo.video;
    }

    // Scroll até o compositor
    document.querySelector(".emails-composer").scrollIntoView({ behavior: "smooth", block: "start" });

    iaResultado.style.display = "none";
    mostrarStatus("sucesso", "✅ Promoção da IA aplicada ao email! Revise e envie.");
  });

  // Init produtos IA
  renderizarProdutosIA();

  // Limpar campos ao carregar (evitar autofill do navegador)
  setTimeout(() => {
    assuntoInput.value = "";
    corpoInput.value = "";
  }, 50);

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

  function obterIniciais(nome, sobrenome) {
    const n = nome ? nome[0] : "";
    const s = sobrenome ? sobrenome[0] : "";
    return (n + s).toUpperCase() || "??";
  }

  function escaparHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderizarClientes(filtro = "") {
    const filtroLower = filtro.toLowerCase();
    const filtrados = clientes.filter(c => {
      const texto = `${c.nome} ${c.sobrenome} ${c.email}`.toLowerCase();
      return texto.includes(filtroLower);
    });

    if (filtrados.length === 0) {
      listaClientesEl.innerHTML = `<p class="dest-vazio"><i class="fa-solid fa-user-slash"></i> Nenhum cliente encontrado.</p>`;
      return;
    }

    let html = "";
    for (const c of filtrados) {
      const iniciais = obterIniciais(c.nome, c.sobrenome);
      const checked = selecionados.has(c.id) ? "checked" : "";
      const selClass = selecionados.has(c.id) ? "selecionado" : "";

      html += `
        <label class="dest-item ${selClass}" data-id="${c.id}">
          <input type="checkbox" ${checked} data-id="${c.id}">
          <div class="dest-item-avatar">${escaparHtml(iniciais)}</div>
          <div class="dest-item-info">
            <div class="dest-item-nome">${escaparHtml(c.nome)} ${escaparHtml(c.sobrenome || "")}</div>
            <div class="dest-item-email">${escaparHtml(c.email)}</div>
          </div>
        </label>`;
    }

    listaClientesEl.innerHTML = html;

    // Eventos de checkbox
    listaClientesEl.querySelectorAll("input[type='checkbox']").forEach(cb => {
      cb.addEventListener("change", () => {
        const id = Number(cb.dataset.id);
        if (cb.checked) {
          selecionados.add(id);
        } else {
          selecionados.delete(id);
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

  // Destinatários no compositor
  const composerDestLista = document.getElementById("composerDestLista");
  const composerDestCount = document.getElementById("composerDestCount");
  const composerDestEmails = document.getElementById("composerDestEmails");
  const inputAddEmail = document.getElementById("inputAddEmail");
  const btnAddEmail = document.getElementById("btnAddEmail");

  let emailsManuais = []; // emails adicionados manualmente

  function adicionarEmailManual() {
    const email = inputAddEmail.value.trim().toLowerCase();
    if (!email) return;

    // Validar formato de email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      inputAddEmail.style.borderColor = "#ef4444";
      setTimeout(() => { inputAddEmail.style.borderColor = "#a5f3fc"; }, 1500);
      return;
    }

    // Verificar se já existe nos manuais
    if (emailsManuais.includes(email)) {
      inputAddEmail.value = "";
      return;
    }

    // Verificar se já está nos clientes selecionados
    const jaEmCliente = [...selecionados].some(id => {
      const c = clientes.find(x => x.id === id);
      return c && c.email.toLowerCase() === email;
    });
    if (jaEmCliente) {
      inputAddEmail.value = "";
      return;
    }

    emailsManuais.push(email);
    inputAddEmail.value = "";
    atualizarComposerDest();
  }

  btnAddEmail.addEventListener("click", adicionarEmailManual);
  inputAddEmail.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarEmailManual();
    }
  });

  function atualizarComposerDest() {
    const totalDest = selecionados.size + emailsManuais.length;
    composerDestCount.textContent = totalDest;

    if (totalDest === 0) {
      composerDestLista.innerHTML = `<span class="composer-dest-vazio">Adicione destinatários acima ou selecione na lista ao lado.</span>`;
      composerDestEmails.innerHTML = "";
      return;
    }

    // Tags de clientes do banco
    let tags = [...selecionados].map(id => {
      const c = clientes.find(x => x.id === id);
      if (!c) return "";
      return `<span class="composer-dest-tag">
        <i class="fa-solid fa-user"></i>
        ${escaparHtml(c.nome)} ${escaparHtml(c.sobrenome || "")}
        <button class="dest-tag-remove" data-id="${id}">&times;</button>
      </span>`;
    }).join("");

    // Tags de emails manuais
    tags += emailsManuais.map(email => {
      return `<span class="composer-dest-tag composer-dest-tag-manual">
        <i class="fa-solid fa-at"></i>
        ${escaparHtml(email)}
        <button class="dest-tag-remove-manual" data-email="${escaparHtml(email)}">&times;</button>
      </span>`;
    }).join("");

    composerDestLista.innerHTML = tags;

    composerDestLista.querySelectorAll(".dest-tag-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        selecionados.delete(Number(btn.dataset.id));
        atualizarContagem();
        renderizarClientes(buscaInput.value);
      });
    });

    composerDestLista.querySelectorAll(".dest-tag-remove-manual").forEach(btn => {
      btn.addEventListener("click", () => {
        emailsManuais = emailsManuais.filter(e => e !== btn.dataset.email);
        atualizarComposerDest();
      });
    });

    // Mostrar todos os emails
    let allEmails = [...selecionados].map(id => {
      const c = clientes.find(x => x.id === id);
      if (!c) return "";
      return `<span class="composer-dest-email-item">${escaparHtml(c.email)}</span>`;
    }).join("");

    allEmails += emailsManuais.map(email => {
      return `<span class="composer-dest-email-item">${escaparHtml(email)}</span>`;
    }).join("");

    composerDestEmails.innerHTML = allEmails ? `<i class="fa-solid fa-at"></i> ${allEmails}` : "";
  }

  buscaInput.addEventListener("input", () => {
    renderizarClientes(buscaInput.value);
  });

  btnSelecionarTodos.addEventListener("click", () => {
    if (selecionados.size === clientes.length) {
      selecionados.clear();
    } else {
      clientes.forEach(c => selecionados.add(c.id));
    }
    atualizarContagem();
    renderizarClientes(buscaInput.value);
  });

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
    const restante = 5 - imagensBase64.length;
    const arquivos = Array.from(files).slice(0, restante);

    for (const file of arquivos) {
      if (!file.type.startsWith("image/")) continue;
      if (imagensBase64.length >= 5) break;

      const reader = new FileReader();
      reader.onload = (e) => {
        imagensBase64.push(e.target.result);
        renderizarPreviews();
      };
      reader.readAsDataURL(file);
    }
  }

  function renderizarPreviews() {
    let html = "";
    imagensBase64.forEach((src, i) => {
      html += `
        <div class="img-preview-item">
          <img src="${src}" alt="Imagem ${i + 1}">
          <button class="btn-remover-img" data-idx="${i}" title="Remover">&times;</button>
        </div>`;
    });
    imagensPreviewEl.innerHTML = html;

    imagensPreviewEl.querySelectorAll(".btn-remover-img").forEach(btn => {
      btn.addEventListener("click", () => {
        imagensBase64.splice(Number(btn.dataset.idx), 1);
        renderizarPreviews();
      });
    });
  }

  // ===== YouTube embed helper =====
  function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    let videoId = null;
    const regexLong = /[?&]v=([a-zA-Z0-9_-]{11})/;
    const regexShort = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
    const matchLong = url.match(regexLong);
    const matchShort = url.match(regexShort);
    if (matchLong) videoId = matchLong[1];
    else if (matchShort) videoId = matchShort[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  // ===== Preview do email =====
  btnPreview.addEventListener("click", () => {
    const assunto = assuntoInput.value.trim() || "(Sem assunto)";
    const corpo = corpoInput.value.trim() || "(Sem mensagem)";
    const videoUrl = inputVideo.value.trim();

    let imgHtml = "";
    if (imagensBase64.length > 0) {
      imgHtml = `<div class="preview-imagens">`;
      imagensBase64.forEach(src => {
        imgHtml += `<img src="${src}" alt="Promoção" class="preview-img-zoom">`;
      });
      imgHtml += `</div>`;
    }

    let videoHtml = "";
    const embedUrl = getYoutubeEmbedUrl(videoUrl);
    if (embedUrl) {
      videoHtml = `<div class="preview-video">
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
      </div>`;
    } else if (videoUrl) {
      videoHtml = `<div class="preview-video-direto">
        <video src="${escaparHtml(videoUrl)}" controls></video>
      </div>`;
    }

    previewBody.innerHTML = `
      <h3>${escaparHtml(assunto)}</h3>
      ${imgHtml}
      ${videoHtml}
      <div class="preview-texto">${escaparHtml(corpo).replace(/\n/g, "<br>")}</div>
      <div style="text-align:center;margin-top:20px;">
        <a href="index.html" target="_blank" class="preview-btn-loja">
          <i class="fa-solid fa-store"></i> Ir para a Loja
        </a>
      </div>
    `;

    // Lightbox zoom nas imagens
    previewBody.querySelectorAll(".preview-img-zoom").forEach(img => {
      img.addEventListener("click", () => abrirLightbox(img.src));
    });

    emailPreview.style.display = "block";
  });

  // ===== Lightbox para zoom de imagem =====
  let lightboxEl = null;

  function criarLightbox() {
    if (lightboxEl) return;
    lightboxEl = document.createElement("div");
    lightboxEl.className = "email-lightbox";
    lightboxEl.innerHTML = `
      <div class="email-lightbox-overlay"></div>
      <div class="email-lightbox-content">
        <button class="email-lightbox-fechar">&times;</button>
        <img class="email-lightbox-img" src="" alt="Zoom">
      </div>
    `;
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector(".email-lightbox-overlay").addEventListener("click", fecharLightbox);
    lightboxEl.querySelector(".email-lightbox-fechar").addEventListener("click", fecharLightbox);
  }

  function abrirLightbox(src) {
    criarLightbox();
    lightboxEl.querySelector(".email-lightbox-img").src = src;
    lightboxEl.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function fecharLightbox() {
    if (lightboxEl) {
      lightboxEl.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  fecharPreview.addEventListener("click", () => {
    emailPreview.style.display = "none";
  });

  // ===== Enviar email =====
  btnEnviar.addEventListener("click", () => {
    const assunto = assuntoInput.value.trim();
    const corpo = corpoInput.value.trim();

    if (selecionados.size === 0 && emailsManuais.length === 0) {
      mostrarStatus("erro", "❌ Adicione pelo menos um destinatário!");
      return;
    }

    if (!assunto) {
      mostrarStatus("erro", "❌ Preencha o assunto do email!");
      return;
    }

    if (!corpo) {
      mostrarStatus("erro", "❌ Escreva a mensagem do email!");
      return;
    }

    // Salvar no histórico
    const destinatarios = clientes.filter(c => selecionados.has(c.id));
    const destManuais = emailsManuais.map(e => ({ nome: e, email: e }));
    const todosDestinatarios = [
      ...destinatarios.map(d => ({ nome: d.nome + " " + (d.sobrenome || ""), email: d.email })),
      ...destManuais
    ];

    const videoUrl = inputVideo.value.trim();
    const videoEmbed = getYoutubeEmbedUrl(videoUrl);

    const emailData = {
      id: Date.now(),
      assunto,
      corpo,
      imagens: imagensBase64.slice(),
      video: videoUrl || null,
      videoEmbed: videoEmbed || null,
      linkLoja: "index.html",
      destinatarios: todosDestinatarios,
      data: new Date().toLocaleString("pt-BR")
    };

    const historico = JSON.parse(localStorage.getItem("mixEmailsPromo") || "[]");
    historico.unshift(emailData);
    localStorage.setItem("mixEmailsPromo", JSON.stringify(historico));

    // Salvar na caixa de entrada (localStorage)
    todosDestinatarios.forEach(d => {
      const chave = `mixInbox_${d.email}`;
      const inbox = JSON.parse(localStorage.getItem(chave) || "[]");
      inbox.unshift({
        id: emailData.id,
        assunto,
        corpo,
        imagens: imagensBase64.slice(),
        video: videoUrl || null,
        videoEmbed: videoEmbed || null,
        linkLoja: "index.html",
        data: emailData.data,
        lido: false
      });
      localStorage.setItem(chave, JSON.stringify(inbox));
    });

    const totalEnviados = todosDestinatarios.length;
    mostrarStatus("sucesso", `✅ Email enviado com sucesso para ${totalEnviados} destinatário(s)!`);

    // Limpar formulário
    assuntoInput.value = "";
    corpoInput.value = "";
    inputVideo.value = "";
    imagensBase64 = [];
    imagensPreviewEl.innerHTML = "";
    selecionados.clear();
    emailsManuais = [];
    atualizarContagem();
    atualizarComposerDest();
    renderizarClientes(buscaInput.value);
    emailPreview.style.display = "none";

    renderizarHistorico();
  });

  function mostrarStatus(tipo, msg) {
    statusEl.className = `email-status ${tipo}`;
    statusEl.textContent = msg;
    statusEl.style.display = "block";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 5000);
  }

  // ===== Histórico =====
  function renderizarHistorico() {
    const historico = JSON.parse(localStorage.getItem("mixEmailsPromo") || "[]");

    if (historico.length === 0) {
      listaHistoricoEl.innerHTML = `<p class="historico-vazio"><i class="fa-solid fa-inbox"></i> Nenhum email enviado ainda.</p>`;
      return;
    }

    let html = "";
    for (const email of historico) {
      const nomes = email.destinatarios.map(d => d.nome).join(", ");

      let imgHtml = "";
      if (email.imagens && email.imagens.length > 0) {
        imgHtml = `<div class="historico-imagens">`;
        email.imagens.forEach(src => {
          imgHtml += `<img src="${src}" alt="Promoção">`;
        });
        imgHtml += `</div>`;
      }

      html += `
        <div class="historico-item">
          <div class="historico-header">
            <span class="historico-assunto">${escaparHtml(email.assunto)}</span>
            <span class="historico-data"><i class="fa-regular fa-calendar"></i> ${escaparHtml(email.data)}</span>
          </div>
          <div class="historico-dest">
            <i class="fa-solid fa-users"></i>
            ${escaparHtml(nomes)} (${email.destinatarios.length} destinatário${email.destinatarios.length > 1 ? "s" : ""})
          </div>
          ${imgHtml}
          <div class="historico-texto">${escaparHtml(email.corpo)}</div>
        </div>`;
    }

    listaHistoricoEl.innerHTML = html;
  }

  // ===== Init =====
  carregarClientes();
  renderizarHistorico();
});
