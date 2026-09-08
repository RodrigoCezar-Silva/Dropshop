/**
 * CENTRAL DE ATENDIMENTO AO CLIENTE - MIX-PROMOÇÃO (admin-chat-center.js)
 * Painel Administrativo / Atendente com Fila ao Vivo, Alerta Sonoro de Chamados
 * e Comunicação Bidirecional em Tempo Real.
 */

document.addEventListener('DOMContentLoaded', function () {
  // Elementos do DOM
  const convListEl = document.getElementById('conversations');
  const messagesEl = document.getElementById('messages');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendMsgBtn');
  const attachBtn = document.getElementById('btnAttach');
  const fileInput = document.getElementById('fileAttachInput');
  const searchInput = document.getElementById('chatSearch');
  const filterTabs = document.querySelectorAll('.chat-tab-btn');
  const btnAtualizarFila = document.getElementById('btnAtualizarFila');
  const btnTestSound = document.getElementById('btnTestSound');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const soundStatusText = document.getElementById('soundStatusText');
  const btnEncerrarAtendimento = document.getElementById('btnEncerrarAtendimento');
  const btnExportChat = document.getElementById('btnExportChat');
  const toastContainer = document.getElementById('toastContainer');
  const quickRepliesWrap = document.getElementById('quickRepliesWrap');

  // Cabeçalho do Atendimento
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderBadge = document.getElementById('chatHeaderBadge');
  const chatHeaderStatus = document.getElementById('chatHeaderStatus');
  const chatStatusDot = document.getElementById('chatStatusDot');
  const chatStatusText = document.getElementById('chatStatusText');
  const clientAvatarBox = document.getElementById('clientAvatarBox');
  const userGreetingName = document.getElementById('userGreetingName');
  const unreadTotalBadge = document.getElementById('unreadTotalBadge');
  const queueTimeUpdated = document.getElementById('queueTimeUpdated');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  // Identificação do Atendente / Admin logado
  const adminNome = (localStorage.getItem('nome') || localStorage.getItem('usuario') || '').trim();
  const adminSobrenome = (localStorage.getItem('sobrenome') || '').trim();
  const attendantName = [adminNome, adminSobrenome].filter(Boolean).join(' ').trim() || 'Atendente Oficial';

  if (userGreetingName) {
    userGreetingName.textContent = attendantName;
  }

  // Base da API (compatível com localhost:3000 e Live Server :5501)
  const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : (window.AUTH_SERVER || window.location.origin);

  // Estado Geral
  let conversations = [];
  let selectedConversation = null;
  let activeFilter = 'all';
  let searchTerm = '';
  let pollingQueueInterval = null;
  let pollingMessagesInterval = null;
  let isFirstLoad = true;

  // Rastreamento para disparo de som de novo chamado
  const knownConversationsMap = new Map();

  // =========================================================================
  // SISTEMA DE SOM DE NOTIFICAÇÃO (Web Audio API Synthesizer)
  // =========================================================================
  let audioCtx = null;
  let soundEnabled = localStorage.getItem('mix_chat_sound_enabled') !== 'false';

  function updateSoundButtonVisual() {
    if (!btnToggleSound || !soundIcon || !soundStatusText) return;
    if (soundEnabled) {
      btnToggleSound.classList.remove('muted');
      soundIcon.className = 'fa-solid fa-volume-high';
      soundStatusText.textContent = 'Som: Ativo';
      btnToggleSound.title = 'Som de notificação ativado. Clique para mutar.';
    } else {
      btnToggleSound.classList.add('muted');
      soundIcon.className = 'fa-solid fa-volume-xmark';
      soundStatusText.textContent = 'Som: Mudo';
      btnToggleSound.title = 'Som de notificação pausado. Clique para ativar.';
    }
  }

  updateSoundButtonVisual();

  function unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {}
  }

  // Desbloqueia contexto de áudio em qualquer interação do usuário com a página
  window.addEventListener('click', unlockAudio, { once: false });
  window.addEventListener('keydown', unlockAudio, { once: false });

  // Toca o som de alerta (2 tons harmônicos estilo "Ding-Dong" cristalino)
  function playNotificationChime() {
    if (!soundEnabled) return;
    try {
      unlockAudio();
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtx = new AudioCtx();
      }
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      // 1º Tom: D5 (587.33 Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.38);

      // 2º Tom: A5 (880.00 Hz) - 130ms depois
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.13);
      gain2.gain.setValueAtTime(0.32, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('Erro ao reproduzir som de notificação:', err);
    }
  }

  // Alternar som
  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('mix_chat_sound_enabled', String(soundEnabled));
      updateSoundButtonVisual();
      if (soundEnabled) {
        playNotificationChime();
        showToast('🔔 Som Ativado', 'Você ouvirá alertas sonoros quando clientes abrirem chamados.');
      }
    });
  }

  // Testar som
  if (btnTestSound) {
    btnTestSound.addEventListener('click', () => {
      soundEnabled = true;
      localStorage.setItem('mix_chat_sound_enabled', 'true');
      updateSoundButtonVisual();
      playNotificationChime();
      showToast('🔔 Teste de Som', 'Alerta sonoro de novo chamado funcionando perfeitamente!');
    });
  }

  // Exibe Toast visual na tela
  function showToast(titulo, mensagem, convId = null) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'chat-notification-toast';
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid fa-bell"></i></div>
      <div class="toast-text">
        <strong>${escapeHtml(titulo)}</strong>
        <p>${escapeHtml(mensagem)}</p>
      </div>
    `;

    if (convId) {
      toast.addEventListener('click', () => {
        abrirConversaPorId(convId);
        toast.remove();
      });
    }

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 6000);
  }

  // =========================================================================
  // CARREGAMENTO E FILA DE CHAMADOS EM TEMPO REAL
  // =========================================================================
  async function carregarFilaChamados() {
    try {
      const res = await fetch(`${apiBase}/api/conversations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      conversations = Array.isArray(data) ? data : [];

      if (queueTimeUpdated) {
        const now = new Date();
        queueTimeUpdated.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      // Detecção de novos chamados para disparar o SOM
      let novoChamadoDetectado = false;
      let clienteChamando = null;

      conversations.forEach(c => {
        const cid = String(c.id);
        const unread = Number(c.unread) || 0;
        const prev = knownConversationsMap.get(cid);

        if (!prev) {
          // Nova conversa que acabou de entrar na lista
          knownConversationsMap.set(cid, { unread, status: c.status, lastPreview: c.lastMessagePreview });
          if (!isFirstLoad && (c.status === 'aguardando_atendente' || (c.status !== 'ia_atendimento' && unread > 0))) {
            novoChamadoDetectado = true;
            clienteChamando = c;
          }
        } else {
          // Conversa existente: cliente enviou nova mensagem ou solicitou atendente
          if ((unread > prev.unread && c.status !== 'ia_atendimento') || (c.status === 'aguardando_atendente' && prev.status !== 'aguardando_atendente')) {
            novoChamadoDetectado = true;
            clienteChamando = c;
          }
          knownConversationsMap.set(cid, { unread, status: c.status, lastPreview: c.lastMessagePreview });
        }
      });

      isFirstLoad = false;

      // Dispara Som e Toast se novo chamado ou mensagem aguardando
      if (novoChamadoDetectado && clienteChamando) {
        playNotificationChime();
        showToast(
          `🔔 Novo Chamado Aberto!`,
          `${clienteChamando.name} quer falar com um atendente (${clienteChamando.protocol || `#CLI-${clienteChamando.id}`})`,
          clienteChamando.id
        );
      }

      // Atualiza badge de total aguardando (ignora chamados em autoatendimento com IA)
      const totalAguardando = conversations.filter(c => c.status === 'aguardando_atendente' || (c.status !== 'ia_atendimento' && c.unread && c.unread > 0)).length;
      if (unreadTotalBadge) {
        if (totalAguardando > 0) {
          unreadTotalBadge.style.display = 'inline-flex';
          unreadTotalBadge.textContent = String(totalAguardando);
        } else {
          unreadTotalBadge.style.display = 'none';
        }
      }

      renderizarListaConversas();

      // Se a conversa atualmente aberta tiver atualizações, sincroniza
      if (selectedConversation) {
        const atualizada = conversations.find(c => String(c.id) === String(selectedConversation.id));
        if (atualizada) {
          selectedConversation = atualizada;
          atualizarCabecalhoChat();
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar conversas:', err);
    }
  }

  // =========================================================================
  // FORMATAÇÃO E HIGIENIZAÇÃO DE NOMES E AVATARES
  // =========================================================================
  function formatarNomeCliente(nomeBruto) {
    if (!nomeBruto) return 'Cliente';
    let nome = String(nomeBruto).trim();
    // Remove prefixo "Atendimento -"
    nome = nome.replace(/^Atendimento\s*-\s*/i, '');
    // Remove palavras 'null' ou 'undefined' residuais
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

  function renderizarListaConversas() {
    if (!convListEl) return;

    // Atualiza contador de chamados concluídos para o botão de atalho
    const totalConcluidos = conversations.filter(c => c.status === 'finalizado' || c.status === 'closed').length;
    const totalConcluidosBadge = document.getElementById('totalConcluidosCountBadge');
    if (totalConcluidosBadge) {
      totalConcluidosBadge.textContent = String(totalConcluidos);
    }

    // FILA AO VIVO DO ATENDENTE: Exibe apenas chamados que necessitam de atendimento humano oficial
    // Remove chamados concluídos e chamados em autoatendimento com a IA (ia_atendimento)
    const chamadosAoVivo = conversations.filter(c => 
      c.status !== 'finalizado' && 
      c.status !== 'closed' && 
      c.status !== 'ia_atendimento'
    );

    let filtradas = chamadosAoVivo.filter(c => {
      if (activeFilter === 'aguardando') {
        return c.status === 'aguardando_atendente' || c.status === 'open' || (c.unread && c.unread > 0);
      }
      if (activeFilter === 'em_atendimento') {
        return c.status === 'em_atendimento' && (!c.unread || c.unread === 0);
      }
      return true; // 'all' (Todos da fila ao vivo de atendimento humano)
    });

    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      filtradas = filtradas.filter(c => {
        const nomeLimpo = formatarNomeCliente(c.name).toLowerCase();
        return nomeLimpo.includes(termo) ||
          (c.protocol || '').toLowerCase().includes(termo) ||
          (c.lastMessagePreview || '').toLowerCase().includes(termo);
      });
    }

    if (filtradas.length === 0) {
      convListEl.innerHTML = `
        <div class="chat-empty-queue">
          <i class="fa-solid fa-inbox"></i>
          Nenhum chamado ativo ${activeFilter !== 'all' ? 'neste filtro' : 'na fila'}.
        </div>
      `;
      return;
    }

    convListEl.innerHTML = filtradas.map(c => {
      const isSelected = selectedConversation && String(selectedConversation.id) === String(c.id);
      const isAguardando = c.status === 'aguardando_atendente' || c.status === 'open' || (c.unread && c.unread > 0);
      const isEmAtendimento = c.status === 'em_atendimento';

      let statusBadge = '';
      if (isAguardando) {
        statusBadge = `<span class="badge-chamado-aguardando"><i class="fa-solid fa-bell"></i> Aguardando</span>`;
      } else if (isEmAtendimento) {
        statusBadge = `<span class="badge-chamado-ativo"><i class="fa-solid fa-comments"></i> Em curso</span>`;
      }

      const nomeLimpo = formatarNomeCliente(c.name);
      const initials = extrairIniciaisCliente(c.name);
      let lastMsg = (c.lastMessagePreview || '').trim();
      if (/MixIA|Autoatendimento|Assistente Virtual|Inteligência Artificial|Perfeito.*Identifiquei sua solicitação/i.test(lastMsg) || !lastMsg) {
        lastMsg = 'Solicitação de atendimento';
      }
      const unreadCount = Number(c.unread) || 0;

      return `
        <div class="conv-item ${isSelected ? 'active' : ''}" data-id="${c.id}">
          <div class="conv-avatar" style="${isAguardando ? 'background:linear-gradient(135deg,#f59e0b,#d97706);' : ''}">
            ${initials}
          </div>
          <div class="conv-info">
            <div class="name">
              <span class="client-name-text" title="${escapeHtml(nomeLimpo)}">${escapeHtml(nomeLimpo)}</span>
              ${statusBadge}
            </div>
            <div class="meta" title="${escapeHtml(lastMsg)}">
              <span style="color:#38bdf8; font-weight:700; margin-right:4px;">${escapeHtml(c.protocol || `#CLI-${c.id}`)}</span>
              ${escapeHtml(lastMsg)}
            </div>
          </div>
          ${unreadCount > 0 ? `<div class="conv-right"><span class="conv-unread" style="background:#ef4444;">${unreadCount}</span></div>` : ''}
        </div>
      `;
    }).join("");

    // Eventos de clique nos itens da fila
    convListEl.querySelectorAll('.conv-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        abrirConversaPorId(id);
      });
    });
  }

  // =========================================================================
  // SELEÇÃO E VISUALIZAÇÃO DE UMA CONVERSA
  // =========================================================================
  async function abrirConversaPorId(id) {
    const conv = conversations.find(c => String(c.id) === String(id));
    if (!conv) return;

    selectedConversation = conv;
    renderizarListaConversas();
    atualizarCabecalhoChat();

    // Habilita compositor
    const nomeLimpo = formatarNomeCliente(conv.name);
    if (msgInput) {
      msgInput.disabled = false;
      msgInput.placeholder = `Responder a ${nomeLimpo}...`;
      msgInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
    if (quickRepliesWrap) quickRepliesWrap.style.display = 'flex';
    if (btnEncerrarAtendimento) btnEncerrarAtendimento.style.display = 'inline-flex';

    // Marca como lida no servidor
    try {
      await fetch(`${apiBase}/api/conversations/${conv.id}/read`, { method: 'POST' });
      conv.unread = 0;
      knownConversationsMap.set(String(conv.id), { ...knownConversationsMap.get(String(conv.id)), unread: 0 });
      renderizarListaConversas();
    } catch (e) {}

    // Carrega mensagens imediatamente
    await carregarMensagensConversaAtual();

    // Inicia polling das mensagens da conversa atual
    clearInterval(pollingMessagesInterval);
    pollingMessagesInterval = setInterval(carregarMensagensConversaAtual, 2000);
  }

  function atualizarCabecalhoChat() {
    if (!selectedConversation) return;
    const c = selectedConversation;
    const nomeLimpo = formatarNomeCliente(c.name);

    if (chatHeaderName) chatHeaderName.textContent = nomeLimpo;
    if (chatHeaderBadge) chatHeaderBadge.style.display = 'inline-flex';
    if (chatStatusDot) chatStatusDot.style.display = 'inline-block';

    const proto = c.protocol || `#CLI-${c.id}`;
    let statusTexto = 'Atendimento em andamento';
    if (c.status === 'aguardando_atendente' || c.status === 'open') statusTexto = '🔔 Cliente aguardando sua resposta';
    if (c.status === 'finalizado') statusTexto = '✅ Atendimento encerrado';

    if (chatStatusText) {
      chatStatusText.innerHTML = `Protocolo <strong>${escapeHtml(proto)}</strong> • ${statusTexto}`;
    }

    if (clientAvatarBox) {
      const initials = extrairIniciaisCliente(c.name);
      clientAvatarBox.innerHTML = `<strong>${initials}</strong>`;
    }
  }

  async function carregarMensagensConversaAtual() {
    if (!selectedConversation || !messagesEl) return;

    try {
      const res = await fetch(`${apiBase}/api/conversations/${selectedConversation.id}/messages`);
      if (!res.ok) return;
      const msgs = await res.json();
      renderizarMensagens(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.warn('Erro ao carregar mensagens:', err);
    }
  }

  function renderizarMensagens(msgs) {
    if (!messagesEl) return;

    // Filtra para que as mensagens da IA (MixIA / bot) NÃO apareçam no chat do funcionário
    const msgsHumanas = (Array.isArray(msgs) ? msgs : []).filter(m => {
      const isBot = m.from === 'bot' || m.from === 'ia' || (m.fromName && /MixIA/i.test(m.fromName));
      return !isBot;
    });

    if (msgsHumanas.length === 0) {
      messagesEl.innerHTML = `
        <div class="chat-empty-queue" style="margin-top:40px;">
          <i class="fa-solid fa-comment-dots" style="font-size:2.5rem; color:#334155;"></i>
          <p>Nenhuma mensagem de atendimento humano trocada ainda com este cliente.</p>
        </div>
      `;
      return;
    }

    const html = msgsHumanas.map(m => {
      const isSystem = m.from === 'system';
      if (isSystem) {
        return `<div class="msg-system">${escapeHtml(m.text)}</div>`;
      }

      // Se enviada por atendente ou admin, aparece à direita (me)
      const isAtendente = m.from === 'attendant' || m.from === 'admin';
      const className = isAtendente ? 'msg me attendant' : 'msg other client';
      let autor = `<i class="fa-solid fa-user"></i> ${escapeHtml(m.fromName || selectedConversation.name || 'Cliente')}`;
      if (isAtendente) {
        autor = `<i class="fa-solid fa-headset"></i> ${escapeHtml(m.fromName || attendantName)} (Atendente)`;
      }

      const hora = formatTime(m.time);

      return `
        <div class="${className}">
          <div class="author">${autor}</div>
          <div class="msg-content">${formatarMensagemTexto(m.text)}</div>
          <span class="time">${hora} ${isAtendente ? '<i class="fa-solid fa-check-double" style="margin-left:3px; opacity:0.85;"></i>' : ''}</span>
        </div>
      `;
    }).join("");

    const shouldScroll = messagesEl.scrollHeight - messagesEl.scrollTop <= messagesEl.clientHeight + 150;
    messagesEl.innerHTML = html;

    if (shouldScroll) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function formatarMensagemTexto(txt) {
    return escapeHtml(txt || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function formatTime(isoOrTs) {
    try {
      const d = new Date(isoOrTs || Date.now());
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // =========================================================================
  // ENVIO DE MENSAGENS PELO ATENDENTE
  // =========================================================================
  async function enviarMensagemAtendente(textoCustom = null) {
    if (!selectedConversation) {
      alert('Selecione um chamado na fila primeiro.');
      return;
    }

    const texto = String(textoCustom !== null ? textoCustom : (msgInput ? msgInput.value : '')).trim();
    if (!texto) return;

    if (msgInput) msgInput.value = '';

    // Envia ao backend como atendente
    try {
      const res = await fetch(`${apiBase}/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'attendant',
          fromName: attendantName,
          text: texto
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await carregarMensagensConversaAtual();
      await carregarFilaChamados();

      // Notifica abas do cliente instantaneamente via BroadcastChannel
      try {
        const bus = new BroadcastChannel('mix_support_bus');
        bus.postMessage({
          type: 'EMPLOYEE_REPLY_TO_CLIENT',
          conversationId: selectedConversation.id,
          protocol: selectedConversation.protocol,
          protocolo: selectedConversation.protocol,
          author: attendantName,
          fromName: attendantName,
          text: texto,
          time: new Date().toISOString()
        });
      } catch (e) {}

      if (messagesEl) {
        setTimeout(() => {
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 60);
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
      alert('Não foi possível enviar a mensagem. Verifique a conexão com o servidor.');
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => enviarMensagemAtendente());
  }

  if (msgInput) {
    msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagemAtendente();
      }
    });
  }

  // Cliques nas respostas rápidas
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      if (text) {
        enviarMensagemAtendente(text);
      }
    });
  });

  // Botão de Enviar Anexo
  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      enviarMensagemAtendente(`[Arquivo enviado pelo atendente: ${file.name}]`);
      fileInput.value = '';
    });
  }

  // =========================================================================
  // ENCERRAR ATENDIMENTO & EXPORTAR HISTÓRICO
  // =========================================================================
  if (btnEncerrarAtendimento) {
    btnEncerrarAtendimento.addEventListener('click', async () => {
      if (!selectedConversation) return;

      const proto = selectedConversation.protocol || '#' + selectedConversation.id;
      const nomeLimpo = formatarNomeCliente(selectedConversation.name);
      const confirmar = confirm(`Deseja realmente encerrar o atendimento do protocolo ${proto} (${nomeLimpo})? O chamado será concluído e arquivado na página de Histórico.`);
      if (!confirmar) return;

      try {
        const res = await fetch(`${apiBase}/api/conversations/${selectedConversation.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'finalizado' })
        });

        if (res.ok) {
          selectedConversation.status = 'finalizado';
          showToast('✅ Atendimento Concluído', `Chamado ${proto} finalizado com sucesso e arquivado no Histórico.`);

          // Reseta a área de chat ativa (o chamado concluído sai da fila ao vivo)
          selectedConversation = null;
          clearInterval(pollingMessagesInterval);

          if (chatHeaderName) chatHeaderName.textContent = 'Selecione um cliente';
          if (chatHeaderBadge) chatHeaderBadge.style.display = 'none';
          if (chatStatusDot) chatStatusDot.style.display = 'none';
          if (chatStatusText) chatStatusText.textContent = 'Aguardando seleção de chamado na fila';
          if (clientAvatarBox) clientAvatarBox.innerHTML = '<i class="fa-solid fa-user"></i>';

          if (msgInput) {
            msgInput.value = '';
            msgInput.disabled = true;
            msgInput.placeholder = 'Selecione um chamado da fila ao vivo para responder...';
          }
          if (sendBtn) sendBtn.disabled = true;
          if (quickRepliesWrap) quickRepliesWrap.style.display = 'none';
          if (btnEncerrarAtendimento) btnEncerrarAtendimento.style.display = 'none';

          if (messagesEl) {
            messagesEl.innerHTML = `
              <div class="chat-empty-queue" style="margin-top:60px;">
                <i class="fa-solid fa-circle-check" style="font-size:3.2rem; color:#10b981; margin-bottom:12px;"></i>
                <h3 style="color:#fff; margin-bottom:8px; font-size:1.15rem;">Atendimento Finalizado com Sucesso!</h3>
                <p style="max-width:440px; margin:0 auto; line-height:1.4;">O protocolo <strong>${escapeHtml(proto)}</strong> foi concluído e transferido para o Histórico de Chamados.<br>Selecione o próximo cliente na fila ao vivo.</p>
              </div>
            `;
          }

          await carregarFilaChamados();
        }
      } catch (err) {
        console.error('Erro ao encerrar atendimento:', err);
        alert('Não foi possível encerrar o atendimento. Verifique a conexão com o servidor.');
      }
    });
  }

  if (btnExportChat) {
    btnExportChat.addEventListener('click', async () => {
      if (!selectedConversation) {
        alert('Selecione uma conversa para baixar o histórico.');
        return;
      }

      try {
        const res = await fetch(`${apiBase}/api/conversations/${selectedConversation.id}/messages`);
        const msgs = await res.json();

        let conteudo = `=====================================================\n`;
        conteudo += `MIX-PROMOÇÃO - HISTÓRICO OFICIAL DE ATENDIMENTO AO CLIENTE\n`;
        conteudo += `=====================================================\n`;
        conteudo += `Protocolo: ${selectedConversation.protocol || '#' + selectedConversation.id}\n`;
        conteudo += `Cliente: ${selectedConversation.name}\n`;
        conteudo += `Atendente Responsável: ${attendantName}\n`;
        conteudo += `Data de Exportação: ${new Date().toLocaleString()}\n`;
        conteudo += `=====================================================\n\n`;

        msgs.forEach(m => {
          const hora = new Date(m.time || Date.now()).toLocaleString();
          conteudo += `[${hora}] ${m.fromName || m.from}: ${m.text}\n`;
        });

        const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Atendimento_${selectedConversation.protocol || selectedConversation.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Erro ao exportar histórico.');
      }
    });
  }

  // =========================================================================
  // FILTROS & BUSCA
  // =========================================================================
  filterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabs.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'rgba(255,255,255,0.1)';
        b.style.color = '#94a3b8';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(0,198,255,0.15)';
      btn.style.borderColor = 'rgba(0,198,255,0.4)';
      btn.style.color = '#38bdf8';

      activeFilter = btn.dataset.filter || 'all';
      renderizarListaConversas();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderizarListaConversas();
    });
  }

  if (btnAtualizarFila) {
    btnAtualizarFila.addEventListener('click', () => {
      const icon = btnAtualizarFila.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      carregarFilaChamados().finally(() => {
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

  // =========================================================================
  // CANAL DE COMUNICAÇÃO BIDIRECIONAL INSTANTÂNEO (BroadcastChannel)
  // =========================================================================
  try {
    const bus = new BroadcastChannel('mix_support_bus');
    bus.onmessage = function (event) {
      const data = event.data;
      if (data && (data.type === 'CLIENT_NEW_MESSAGE' || data.type === 'CLIENT_NEW_TICKET')) {
        carregarFilaChamados();
        if (selectedConversation && (String(selectedConversation.id) === String(data.conversationId) || selectedConversation.protocol === data.protocol)) {
          carregarMensagensConversaAtual();
        }
        if (data.pediuAtendente) {
          playNotificationChime();
          showToast(
            '🔔 Novo Chamado Aberto!',
            `${data.clientName || 'Cliente'} quer falar com um atendente (${data.protocol || ''}).`,
            data.conversationId
          );
        }
      }
    };
  } catch (e) {}

  // =========================================================================
  // INICIALIZAÇÃO E POLLING CONTÍNUO
  // =========================================================================
  carregarFilaChamados();
  pollingQueueInterval = setInterval(carregarFilaChamados, 2500);
});