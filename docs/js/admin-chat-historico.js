/**
 * HISTÓRICO DE CHAMADOS CONCLUÍDOS - MIX-PROMOÇÃO (admin-chat-historico.js)
 * Visualizador completo de atendimentos encerrados, estatísticas e transcrição
 */

document.addEventListener('DOMContentLoaded', function () {
  // Elementos do DOM
  const historicoListScroll = document.getElementById('historicoListScroll');
  const historicoSearch = document.getElementById('historicoSearch');
  const filterChips = document.querySelectorAll('.btn-chip-filter[data-period]');
  const btnRecarregar = document.getElementById('btnRecarregarHistorico');
  const statTotalEncerrados = document.getElementById('statTotalEncerrados');
  const statHojeEncerrados = document.getElementById('statHojeEncerrados');
  const statClientesAtendidos = document.getElementById('statClientesAtendidos');
  const historicoCounterBadge = document.getElementById('historicoCounterBadge');

  // Detalhes do Chamado Selecionado
  const historicoDetailHeader = document.getElementById('historicoDetailHeader');
  const detailCustomerName = document.getElementById('detailCustomerName');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const historicoMessagesViewer = document.getElementById('historicoMessagesViewer');
  const btnExportDetailChat = document.getElementById('btnExportDetailChat');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  // Base da API
  const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : (window.AUTH_SERVER || window.location.origin);

  let concluidos = [];
  let selectedChamado = null;
  let activePeriod = 'all';
  let searchTerm = '';

  // =========================================================================
  // HIGIENIZAÇÃO DE NOMES E INICIAIS
  // =========================================================================
  function formatarNomeCliente(nomeBruto) {
    if (!nomeBruto) return 'Cliente';
    let nome = String(nomeBruto).trim();
    nome = nome.replace(/^Atendimento\s*-\s*/i, '');
    nome = nome.replace(/\bnull\b/gi, '').replace(/\bundefined\b/gi, '');
    nome = nome.trim().replace(/\s+/g, ' ');
    return nome || 'Cliente';
  }

  function extrairIniciaisCliente(nomeBruto) {
    const limpo = formatarNomeCliente(nomeBruto);
    const partes = limpo.split(' ').filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (limpo.slice(0, 2) || 'CL').toUpperCase();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatarDataHora(tsOrIso) {
    try {
      const d = new Date(tsOrIso || Date.now());
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  // =========================================================================
  // CARREGAR CHAMADOS CONCLUÍDOS
  // =========================================================================
  async function carregarHistorico() {
    try {
      const res = await fetch(`${apiBase}/api/conversations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const todas = await res.json();

      // Filtra APENAS chamados concluídos ou encerrados
      concluidos = (Array.isArray(todas) ? todas : []).filter(c => c.status === 'finalizado' || c.status === 'closed');

      atualizarEstatisticas();
      renderizarListaHistorico();
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      if (historicoListScroll) {
        historicoListScroll.innerHTML = `
          <div class="chat-empty-queue">
            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i>
            <p>Erro ao conectar com o servidor para carregar o histórico.</p>
          </div>
        `;
      }
    }
  }

  function atualizarEstatisticas() {
    const total = concluidos.length;
    if (statTotalEncerrados) statTotalEncerrados.textContent = String(total);

    // Concluídos Hoje
    const hojeStr = new Date().toDateString();
    const hojeCount = concluidos.filter(c => {
      const d = new Date(c.updatedAt || c.createdAt || Date.now());
      return d.toDateString() === hojeStr;
    }).length;
    if (statHojeEncerrados) statHojeEncerrados.textContent = String(hojeCount);

    // Clientes únicos
    const clientesSet = new Set(concluidos.map(c => formatarNomeCliente(c.name).toLowerCase()));
    if (statClientesAtendidos) statClientesAtendidos.textContent = String(clientesSet.size);

    if (historicoCounterBadge) {
      historicoCounterBadge.textContent = `${total} chamado${total !== 1 ? 's' : ''}`;
    }
  }

  // =========================================================================
  // RENDERIZAÇÃO DA LISTA DE CHAMADOS CONCLUÍDOS
  // =========================================================================
  function renderizarListaHistorico() {
    if (!historicoListScroll) return;

    let filtrados = concluidos;

    // Filtro de período
    const agora = Date.now();
    const UM_DIA = 24 * 60 * 60 * 1000;
    if (activePeriod === 'today') {
      const hojeStr = new Date().toDateString();
      filtrados = filtrados.filter(c => new Date(c.updatedAt || c.createdAt).toDateString() === hojeStr);
    } else if (activePeriod === 'week') {
      filtrados = filtrados.filter(c => (agora - (c.updatedAt || c.createdAt || 0)) <= 7 * UM_DIA);
    } else if (activePeriod === 'month') {
      filtrados = filtrados.filter(c => (agora - (c.updatedAt || c.createdAt || 0)) <= 30 * UM_DIA);
    }

    // Filtro de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c => {
        const nomeLimpo = formatarNomeCliente(c.name).toLowerCase();
        return nomeLimpo.includes(termo) ||
          (c.protocol || '').toLowerCase().includes(termo) ||
          (c.lastMessagePreview || '').toLowerCase().includes(termo);
      });
    }

    if (filtrados.length === 0) {
      historicoListScroll.innerHTML = `
        <div class="chat-empty-queue">
          <i class="fa-solid fa-box-open"></i>
          Nenhum chamado concluído encontrado ${searchTerm ? 'para a busca' : ''}.
        </div>
      `;
      return;
    }

    historicoListScroll.innerHTML = filtrados.map(c => {
      const isSelected = selectedChamado && String(selectedChamado.id) === String(c.id);
      const nomeLimpo = formatarNomeCliente(c.name);
      const initials = extrairIniciaisCliente(c.name);
      const proto = c.protocol || `#CLI-${c.id}`;
      const dataHora = formatarDataHora(c.updatedAt || c.createdAt);
      let preview = (c.lastMessagePreview || '').trim();
      if (/MixIA|Autoatendimento|Assistente Virtual|Inteligência Artificial|Perfeito.*Identifiquei sua solicitação/i.test(preview) || !preview) {
        preview = 'Atendimento concluído e arquivado';
      }

      return `
        <div class="historico-card ${isSelected ? 'active' : ''}" data-id="${c.id}">
          <div class="historico-card-avatar">
            ${initials}
          </div>
          <div class="historico-card-info">
            <div class="historico-card-top">
              <span class="historico-card-name" title="${escapeHtml(nomeLimpo)}">${escapeHtml(nomeLimpo)}</span>
              <span class="badge-chamado-fechado" style="font-size:0.68rem; padding:2px 7px;"><i class="fa-solid fa-check"></i> Concluído</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span class="historico-card-proto">${escapeHtml(proto)}</span>
              <span class="historico-card-date"><i class="fa-regular fa-clock" style="font-size:0.7rem;"></i> ${dataHora}</span>
            </div>
            <div class="historico-card-preview" title="${escapeHtml(preview)}">
              ${escapeHtml(preview)}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Eventos de clique nas cartas
    historicoListScroll.querySelectorAll('.historico-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        abrirDetalheChamado(id);
      });
    });
  }

  // =========================================================================
  // VISUALIZAÇÃO DA TRANSCRIÇÃO DE MENSAGENS
  // =========================================================================
  async function abrirDetalheChamado(id) {
    const chamado = concluidos.find(c => String(c.id) === String(id));
    if (!chamado) return;

    selectedChamado = chamado;
    renderizarListaHistorico();

    const nomeLimpo = formatarNomeCliente(chamado.name);
    const proto = chamado.protocol || `#CLI-${chamado.id}`;
    const dataHora = formatarDataHora(chamado.updatedAt || chamado.createdAt);

    if (historicoDetailHeader) historicoDetailHeader.style.display = 'flex';
    if (detailCustomerName) detailCustomerName.textContent = nomeLimpo;
    if (detailSubtitle) {
      detailSubtitle.innerHTML = `Protocolo: <strong style="color:#38bdf8;">${escapeHtml(proto)}</strong> • Finalizado em ${dataHora}`;
    }

    if (historicoMessagesViewer) {
      historicoMessagesViewer.innerHTML = `
        <div class="chat-empty-queue">
          <i class="fa-solid fa-spinner fa-spin" style="color:#10b981;"></i>
          Carregando transcrição do chamado...
        </div>
      `;
    }

    try {
      const res = await fetch(`${apiBase}/api/conversations/${chamado.id}/messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const msgs = await res.json();
      renderizarMensagensDetalhe(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Erro ao buscar mensagens do histórico:', err);
      if (historicoMessagesViewer) {
        historicoMessagesViewer.innerHTML = `
          <div class="chat-empty-queue">
            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i>
            <p>Não foi possível carregar as mensagens deste chamado.</p>
          </div>
        `;
      }
    }
  }

  function renderizarMensagensDetalhe(msgs) {
    if (!historicoMessagesViewer) return;

    // Filtra para que as mensagens da IA (MixIA / bot) NÃO apareçam no histórico do funcionário
    const msgsHumanas = (Array.isArray(msgs) ? msgs : []).filter(m => {
      const isBot = m.from === 'bot' || m.from === 'ia' || (m.fromName && /MixIA/i.test(m.fromName));
      return !isBot;
    });

    if (msgsHumanas.length === 0) {
      historicoMessagesViewer.innerHTML = `
        <div class="chat-empty-queue">
          <i class="fa-solid fa-comments"></i>
          <p>Nenhuma mensagem de atendimento humano registrada neste chamado.</p>
        </div>
      `;
      return;
    }

    const html = msgsHumanas.map(m => {
      const isSystem = m.from === 'system';
      if (isSystem) {
        return `<div class="msg-system" style="margin:8px auto;">${escapeHtml(m.text)}</div>`;
      }

      const isAtendente = m.from === 'attendant' || m.from === 'admin';
      const className = isAtendente ? 'msg me attendant' : 'msg other client';
      let autor = `<i class="fa-solid fa-user"></i> ${escapeHtml(m.fromName || formatarNomeCliente(selectedChamado.name))}`;
      if (isAtendente) {
        autor = `<i class="fa-solid fa-headset"></i> ${escapeHtml(m.fromName || 'Atendente')}`;
      }

      const hora = new Date(m.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let textoFormatado = escapeHtml(m.text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      return `
        <div class="${className}">
          <div class="author">${autor}</div>
          <div class="msg-content">${textoFormatado}</div>
          <span class="time">${hora} ${isAtendente ? '<i class="fa-solid fa-check-double" style="margin-left:3px; opacity:0.85;"></i>' : ''}</span>
        </div>
      `;
    }).join("");

    historicoMessagesViewer.innerHTML = html;
    historicoMessagesViewer.scrollTop = 0;
  }

  // =========================================================================
  // EXPORTAR TRANSCRIÇÃO EM ARQUIVO DE TEXTO (.TXT)
  // =========================================================================
  if (btnExportDetailChat) {
    btnExportDetailChat.addEventListener('click', async () => {
      if (!selectedChamado) return;

      try {
        const res = await fetch(`${apiBase}/api/conversations/${selectedChamado.id}/messages`);
        const msgs = await res.json();
        const nomeLimpo = formatarNomeCliente(selectedChamado.name);
        const proto = selectedChamado.protocol || `#CLI-${selectedChamado.id}`;
        const dataEnc = formatarDataHora(selectedChamado.updatedAt || selectedChamado.createdAt);

        let txt = `=====================================================\n`;
        txt += `MIX-PROMOÇÃO - HISTÓRICO DE ATENDIMENTO CONCLUÍDO\n`;
        txt += `=====================================================\n`;
        txt += `Protocolo: ${proto}\n`;
        txt += `Cliente: ${nomeLimpo}\n`;
        txt += `Data de Conclusão: ${dataEnc}\n`;
        txt += `Status: Concluído e Arquivado\n`;
        txt += `=====================================================\n\n`;

        const msgsHumanas = (Array.isArray(msgs) ? msgs : []).filter(m => {
          const isBot = m.from === 'bot' || m.from === 'ia' || (m.fromName && /MixIA/i.test(m.fromName));
          return !isBot;
        });

        msgsHumanas.forEach(m => {
          const d = new Date(m.time || Date.now()).toLocaleString('pt-BR');
          const remetente = m.from === 'system' ? 'SISTEMA' : (m.fromName || (m.from === 'attendant' ? 'Atendente' : nomeLimpo));
          txt += `[${d}] ${remetente}:\n${m.text}\n\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Historico_Chamado_${proto.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Erro ao exportar histórico do chamado.');
      }
    });
  }

  // =========================================================================
  // EVENTOS DE FILTROS E BUSCA
  // =========================================================================
  filterChips.forEach(btn => {
    btn.addEventListener('click', () => {
      filterChips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePeriod = btn.dataset.period || 'all';
      renderizarListaHistorico();
    });
  });

  if (historicoSearch) {
    historicoSearch.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderizarListaHistorico();
    });
  }

  if (btnRecarregar) {
    btnRecarregar.addEventListener('click', () => {
      const icon = btnRecarregar.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      carregarHistorico().finally(() => {
        setTimeout(() => {
          if (icon) icon.classList.remove('fa-spin');
        }, 500);
      });
    });
  }

  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      const keys = ['tipoUsuario','token','nome','sobrenome','isAdmin','foto','fotoMime','clienteCPF','email','clienteTelefone','clienteId'];
      keys.forEach(k => localStorage.removeItem(k));
      window.location.href = 'index.html';
    });
  }

  // Inicialização
  carregarHistorico();
});
