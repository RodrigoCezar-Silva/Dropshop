/**
 * Painel de perfil do cliente.
 * Gerencia abas, preferências, pedidos e navegação da área "Minha Conta".
 */
document.addEventListener("DOMContentLoaded", () => {
  const painelCliente = document.getElementById("painelCliente");

  // Garantia defensiva: esconder modal de exclusão no carregamento (evita aberturas acidentais)
  (function ensureModalHiddenOnLoad() {
    try {
      const ov = document.getElementById('confirmExcluirModal');
      if (ov) {
        ov.classList.remove('show');
        ov.classList.remove('hide');
        ov.setAttribute('aria-hidden', 'true');
      }
      const modalClose = document.getElementById('modalCloseBtn');
      if (modalClose) modalClose.setAttribute('aria-hidden', 'false');
    } catch (e) { /* ignore */ }
  })();

  // Botão Minha Conta disponível em páginas gerais
  const btnMinhaConta = document.getElementById("btnMinhaConta");
  if (btnMinhaConta) {
    btnMinhaConta.addEventListener("click", () => {
      window.location.href = "./html/meu-perfil.html";
    });
  }

  // Modal helpers para confirmação com senha
  function abrirModalConfirmacao() {
    return new Promise(resolve => {
      // criar modal dinamicamente para evitar qualquer estado pré-existente no DOM
      const existing = document.getElementById('confirmExcluirModal');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'confirmExcluirModal';
      overlay.className = 'modal-overlay';
      overlay.setAttribute('aria-hidden', 'true');

      overlay.innerHTML = `
        <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <button class="modal-close" id="modalCloseBtn" aria-label="Fechar">×</button>
          <h2 id="modalTitle">Confirmar exclusão de conta</h2>
          <p>Por favor, digite sua senha para confirmar a exclusão permanente da sua conta.</p>
          <div class="modal-body">
            <label for="modalSenha" class="modal-label">Senha</label>
            <div class="input-icon modal-input-wrap">
              <input id="modalSenha" class="modal-input" type="password" autocomplete="current-password" placeholder="Digite sua senha">
              <button type="button" id="modalToggleSenha" class="modal-eye" aria-label="Mostrar senha"><i class="fa fa-eye"></i></button>
            </div>
            <div id="modalError" class="modal-error" role="alert" aria-live="assertive" style="display:none;"></div>
            <div class="modal-actions">
              <button id="modalCancelar" class="btn btn-secondary">Cancelar</button>
              <button id="modalConfirmar" class="btn btn-danger"><span class="btn-text">Excluir conta</span><span class="btn-spinner" aria-hidden="true"></span></button>
            </div>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const senhaInput = overlay.querySelector('#modalSenha');
      const btnCancelar = overlay.querySelector('#modalCancelar');
      const btnConfirmar = overlay.querySelector('#modalConfirmar');
      const btnClose = overlay.querySelector('#modalCloseBtn');
      const btnToggle = overlay.querySelector('#modalToggleSenha');
      const modalError = overlay.querySelector('#modalError');

      let settled = false;

      function cleanup() {
        try {
          overlay.classList.remove('show');
          overlay.setAttribute('aria-hidden', 'true');
          senhaInput.value = '';
          btnCancelar && btnCancelar.removeEventListener('click', onCancelar);
          btnConfirmar && btnConfirmar.removeEventListener('click', onConfirmar);
          btnClose && btnClose.removeEventListener('click', onCancelar);
          btnToggle && btnToggle.removeEventListener('click', toggleSenha);
          senhaInput && senhaInput.removeEventListener('input', onInput);
          overlay.removeEventListener('click', onOverlayClick);
          window.removeEventListener('keydown', onKey);
        } catch (e) { /* ignore */ }
        // remover do DOM após animação
        setTimeout(() => { try { overlay.remove(); } catch (e) {} }, 160);
        if (modalError) { modalError.style.display = 'none'; modalError.textContent = ''; }
      }

      function finish(result) { if (settled) return; settled = true; cleanup(); resolve(result); }

      function onCancelar(e) { e && e.preventDefault(); finish(null); }

      function onConfirmar(e) { e && e.preventDefault(); const v = senhaInput.value.trim(); if (!v) { senhaInput.classList.add('input-error'); senhaInput.focus(); return; }
        const close = () => { if (!settled) { settled = true; cleanup(); } else { cleanup(); } };
        finish({ senha: v, close, overlay, btnConfirmar, btnCancelar, modalError, senhaInput });
      }

      function toggleSenha(e) {
        e && e.preventDefault();
        if (!senhaInput) return;
        const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', tipo);
        if (btnToggle) {
          const ic = btnToggle.querySelector('i');
          if (ic) { ic.classList.toggle('fa-eye'); ic.classList.toggle('fa-eye-slash'); }
        }
        senhaInput.focus();
      }

      function onInput() { senhaInput.classList.remove('input-error'); btnConfirmar.disabled = !senhaInput.value.trim(); if (modalError) { modalError.style.display = 'none'; modalError.textContent = ''; } }

      function onOverlayClick(e) { if (e.target === overlay) { onCancelar(e); } }

      // mostrar
      requestAnimationFrame(() => {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
      });

      senhaInput && senhaInput.setAttribute('type', 'password');
      if (btnToggle) {
        const icInit = btnToggle.querySelector('i'); if (icInit) { icInit.classList.remove('fa-eye-slash'); icInit.classList.add('fa-eye'); }
      }
      senhaInput && senhaInput.focus();
      btnConfirmar && (btnConfirmar.disabled = !senhaInput.value.trim());
      btnCancelar && btnCancelar.addEventListener('click', onCancelar);
      btnConfirmar && btnConfirmar.addEventListener('click', onConfirmar);
      btnClose && btnClose.addEventListener('click', onCancelar);
      btnToggle && btnToggle.addEventListener('click', toggleSenha);
      senhaInput && senhaInput.addEventListener('input', onInput);
      overlay.addEventListener('click', onOverlayClick);

      function onKey(e) { if (e.key === 'Escape') { onCancelar(); } }
      window.addEventListener('keydown', onKey);
    });
  }

  // Se não estiver na página do painel do cliente, não executa o restante.
  if (!painelCliente) {
    return;
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const clienteId = localStorage.getItem("clienteId");
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  const token = localStorage.getItem('token') || localStorage.getItem('tokenCliente');
  const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : window.location.origin;
  const chavePreferencias = "mixClientePreferencias";

  if (tipoUsuario !== "Cliente" || !clienteId) {
    window.location.href = "login-cliente.html";
    return;
  }

  const preferenciasPadrao = {
    emailPedidos: true,
    whatsappOfertas: false,
    abrirUltimaAba: true,
    abaPadrao: "visao-geral"
  };

  function obterPreferencias() {
    try {
      let gotPublic = false;
      const salvas = JSON.parse(localStorage.getItem(chavePreferencias));
      return { ...preferenciasPadrao, ...(salvas || {}) };
    } catch {
      return { ...preferenciasPadrao };
    }
  }

  function salvarPreferencias(preferencias) {
    localStorage.setItem(chavePreferencias, JSON.stringify(preferencias));
  }

  function ativarAba(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });

    tabContents.forEach(content => {
      content.classList.toggle("active", content.id === tabId);
    });

    localStorage.setItem("mixClienteUltimaAba", tabId);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      ativarAba(btn.dataset.tab);
    });
  });

  const preferencias = obterPreferencias();
  const ultimaAba = localStorage.getItem("mixClienteUltimaAba");
  const abaInicial = preferencias.abrirUltimaAba && ultimaAba ? ultimaAba : preferencias.abaPadrao;
  if (document.getElementById(abaInicial)) {
    ativarAba(abaInicial);
  }

  // Renderizar reclamações do cliente na aba "reclamacoes"
  async function renderReclamacoes() {
    const container = document.getElementById('listaReclamacoesCliente');
    if (!container) return;
    // obter email do cliente exibido na página (para filtro no servidor)
    const clienteEmailEl = document.getElementById('emailCliente');
    const clienteEmail = clienteEmailEl ? (clienteEmailEl.value || clienteEmailEl.textContent || '').trim().toLowerCase() : '';
    let lista = [];
    // tenta buscar do servidor primeiro (varios hosts candidatos), usando ?email= para filtrar; se falhar usa localStorage
    try {
      const bases = [];
      if (typeof apiBase !== 'undefined' && apiBase) bases.push(apiBase);
      bases.push('http://localhost:3000', 'http://127.0.0.1:3000', '');
      let resp = null;
      for (const b of bases) {
        try {
          const base = (b ? b : '');
          const url = base + '/api/reclamacoes' + (clienteEmail ? `?email=${encodeURIComponent(clienteEmail)}` : '');
          resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (resp && resp.ok) break;
        } catch (e) {
          resp = null;
        }
      }
      if (resp && resp.ok) {
        const json = await resp.json();
        // json pode ser array ou objeto
        lista = Array.isArray(json) ? json : (json.reclamacoes || json.data || []);
        // sincronizar localStorage com servidor (remover itens excluídos localmente se o servidor já refletiu a mudança)
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
      } else {
        // fallback local (filtrar itens marcados como deletados)
        const raw = localStorage.getItem('mixReclamacoes') || '[]';
        try { lista = JSON.parse(raw); } catch (e) { lista = []; }
        try {
          const deletedRaw = localStorage.getItem('mixReclamacoesDeleted') || '[]';
          const deleted = JSON.parse(deletedRaw || '[]');
          if (Array.isArray(deleted) && deleted.length) {
            const delSet = new Set(deleted.map(x => Number(x)));
            lista = (lista || []).filter(item => !delSet.has(Number(item.id)));
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      const raw = localStorage.getItem('mixReclamacoes') || '[]';
      try { lista = JSON.parse(raw); } catch (err) { lista = []; }
    }

    const filtradas = lista.filter(r => {
      if (!r) return false;
      if (clienteEmail && r.email && r.email.toLowerCase() === clienteEmail) return true;
      const nomeCliente = (localStorage.getItem('nome') || '').trim().toLowerCase();
      if (nomeCliente && r.nome && r.nome.trim().toLowerCase().includes(nomeCliente)) return true;
      return false;
    });

    if (!filtradas.length) {
      container.innerHTML = '<p class="reclamacoes-vazio">Nenhuma reclamação encontrada.</p>';
      return;
    }

    const html = filtradas.map(r => {
      // determina miniatura: se for do cliente atual, tenta usar a foto já carregada na página
      let avatarSrc = '';
      try {
        const minhaFotoEl = document.getElementById('fotoClienteResumo') || document.getElementById('mp-avatar') || document.getElementById('fotoCliente');
        const clienteEmailEl = document.getElementById('emailCliente');
        const clienteEmailOnPage = clienteEmailEl ? (clienteEmailEl.value || clienteEmailEl.textContent || '').trim().toLowerCase() : '';
        if (minhaFotoEl && minhaFotoEl.src && r.email && clienteEmailOnPage && r.email.toLowerCase() === clienteEmailOnPage) {
          avatarSrc = minhaFotoEl.src;
        }
      } catch (e) { avatarSrc = ''; }

      if (!avatarSrc) {
        // gerar avatar com iniciais como fallback
        const initials = (r.nome || '')
          .split(/\s+/)
          .filter(Boolean)
          .map(n => n[0])
          .slice(0,2)
          .join('')
          .toUpperCase() || 'U';
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='#eef2ff'/><text x='50%' y='50%' dy='0.35em' text-anchor='middle' fill='#4f46e5' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='28'>${initials}</text></svg>`;
        avatarSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      }
      // render attachments: prefer `attachments` (from server) then fallback to `anexos` (legacy/local)
      const attachments = Array.isArray(r.attachments) && r.attachments.length ? r.attachments : (Array.isArray(r.anexos) ? r.anexos : []);
      const anexosHtml = attachments.map(a => {
        // a can be a string or object
        let src = '';
        let mimetype = '';
        if (typeof a === 'string') { src = a; }
        else { src = a.url || a.filename || (a.id ? `/api/reclamacao/attachment/${a.id}` : ''); mimetype = a.mimetype || a.type || ''; }
        if (!src) return '';
        const lower = String(src).toLowerCase();
        // informação de quem enviou anexos (enviadoPor) quando disponível
        const enviadoPor = (typeof a === 'object' && a.enviadoPor) ? (`Enviado por: ${escapeHtml((a.enviadoPor.nome||'') + ' <' + (a.enviadoPor.email||'') + '>' )}`) : '';
        if ((mimetype && mimetype.startsWith('video/')) || lower.endsWith('.mp4') || lower.includes('.mp4') || lower.includes('/video')) {
          return `<div class="anexo-wrap" ${enviadoPor?`title="${enviadoPor}"`:''}><video class="reclamacao-thumb" muted playsinline preload="metadata" src="${src}" data-src="${src}"></video></div>`;
        }
        return `<div class="anexo-wrap" ${enviadoPor?`title="${enviadoPor}"`:''}><img src="${src}" class="reclamacao-thumb" alt="${(a.originalName||a.name||a.filename||'Anexo')}"></div>`;
      }).join('') || '';

      const respostasHtml = (r.respostas && Array.isArray(r.respostas) && r.respostas.length) ? (() => {
        const last = r.respostas[r.respostas.length - 1];
        const dataTxt = last && (last.data || last.data || '') ? escapar(last.data || '') : '';
        const autor = last && (last.autor || last.autor) ? escapar(last.autor) : 'Atendimento';
        const texto = last && (last.texto || last.text || '') ? escapar(last.texto || last.text || '') : '';
        return `<div class="reclamacao-ultima-resposta">
                  <strong><i class="fa-solid fa-reply"></i> ÚLTIMA RESPOSTA (${dataTxt}):</strong>
                  <div>${texto}</div>
                </div>`;
      })() : '';

      return `
        <article class="reclamacao-card ${((r.status||'')==='pendente'?'pending':'')}">
          <div class="reclamacao-header">
            <div class="reclamacao-cliente">
              <div class="reclamacao-avatar-wrap"><img src="${avatarSrc}" alt="avatar" class="reclamacao-avatar"></div>
              <div class="reclamacao-meta-wrap">
                <div class="reclamacao-nome">${(r.nome||'')}</div>
                <div class="reclamacao-email">${(r.email||'')} ${r.telefone?('&middot; '+escapar(r.telefone)):''}</div>
              </div>
            </div>
            <div class="reclamacao-head-right">
              <div class="reclamacao-data">${(r.data||'')}</div>
              <div class="reclamacao-status">${(r.status||'pendente').toUpperCase()}</div>
            </div>
          </div>
          <h4 class="reclamacao-assunto"><i class="fa-solid fa-tag"></i> ${(r.assunto||'')}</h4>
          <p class="reclamacao-texto">${(r.reclamacao||'')}</p>
          <div class="reclamacao-anexos">${anexosHtml}</div>
          ${respostasHtml}
          <div class="reclamacao-acoes">
            <button class="btn-responder-cliente" data-id="${r.id}"><i class="fa-solid fa-reply"></i> Responder</button>
            <button class="btn-excluir-reclamacao" data-id="${r.id}"><i class="fa-solid fa-trash"></i> Excluir</button>
          </div>
        </article>`;
    }).join('');

    container.innerHTML = html;

    // adicionar listener para responder (cliente)
    container.querySelectorAll('.btn-responder-cliente').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id && Number(btn.dataset.id);
        const raw = localStorage.getItem('mixReclamacoes') || '[]';
        let lista = [];
        try { lista = JSON.parse(raw); } catch (e) { lista = []; }
        const rec = lista.find(x => Number(x.id) === Number(id));
        // se não encontrado localmente, tentar buscar do servidor
        if (!rec) {
          fetch((typeof apiBase !== 'undefined' ? apiBase : '') + `/api/reclamacoes`).then(r=>r.json()).then(json=>{
            const found = (Array.isArray(json) ? json : (json.reclamacoes||json.data||[])).find(x=>Number(x.id)===Number(id));
            if (found) abrirModalRespostaCliente(found, lista);
          }).catch(()=>{ mostrarPopup('Não foi possível carregar a reclamação do servidor.', 'erro'); });
        } else {
          abrirModalRespostaCliente(rec, lista);
        }
      });
    });

    // listener para excluir reclamação (cliente)
    container.querySelectorAll('.btn-excluir-reclamacao').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id && Number(btn.dataset.id);
        if (!confirm('Deseja realmente excluir esta reclamação?')) return;
        // tentar deletar no servidor primeiro
        let deletedOnServer = false;
        try {
          const bases = [];
          if (typeof apiBase !== 'undefined' && apiBase) bases.push(apiBase);
          bases.push('http://localhost:3000', 'http://127.0.0.1:3000', '');
          for (const b of bases) {
            try {
              const url = (b ? b : '') + `/api/reclamacoes/${id}`;
              const resp = await fetch(url, { method: 'DELETE' });
              if (resp && resp.ok) { deletedOnServer = true; break; }
            } catch (e) { continue; }
          }
        } catch (e) { /* silencioso */ }

        // somente remover localmente se o servidor confirmou a exclusão
        if (deletedOnServer) {
          try {
            const raw = localStorage.getItem('mixReclamacoes') || '[]';
            let lista = [];
            try { lista = JSON.parse(raw); } catch (e) { lista = []; }
            const idx = lista.findIndex(x => Number(x.id) === Number(id));
            if (idx !== -1) {
              lista.splice(idx, 1);
              localStorage.setItem('mixReclamacoes', JSON.stringify(lista));
            }
          } catch (e) { /* ignore */ }
          // garantir remoção da lista de deletados
          try {
            const deletedRaw = localStorage.getItem('mixReclamacoesDeleted') || '[]';
            let deleted = JSON.parse(deletedRaw || '[]');
            if (Array.isArray(deleted) && deleted.length) {
              deleted = deleted.filter(d => Number(d) !== Number(id));
              localStorage.setItem('mixReclamacoesDeleted', JSON.stringify(deleted));
            }
          } catch (e) { /* ignore */ }
          renderReclamacoes();
          mostrarPopup('Reclamação excluída do servidor.', 'sucesso');
        } else {
          // não remover localmente: informar o usuário para tentar novamente
          mostrarPopup('Não foi possível excluir no servidor. Verifique a conexão e tente novamente.', 'erro');
        }
      });
    });

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
          v.setAttribute('controls', '');
          v.style.width = '240px';
          v.style.height = 'auto';
        });
      });
    })(container);

    // eventos de editar / reenviar
    container.querySelectorAll('.btn-editar-reclamacao').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id && Number(btn.dataset.id);
        const raw = localStorage.getItem('mixReclamacoes') || '[]';
        let lista = [];
        try { lista = JSON.parse(raw); } catch (e) { lista = []; }
        const rec = lista.find(x => Number(x.id) === Number(id));
        if (rec) abrirModalEdicao(rec);
      });
    });

    container.querySelectorAll('.btn-reenviar-reclamacao').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id && Number(btn.dataset.id);
        const raw = localStorage.getItem('mixReclamacoes') || '[]';
        let lista = [];
        try { lista = JSON.parse(raw); } catch (e) { lista = []; }
        const idx = lista.findIndex(x => Number(x.id) === Number(id));
        if (idx === -1) return mostrarPopup('Reclamação não encontrada.', 'erro');

        // marcar como pendente e atualizar timestamp
        lista[idx].status = 'pendente';
        lista[idx].data = new Date().toLocaleString('pt-BR');
        localStorage.setItem('mixReclamacoes', JSON.stringify(lista));
        renderReclamacoes();
        mostrarPopup('Reclamação reenviada localmente.', 'sucesso');

        // tentar sincronizar com servidor (caso exista endpoint de atualização)
        try {
          const putUrl = (typeof apiBase !== 'undefined' ? apiBase : '') + `/api/reclamacoes/${lista[idx].id}`;
          await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lista[idx]) }).catch(()=>{});
        } catch (e) { /* silencioso */ }
      });
    });
  }

  // Modal dinâmico para edição da reclamação (cliente)
  function abrirModalEdicao(reclamacao) {
    if (!reclamacao) return;
    // remover modal antigo
    const existing = document.getElementById('modalEditarReclamacao');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modalEditarReclamacao';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-conteudo">
        <button class="modal-fechar" id="fecharEditarModal">&times;</button>
        <div class="modal-header"><i class="fa fa-edit"></i><h2>Editar Reclamação</h2></div>
        <div class="modal-info">
          <div class="modal-info-item"><i class="fa fa-user"></i> <strong>${escapar(reclamacao.nome)}</strong></div>
          <div class="modal-info-item"><i class="fa fa-envelope"></i> ${escapar(reclamacao.email)}</div>
        </div>
        <div class="modal-form">
          <label for="editarAssunto">Assunto</label>
          <input id="editarAssunto" type="text" value="${escapar(reclamacao.assunto||'')}">
          <label for="editarTexto">Reclamação</label>
          <textarea id="editarTexto" rows="6">${escapar(reclamacao.reclamacao||'')}</textarea>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
            <button id="btnCancelarEditar" class="btn-excluir-reclamacao">Cancelar</button>
            <button id="btnSalvarEditar" class="btn-responder"><i class="fa fa-save"></i> Salvar</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const fechar = () => { try { overlay.remove(); } catch (e) {} };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
    document.getElementById('fecharEditarModal').addEventListener('click', fechar);
    document.getElementById('btnCancelarEditar').addEventListener('click', (e) => { e.preventDefault(); fechar(); });

    document.getElementById('btnSalvarEditar').addEventListener('click', async (e) => {
      e.preventDefault();
      const novoAssunto = document.getElementById('editarAssunto').value.trim();
      const novoTexto = document.getElementById('editarTexto').value.trim();
      if (!novoAssunto || !novoTexto) return mostrarPopup('Preencha assunto e texto.', 'erro');

      // atualizar localStorage
      const raw = localStorage.getItem('mixReclamacoes') || '[]';
      let lista = [];
      try { lista = JSON.parse(raw); } catch (e) { lista = []; }
      const idx = lista.findIndex(x => Number(x.id) === Number(reclamacao.id));
      if (idx === -1) return mostrarPopup('Reclamação não encontrada para salvar.', 'erro');
      lista[idx].assunto = novoAssunto;
      lista[idx].reclamacao = novoTexto;
      lista[idx].status = 'pendente';
      lista[idx].data = new Date().toLocaleString('pt-BR');
      localStorage.setItem('mixReclamacoes', JSON.stringify(lista));
      fechar();
      renderReclamacoes();
      mostrarPopup('Reclamação atualizada e marcada como pendente.', 'sucesso');

      // tentativa de sincronização com servidor (caso disponivel)
      try {
        const putUrl = (typeof apiBase !== 'undefined' ? apiBase : '') + `/api/reclamacoes/${lista[idx].id}`;
        await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lista[idx]) }).catch(()=>{});
      } catch (e) { /* silencioso */ }
    });
  }

  // Modal para responder (cliente)
  function abrirModalRespostaCliente(reclamacao, listaLocal) {
    if (!reclamacao) return;
    const existing = document.getElementById('modalResponderReclamacao');
    if (existing) existing.remove();

    // preparar attachments
    const attachments = Array.isArray(reclamacao.attachments) && reclamacao.attachments.length ? reclamacao.attachments : (Array.isArray(reclamacao.anexos) ? reclamacao.anexos : []);
    const anexosHtml = attachments.map(a => {
      let src = '';
      let mimetype = '';
      if (typeof a === 'string') src = a;
      else { src = a.url || a.filename || (a.id ? `/api/reclamacao/attachment/${a.id}` : ''); mimetype = a.mimetype || a.type || ''; }
      if (!src) return '';
      const lower = String(src).toLowerCase();
      if ((mimetype && mimetype.startsWith('video/')) || lower.endsWith('.mp4') || lower.includes('.mp4') || lower.includes('/video')) {
        return `<div class="modal-thumb-wrap"><video controls class="modal-thumb" src="${src}"></video></div>`;
      }
      return `<div class="modal-thumb-wrap"><img src="${src}" class="modal-thumb" alt="${escapar((a.originalName||a.name||a.filename||'Anexo'))}"></div>`;
    }).join('');

    const respostasHist = (reclamacao.respostas && Array.isArray(reclamacao.respostas) && reclamacao.respostas.length) ? reclamacao.respostas.map(resp => {
      return `<div class="resposta-item"><div class="resposta-data"><i class="fa-regular fa-clock"></i> ${escapar(resp.data||'')}</div><p class="resposta-texto">${escapar(resp.texto||resp.text||'')}</p></div>`;
    }).join('') : '<p class="sem-respostas">Nenhuma resposta enviada ainda.</p>';

    // preparar avatar/miniatura (preferir fotoBase64 quando disponível)
    let avatarHtml = '';
    try {
      if (reclamacao.fotoBase64) {
        const mime = reclamacao.fotoMime || 'image/jpeg';
        const dataUrl = `data:${mime};base64,${reclamacao.fotoBase64}`;
        avatarHtml = `<div class="modal-avatar"><img src="${dataUrl}" alt="avatar"/></div>`;
      } else {
        const initials = (reclamacao.nome || '').split(/\s+/).filter(Boolean).map(n=>n[0]).slice(0,2).join('').toUpperCase() || 'U';
        avatarHtml = `<div class="modal-avatar placeholder"><span>${initials}</span></div>`;
      }
    } catch (e) { avatarHtml = ''; }

    const overlay = document.createElement('div');
    overlay.id = 'modalResponderReclamacao';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-conteudo modal-large">
        <button class="modal-fechar" id="fecharResponderModal">&times;</button>
        <div class="modal-header"><i class="fa fa-reply"></i><h2>Responder Reclamação</h2></div>
        <div class="modal-body">
          <div class="modal-info">
            ${avatarHtml}
            <div class="modal-info-details">
              <div class="modal-info-item name"><strong>${escapar(reclamacao.nome||'')}</strong></div>
              <div class="modal-info-item email"><i class="fa fa-envelope"></i> ${escapar(reclamacao.email||'')}</div>
              ${reclamacao.telefone ? `<div class="modal-info-item phone"><i class="fa fa-phone"></i> ${escapar(reclamacao.telefone)}</div>` : ''}
              <div class="modal-info-item tag"><i class="fa fa-tag"></i> ${escapar(reclamacao.assunto||'')}</div>
              <div class="modal-info-item message"><i class="fa fa-message"></i> ${escapar(reclamacao.reclamacao||'')}</div>
            </div>
          </div>
          <div class="modal-anexos-container">
            <h4>Anexos</h4>
            <div class="modal-anexos">${anexosHtml}</div>
          </div>
          <div class="modal-historico">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico de Respostas</h3>
            ${respostasHist}
          </div>
          <div class="modal-responder">
            <label for="responderTexto">Sua Resposta:</label>
            <textarea id="responderTexto" rows="6" placeholder="Digite sua resposta ao cliente..."></textarea>
            <div class="modal-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
              <button id="btnCancelarResponder" class="btn-excluir-reclamacao">Cancelar</button>
              <button id="btnEnviarResponder" class="btn-responder"><i class="fa fa-paper-plane"></i> Enviar</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const fechar = () => { try { overlay.remove(); } catch (e) {} };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
    document.getElementById('fecharResponderModal').addEventListener('click', fechar);
    document.getElementById('btnCancelarResponder').addEventListener('click', (e) => { e.preventDefault(); fechar(); });

    // enviar
    document.getElementById('btnEnviarResponder').addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      const texto = (document.getElementById('responderTexto').value || '').trim();
      if (!texto) return mostrarPopup('Digite uma resposta antes de enviar.', 'erro');
      btn.disabled = true; btn.textContent = 'Enviando...';

      const respostaObj = { texto, data: new Date().toLocaleString('pt-BR'), autor: localStorage.getItem('nome') || 'Cliente' };

      // atualizar local
      try {
        let lista = listaLocal || [];
        if (!lista.length) { try { lista = JSON.parse(localStorage.getItem('mixReclamacoes') || '[]'); } catch { lista = []; } }
        const idx = lista.findIndex(x => Number(x.id) === Number(reclamacao.id));
        if (idx === -1) {
          const copy = {...reclamacao, respostas: reclamacao.respostas ? reclamacao.respostas.slice() : [] };
          copy.respostas.push(respostaObj);
          lista.push(copy);
        } else {
          if (!lista[idx].respostas) lista[idx].respostas = [];
          lista[idx].respostas.push(respostaObj);
        }
        localStorage.setItem('mixReclamacoes', JSON.stringify(lista));
      } catch (err) { console.warn('Falha ao atualizar localStorage com resposta:', err && err.message); }

      // enviar para servidor
      try {
        const putUrl = (typeof apiBase !== 'undefined' ? apiBase : '') + `/api/reclamacoes/${reclamacao.id}`;
        const body = { respostas: (reclamacao.respostas ? reclamacao.respostas.slice() : []).concat([respostaObj]) };
        const headers = { 'Content-Type': 'application/json' };
        const tokenLocal = localStorage.getItem('token') || localStorage.getItem('tokenCliente');
        if (tokenLocal) headers['Authorization'] = 'Bearer ' + tokenLocal;
        const resp = await fetch(putUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (resp && resp.ok) mostrarPopup('Resposta enviada ao servidor.', 'sucesso');
        else {
          console.warn('PUT /api/reclamacoes respondeu:', resp && resp.status);
          mostrarPopup('Resposta salva localmente (será sincronizada depois).', 'aviso');
        }
      } catch (e) {
        console.warn('Falha ao enviar resposta ao servidor:', e && e.message);
        mostrarPopup('Resposta salva localmente (será sincronizada depois).', 'aviso');
      }

      fechar();
      renderReclamacoes();
    });
  }

  function escapar(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
  function escapeHtml(s) { return String(s||'').replace(/"/g, '&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  preencherFormularioPreferencias(preferencias);
  atualizarResumoPreferencias(preferencias);

  const formConfiguracoes = document.getElementById("formConfiguracoes");
  const btnResetPreferencias = document.getElementById("btnResetPreferencias");
  const listaCompras = document.getElementById("listaCompras");

  if (formConfiguracoes) {
    formConfiguracoes.addEventListener("submit", event => {
      event.preventDefault();

      const novasPreferencias = {
        emailPedidos: document.getElementById("prefEmailPedidos").checked,
        whatsappOfertas: document.getElementById("prefWhatsappOfertas").checked,
        abrirUltimaAba: document.getElementById("prefAbrirUltimaAba").checked,
        abaPadrao: document.getElementById("prefAbaPadrao").value
      };

      salvarPreferencias(novasPreferencias);
      atualizarResumoPreferencias(novasPreferencias);
      aplicarModoPainel(novasPreferencias);
      mostrarPopup("Preferências atualizadas com sucesso!", "sucesso");
    });
  }

  if (btnResetPreferencias) {
    btnResetPreferencias.addEventListener("click", () => {
      preencherFormularioPreferencias(preferenciasPadrao);
      salvarPreferencias(preferenciasPadrao);
      atualizarResumoPreferencias(preferenciasPadrao);
      aplicarModoPainel(preferenciasPadrao);
      mostrarPopup("Preferências restauradas para o padrão.", "sucesso");
    });
  }

  aplicarModoPainel(preferencias);
  renderizarCompras();

  // quando a aba "reclamacoes" for ativada, renderiza
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('.tab-btn');
    if (!t) return;
    if (t.dataset && t.dataset.tab === 'reclamacoes') setTimeout(renderReclamacoes, 40);
  });

  // Se fomos redirecionados do formulário de contato, abrir aba de reclamações
  try {
    const abrir = localStorage.getItem('abrirReclamacoes');
    if (abrir) {
      localStorage.removeItem('abrirReclamacoes');
      // tenta localizar a última reclamação enviada (localStorage mixReclamacoes) e mostrar popup para continuar
      try {
        const listaRaw = localStorage.getItem('mixReclamacoes') || '[]';
        const lista = JSON.parse(listaRaw);
        let ultima = null;
        if (Array.isArray(lista) && lista.length) {
          // preferir última com mesmo email do usuário exibido na página
          const emailOnPageEl = document.getElementById('emailCliente');
          const emailOnPage = emailOnPageEl ? (emailOnPageEl.value || emailOnPageEl.textContent || '').trim().toLowerCase() : '';
          for (let i = lista.length - 1; i >= 0; i--) {
            const it = lista[i];
            if (!it) continue;
            if (emailOnPage && it.email && it.email.toLowerCase() === emailOnPage) { ultima = it; break; }
            if (!ultima) ultima = it;
          }
        }
        if (ultima) showContinueReclamacaoPopup(ultima);
        else if (document.getElementById('reclamacoes')) ativarAba('reclamacoes');
      } catch (e) { if (document.getElementById('reclamacoes')) ativarAba('reclamacoes'); }
    }
  } catch(e){}

  // mostra popup para continuar edição/resposta da reclamação enviada (usa showStyledPopup se disponível)
  function showContinueReclamacaoPopup(reclamacao) {
    try {
      if (window.showStyledPopup) {
        window.showStyledPopup({
          title: 'Reclamação enviada',
          message: 'Sua reclamação foi recebida. Deseja ver todas as suas reclamações?',
          buttons: [
            { label: 'Ver Reclamações', onClick: () => { if (document.getElementById('reclamacoes')) ativarAba('reclamacoes'); } },
            { label: 'Fechar', onClick: () => {}, close: true }
          ]
        });
        return;
      }

      // fallback: cria popup manualmente
      const overlay = document.createElement('div'); overlay.className = 'mix-popup-overlay';
      overlay.setAttribute('aria-hidden', 'false');
      const box = document.createElement('div'); box.className = 'mix-popup-box';
      const title = document.createElement('h3'); title.className = 'mix-popup-title'; title.textContent = 'Reclamação enviada';
      const msg = document.createElement('p'); msg.className = 'mix-popup-message'; msg.textContent = 'Sua reclamação foi recebida. Deseja continuar editando ou ver todas as suas reclamações?';

      const actions = document.createElement('div'); actions.className = 'mix-popup-actions';
      const btnVer = document.createElement('button'); btnVer.className = 'mix-popup-btn'; btnVer.textContent = 'Ver Reclamações';
      const btnFechar = document.createElement('button'); btnFechar.className = 'mix-popup-btn'; btnFechar.textContent = 'Fechar';

      actions.appendChild(btnVer); actions.appendChild(btnFechar);
      box.appendChild(title); box.appendChild(msg); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

      function cleanup() { try { overlay.remove(); } catch (e) {} }

      btnFechar.addEventListener('click', () => { cleanup(); });
      btnVer.addEventListener('click', () => { cleanup(); if (document.getElementById('reclamacoes')) ativarAba('reclamacoes'); });
    } catch (e) { console.warn('Erro ao exibir popup de continuar reclamacao:', e && e.message); if (document.getElementById('reclamacoes')) ativarAba('reclamacoes'); }
  }

  // render inicial caso já estejamos na aba
  if (document.querySelector('.tab-btn.active') && document.querySelector('.tab-btn.active').dataset.tab === 'reclamacoes') {
    renderReclamacoes();
  }

  if (listaCompras) {
    listaCompras.addEventListener("click", event => {
      const botaoCancelar = event.target.closest(".btn-cancelar-pedido");
      if (!botaoCancelar) return;

      const pedidoId = botaoCancelar.dataset.pedidoId;
      cancelarPedido(pedidoId);
    });
  }

  // Carrega dados do cliente: tenta /me quando houver token, e faz fallback público por id
  async function carregarDadosCliente() {
    // Helper: tenta uma lista de URLs até encontrar uma resposta OK
    async function tryFetchUrls(urls, options) {
      for (const u of urls) {
        try {
          const res = await fetch(u, options);
          if (res && res.ok) return res;
          // se recebeu 4xx/5xx, pare e retorne para que o caller trate (por exemplo 404)
        } catch (err) {
          // erro de rede (ex: ECONNREFUSED) — tentar próximo
          console.debug('[meu-perfil] tryFetchUrls falhou para', u, err && err.message);
        }
      }
      return null;
    }

    try {
      // candidate bases: apiBase (configurado), depois dois hosts comuns e por fim caminho relativo
      const bases = [];
      if (apiBase) bases.push(apiBase);
      bases.push('http://localhost:3000', 'http://127.0.0.1:3000', '');

      const urls = bases.map(b => (b ? b : '') + `/api/cliente/${clienteId}`);

      // tenta buscar o cliente público usando os possíveis hosts
        const pubResp = await tryFetchUrls(urls);
        if (pubResp) {
          try {
            const pubData = await pubResp.json();
            console.debug('[meu-perfil] pubData recebido', pubData);
            if (pubData && pubData.sucesso) { aplicarDadosCliente(pubData); gotPublic = true; }
            else if (pubData && (pubData.nome || pubData.id || pubData.cliente)) { aplicarDadosCliente(pubData); gotPublic = true; }
          } catch (err) {
            console.debug('[meu-perfil] erro ao parsear JSON do cliente público', err && err.message);
          }
        } else {
          console.debug('[meu-perfil] não conseguiu alcançar /api/cliente/:id em nenhum host candidato');
        }

      // agora tenta o endpoint protegido /me se houver token — silencioso em caso de falha de rede
      if (token && !gotPublic) {
        const meUrls = bases.map(b => (b ? b : '') + '/api/cliente/me');
        const meResp = await tryFetchUrls(meUrls, { headers: { 'Authorization': 'Bearer ' + token } });
        if (meResp) {
          try {
            const data = await meResp.json();
            if (data && data.sucesso) aplicarDadosCliente(data);
          } catch (err) {
            console.debug('[meu-perfil] erro ao parsear JSON de /me', err && err.message);
          }
        } else {
          console.debug('[meu-perfil] /api/cliente/me indisponível em todos hosts candidatos (silencioso)');
        }
      }
    } catch (e) {
      console.warn('carregarDadosCliente:', e && e.message);
      mostrarPopup('Não foi possível carregar os dados do cliente.', 'erro');
    }
  }

  if (clienteId) carregarDadosCliente();

  // Extrai e aplica dados do cliente em elementos da página
  function aplicarDadosCliente(data) {
    if (!data) return;

    // Helper para preencher múltiplos IDs possíveis (compatibilidade entre versões)
    const setValue = (ids, value) => {
      ids = Array.isArray(ids) ? ids : [ids];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') el.value = value || '';
        else el.textContent = value || '';
      });
    };

    console.debug('[meu-perfil] aplicarDadosCliente recebido', data);

    // Normaliza payloads que podem vir em formatos diferentes
    let cliente = data;
    if (data.cliente) cliente = data.cliente;
    if (data.clientes && Array.isArray(data.clientes) && data.clientes.length) cliente = data.clientes[0];
    if (Array.isArray(data) && data.length) cliente = data[0];
    if (data.data && (data.data.nome || data.data.id)) cliente = data.data;

    // Nome / Sobrenome
    setValue(['nomeCliente','campo-nome','mp-name'], cliente.nome || '');
    // CPF
    setValue(['cpfCliente','campo-cpf'], cliente.cpf || '');
    // Email
    setValue(['emailCliente','campo-email','mp-email'], cliente.email || '');
    // Telefone
    setValue(['telefoneCliente','campo-telefone'], cliente.telefone || '');
    // Data de nascimento
    const dataN = cliente.data_nascimento ? new Date(cliente.data_nascimento) : null;
    const dataISO = dataN ? `${dataN.getFullYear()}-${String(dataN.getMonth()+1).padStart(2,'0')}-${String(dataN.getDate()).padStart(2,'0')}` : '';
    const dnEl = document.getElementById('dataNascimentoCliente');
    if (dnEl) dnEl.value = dataISO;

    // Endereço
    setValue(['ruaCliente','campo-rua'], cliente.rua || '');
    setValue(['bairroCliente','campo-bairro'], cliente.bairro || '');
    setValue(['numeroCliente','campo-numero'], cliente.numero || '');
    setValue(['complementoCliente','campo-complemento'], cliente.complemento || cliente.complemento_endereco || '');
    setValue(['cidadeCliente','campo-cidade'], cliente.cidade || '');
    setValue(['estadoCliente','campo-estado'], cliente.estado || '');
    setValue(['cepCliente','campo-cep'], cliente.cep || '');

    // Aplica foto enviada em base64, se houver
    if (cliente.fotoBase64) {
      const dataUrl = `data:${cliente.fotoMime||'image/jpeg'};base64,${cliente.fotoBase64}`;
      ['fotoCliente','mp-avatar','fotoClienteResumo','fotoClienteSidebar','fotoClienteSidebarImg'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.src = dataUrl;
      });
    }

    // Gera um avatar SVG com iniciais como fallback (evita requests a /img/default-user.png)
    function generateInitialsAvatar(name, size = 128) {
      const initials = (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(n => n[0])
        .slice(0,2)
        .join('')
        .toUpperCase() || 'U';
      const bg = '#e6e6e6';
      const fg = '#6b7280';
      const fontSize = Math.floor(size * 0.45);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' dy='0.35em' text-anchor='middle' fill='${fg}' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='${fontSize}'>${initials}</text></svg>`;
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    // Se já temos `fotoBase64` no payload público, aplica; caso contrário usa avatar por iniciais
    if (!cliente.fotoBase64) {
      const url = generateInitialsAvatar((cliente.nome || '') + ' ' + (cliente.sobrenome || ''));
      ['fotoCliente','mp-avatar','fotoClienteResumo','fotoClienteSidebar','fotoClienteSidebarImg'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.src = url;
      });
    }

    // atualiza resumo usando o cliente normalizado
    atualizarResumoCliente(cliente, clienteId);
  }

  // Pré-visualizar nova foto
  const inputFoto = document.getElementById("inputFotoCliente");
  if (inputFoto) {
    inputFoto.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          document.getElementById("fotoCliente").src = ev.target.result;
          const fotoResumo = document.getElementById("fotoClienteResumo");
          if (fotoResumo) fotoResumo.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Botão Alterar Dados
  const btnAlterarDados = document.getElementById("btnAlterarDados");
  let editando = false;

  if (btnAlterarDados) {
    btnAlterarDados.addEventListener("click", () => {
      if (!editando) {
        editando = true;
        btnAlterarDados.innerHTML = '<i class="fa fa-save"></i> Salvar Dados';
        btnAlterarDados.classList.add("btn-salvar");

        document.querySelectorAll(
          "#nomeCliente, #sobrenomeCliente, #emailCliente, #telefoneCliente, #dataNascimentoCliente, #ruaCliente, #bairroCliente, #numeroCliente, #complementoCliente, #estadoCliente"
        ).forEach(campo => campo.removeAttribute("readonly"));
      } else {
        editando = false;
        btnAlterarDados.innerHTML = '<i class="fa fa-edit"></i> Alterar Dados';
        btnAlterarDados.classList.remove("btn-salvar");

        document.querySelectorAll(
          "#nomeCliente, #sobrenomeCliente, #emailCliente, #telefoneCliente, #dataNascimentoCliente, #ruaCliente, #bairroCliente, #numeroCliente, #complementoCliente, #estadoCliente"
        ).forEach(campo => campo.setAttribute("readonly", true));

        const dadosAtualizados = {
          nome: document.getElementById("nomeCliente").value,
          sobrenome: document.getElementById("sobrenomeCliente").value,
          email: document.getElementById("emailCliente").value,
          telefone: document.getElementById("telefoneCliente").value,
          data_nascimento: document.getElementById("dataNascimentoCliente").value,
          rua: document.getElementById("ruaCliente").value,
          bairro: document.getElementById("bairroCliente").value,
          numero: document.getElementById("numeroCliente").value,
          complemento: document.getElementById("complementoCliente").value,
          estado: document.getElementById("estadoCliente").value
        };

        fetch((typeof apiBase !== 'undefined' ? apiBase : '') + `/api/cliente/${clienteId}`, {
          method: "PUT",
          headers: Object.assign({ "Content-Type": "application/json" }, token ? { 'Authorization': 'Bearer ' + token } : {}),
          body: JSON.stringify(dadosAtualizados)
        })
          .then(res => res.json())
          .then(data => {
              if (data.sucesso) {
                // Se houver foto selecionada, envie primeiro a foto
                const fotoArquivo = inputFoto && inputFoto.files && inputFoto.files[0];
                const afterSave = () => {
                  // recarrega do servidor para garantir dados consistentes
                  carregarDadosCliente();
                  mostrarPopup("Dados atualizados com sucesso!", "sucesso");
                };

                if (fotoArquivo) {
                  const form = new FormData();
                  form.append('foto', fotoArquivo);
                  fetch((typeof apiBase !== 'undefined' ? apiBase : '') + `/api/cliente/${clienteId}/foto`, {
                    method: 'PUT',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                    body: form
                  }).then(r => r.json().catch(()=>({}))).then(()=> afterSave()).catch(()=> afterSave());
                } else {
                  afterSave();
                }
              } else {
                mostrarPopup("Erro ao atualizar: " + data.mensagem, "erro");
              }
          })
          .catch(() => {
            mostrarPopup("Não foi possível salvar os dados.", "erro");
          });
      }
    });
  }

  // Excluir conta (com confirmação)
  const btnExcluir = document.getElementById('btnExcluirConta');
  if (btnExcluir) {
    btnExcluir.addEventListener('click', async (e) => {
      // apenas responder a cliques reais do usuário (evita abertura por scripts)
      if (e && e.isTrusted === false) return;
      if (!clienteId) {
        mostrarPopup('Cliente não identificado. Faça login primeiro.', 'erro');
        return;
      }

      // Abrir modal sempre que o usuário clicar para confirmar a exclusão
      const senha = await abrirModalConfirmacao();
      if (!senha) {
        // usuário cancelou
        return;
      }

      try {
        const resp = await fetch((typeof apiBase !== 'undefined' ? apiBase : '') + `/api/cliente/${clienteId}/excluir-com-senha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha })
        });
        const j = await resp.json().catch(()=>({sucesso:false}));
        if (resp.ok && j.sucesso) {
          localStorage.removeItem('token');
          localStorage.removeItem('clienteId');
          mostrarPopup('Conta excluída com sucesso.', 'sucesso');
          // redirecionar imediatamente para a tela de login do cliente
          window.location.href = 'login-cliente.html';
          return;
        }

        // erro ao excluir com senha
        mostrarPopup('Falha ao excluir conta: ' + (j.mensagem || resp.statusText || 'Erro desconhecido'), 'erro');
      } catch (err) {
        console.error('Erro ao excluir com senha', err);
        mostrarPopup('Erro de conexão ao tentar excluir a conta.', 'erro');
      }
    });
  }

  // Botão Alterar Senha + Medidor de força
  const btnAlterarSenha = document.getElementById("btnAlterarSenha");
  const novaSenhaInput = document.getElementById("novaSenhaCliente");
  const confirmarSenhaInput = document.getElementById("confirmarSenhaCliente");

  const forcaSenha = document.getElementById("forcaSenha");
  const mensagemConfirmacao = document.getElementById("mensagemConfirmacao");

  let editandoSenha = false;

  if (novaSenhaInput) {
    novaSenhaInput.addEventListener("input", () => {
      const senha = novaSenhaInput.value;
      let nivel = 0;

      if (senha.length >= 6) nivel++;
      if (/[A-Z]/.test(senha)) nivel++;
      if (/[0-9]/.test(senha)) nivel++;
      if (/[^A-Za-z0-9]/.test(senha)) nivel++;

      if (forcaSenha) {
        switch (nivel) {
          case 0:
          case 1:
            forcaSenha.textContent = "Senha fraca";
            forcaSenha.style.color = "red";
            break;
          case 2:
            forcaSenha.textContent = "Senha média";
            forcaSenha.style.color = "orange";
            break;
          case 3:
            forcaSenha.textContent = "Senha forte";
            forcaSenha.style.color = "green";
            break;
          case 4:
            forcaSenha.textContent = "Senha muito forte";
            forcaSenha.style.color = "darkgreen";
            break;
        }
      }
    });
  }

  if (confirmarSenhaInput) {
    confirmarSenhaInput.addEventListener("input", () => {
      if (mensagemConfirmacao) {
        if (confirmarSenhaInput.value === novaSenhaInput.value) {
          mensagemConfirmacao.textContent = "As senhas coincidem!";
          mensagemConfirmacao.style.color = "green";
        } else {
          mensagemConfirmacao.textContent = "As senhas não coincidem!";
          mensagemConfirmacao.style.color = "red";
        }
      }
    });
  }

  if (btnAlterarSenha) {
    btnAlterarSenha.addEventListener("click", () => {
      if (!editandoSenha) {
        editandoSenha = true;
        btnAlterarSenha.innerHTML = '<i class="fa fa-save"></i> Salvar Senha';
        btnAlterarSenha.classList.add("btn-salvar");

        novaSenhaInput.removeAttribute("readonly");
        confirmarSenhaInput.removeAttribute("readonly");
      } else {
        editandoSenha = false;
        btnAlterarSenha.innerHTML = '<i class="fa fa-key"></i> Alterar Senha';
        btnAlterarSenha.classList.remove("btn-salvar");

        novaSenhaInput.setAttribute("readonly", true);
        confirmarSenhaInput.setAttribute("readonly", true);

        const novaSenha = novaSenhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        if (!novaSenha || !confirmarSenha) {
          mostrarPopup("Por favor, preencha os dois campos de senha.", "erro");
          return;
        }

        if (novaSenha !== confirmarSenha) {
          mostrarPopup("As senhas não coincidem!", "erro");
          return;
        }

        // Se chegou aqui, as senhas coincidem
        fetch((typeof apiBase !== 'undefined' ? apiBase : '') + `/api/cliente/${clienteId}/senha`, {
          method: "PUT",
          headers: Object.assign({ "Content-Type": "application/json" }, token ? { 'Authorization': 'Bearer ' + token } : {}),
          body: JSON.stringify({ senha: novaSenha })
        })
          .then(res => res.json())
          .then(data => {
            if (data.sucesso) {
              mostrarPopup("Senha alterada com sucesso!", "sucesso");
            } else {
              mostrarPopup("Erro ao alterar senha: " + data.mensagem, "erro");
            }
          })
          .catch(() => {
            mostrarPopup("Não foi possível alterar a senha.", "erro");
          });

        novaSenhaInput.value = "";
        confirmarSenhaInput.value = "";
        if (forcaSenha) forcaSenha.textContent = "";
        if (mensagemConfirmacao) mensagemConfirmacao.textContent = "";
      }
    });
  }

  function preencherFormularioPreferencias(preferenciasAtuais) {
    const eEmail = document.getElementById("prefEmailPedidos");
    const eWhatsapp = document.getElementById("prefWhatsappOfertas");
    const eAbrir = document.getElementById("prefAbrirUltimaAba");
    if (eEmail) eEmail.checked = !!preferenciasAtuais.emailPedidos;
    if (eWhatsapp) eWhatsapp.checked = !!preferenciasAtuais.whatsappOfertas;
    if (eAbrir) eAbrir.checked = !!preferenciasAtuais.abrirUltimaAba;
    const sel = document.getElementById("prefAbaPadrao");
    if (sel) sel.value = preferenciasAtuais.abaPadrao || "visao-geral";
  }

  function atualizarResumoPreferencias(preferenciasAtuais) {
    const mapaAbas = {
      "visao-geral": "Visão Geral",
      perfil: "Dados do Cliente",
      compras: "Pedidos e Itens",
      cancelados: "Pedidos Cancelados"
    };

    const resumoAbaPreferida = document.getElementById("resumoAbaPreferida");
    if (resumoAbaPreferida) {
      resumoAbaPreferida.textContent = mapaAbas[preferenciasAtuais.abaPadrao] || "Visão Geral";
    }
  }

  function aplicarModoPainel(preferenciasAtuais) {
    if (!painelCliente) return;
    painelCliente.classList.toggle("painel-compacto", !preferenciasAtuais.emailPedidos && !preferenciasAtuais.whatsappOfertas);
  }

  function atualizarResumoCliente(data, idCliente) {
    const nomeCompleto = `${data.nome || "Cliente"} ${data.sobrenome || ""}`.trim();
    const email = data.email || "Email não informado";
    const telefone = data.telefone || "Não informado";
    const estado = data.estado || "Estado não informado";
    const bairro = data.bairro || "Bairro não informado";
    const localizacao = [bairro, estado].filter(valor => valor && !valor.includes("não informado") && !valor.includes("Não informado")).join(" - ") || "Localização não informada";

    definirTexto("resumoNome", nomeCompleto);
    definirTexto("resumoEmail", email);
    definirTexto("resumoEstado", estado);
    definirTexto("resumoBairro", bairro);
    definirTexto("resumoClienteId", `#${idCliente}`);
    definirTexto("resumoTelefone", telefone);
    definirTexto("perfilSidebarNome", nomeCompleto);
    definirTexto("perfilSidebarEmail", email);
    definirTexto("perfilSidebarTelefone", telefone);
    definirTexto("perfilSidebarEstado", estado);
    definirTexto("configResumoNome", nomeCompleto);
    definirTexto("configResumoEmail", email);
    definirTexto("configResumoLocal", localizacao);
    definirTexto("resumoStatusConta", "Conta ativa");
  }

  async function renderizarCompras() {
    const totalItensCompras = document.getElementById("totalItensCompras");
    const subtotalCompras = document.getElementById("subtotalCompras");
    const resumoCompras = document.getElementById("resumoCompras");
    let pedidos = [];

    // Tentativa de obter do backend (se disponível)
    try {
      if (clienteId) {
        const resp = await fetch(`${apiBase}/api/cliente/${clienteId}/pedidos`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.sucesso && Array.isArray(data.pedidos)) {
            pedidos = data.pedidos.map(p => ({
              id: p.id,
              total: Number((p.total || '').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
              criadoEm: p.dataPedido,
              status: p.status || 'pendente',
              itens: p.itens || []
            }));
          }
        }
      }
    } catch (e) {
      // ignore e fallback
    }

    // fallback localStorage
    if (!pedidos.length) {
      pedidos = (JSON.parse(localStorage.getItem("mixPedidosCliente")) || [])
        .filter(pedido => String(pedido.clienteId) === String(clienteId));
    }

    const totalPedidos = pedidos.length;
    const totalMovimentado = pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
    const totalItens = pedidos.reduce((acc, pedido) => acc + (pedido.itens || []).reduce((soma, item) => soma + Number(item.quantidade || 0), 0), 0);

    if (totalItensCompras) totalItensCompras.textContent = String(totalPedidos);
    if (subtotalCompras) subtotalCompras.textContent = formatarMoeda(totalMovimentado);
    if (resumoCompras) resumoCompras.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;

    if (!listaCompras) return;

    if (!pedidos.length) {
      listaCompras.innerHTML = '<li class="lista-vazia">Nenhum pedido encontrado ainda. Você pode usar o modo de teste do checkout para gerar um pedido e validar o fluxo.</li>';
      return;
    }

    listaCompras.innerHTML = pedidos
      .map(pedido => {
        const itensHtml = (pedido.itens || [])
          .map(item => {
            const imagem = item.imagem || "./img/default-user.png";
            const quantidade = Number(item.quantidade || 1);
            const subtotalItem = Number(item.subtotal || 0);
            return `
              <div class="pedido-item">
                <img src="${imagem}" alt="${item.nome || "Produto"}">
                <div class="pedido-item-info">
                  <span>Produto</span>
                  <h4>${item.nome || "Produto sem nome"}</h4>
                  <p class="pedido-item-descricao">${item.descricao || "Sem descrição disponível."}</p>
                  <small>Quantidade: ${quantidade}</small>
                </div>
                <div class="pedido-item-preco">
                  <strong>${formatarMoeda(subtotalItem)}</strong>
                  <small>${formatarMoeda(Number(item.precoUnitario || 0))} por unidade</small>
                </div>
              </div>
            `;
          })
          .join("");

        const statusClasse = normalizarClasseStatus(pedido.status);
        const endereco = pedido.cliente?.endereco || {};

        return `
          <li class="pedido-card">
            <div class="pedido-card-topo">
              <div class="pedido-card-topo-principal">
                <div class="pedido-card-id">
                  <h3>${pedido.id}</h3>
                  <small>Realizado em ${formatarDataHora(pedido.criadoEm)}</small>
                </div>
                <p class="pedido-card-descricao">${pedido.teste ? "Pedido gerado no modo de teste." : "Pedido confirmado no checkout."}</p>
              </div>
              <div class="pedido-card-topo-lateral">
                <span class="pedido-status ${statusClasse}">${pedido.status || "Confirmado"}</span>
                <button type="button" class="btn-cancelar-pedido" data-pedido-id="${pedido.id}" ${pedido.status === "Cancelado" ? "disabled" : ""}>
                  ${pedido.status === "Cancelado" ? "Pedido cancelado" : "Cancelar pedido"}
                </button>
              </div>
            </div>

            <div class="pedido-card-meta">
              <div>
                <span>Forma de pagamento</span>
                <strong>${pedido.formaPagamento || "Não informada"}</strong>
              </div>
              <div>
                <span>Frete</span>
                <strong>${(!pedido.frete?.valor || pedido.frete?.tipo === "GRATIS") ? "Frete Grátis" : pedido.frete.tipo + " - " + formatarMoeda(Number(pedido.frete.valor))}</strong>
              </div>
              <div>
                <span>Total do pedido</span>
                <strong>${formatarMoeda(Number(pedido.total || 0))}</strong>
              </div>
            </div>

            <div class="pedido-cliente-grid">
              <div class="pedido-cliente-bloco">
                <span>Contato do pedido</span>
                <strong>${pedido.cliente?.email || "Email não informado"}</strong>
                <p>${pedido.cliente?.telefone || "Telefone não informado"}</p>
              </div>
              <div class="pedido-cliente-bloco">
                <span>Endereço de entrega</span>
                <strong>${endereco.rua || "Rua não informada"}, ${endereco.numero || "s/n"}</strong>
                <p>${endereco.bairro || "Bairro não informado"} - ${endereco.estado || "UF não informada"}</p>
                <p>${endereco.complemento || "Sem complemento"}</p>
              </div>
            </div>

            <div class="pedido-itens-lista">
              ${itensHtml}
            </div>
          </li>
        `;
      })
      .join("");
  }

  function cancelarPedido(pedidoId) {
    const pedidos = JSON.parse(localStorage.getItem("mixPedidosCliente")) || [];
    const pedidoIndex = pedidos.findIndex(pedido => pedido.id === pedidoId && String(pedido.clienteId) === String(clienteId));

    if (pedidoIndex === -1) {
      mostrarPopup("Pedido não encontrado para cancelamento.", "erro");
      return;
    }

    pedidos[pedidoIndex].status = "Cancelado";
    localStorage.setItem("mixPedidosCliente", JSON.stringify(pedidos));
    renderizarCompras();
    mostrarPopup("Pedido cancelado com sucesso.", "sucesso");
  }

  function normalizarClasseStatus(status) {
    return String(status || "confirmado")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");
  }

  function formatarDataHora(dataIso) {
    if (!dataIso) return "Data não disponível";
    return new Date(dataIso).toLocaleString("pt-BR");
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
  }

  function definirTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  }

  // Função para popup elegante (duração em ms opcional)
  let _popupTimer = null;
  function mostrarPopup(mensagem, tipo = 'sucesso', duracao = 2000) {
    const popup = document.getElementById("popupSucesso");
    if (!popup) return;

    // limpar timer anterior
    if (_popupTimer) {
      clearTimeout(_popupTimer);
      _popupTimer = null;
    }

    const icon = tipo === 'sucesso' ? 'fa-check-circle' : 'fa-exclamation-circle';
    popup.innerHTML = `<i class="fa ${icon}" aria-hidden="true"></i><div class="popup-text">${mensagem}</div>`;
    popup.classList.remove('erro','sucesso');
    popup.classList.add(tipo === 'sucesso' ? 'sucesso' : 'erro');
    popup.classList.add('show');

    // force inline styles as fallback in case CSS rules are overridden
    try {
      popup.style.display = 'inline-flex';
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0)';
    } catch (e) { /* ignore */ }

    console.log('[meu-perfil] mostrarPopup:', mensagem, tipo);

    _popupTimer = setTimeout(() => {
      popup.classList.remove('show');
      try {
        popup.style.opacity = '';
        popup.style.transform = '';
      } catch (e) {}
      _popupTimer = null;
    }, duracao);
  }
});