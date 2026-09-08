/**
 * CENTRAL DE ATENDIMENTO AO CLIENTE — PAINEL DO FUNCIONÁRIO
 * Visualiza todas as conversas dos clientes e permite responder em tempo real.
 * Comunicação via BroadcastChannel + localStorage.
 */

document.addEventListener('DOMContentLoaded', function () {
  // ── Elementos ──
  const clientList      = document.getElementById('clientList');
  const emptyQueue      = document.getElementById('emptyQueue');
  const emptyState      = document.getElementById('emptyState');
  const chatPanel       = document.getElementById('chatPanel');
  const infoPanel       = document.getElementById('infoPanel');
  const panelMessages   = document.getElementById('panelMessages');
  const panelClientName = document.getElementById('panelClientName');
  const panelClientAvatar = document.getElementById('panelClientAvatar');
  const panelClientStatus = document.getElementById('panelClientStatus');
  const panelProtocolo  = document.getElementById('panelProtocolo');
  const funcReplyInput  = document.getElementById('funcReplyInput');
  const btnFuncSend     = document.getElementById('btnFuncSend');
  const btnExportConv   = document.getElementById('btnExportConv');
  const btnRefreshQueue = document.getElementById('btnRefreshQueue');
  const searchInput     = document.getElementById('searchClientes');
  const statusOnlineText = document.getElementById('statusOnlineText');
  const toastEl         = document.getElementById('opToast');
  const toastMsg        = document.getElementById('opToastMsg');

  // Painéis de info do cliente selecionado
  const infoPanelNome      = document.getElementById('infoPanelNome');
  const infoPanelEmail     = document.getElementById('infoPanelEmail');
  const infoPanelProto     = document.getElementById('infoPanelProto');
  const infoPanelAtendente = document.getElementById('infoPanelAtendente');
  const infoPanelHora      = document.getElementById('infoPanelHora');

  // Nome do funcionário logado
  const nomeFuncionario = (localStorage.getItem('nomeFuncionario') || localStorage.getItem('nome') || 'Funcionário').trim();
  if (statusOnlineText) statusOnlineText.textContent = `${nomeFuncionario} Online`;

  // ── Estado ──
  let clientesSelecionados = [];   // fila de clientes carregada
  let protocoloAtivo = null;       // protocolo do cliente em foco
  let pollingInterval  = null;

  // ── BroadcastChannel para comunicar com as abas dos clientes ──
  let bus = null;
  try {
    bus = new BroadcastChannel('mix_support_bus');
    bus.onmessage = function (event) {
      const data = event.data;
      if (!data) return;

      if (data.type === 'CLIENT_NEW_MESSAGE') {
        // Adiciona/atualiza cliente na fila
        adicionarOuAtualizarClienteNaFila(data);

        // Se for o cliente atualmente aberto, atualiza o chat
        if (data.protocolo === protocoloAtivo) {
          carregarChatDoCliente(protocoloAtivo);
        } else {
          // Mostra toast de nova mensagem
          mostrarToast(`Nova msg de ${data.cliente || 'cliente'}: "${(data.text || '').substring(0, 50)}..."`);
        }
      }
    };
  } catch (e) {}

  // ── Carregar fila do localStorage ──
  function carregarFilaDoLocalStorage() {
    let fila = [];
    try {
      fila = JSON.parse(localStorage.getItem('mix_clientes_fila_atendimento') || '[]');
    } catch (e) {}

    // Deduplica por protocolo, mantendo o mais recente
    const mapa = {};
    fila.forEach(item => {
      mapa[item.protocolo] = item;
    });
    clientesSelecionados = Object.values(mapa);
    renderizarListaClientes();
  }

  function adicionarOuAtualizarClienteNaFila(data) {
    const existe = clientesSelecionados.findIndex(c => c.protocolo === data.protocolo);
    const novoItem = {
      protocolo: data.protocolo,
      cliente: data.cliente || 'Cliente',
      atendente: data.atendente || '—',
      text: data.text || '',
      time: data.time || new Date().toISOString()
    };
    if (existe >= 0) {
      clientesSelecionados[existe] = novoItem;
    } else {
      clientesSelecionados.unshift(novoItem);
    }
    renderizarListaClientes();
  }

  function renderizarListaClientes(filtro = '') {
    const lista = clientesSelecionados.filter(c => {
      if (!filtro) return true;
      const f = filtro.toLowerCase();
      return (c.cliente || '').toLowerCase().includes(f) ||
             (c.protocolo || '').toLowerCase().includes(f);
    });

    // Limpa itens (mantém o emptyQueue)
    Array.from(clientList.children).forEach(el => {
      if (el.id !== 'emptyQueue') el.remove();
    });

    if (lista.length === 0) {
      if (emptyQueue) emptyQueue.style.display = 'block';
      return;
    }
    if (emptyQueue) emptyQueue.style.display = 'none';

    lista.forEach(cliente => {
      const item = document.createElement('div');
      item.className = 'op-client-item' + (cliente.protocolo === protocoloAtivo ? ' active' : '');
      item.dataset.protocolo = cliente.protocolo;

      const iniciais = (cliente.cliente || 'C').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
      const hora = formatarHora(cliente.time);
      const textoCurto = (cliente.text || '').substring(0, 45) + ((cliente.text || '').length > 45 ? '...' : '');

      item.innerHTML = `
        <div class="op-client-avatar">${iniciais}</div>
        <div class="op-client-info">
          <div class="op-client-name">${escHtml(cliente.cliente)}</div>
          <div class="op-client-meta">${escHtml(textoCurto)}</div>
          <div class="op-client-proto">#${cliente.protocolo} • ${hora}</div>
        </div>
      `;

      item.addEventListener('click', () => selecionarCliente(cliente));
      clientList.appendChild(item);
    });
  }

  function selecionarCliente(cliente) {
    protocoloAtivo = cliente.protocolo;

    // Atualiza destaque na lista
    document.querySelectorAll('.op-client-item').forEach(el => {
      el.classList.toggle('active', el.dataset.protocolo === protocoloAtivo);
    });

    // Mostra painel de chat
    if (emptyState) emptyState.style.display = 'none';
    if (chatPanel) { chatPanel.style.display = 'flex'; chatPanel.style.flexDirection = 'column'; chatPanel.style.flex = '1'; chatPanel.style.overflow = 'hidden'; }
    if (infoPanel) infoPanel.style.display = 'flex';

    // Preenche header
    const iniciais = (cliente.cliente || 'C').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    if (panelClientAvatar) panelClientAvatar.textContent = iniciais;
    if (panelClientName) panelClientName.textContent = cliente.cliente;
    if (panelClientStatus) panelClientStatus.textContent = `Online • Atendente: ${cliente.atendente || '—'}`;
    if (panelProtocolo) panelProtocolo.textContent = `#${cliente.protocolo}`;

    // Preenche info lateral
    if (infoPanelNome) infoPanelNome.textContent = cliente.cliente;
    if (infoPanelProto) infoPanelProto.textContent = '#' + cliente.protocolo;
    if (infoPanelAtendente) infoPanelAtendente.textContent = cliente.atendente || '—';
    if (infoPanelHora) infoPanelHora.textContent = formatarHora(cliente.time);

    // Ativa o botão de envio
    if (funcReplyInput) {
      funcReplyInput.disabled = false;
      funcReplyInput.focus();
    }
    if (btnFuncSend) btnFuncSend.disabled = false;

    // Carrega as mensagens do chat desse cliente
    carregarChatDoCliente(protocoloAtivo);

    // Inicia polling para detectar novas mensagens do cliente
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
      if (protocoloAtivo) carregarChatDoCliente(protocoloAtivo, true);
    }, 3000);
  }

  let ultimoTamanhoMensagens = 0;

  function carregarChatDoCliente(protocolo, silencioso = false) {
    let msgs = [];
    try {
      const saved = localStorage.getItem('mix_cliente_chat_' + protocolo);
      if (saved) msgs = JSON.parse(saved);
    } catch (e) {}

    if (silencioso && msgs.length === ultimoTamanhoMensagens) return;
    ultimoTamanhoMensagens = msgs.length;

    if (!panelMessages) return;
    panelMessages.innerHTML = '';

    if (msgs.length === 0) {
      panelMessages.innerHTML = '<div style="text-align:center;color:#475569;padding:40px;font-size:0.88rem;">Nenhuma mensagem neste atendimento ainda.</div>';
      return;
    }

    msgs.forEach(msg => {
      if (msg.type === 'system') {
        const div = document.createElement('div');
        div.className = 'op-msg-system';
        div.textContent = msg.text;
        panelMessages.appendChild(div);
        return;
      }

      const div = document.createElement('div');
      const tipo = msg.type === 'client' ? 'cliente' : (msg.isFuncionario ? 'funcionario' : 'atendente');
      div.className = `op-msg ${tipo}`;

      const autor = msg.type === 'client'
        ? `<i class="fa-solid fa-user"></i> ${escHtml(msg.author || 'Cliente')}`
        : (msg.isFuncionario
            ? `<i class="fa-solid fa-user-shield"></i> ${escHtml(msg.author || 'Funcionário')}`
            : `<i class="fa-solid fa-headset"></i> ${escHtml(msg.author || 'Atendente')}`);

      const textFormatado = escHtml(msg.text || '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      div.innerHTML = `
        <div class="op-msg-author">${autor}</div>
        <div class="op-msg-bubble">${textFormatado}</div>
        <div class="op-msg-time">${formatarHora(msg.time)}</div>
      `;
      panelMessages.appendChild(div);
    });

    panelMessages.scrollTop = panelMessages.scrollHeight;
  }

  // ── Enviar resposta do funcionário ──
  function enviarRespostaFuncionario() {
    if (!protocoloAtivo || !funcReplyInput) return;
    const texto = funcReplyInput.value.trim();
    if (!texto) return;

    // Adiciona a mensagem no localStorage do cliente
    let msgs = [];
    try {
      const saved = localStorage.getItem('mix_cliente_chat_' + protocoloAtivo);
      if (saved) msgs = JSON.parse(saved);
    } catch (e) {}

    const novaMsg = {
      type: 'attendant',
      isFuncionario: true,
      author: `${nomeFuncionario} (Funcionário)`,
      text: texto,
      time: new Date().toISOString()
    };
    msgs.push(novaMsg);

    try {
      localStorage.setItem('mix_cliente_chat_' + protocoloAtivo, JSON.stringify(msgs));
    } catch (e) {}

    // Notifica a aba do cliente via BroadcastChannel
    try {
      if (bus) {
        bus.postMessage({
          type: 'EMPLOYEE_REPLY_TO_CLIENT',
          protocolo: protocoloAtivo,
          author: novaMsg.author,
          text: texto,
          time: novaMsg.time
        });
      }
    } catch (e) {}

    // Limpa campo e atualiza chat
    funcReplyInput.value = '';
    funcReplyInput.style.height = 'auto';
    carregarChatDoCliente(protocoloAtivo);
  }

  if (btnFuncSend) {
    btnFuncSend.addEventListener('click', enviarRespostaFuncionario);
  }

  if (funcReplyInput) {
    funcReplyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarRespostaFuncionario();
      }
    });
    funcReplyInput.addEventListener('input', () => {
      funcReplyInput.style.height = 'auto';
      funcReplyInput.style.height = Math.min(funcReplyInput.scrollHeight, 120) + 'px';
    });
  }

  // ── Respostas Rápidas ──
  document.querySelectorAll('.op-quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!funcReplyInput || !protocoloAtivo) return;
      funcReplyInput.value = btn.dataset.reply || '';
      funcReplyInput.focus();
    });
  });

  // ── Export ──
  if (btnExportConv) {
    btnExportConv.addEventListener('click', () => {
      if (!protocoloAtivo) return;
      let msgs = [];
      try {
        msgs = JSON.parse(localStorage.getItem('mix_cliente_chat_' + protocoloAtivo) || '[]');
      } catch (e) {}

      let log = '='.repeat(55) + '\n';
      log += 'MIX-PROMOÇÃO — HISTÓRICO DE ATENDIMENTO AO CLIENTE\n';
      log += '='.repeat(55) + '\n';
      log += `Protocolo: #${protocoloAtivo}\n`;
      log += `Data de exportação: ${new Date().toLocaleString('pt-BR')}\n`;
      log += '='.repeat(55) + '\n\n';

      msgs.forEach(m => {
        if (m.type === 'system') {
          log += `[SISTEMA] ${m.text}\n\n`;
        } else {
          log += `[${m.author || (m.type === 'client' ? 'Cliente' : 'Atendente')} — ${formatarHora(m.time)}]:\n${m.text}\n\n`;
        }
      });

      const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversa_${protocoloAtivo}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // ── Atualizar fila ──
  if (btnRefreshQueue) {
    btnRefreshQueue.addEventListener('click', () => {
      carregarFilaDoLocalStorage();
    });
  }

  // ── Busca ──
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderizarListaClientes(searchInput.value.trim());
    });
  }

  // ── Toast ──
  let toastTimer = null;
  function mostrarToast(mensagem) {
    if (!toastEl || !toastMsg) return;
    toastMsg.textContent = mensagem;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4000);
  }

  // ── Utilitários ──
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatarHora(iso) {
    try {
      return new Date(iso || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '—'; }
  }

  // ── Inicialização ──
  carregarFilaDoLocalStorage();

  // Auto-atualiza a fila a cada 5 segundos
  setInterval(() => {
    carregarFilaDoLocalStorage();
  }, 5000);
});

