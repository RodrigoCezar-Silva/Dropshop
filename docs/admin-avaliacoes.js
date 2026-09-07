/**
 * Painel Administrativo de Avaliações e Comentários do Produto
 * Permite visualizar, filtrar, auditar fotos/vídeos e moderar/excluir avaliações.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const produtoId = Number(params.get("id") || params.get("produtoId") || 0);

  const containerLista = document.getElementById("comentariosAdminLista");
  const produtoThumb = document.getElementById("spotlightThumb");
  const produtoTitulo = document.getElementById("spotlightTitulo");
  const produtoIdTag = document.getElementById("spotlightIdTag");
  const produtoCatTag = document.getElementById("spotlightCatTag");
  const produtoPrecoTag = document.getElementById("spotlightPrecoTag");
  const btnVerLoja = document.getElementById("spotlightVerLoja");
  
  const scoreNumeroEl = document.getElementById("scoreNumero");
  const scoreEstrelasEl = document.getElementById("scoreEstrelas");
  const scoreTotalTextoEl = document.getElementById("scoreTotalTexto");
  
  const buscaInput = document.getElementById("buscaComentariosInput");
  const filtroBtns = document.querySelectorAll(".filtro-btn");

  // Modal Lightbox
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxContainer = document.getElementById("lightboxContainer");
  const btnFecharLightbox = document.getElementById("btnFecharLightbox");

  // Modal Confirmação de Exclusão
  const confirmModal = document.getElementById("confirmarExclusaoModal");
  const btnCancelarModal = document.getElementById("btnCancelarExclusao");
  const btnConfirmarDeletar = document.getElementById("btnConfirmarExclusao");

  let comentarioParaExcluir = null;
  let comentariosCarregados = [];
  let filtroNotaAtivo = "todas";

  const apiBase = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : (window.AUTH_SERVER || window.location.origin);

  function formatarData(dataStr) {
    if (!dataStr) return "";
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dataStr;
    }
  }

  function gerarEstrelasHtml(nota) {
    const n = Math.max(1, Math.min(5, Number(nota) || 5));
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= n) {
        html += `<i class="fa-solid fa-star"></i>`;
      } else {
        html += `<i class="fa-regular fa-star"></i>`;
      }
    }
    return html;
  }

  function abrirLightbox(tipo, src) {
    if (!lightboxModal || !lightboxContainer) return;
    lightboxContainer.innerHTML = "";

    if (tipo === "img") {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Mídia do comentário";
      lightboxContainer.appendChild(img);
    } else if (tipo === "video") {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      lightboxContainer.appendChild(video);
    }

    lightboxModal.style.display = "flex";
  }

  function fecharLightbox() {
    if (!lightboxModal || !lightboxContainer) return;
    const video = lightboxContainer.querySelector("video");
    if (video) video.pause();
    lightboxContainer.innerHTML = "";
    lightboxModal.style.display = "none";
  }

  if (btnFecharLightbox) {
    btnFecharLightbox.addEventListener("click", fecharLightbox);
  }
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) fecharLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharLightbox();
      fecharModalExclusao();
    }
  });

  function abrirModalExclusao(id) {
    comentarioParaExcluir = id;
    if (confirmModal) confirmModal.style.display = "flex";
  }

  function fecharModalExclusao() {
    comentarioParaExcluir = null;
    if (confirmModal) confirmModal.style.display = "none";
  }

  if (btnCancelarModal) btnCancelarModal.addEventListener("click", fecharModalExclusao);
  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) fecharModalExclusao();
    });
  }

  if (btnConfirmarDeletar) {
    btnConfirmarDeletar.addEventListener("click", async () => {
      if (!comentarioParaExcluir) return;
      const idParaRemover = comentarioParaExcluir;
      fecharModalExclusao();

      try {
        const res = await fetch(`${apiBase}/api/comentarios/${idParaRemover}`, {
          method: "DELETE"
        });
        const json = await res.json();
        if (res.ok && json.sucesso) {
          // Remove da memória e re-renderiza
          comentariosCarregados = comentariosCarregados.filter(c => c.id !== idParaRemover);
          atualizarEstatisticasScore(comentariosCarregados);
          aplicarFiltros();
        } else {
          alert(json.mensagem || "Não foi possível excluir o comentário.");
        }
      } catch (err) {
        console.error("Erro ao excluir comentário:", err);
        alert("Erro de conexão ao excluir comentário.");
      }
    });
  }

  function atualizarEstatisticasScore(lista) {
    if (!scoreNumeroEl || !scoreEstrelasEl || !scoreTotalTextoEl) return;
    const total = lista.length;

    if (total === 0) {
      scoreNumeroEl.textContent = "0.0";
      scoreEstrelasEl.innerHTML = gerarEstrelasHtml(0);
      scoreTotalTextoEl.textContent = "Nenhuma avaliação";
      return;
    }

    const soma = lista.reduce((acc, c) => acc + (Number(c.nota) || 5), 0);
    const media = (soma / total).toFixed(1);

    scoreNumeroEl.textContent = media;
    scoreEstrelasEl.innerHTML = gerarEstrelasHtml(Math.round(Number(media)));
    scoreTotalTextoEl.textContent = `${total} ${total === 1 ? "avaliação recebida" : "avaliações recebidas"}`;
  }

  function renderizarLista(lista) {
    if (!containerLista) return;

    if (!lista || !lista.length) {
      containerLista.innerHTML = `
        <div class="comentarios-empty-state">
          <i class="fa-regular fa-comment-dots"></i>
          <h3>Nenhuma avaliação encontrada</h3>
          <p>Não há comentários que correspondam aos filtros selecionados para este produto.</p>
        </div>
      `;
      return;
    }

    containerLista.innerHTML = lista.map(c => {
      const fotos = Array.isArray(c.fotos) ? c.fotos.filter(Boolean) : [];
      const video = c.video || null;
      const autor = c.autor || "Cliente";
      const inicial = autor.trim().charAt(0).toUpperCase() || "C";
      const dataFmt = formatarData(c.criadoEm);

      // Avatar
      const avatarHtml = c.clienteFoto
        ? `<img src="${apiBase}${c.clienteFoto}" class="admin-cliente-avatar" alt="${autor}" onerror="this.outerHTML='<div class=\\'admin-cliente-avatar-fallback\\'>${inicial}</div>'">`
        : `<div class="admin-cliente-avatar-fallback">${inicial}</div>`;

      // Fotos HTML
      let midiaHtml = "";
      if (fotos.length > 0 || video) {
        midiaHtml += `<div class="comentario-midia-container">`;
        fotos.forEach(src => {
          midiaHtml += `
            <img src="${src}" class="comentario-midia-thumb" alt="Foto avaliação" data-tipo="img" data-src="${src}" title="Clique para ampliar" />
          `;
        });
        if (video) {
          midiaHtml += `
            <div class="comentario-video-thumb-box" data-tipo="video" data-src="${video}" title="Clique para assistir ao vídeo">
              <video src="${video}" muted></video>
              <i class="fa-solid fa-circle-play video-play-icon"></i>
            </div>
          `;
        }
        midiaHtml += `</div>`;
      }

      return `
        <article class="card-comentario-admin" id="cardComentario_${c.id}">
          <div class="comentario-admin-header">
            <div class="comentario-autor-box">
              ${avatarHtml}
              <div class="comentario-autor-detalhes">
                <strong>${autor}</strong>
                <span class="badge-cliente-verificado"><i class="fa-solid fa-circle-check"></i> Compra Verificada</span>
              </div>
            </div>
            <div class="comentario-nota-data">
              <div class="comentario-estrelas-gold">
                ${gerarEstrelasHtml(c.nota)}
              </div>
              <span class="comentario-data-label">${dataFmt}</span>
            </div>
          </div>

          <div class="comentario-texto-conteudo">
            ${c.texto ? String(c.texto).replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<em>Sem texto</em>"}
          </div>

          ${midiaHtml}

          <div class="comentario-admin-footer">
            <span class="comentario-id-tag">ID Avaliação: #${c.id}</span>
            <button class="btn-admin-excluir-comentario" data-id="${c.id}" title="Excluir este comentário do produto">
              <i class="fa-solid fa-trash-can"></i> Excluir Comentário
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Eventos de clique nas mídias
    containerLista.querySelectorAll(".comentario-midia-thumb, .comentario-video-thumb-box").forEach(el => {
      el.addEventListener("click", () => {
        abrirLightbox(el.dataset.tipo, el.dataset.src);
      });
    });

    // Eventos nos botões de excluir
    containerLista.querySelectorAll(".btn-admin-excluir-comentario").forEach(btn => {
      btn.addEventListener("click", () => {
        abrirModalExclusao(Number(btn.dataset.id));
      });
    });
  }

  function aplicarFiltros() {
    let filtrados = [...comentariosCarregados];

    // Filtro por nota / mídia
    if (filtroNotaAtivo === "5") {
      filtrados = filtrados.filter(c => Number(c.nota) === 5);
    } else if (filtroNotaAtivo === "4") {
      filtrados = filtrados.filter(c => Number(c.nota) === 4);
    } else if (filtroNotaAtivo === "3") {
      filtrados = filtrados.filter(c => Number(c.nota) === 3);
    } else if (filtroNotaAtivo === "midia") {
      filtrados = filtrados.filter(c => (Array.isArray(c.fotos) && c.fotos.length > 0) || c.video);
    }

    // Filtro por busca textual
    if (buscaInput) {
      const termo = buscaInput.value.toLowerCase().trim();
      if (termo) {
        filtrados = filtrados.filter(c => {
          const autor = String(c.autor || "").toLowerCase();
          const texto = String(c.texto || "").toLowerCase();
          return autor.includes(termo) || texto.includes(termo);
        });
      }
    }

    renderizarLista(filtrados);
  }

  // Interatividade dos botões de filtro
  filtroBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filtroBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtroNotaAtivo = btn.dataset.filtro;
      aplicarFiltros();
    });
  });

  if (buscaInput) {
    buscaInput.addEventListener("input", () => {
      aplicarFiltros();
    });
  }

  // Carregar dados do produto e seus comentários
  try {
    let produtoEncontrado = null;

    if (produtoId) {
      try {
        const respProd = await fetch(`${apiBase}/api/produtos/${produtoId}`);
        const dataProd = await respProd.json();
        if (respProd.ok && dataProd.sucesso && dataProd.produto) {
          produtoEncontrado = dataProd.produto;
        }
      } catch (err) {
        console.warn("Falha ao buscar produto na API:", err);
      }
    }

    // Fallback para localStorage caso não venha da API
    if (!produtoEncontrado && produtoId) {
      const loja = JSON.parse(localStorage.getItem("loja") || "[]");
      produtoEncontrado = loja.find(p => Number(p.id) === produtoId) || null;
    }

    // Preenche card de spotlight
    if (produtoEncontrado) {
      if (produtoThumb) produtoThumb.src = produtoEncontrado.imagem || "https://via.placeholder.com/150?text=Produto";
      if (produtoTitulo) produtoTitulo.textContent = produtoEncontrado.nome || `Produto #${produtoId}`;
      if (produtoIdTag) produtoIdTag.textContent = `ID #${produtoEncontrado.id || produtoId}`;
      if (produtoCatTag) produtoCatTag.textContent = produtoEncontrado.categoria || "Geral";
      if (produtoPrecoTag) produtoPrecoTag.textContent = produtoEncontrado.precoAtual || "";
      if (btnVerLoja) btnVerLoja.href = `produto.html?id=${produtoEncontrado.id || produtoId}`;
    } else {
      if (produtoTitulo) produtoTitulo.textContent = produtoId ? `Produto #${produtoId}` : "Todas as Avaliações";
      if (produtoIdTag) produtoIdTag.textContent = produtoId ? `ID #${produtoId}` : "Geral";
      if (produtoThumb) produtoThumb.src = "https://via.placeholder.com/150?text=Produto";
      if (btnVerLoja) btnVerLoja.style.display = "none";
    }

    // Carregar Comentários
    const urlComentarios = produtoId
      ? `${apiBase}/api/comentarios?produtoId=${produtoId}`
      : `${apiBase}/api/comentarios`;

    const respComentarios = await fetch(urlComentarios);
    const dataComentarios = await respComentarios.json();

    comentariosCarregados = Array.isArray(dataComentarios) ? dataComentarios : [];

    atualizarEstatisticasScore(comentariosCarregados);
    renderizarLista(comentariosCarregados);

  } catch (err) {
    console.error("Erro ao carregar avaliações do produto:", err);
    if (containerLista) {
      containerLista.innerHTML = `
        <div class="comentarios-empty-state" style="border-color: #fecaca; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
          <h3>Erro ao carregar avaliações</h3>
          <p>${err.message || "Não foi possível conectar ao servidor para carregar os comentários."}</p>
        </div>
      `;
    }
  }
});

