document.addEventListener("DOMContentLoaded", async () => {
  // Verificar se é admin
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  if (tipoUsuario !== "Administrador") {
    alert("Acesso restrito a administradores.");
    window.location.href = "admin-login.html";
    return;
  }

  let filtroAtual = "todas";
  let reclamacaoSelecionadaId = null;
  let cacheReclamacoes = [];

  const listaEl = document.getElementById("listaReclamacoes");
  const msgVazio = document.getElementById("msgVazio");
  const modalOverlay = document.getElementById("modalResposta");
  const modalInfo = document.getElementById("modalInfo");
  const modalHistorico = document.getElementById("historicoRespostas");
  const txtResposta = document.getElementById("respostaTexto");
  const btnEnviar = document.getElementById("btnEnviarResposta");
  const btnFechar = document.getElementById("fecharModal");
  const btnGerarIA = document.getElementById('btnGerarIA');

  // Filtros
  document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".filtro-btn.ativo").classList.remove("ativo");
      btn.classList.add("ativo");
      filtroAtual = btn.dataset.filtro;
      renderizar();
    });
  });

  async function obterReclamacoes() {
    // tenta várias bases possíveis (quando estiver servindo os HTMLs por Live Server ou pelo próprio Express)
    const bases = [];
    const currentPort = window.location.port;
    if (currentPort && currentPort !== '3000') bases.push('http://localhost:3000');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') bases.push(window.location.origin);
    bases.push('http://127.0.0.1:3000', '');

    for (const b of bases) {
      try {
        const url = (b ? b : '') + '/api/reclamacoes';
        console.debug('[admin] tentando obter reclamacoes de', url);
        const res = await fetch(url);
        if (!res.ok) { console.debug('[admin] resposta não OK', res.status); continue; }
        const json = await res.json().catch(() => null);
        if (!json) continue;
        // aceitar tanto array quanto objeto { sucesso: true, ... }
        let lista;
        if (Array.isArray(json)) lista = json;
        else if (json && Array.isArray(json.reclamacoes)) lista = json.reclamacoes;
        else if (json && json.sucesso && Array.isArray(json.data)) lista = json.data;
        else if (json && Object.keys(json).length) {
          const arr = Object.values(json).filter(v => v && v.id);
          lista = arr.length ? arr : null;
        }
        if (lista) {
          try { localStorage.setItem('mixReclamacoes', JSON.stringify(lista)); } catch (e) { /* ignore */ }
          // limpar lista de deletados que já desapareceram no servidor
          try {
            const deletedRaw = localStorage.getItem('mixReclamacoesDeleted') || '[]';
            const deleted = JSON.parse(deletedRaw || '[]');
            if (Array.isArray(deleted) && deleted.length) {
              const idsServer = new Set((lista || []).map(x => Number(x.id)));
              const remaining = deleted.filter(d => !idsServer.has(Number(d)));
              localStorage.setItem('mixReclamacoesDeleted', JSON.stringify(remaining));
            }
          } catch (e) { /* ignore */ }
          return lista;
        }
        // se json for um objeto simples com dados, tentar normalizar
        if (json && Object.keys(json).length && !json.sucesso) {
          // tentar extrair lista se for objeto indexado por id
          const arr = Object.values(json).filter(v => v && v.id);
          if (arr.length) return arr;
        }
      } catch (err) {
        console.debug('[admin] falha fetch base', b, err && err.message);
        continue;
      }
    }

        // fallback para localStorage, aplicando filtro de itens marcados como deletados
    try {
      let lista = JSON.parse(localStorage.getItem("mixReclamacoes") || "[]") || [];
      const deletedRaw = localStorage.getItem('mixReclamacoesDeleted') || '[]';
      try {
        const deleted = JSON.parse(deletedRaw || '[]');
        if (Array.isArray(deleted) && deleted.length) {
          const delSet = new Set(deleted.map(x => Number(x)));
          lista = lista.filter(item => !delSet.has(Number(item.id)));
        }
      } catch (e) { /* ignore parsing deleted */ }
      return lista;
    } catch { return []; }
  }

  function salvarReclamacoes(lista) {
    localStorage.setItem("mixReclamacoes", JSON.stringify(lista));
  }

  async function loadReclamacoes() {
    cacheReclamacoes = await obterReclamacoes();

    // Se não houver reclamações (dev/local), semear alguns exemplos para visualização
    if ((!cacheReclamacoes || cacheReclamacoes.length === 0) && !localStorage.getItem('mixReclamacoesSeeded')) {
      const now = Date.now();
      const sample = [
        {
          id: now,
          nome: 'Maria Silva',
          email: 'maria.silva@example.com',
          telefone: '(21) 99999-0000',
          assunto: 'Produto avariado',
          reclamacao: 'Recebi o produto com defeito na lateral, gostaria de troca ou reembolso.',
          anexos: [],
          data: new Date().toLocaleString('pt-BR'),
          status: 'pendente',
          respostas: []
        },
        {
          id: now + 1,
          nome: 'João Pereira',
          email: 'joao.pereira@example.com',
          telefone: '(21) 98888-1111',
          assunto: 'Atraso na entrega',
          reclamacao: 'Meu pedido atrasou mais do que o prazo informado.',
          anexos: [],
          data: new Date().toLocaleString('pt-BR'),
          status: 'respondida',
          respostas: [
            { texto: 'Pedimos desculpas pelo transtorno. Pedido reenviado e status atualizado.', data: new Date().toLocaleString('pt-BR') }
          ]
        }
      ];
      cacheReclamacoes = sample;
      salvarReclamacoes(cacheReclamacoes);
      localStorage.setItem('mixReclamacoesSeeded', '1');
    }

    renderizar();
  }

  function atualizarBadges() {
    const reclamacoes = cacheReclamacoes || [];
    const pendentes = reclamacoes.filter(r => r.status === "pendente").length;
    const respondidas = reclamacoes.filter(r => r.status === "respondida").length;

    const elTodas = document.getElementById("badge-todas");
    const elPend = document.getElementById("badge-pendente");
    const elResp = document.getElementById("badge-respondida");
    if (elTodas) elTodas.textContent = reclamacoes.length;
    if (elPend) elPend.textContent = pendentes;
    if (elResp) elResp.textContent = respondidas;
  }

  function obterIniciais(nome) {
    const partes = nome.trim().split(" ");
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  }

  function escaparHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderizar() {
    let reclamacoes = cacheReclamacoes || [];
    if (filtroAtual !== "todas") reclamacoes = reclamacoes.filter(r => r.status === filtroAtual);

    reclamacoes.sort((a, b) => {
      if (a.status === "pendente" && b.status !== "pendente") return -1;
      if (a.status !== "pendente" && b.status === "pendente") return 1;
      return b.id - a.id;
    });

    atualizarBadges();

    if (reclamacoes.length === 0) {
      listaEl.innerHTML = `
        <p class="reclamacoes-vazio">
          <i class="fa-solid fa-face-smile"></i> Nenhuma reclamação encontrada.
        </p>`;
      return;
    }

    let html = "";
    for (const r of reclamacoes) {
      const iniciais = obterIniciais(r.nome);
      const temFoto = r.fotoBase64;
      const ultimaResposta = r.respostas && r.respostas.length > 0 ? r.respostas[r.respostas.length - 1] : null;

      html += `
        <div class="reclamacao-card ${escaparHtml(r.status)}">
          <div class="reclamacao-header">
            <div class="reclamacao-cliente">
              ${temFoto ? `<div class="reclamacao-avatar-wrap"><img src="data:${(r.fotoMime||'image/jpeg')};base64,${r.fotoBase64}" class="reclamacao-avatar" alt="${escaparHtml(r.nome)}"> </div>` : `<div class="reclamacao-avatar">${escaparHtml(iniciais)}</div>`}
              <div>
                <div class="reclamacao-nome">${escaparHtml(r.nome)}</div>
                <div class="reclamacao-email">${escaparHtml(r.email)}${r.telefone ? ' • ' + escaparHtml(r.telefone) : ''}</div>
              </div>
            </div>
            <div class="reclamacao-meta">
              <span class="reclamacao-data"><i class="fa-regular fa-calendar"></i> ${escaparHtml(r.data)}</span>
              <span class="reclamacao-status ${escaparHtml(r.status)}">${r.status === "pendente" ? "⏳ Pendente" : "✅ Respondida"}</span>
            </div>
          </div>

          <h3 class="reclamacao-assunto"><i class="fa-solid fa-tag"></i> ${escaparHtml(r.assunto)}</h3>
          <p class="reclamacao-texto">${escaparHtml(r.reclamacao)}</p>

          ${((r.anexos && r.anexos.length) || (r.attachments && r.attachments.length)) ? `
            <div class="reclamacao-anexos">
              ${(() => {
                const list = (Array.isArray(r.anexos) && r.anexos.length) ? r.anexos : (Array.isArray(r.attachments) ? r.attachments : []);
                return list.map(a => {
                  // a pode ser string ou objeto
                  let src = '';
                  let mimetype = '';
                  let storedInDb = false;
                  let attId = null;
                  if (typeof a === 'string') src = a;
                  else {
                    src = a.url || a.filename || '';
                    mimetype = a.mimetype || a.type || '';
                    storedInDb = !!a.storedInDb || !!a.data;
                    attId = a.id || null;
                  }
                  // calcular host do servidor (assume server em :3000 em dev)
                  const hostPort = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? `${window.location.protocol}//${window.location.hostname}:3000`
                    : `${window.location.protocol}//${window.location.hostname}`;

                  // se for armazenado no DB e tiver id, preferir endpoint /poster para gerar thumbnail
                  if (storedInDb && attId && (mimetype && mimetype.startsWith('image/'))) {
                    src = `${hostPort}/api/reclamacao/attachment/${attId}/poster`;
                  } else if (storedInDb && attId && (mimetype && mimetype.startsWith('video/'))) {
                    // para vídeos, usar o próprio attachment como source (poster gerado client-side)
                    src = `${hostPort}/api/reclamacao/attachment/${attId}`;
                  } else if (src && src.startsWith('/')) {
                    src = `${hostPort}${src}`;
                  }

                  if (!src) return '';
                  if ((mimetype && mimetype.startsWith('image/')) || src.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) || src.includes('/poster')) {
                    return `<img src="${src}" class="reclamacao-thumb" alt="${escaparHtml(a.originalName || a.name || a.filename || '')}">`;
                  }
                  if ((mimetype && mimetype.startsWith('video/')) || src.match(/\.(mp4|webm|ogg)(\?|$)/i) || src.includes('/api/reclamacao/attachment/')) {
                    return `<video class="reclamacao-thumb" muted playsinline preload="metadata" src="${src}" data-src="${src}"></video>`;
                  }
                  return '';
                }).join('');
              })()}
            </div>
          ` : ''}

          ${ultimaResposta ? `
            <div class="reclamacao-ultima-resposta">
              <strong><i class="fa-solid fa-reply"></i> Última resposta (${escaparHtml(ultimaResposta.data)}):</strong>
              ${escaparHtml(ultimaResposta.texto)}
            </div>
          ` : ""}

          <div class="reclamacao-acoes">
            <button class="btn-responder" data-id="${r.id}">
              <i class="fa-solid fa-reply"></i> Responder
            </button>
            <button class="btn-excluir-reclamacao" data-id="${r.id}">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>`;
    }

    listaEl.innerHTML = html;

    // gerar miniaturas de vídeos (cliente-side) e substituir por poster click-to-play
    (function processAttachmentThumbnails(rootEl) {
      rootEl = rootEl || document;
      const videos = rootEl.querySelectorAll('video.reclamacao-thumb[data-src]');
      if (!videos || !videos.length) return;
      const captureVideoFrame = (url, seekTo = 0.1) => new Promise((resolve, reject) => {
        try {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.src = url;
          const tidy = () => { try { video.src = ''; video.remove(); } catch (e) {} };
          const onError = (e) => { tidy(); reject(e || new Error('video error')); };
          video.addEventListener('loadeddata', () => {
            try { video.currentTime = Math.min(seekTo, (video.duration || seekTo)); } catch (e) { /* ignore */ }
          });
          video.addEventListener('seeked', () => {
            try {
              const w = 320;
              const h = Math.round((video.videoHeight || 180) / ((video.videoWidth || 320) / w));
              const canvas = document.createElement('canvas');
              canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
              tidy();
              resolve(dataUrl);
            } catch (e) { tidy(); reject(e); }
          });
          video.addEventListener('error', onError);
        } catch (e) { reject(e); }
      });

      videos.forEach(v => {
        const src = v.getAttribute('data-src') || v.src;
        if (!src) return;
        captureVideoFrame(src).then(poster => {
          const img = document.createElement('img');
          img.src = poster;
          img.className = 'reclamacao-thumb video-poster';
          img.setAttribute('data-video-src', src);
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => {
            const videoEl = document.createElement('video');
            videoEl.className = 'reclamacao-thumb video-player';
            videoEl.controls = true;
            videoEl.autoplay = true;
            videoEl.src = src;
            v.parentNode.replaceChild(videoEl, img);
          });
          v.parentNode.replaceChild(img, v);
        }).catch(() => {
          // falha ao gerar poster: manter elemento <video> reduzido
          v.setAttribute('controls', '');
          v.style.width = '240px';
          v.style.height = 'auto';
        });
      });
    })(listaEl);

    // Eventos dos botões
    listaEl.querySelectorAll(".btn-responder").forEach(btn => btn.addEventListener("click", () => abrirModal(Number(btn.dataset.id))));
    listaEl.querySelectorAll(".btn-excluir-reclamacao").forEach(btn => btn.addEventListener("click", () => excluirReclamacao(Number(btn.dataset.id))));
  }

  function abrirModal(id) {
    const r = (cacheReclamacoes || []).find(rec => rec.id === id);
    if (!r) return;

    reclamacaoSelecionadaId = id;

    // Info do cliente
    modalInfo.innerHTML = `
      <div class="modal-info-item"><i class="fa-solid fa-user"></i> <strong>${escaparHtml(r.nome)}</strong></div>
      <div class="modal-info-item"><i class="fa-solid fa-envelope"></i> ${escaparHtml(r.email)}</div>
      ${r.telefone ? `<div class="modal-info-item"><i class="fa-solid fa-phone"></i> ${escaparHtml(r.telefone)}</div>` : ''}
      <div class="modal-info-item"><i class="fa-solid fa-tag"></i> ${escaparHtml(r.assunto)}</div>
      <div class="modal-info-item"><i class="fa-solid fa-message"></i> ${escaparHtml(r.reclamacao)}</div>
    `;

    const attachmentsModal = (Array.isArray(r.anexos) && r.anexos.length) ? r.anexos : (Array.isArray(r.attachments) ? r.attachments : []);
    if (attachmentsModal && attachmentsModal.length) {
      let anexHtml = '<div class="modal-anexos"><h4>Anexos</h4>';
      // host/port para resolver caminhos relativos quando HTML servido por Live Server
      const hostPort = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : `${window.location.protocol}//${window.location.hostname}`;

      for (const a of attachmentsModal) {
        let src = '';
        let mimetype = '';
        let storedInDb = false;
        let attId = null;
        if (typeof a === 'string') src = a;
        else {
          src = a.url || a.filename || '';
          mimetype = a.mimetype || a.type || '';
          storedInDb = !!a.storedInDb || !!a.data;
          attId = a.id || null;
        }

        if (storedInDb && attId) {
          const poster = `${hostPort}/api/reclamacao/attachment/${attId}/poster`;
          const attachmentUrl = `${hostPort}/api/reclamacao/attachment/${attId}`;
          if (mimetype && mimetype.startsWith('image/')) {
            anexHtml += `<img src="${poster}" class="modal-thumb" alt="${escaparHtml(a.originalName || a.name || a.filename || '')}" onerror="this.onerror=null;this.src='${attachmentUrl}';">`;
          } else if (mimetype && mimetype.startsWith('video/')) {
            anexHtml += `<img src="${poster}" class="modal-thumb video-poster" data-video-src="${attachmentUrl}" style="cursor:pointer;" alt="${escaparHtml(a.originalName || a.name || a.filename || '')}" onerror="this.onerror=null;this.style.display='none';">`;
          } else {
            anexHtml += `<a href="${attachmentUrl}" target="_blank" class="modal-thumb file-link">Abrir</a>`;
          }
        } else {
          if (src && src.startsWith('/')) src = `${hostPort}${src}`;
          if (!src) continue;
          if ((mimetype && mimetype.startsWith('image/')) || src.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
            anexHtml += `<img src="${src}" class="modal-thumb" alt="${escaparHtml(a.originalName || a.name || a.filename || '')}">`;
          } else if ((mimetype && mimetype.startsWith('video/')) || src.match(/\.(mp4|webm|ogg)(\?|$)/i) || src.includes('/api/reclamacao/attachment/')) {
            anexHtml += `<img src="${src}" class="modal-thumb video-poster" data-video-src="${src}" style="cursor:pointer;" alt="${escaparHtml(a.originalName || a.name || a.filename || '')}" onerror="this.onerror=null;this.style.display='none';">`;
          }
        }
      }
      anexHtml += '</div>';
      modalInfo.innerHTML += anexHtml;

      // adicionar listeners click-to-play para imagens que representam posters de vídeo
      setTimeout(() => {
        const posters = modalInfo.querySelectorAll('img.video-poster');
        posters.forEach(img => {
          if (img.dataset.bound) return;
          img.dataset.bound = '1';
          img.addEventListener('click', () => {
            const srcVideo = img.getAttribute('data-video-src');
            if (!srcVideo) return;
            const videoEl = document.createElement('video');
            videoEl.controls = true;
            videoEl.autoplay = true;
            videoEl.className = 'modal-thumb video-player';
            videoEl.src = srcVideo;
            img.parentNode.replaceChild(videoEl, img);
          });
        });
      }, 50);
    }

    // Histórico
    if (r.respostas && r.respostas.length > 0) {
      let histHtml = "";
      for (const resp of r.respostas) {
        histHtml += `
          <div class="resposta-item">
            <div class="resposta-data"><i class="fa-regular fa-clock"></i> ${escaparHtml(resp.data)}</div>
            <p class="resposta-texto">${escaparHtml(resp.texto)}</p>
          </div>`;
      }
      modalHistorico.innerHTML = `
        <h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico de Respostas</h3>
        ${histHtml}`;
    } else {
      modalHistorico.innerHTML = `
        <h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico de Respostas</h3>
        <p class="sem-respostas">Nenhuma resposta enviada ainda.</p>`;
    }

    txtResposta.value = "";
    // limpar flag de IA
    delete modalOverlay.dataset.iaGenerated;
    delete modalOverlay.dataset.iaName;
    modalOverlay.style.display = "flex";
  }

  function fecharModal() {
    modalOverlay.style.display = "none";
    reclamacaoSelecionadaId = null;
  }

  btnFechar.addEventListener("click", fecharModal);
  modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) fecharModal(); });

  // Gerar resposta automática (simples, client-side)
  if (btnGerarIA) {
    btnGerarIA.addEventListener('click', () => {
      const r = (cacheReclamacoes || []).find(rec => rec.id === reclamacaoSelecionadaId);
      if (!r) { alert('Selecione uma reclamação válida antes de gerar IA.'); return; }
      const iaName = localStorage.getItem('nomeAtendenteIA') || 'Sofia Lima';
      // template simples, pode ser ajustado pelo usuário
      const texto = `Olá ${r.nome},\n\nObrigado por entrar em contato sobre "${r.assunto}". Lamento que você tenha passado por isso. Recebi sua mensagem: "${r.reclamacao}". Vamos analisar e tomar as providências necessárias o mais rápido possível. Entraremos em contato com atualizações em até 48 horas.\n\nAtenciosamente,\n${iaName}`;
      txtResposta.value = texto;
      // marcar que a resposta foi gerada pela IA e anotar o nome
      modalOverlay.dataset.iaGenerated = '1';
      modalOverlay.dataset.iaName = iaName;
      mostrarPopup && mostrarPopup('Resposta gerada pela IA. Revise antes de enviar.', 'info');
    });
  }

  // Enviar resposta (envia para servidor quando possível)
  btnEnviar.addEventListener("click", async () => {
    const texto = txtResposta.value.trim();
    if (!texto) { alert("Digite uma resposta antes de enviar."); return; }

    const idx = (cacheReclamacoes || []).findIndex(r => r.id === reclamacaoSelecionadaId);
    if (idx === -1) return;

    if (!cacheReclamacoes[idx].respostas) cacheReclamacoes[idx].respostas = [];
    let autorNome = localStorage.getItem('nome') || localStorage.getItem('usuario') || 'Atendente';
    // se resposta foi gerada pela IA, usar o nome completo configurado
    if (modalOverlay.dataset.iaGenerated === '1') {
      autorNome = modalOverlay.dataset.iaName || autorNome;
    }
    const respostaObj = { texto, data: new Date().toLocaleString('pt-BR'), autor: autorNome };
    cacheReclamacoes[idx].respostas.push(respostaObj);
    cacheReclamacoes[idx].status = 'respondida';

    // tentar atualizar no servidor via PUT /api/reclamacoes/:id
    let enviado = false;
    const bases = [];
    const currentPort = window.location.port;
    if (currentPort && currentPort !== '3000') bases.push('http://localhost:3000');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') bases.push(window.location.origin);
    bases.push('http://127.0.0.1:3000', '');

    for (const b of bases) {
      try {
        const url = (b ? b : '') + `/api/reclamacoes/${reclamacaoSelecionadaId}`;
        const body = { respostas: cacheReclamacoes[idx].respostas, status: cacheReclamacoes[idx].status };
        const resp = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (resp && resp.ok) { enviado = true; break; }
      } catch (e) { continue; }
    }

    salvarReclamacoes(cacheReclamacoes);
    fecharModal();
    renderizar();

    if (enviado) mostrarPopup && mostrarPopup('Resposta enviada ao servidor.', 'sucesso');
    else mostrarPopup && mostrarPopup('Resposta salva localmente (será sincronizada depois).', 'aviso');
  });

  function excluirReclamacao(id) {
    if (!confirm("Tem certeza que deseja excluir esta reclamação?")) return;
    // tentar deletar no servidor; se falhar, remover localmente
    (async () => {
      const bases = [];
      const currentPort = window.location.port;
      if (currentPort && currentPort !== '3000') bases.push('http://localhost:3000');
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') bases.push(window.location.origin);
      bases.push('http://127.0.0.1:3000', '');
      let deleted = false;
      for (const b of bases) {
        try {
          const url = (b ? b : '') + `/api/reclamacoes/${id}`;
          const resp = await fetch(url, { method: 'DELETE' });
          if (resp && resp.ok) { deleted = true; break; }
        } catch (e) { continue; }
      }
      // somente remover localmente se o servidor confirmou a exclusão
      if (deleted) {
        cacheReclamacoes = (cacheReclamacoes || []).filter(r => r.id !== id);
        salvarReclamacoes(cacheReclamacoes);
        try {
          const deletedRaw = localStorage.getItem('mixReclamacoesDeleted') || '[]';
          let deletedArr = JSON.parse(deletedRaw || '[]');
          if (Array.isArray(deletedArr) && deletedArr.length) {
            deletedArr = deletedArr.filter(d => Number(d) !== Number(id));
            localStorage.setItem('mixReclamacoesDeleted', JSON.stringify(deletedArr));
          }
        } catch (e) { /* ignore */ }
        console.debug('[admin] reclamacao deletada no servidor');
        renderizar();
        mostrarPopup && mostrarPopup('Reclamação excluída do servidor.', 'sucesso');
      } else {
        console.debug('[admin] não foi possível deletar no servidor');
        mostrarPopup && mostrarPopup('Não foi possível excluir no servidor. Verifique a conexão e tente novamente.', 'erro');
      }
    })();
  }

  // Carregar e renderizar
  await loadReclamacoes();
});
