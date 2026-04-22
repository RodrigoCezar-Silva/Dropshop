/**
 * Sistema de comentários e avaliações do produto.
 * Controla abertura do popup, envio das notas,
 * renderização dos comentários e estatísticas de estrelas.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Confere se o usuário atual é administrador.
  let isAdmin = localStorage.getItem("isAdmin") === "true";

  const btnComentar = document.getElementById("btnComentar");
  const btnAvaliar = document.querySelector(".btn-avaliar");
  const popup = document.getElementById("popupComentario");
  const fecharPopup = document.getElementById("fecharPopup");
  const fotosInput = document.getElementById("fotosComentario");
  const previewDiv = document.getElementById("previewFotos");
  const videoInput = document.getElementById("videoComentario");
  const previewVideo = document.getElementById("previewVideo");
  const formComentario = document.getElementById("formComentario");

  // Garantir que o popup do formulário esteja sempre escondido até verificarmos o login
  if (popup) popup.style.display = 'none';

  // Mostrar o botão de avaliar somente se estiver logado como cliente ou admin
  const clienteLogado = localStorage.getItem("clienteId");
  const podeAvaliar = (isAdmin || clienteLogado);
  if (btnComentar) btnComentar.style.display = podeAvaliar ? "inline-block" : "none";
  if (btnAvaliar) btnAvaliar.style.display = podeAvaliar ? "inline-block" : "none";

  // Abrir popup de comentário (só se logado)
  // Popup estilizado para login obrigatório
  const popupLoginObrigatorio = document.getElementById("popupLoginObrigatorio");
  const fecharPopupLogin = document.getElementById("fecharPopupLogin");
  const btnFecharLoginPopup = document.getElementById("btnFecharLoginPopup");
  const btnIrLoginPopup = document.getElementById("btnIrLoginPopup");
  const btnCancelarLoginPopup = document.getElementById("btnCancelarLoginPopup");

  function mostrarPopupLoginObrigatorio() {
    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "flex";
  }
  function fecharPopupLoginObrigatorio() {
    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "none";
  }
  if (fecharPopupLogin) fecharPopupLogin.onclick = fecharPopupLoginObrigatorio;
  if (btnFecharLoginPopup) btnFecharLoginPopup.onclick = fecharPopupLoginObrigatorio;
  if (btnCancelarLoginPopup) btnCancelarLoginPopup.onclick = fecharPopupLoginObrigatorio;
  if (btnIrLoginPopup) btnIrLoginPopup.addEventListener('click', function() {
    // redireciona para a página de login incluindo returnTo = página atual
    // adiciona o parâmetro openComment=1 para que, após login e retorno, o formulário abra automaticamente
    let current = window.location.pathname + window.location.search + window.location.hash;
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      params.set('openComment', '1');
      const path = url.pathname + '?' + params.toString() + (url.hash || '');
      current = path;
    } catch (err) {
      // fallback simples
      if (current.indexOf('?') === -1) current += '?openComment=1'; else current += '&openComment=1';
    }
    const loginUrl = './html/login-cliente.html?returnTo=' + encodeURIComponent(current);
    window.location.href = loginUrl;
  });

  function usuarioLogado() {
    return localStorage.getItem("isAdmin") === "true" || localStorage.getItem("clienteId");
  }
  if (btnComentar) btnComentar.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (usuarioLogado()) {
      if (popup) popup.style.display = "flex";
    } else {
      if (popup) popup.style.display = "none";
      mostrarPopupLoginObrigatorio();
    }
  });
  if (btnAvaliar) btnAvaliar.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (usuarioLogado()) {
      if (popup) popup.style.display = "flex";
    } else {
      if (popup) popup.style.display = "none";
      mostrarPopupLoginObrigatorio();
    }
  });

  // Garante que o popupComentario nunca aparece para não logados
  if (!usuarioLogado()) {
    if (popup) popup.style.display = "none";
  }
  // Se a URL contém openComment=1 e o usuário está logado, abre o formulário automaticamente
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('openComment') === '1' && usuarioLogado() && popup) {
      popup.style.display = 'flex';
      // remover o parâmetro da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete('openComment');
      window.history.replaceState({}, document.title, url.toString());
    }
  } catch (e) {
    // ignore
  }
  if (fecharPopup) fecharPopup.addEventListener("click", () => popup.style.display = "none");

  // Buscar comentários do servidor para este produto
  let comentarios = [];
  async function carregarComentariosDoServidor() {
    const params = new URLSearchParams(window.location.search);
    const produtoId = params.get('id') || params.get('produtoId') || params.get('produto');
    // construir base da API: prioriza a configuração carregada por auth-links (`window.AUTH_SERVER`)
    const host = window.location.hostname;
    const proto = window.location.protocol;
    const defaultBase = `${proto}//${host}:3000`;
    const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
    const apiUrl = `${apiBase}/api/comentarios` + (produtoId ? ('?produtoId=' + encodeURIComponent(produtoId)) : '');

    // tenta primeiro API configurada (AUTH_SERVER ou host:3000), se falhar tenta relativo (útil em produção se API for proxy)
    try {
      let resp = await fetch(apiUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Resposta não OK: ' + resp.status);
      const lista = await resp.json();
      comentarios = Array.isArray(lista) ? lista : [];
      atualizarComentarios(comentarios);
      atualizarEstatisticas(comentarios);
      return;
    } catch (err) {
      try {
        const relativePath = '/api/comentarios' + (produtoId ? ('?produtoId=' + encodeURIComponent(produtoId)) : '');
        const resp2 = await fetch(relativePath);
        if (!resp2.ok) throw new Error('Resposta relativa não OK: ' + resp2.status);
        const lista2 = await resp2.json();
        comentarios = Array.isArray(lista2) ? lista2 : [];
        atualizarComentarios(comentarios);
        atualizarEstatisticas(comentarios);
        return;
      } catch (err2) {
        console.warn('Erro ao carregar comentarios do servidor (apiBase e relativo):', err && err.message, err2 && err2.message);
        comentarios = [];
        atualizarComentarios(comentarios);
        atualizarEstatisticas(comentarios);
        return;
      }
    }
  }
  carregarComentariosDoServidor();

  // Filtro de comentários por estrela
  const filtroTudo = document.getElementById("filtro-tudo");
  const botoesFiltro = document.querySelectorAll(".filtros-avaliacoes button");
  if (botoesFiltro.length > 0) {
    botoesFiltro.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        // idx 0 = Tudo, 1 = 5 estrelas, 2 = 4, ...
        botoesFiltro.forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
            if (idx === 0) {
              atualizarComentarios(comentarios);
            } else {
              const estrela = 6 - idx;
              const filtrados = comentarios.filter(c => Number(c.nota || c.notaProduto || 0) === estrela);
              atualizarComentarios(filtrados);
            }
      });
    });
  }

  // Pré-visualização de fotos no formulário
  fotosInput.addEventListener("change", () => {
    previewDiv.innerHTML = "";
    const files = fotosInput.files;
    for (let i = 0; i < files.length && i < 5; i++) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "60px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.style.margin = "5px";
        img.style.borderRadius = "6px";
        previewDiv.appendChild(img);
      };
      reader.readAsDataURL(files[i]);
    }
  });

  // Pré-visualização de vídeo no formulário
  videoInput.addEventListener("change", () => {
    previewVideo.innerHTML = "";
    if (videoInput.files.length > 0) {
      const file = videoInput.files[0];
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.style.width = "120px";
      video.style.height = "80px";
      video.style.marginTop = "10px";
      video.style.borderRadius = "6px";
      previewVideo.appendChild(video);
    }
  });

  // Salva uma nova avaliação enviada pelo usuário.
  // Também atualiza a lista de comentários e os gráficos de estrelas.
  formComentario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const autor = document.getElementById("autor").value.trim();
    const texto = document.getElementById("texto").value.trim();
    const notaProduto = parseInt(document.getElementById("notaProduto").value) || 0;

    if (!texto || !notaProduto) {
      alert("Preencha comentário e selecione uma nota.");
      return;
    }

    // preparar FormData para envio ao servidor
    try {
      const params = new URLSearchParams(window.location.search);
      const produtoId = params.get('id') || params.get('produtoId') || params.get('produto');
      const fd = new FormData();
      fd.append('autor', autor || '');
      fd.append('texto', texto);
      fd.append('nota', String(notaProduto));
      if (produtoId) fd.append('produtoId', produtoId);
      const clienteId = localStorage.getItem('clienteId');
      if (clienteId) fd.append('clienteId', clienteId);

      // anexar fotos
      for (let i = 0; i < fotosInput.files.length && i < 5; i++) {
        fd.append('fotos', fotosInput.files[i]);
      }
      // anexar video (apenas 1)
      if (videoInput.files.length > 0) fd.append('video', videoInput.files[0]);

      // enviar para API configurada (AUTH_SERVER ou host:3000) e, se falhar, tentar caminho relativo
      const host = window.location.hostname;
      const proto = window.location.protocol;
      const defaultBase = `${proto}//${host}:3000`;
      const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
      let resp = null;
      try {
        resp = await fetch(apiBase + '/api/comentarios', { method: 'POST', body: fd });
        if (!resp.ok) throw new Error('API base respondeu ' + resp.status);
      } catch (err) {
        // tentativa fallback relativo
        resp = await fetch('/api/comentarios', { method: 'POST', body: fd });
      }
      const j = await resp.json();
      if (!resp.ok || !j.sucesso) {
        alert(j.mensagem || 'Erro ao enviar comentário');
        return;
      }

      // limpar formulário e recarregar comentários do servidor
      popup.style.display = 'none';
      formComentario.reset();
      previewDiv.innerHTML = '';
      previewVideo.innerHTML = '';
      await carregarComentariosDoServidor();
    } catch (err) {
      console.error('Erro ao enviar comentario:', err && err.message);
      alert('Erro ao enviar comentário. Tente mais tarde.');
    }
  });

  // Renderiza cada comentário na tela e controla o botão de remover.
  function atualizarComentarios(listaComentarios) {
    const lista = document.getElementById("lista-comentarios");
    lista.innerHTML = "";
    isAdmin = localStorage.getItem("isAdmin") === "true";

    listaComentarios.forEach((c, index) => {
      const div = document.createElement("div");
      div.classList.add("comentario");

      const topo = document.createElement("div");
      topo.classList.add("comentario-topo");

      const info = document.createElement("div");
      info.classList.add("comentario-info");
      const notaCur = Number(c.nota || c.notaProduto || 0);
      info.innerHTML = `<strong>${c.autor || 'Anônimo'}:</strong> <span class="estrelas">${"★".repeat(notaCur)}</span>`;
      topo.appendChild(info);

      if (isAdmin) {
        const btnRemover = document.createElement("button");
        btnRemover.textContent = "Remover comentário";
        btnRemover.classList.add("btn-remover");
        btnRemover.addEventListener("click", async () => {
          // chama API para remover
          try {
            const id = c.id || c._id;
            if (!id) return alert('Comentário sem id.');
            // delete via API base (AUTH_SERVER) with fallback to relative
            const host = window.location.hostname;
            const proto = window.location.protocol;
            const defaultBase = `${proto}//${host}:3000`;
            const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
            let resp = null;
            try {
              resp = await fetch(apiBase + '/api/comentarios/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
              if (!resp.ok) throw new Error('API base respondeu ' + resp.status);
            } catch (err) {
              resp = await fetch('/api/comentarios/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            }
            const j = await resp.json();
            if (!resp.ok) return alert(j.mensagem || 'Falha ao remover comentário');
            await carregarComentariosDoServidor();
          } catch (err) { console.error('Erro ao remover comentario:', err); alert('Erro ao remover comentário'); }
        });
        topo.appendChild(btnRemover);
      }

      div.appendChild(topo);

      const texto = document.createElement("p");
      texto.textContent = c.texto;
      div.appendChild(texto);

      const midiaDiv = document.createElement("div");
      midiaDiv.classList.add("comentario-midia");

      if (c.fotos && c.fotos.length > 0) {
        c.fotos.forEach(foto => {
          const img = document.createElement("img");
          img.src = foto;
          img.addEventListener("click", () => abrirMediaPopup(c, "img", foto));
          midiaDiv.appendChild(img);
        });
      }

      if (c.video) {
        const video = document.createElement("video");
        const videoSrc = typeof c.video === 'string' ? c.video : (c.video.dataUri || (c.video.data && c.video.data));
        video.src = videoSrc;
        video.controls = true;
        video.addEventListener("click", () => abrirMediaPopup(c, "video", videoSrc));
        midiaDiv.appendChild(video);
      }

      div.appendChild(midiaDiv);
      lista.appendChild(div);
    });
  }

  // Abre um popup ampliado para visualizar fotos e vídeos enviados
  // nos comentários, com troca entre miniaturas.
  function abrirMediaPopup(comentario, tipoInicial, srcInicial) {
    const mediaPopup = document.getElementById("mediaPopup");
    const mediaContent = document.getElementById("mediaContent");
    mediaContent.innerHTML = "";

    const principal = document.createElement("div");
    principal.style.textAlign = "center";

    if (tipoInicial === "img") {
      const img = document.createElement("img");
      img.src = srcInicial;
      principal.appendChild(img);
    } else if (tipoInicial === "video") {
      const video = document.createElement("video");
      video.src = srcInicial;
      video.controls = true;
      video.autoplay = true;
      principal.appendChild(video);
    }
    mediaContent.appendChild(principal);

    const miniaturas = document.createElement("div");
    miniaturas.style.display = "flex";
    miniaturas.style.gap = "8px";
    miniaturas.style.marginTop = "12px";
    miniaturas.style.flexWrap = "wrap";
    miniaturas.style.justifyContent = "center";

    if (comentario.fotos && comentario.fotos.length > 0) {
      comentario.fotos.forEach(foto => {
        const thumb = document.createElement("img");
        thumb.src = foto;
        thumb.style.width = "60px";
        thumb.style.height = "60px";
        thumb.style.objectFit = "cover";
        thumb.style.cursor = "pointer";
        thumb.style.borderRadius = "6px";
        thumb.addEventListener("click", () => {
          principal.innerHTML = "";
          const img = document.createElement("img");
          img.src = foto;
          principal.appendChild(img);
        });
        miniaturas.appendChild(thumb);
      });
    }

    if (comentario.video) {
      const thumbVideo = document.createElement("video");
      thumbVideo.src = comentario.video;
      thumbVideo.muted = true;
      thumbVideo.loop = true;
      thumbVideo.autoplay = true;
      thumbVideo.style.width = "80px";
      thumbVideo.style.height = "60px";
      thumbVideo.style.cursor = "pointer";
      thumbVideo.style.borderRadius = "6px";
      thumbVideo.addEventListener("click", () => {
        principal.innerHTML = "";
        const video = document.createElement("video");
        video.src = comentario.video;
        video.controls = true;
        video.autoplay = true;
        principal.appendChild(video);
      });
      miniaturas.appendChild(thumbVideo);
    }

    mediaContent.appendChild(miniaturas);
    mediaPopup.style.display = "flex";
  }

    const closeMedia = document.getElementById("closeMedia");
  if (closeMedia) {
    closeMedia.addEventListener("click", () => {
      document.getElementById("mediaPopup").style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    const mediaPopup = document.getElementById("mediaPopup");
    if (e.target === mediaPopup) {
      mediaPopup.style.display = "none";
    }
  });

  // Calcula média, porcentagem e distribuição das notas.
  // Esses dados alimentam as barras e os percentuais exibidos na página.
  function atualizarEstatisticas(listaComentarios) {
    const estatisticasDiv = document.getElementById("estatisticasComentarios");
    if (!estatisticasDiv) return;

    if (listaComentarios.length === 0) {
      estatisticasDiv.textContent = "Nenhum comentário ainda.";
      document.getElementById("mediaEstrelas").textContent = "-";
      document.getElementById("estrelasMedia").textContent = "☆☆☆☆☆";
      return;
    }

    const total = listaComentarios.length;
    const somaNotas = listaComentarios.reduce((acc, c) => acc + (Number(c.nota || c.notaProduto || 0)), 0);
    const media = (somaNotas / total).toFixed(1);

    // Calcular distribuição de estrelas
    const contador = [0, 0, 0, 0, 0, 0]; // índice 1-5
    listaComentarios.forEach(c => {
      const nota = Number(c.nota || c.notaProduto || 0);
      if (nota >= 1 && nota <= 5) contador[nota]++;
    });

    for (let i = 1; i <= 5; i++) {
      const porcent = total ? ((contador[i] / total) * 100).toFixed(0) : 0;
      const barra = document.getElementById(`barra${i}`);
      const perc = document.getElementById(`perc${i}`);
      if (barra) barra.style.width = `${porcent}%`;
      if (perc) perc.textContent = `${porcent}%`;

      // Atualiza contagem nos botões já existentes de filtro
      const btnFiltro = document.querySelector(`.filtros-avaliacoes button:nth-child(${6 - i + 1})`);
      if (btnFiltro) {
        btnFiltro.textContent = `${i} Estrela${i > 1 ? "s" : ""} (${contador[i]})`;
      }
    }

    const ratingPercent = ((media / 5) * 100).toFixed(0);
    estatisticasDiv.innerHTML = `Total de avaliações: <strong>${total}</strong> | Média: <strong>${media} ★</strong> (<strong>${ratingPercent}%</strong>)`;

    // Atualiza média visual
    const mediaEstrelas = document.getElementById("mediaEstrelas");
    const estrelasMedia = document.getElementById("estrelasMedia");
    if (mediaEstrelas) mediaEstrelas.textContent = media;
    if (estrelasMedia) {
      const cheias = Math.round(media);
      estrelasMedia.textContent = "★".repeat(cheias) + "☆".repeat(5 - cheias);
    }
  }
});
