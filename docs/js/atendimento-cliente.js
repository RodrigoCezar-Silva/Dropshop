/**
 * CANAL DE ATENDIMENTO AO CLIENTE - MIX-PROMOÇÃO (atendimento.html)
 * Autoatendimento Inteligente com MixIA (IA 24h) com Mensagem de Boas-Vindas
 * Imediata, Opções Interativas, Escalação Exclusiva por Palavras-Chave
 * e Formatação Inteligente do Nome do Cliente (sem 'null' e com caixa correta).
 */

(function () {
  // Evita inicialização duplicada
  if (window.__MIX_ATENDIMENTO_CLIENTE_INITIALIZED__) {
    console.log('[atendimento-cliente] Script já inicializado.');
    return;
  }
  window.__MIX_ATENDIMENTO_CLIENTE_INITIALIZED__ = true;

  // =========================================================================
  // PERFIS DE ATENDIMENTO: MIXIA (IA 24H) & EQUIPE HUMANA OFICIAL
  // =========================================================================
  const MIX_IA = {
    nome: "MixIA — Inteligência Artificial 24h",
    primeiroNome: "MixIA",
    cargo: "Assistente Virtual Inteligente",
    especialidade: "Autoatendimento & Tira-Dúvidas 24h",
    gradiente: "linear-gradient(135deg, #0072ff, #00c6ff)",
    icone: "fa-solid fa-robot"
  };

  const ATENDENTES_SUPORTE = [
    {
      id: 1,
      nome: "Camila Santos",
      primeiroNome: "Camila",
      cargo: "Atendente Oficial Verificada",
      especialidade: "Pedidos & Rastreamento",
      gradiente: "linear-gradient(135deg, #0072ff, #00c6ff)",
      icone: "fa-solid fa-headset",
      saudacao: "Sou a **Camila Santos**, especialista em pedidos e rastreamento da MIX-PROMOÇÃO."
    },
    {
      id: 2,
      nome: "Lucas Ferreira",
      primeiroNome: "Lucas",
      cargo: "Consultor de Pagamentos & PIX",
      especialidade: "Pagamentos & Faturamento",
      gradiente: "linear-gradient(135deg, #059669, #10b981)",
      icone: "fa-solid fa-credit-card",
      saudacao: "Sou o **Lucas Ferreira**, consultor financeiro e de pagamentos da MIX-PROMOÇÃO."
    },
    {
      id: 3,
      nome: "Beatriz Rocha",
      primeiroNome: "Beatriz",
      cargo: "Supervisora de Pós-Venda",
      especialidade: "Trocas, Devoluções & CDC",
      gradiente: "linear-gradient(135deg, #7c3aed, #ec4899)",
      icone: "fa-solid fa-rotate-left",
      saudacao: "Sou a **Beatriz Rocha**, supervisora de trocas, devoluções e pós-venda da loja."
    },
    {
      id: 4,
      nome: "Gabriel Lima",
      primeiroNome: "Gabriel",
      cargo: "Analista de Suporte ao Consumidor",
      especialidade: "Atendimento Geral & Cadastro",
      gradiente: "linear-gradient(135deg, #2563eb, #38bdf8)",
      icone: "fa-solid fa-user-shield",
      saudacao: "Sou o **Gabriel Lima**, analista do canal de atendimento online da MIX-PROMOÇÃO."
    },
    {
      id: 5,
      nome: "Juliana Martins",
      primeiroNome: "Juliana",
      cargo: "Coordenadora de Entregas",
      especialidade: "Logística & Prazos de Envio",
      gradiente: "linear-gradient(135deg, #d97706, #ef4444)",
      icone: "fa-solid fa-truck-fast",
      saudacao: "Sou a **Juliana Martins**, coordenadora de entregas e expedição de encomendas."
    },
    {
      id: 6,
      nome: "Thiago Albuquerque",
      primeiroNome: "Thiago",
      cargo: "Especialista em Soluções Rápidas",
      especialidade: "Ouvidoria & Resoluções Prioritárias",
      gradiente: "linear-gradient(135deg, #0f766e, #06b6d4)",
      icone: "fa-solid fa-handshake-angle",
      saudacao: "Sou o **Thiago Albuquerque**, especialista da central de soluções da MIX-PROMOÇÃO."
    }
  ];

  function sortearProximoAtendente() {
    let ultimoId = 0;
    try {
      ultimoId = parseInt(sessionStorage.getItem('mix_ultimo_atendente_id') || localStorage.getItem('mix_ultimo_atendente_id') || '0', 10);
    } catch (e) {}

    const outros = ATENDENTES_SUPORTE.filter(a => a.id !== ultimoId);
    const listaParaSorteio = outros.length > 0 ? outros : ATENDENTES_SUPORTE;
    const escolhido = listaParaSorteio[Math.floor(Math.random() * listaParaSorteio.length)];

    try {
      sessionStorage.setItem('mix_ultimo_atendente_id', String(escolhido.id));
      localStorage.setItem('mix_ultimo_atendente_id', String(escolhido.id));
      sessionStorage.setItem('mix_atendente_atual', JSON.stringify(escolhido));
    } catch (e) {}

    return escolhido;
  }

  function carregarAtendenteAtual() {
    try {
      const salvo = sessionStorage.getItem('mix_atendente_atual');
      if (salvo) return JSON.parse(salvo);
    } catch (e) {}
    return sortearProximoAtendente();
  }

  // =========================================================================
  // SANITIZAÇÃO E FORMATAÇÃO DO NOME DO CLIENTE
  // Remove 'null', 'undefined' e aplica capitalização elegante com preposições
  // =========================================================================
  function limparStringNull(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'nan') {
      return '';
    }
    return str.replace(/\b(null|undefined|nan)\b/gi, '').replace(/\s+/g, ' ').trim();
  }

  function formatarNomePessoa(nomeBruto) {
    const limpo = limparStringNull(nomeBruto);
    if (!limpo) return 'Cliente';

    const preposicoes = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
    return limpo.split(' ').map((palavra, index) => {
      const pLower = palavra.toLowerCase();
      if (index > 0 && preposicoes.has(pLower)) {
        return pLower;
      }
      return pLower.charAt(0).toUpperCase() + pLower.slice(1);
    }).join(' ');
  }

  // =========================================================================
  // DETECTOR DE PALAVRAS-CHAVE PARA ATENDIMENTO HUMANO
  // Só transfere para atendente humano quando o cliente digita palavras-chave!
  // =========================================================================
  function verificarPedidoAtendenteHumano(texto) {
    if (!texto) return false;
    const t = String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Raízes e termos diretos (cobre variações no plural, singular e digitação)
    if (
      t.includes('atendent') ||
      t.includes('humano') ||
      t.includes('humana') ||
      t.includes('operador') ||
      t.includes('suporte humano') ||
      t.includes('falar com alguem') ||
      t.includes('falar com pessoa') ||
      t.includes('chamar alguem') ||
      t.includes('chamar atendente') ||
      t.includes('preciso de atendente') ||
      t.includes('passar para atendente') ||
      t.includes('transferir') ||
      t.includes('transferencia') ||
      t.includes('nao quero robo') ||
      t.includes('nao quero bot') ||
      t.includes('chega de robo') ||
      t.includes('pessoa de verdade')
    ) {
      return true;
    }

    const padroes = [
      /\batendente\b/,
      /\batendentes\b/,
      /\batendete\b/,
      /\bhumano\b/,
      /\bhumana\b/,
      /\bhumanos\b/,
      /\bhumanas\b/,
      /\bpessoa\b/,
      /\bpessoas\b/,
      /\boperador\b/,
      /\boperadora\b/,
      /\boperadores\b/,
      /\bfuncionario\b/,
      /\bfuncionaria\b/,
      /\bcolaborador\b/,
      /\bcolaboradora\b/,
      /\balguem\b/,
      /\bgente\b/,
      /\bespecialista\b/,
      /\bsuporte humano\b/,
      /\batendimento humano\b/,
      /\bchamar atendente\b/,
      /\bchama atendente\b/,
      /\bchamar um atendente\b/,
      /\bquero atendente\b/,
      /\bquero um atendente\b/,
      /\bfalar com atendente\b/,
      /\bfalar com um atendente\b/,
      /\bfalar com uma atendente\b/,
      /\bfalar com uma pessoa\b/,
      /\bfalar com humano\b/,
      /\bfalar com um humano\b/,
      /\bfalar com alguem\b/,
      /\bchamar alguem\b/,
      /\bpreciso de atendente\b/,
      /\bpreciso de alguem\b/,
      /\bpreciso falar com atendente\b/,
      /\bpassa(r)? para atendente\b/,
      /\bpassar pro atendente\b/,
      /\bpassar pra atendente\b/,
      /\btransfere\b/,
      /\btransferir\b/,
      /\btransferencia\b/,
      /\bnao quero robo\b/,
      /\bnao quero bot\b/,
      /\bchega de robo\b/,
      /\bchega de bot\b/,
      /\bme atende alguem\b/
    ];

    return padroes.some(regex => regex.test(t));
  }

  function initAtendimento() {
    const messagesEl = document.getElementById('messages');
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendMsgBtn');
    const attachBtn = document.getElementById('btnAttach');
    const fileInput = document.getElementById('fileAttachInput');
    const btnExport = document.getElementById('btnExportChat');
    const btnNovo = document.getElementById('btnNovoAtendimento');
    const btnEncerrar = document.getElementById('btnEncerrarAtendimento');
    const btnSidebarChamarHumano = document.getElementById('btnSidebarChamarHumano');
    const protocolEl = document.getElementById('protocolNumber');
    const protocolSubEl = document.getElementById('protocolSubtitle');
    const userGreetingNameEl = document.getElementById('userGreetingName');

    // Elementos do Atendente na barra do chat
    const chatHeaderNameEl = document.getElementById('chatHeaderName');
    const chatHeaderBadgeEl = document.getElementById('chatHeaderBadge');
    const chatHeaderStatusEl = document.getElementById('chatHeaderStatus');
    const attendantAvatarIconEl = document.querySelector('.attendant-avatar i');
    const attendantAvatarWrapEl = document.querySelector('.attendant-avatar');

    // Limpeza preventiva de "null" ou valores corrompidos no localStorage
    try {
      const rawSobrenome = localStorage.getItem('sobrenome');
      if (rawSobrenome && (rawSobrenome.trim().toLowerCase() === 'null' || rawSobrenome.trim().toLowerCase() === 'undefined')) {
        localStorage.removeItem('sobrenome');
      }
      const rawNome = localStorage.getItem('nome');
      if (rawNome && /\b(null|undefined)\b/i.test(rawNome)) {
        const nomeCorrigido = rawNome.replace(/\b(null|undefined)\b/gi, '').replace(/\s+/g, ' ').trim();
        if (nomeCorrigido) {
          localStorage.setItem('nome', nomeCorrigido);
        }
      }
    } catch (e) {}

    // Identificação Formatada do Cliente
    const nomeCliente = limparStringNull(localStorage.getItem('nome'));
    const sobrenomeCliente = limparStringNull(localStorage.getItem('sobrenome'));
    const clienteFullName = formatarNomePessoa([nomeCliente, sobrenomeCliente].filter(Boolean).join(' ') || localStorage.getItem('usuario') || 'Cliente');
    const clienteEmail = (localStorage.getItem('email') || '').trim();

    if (userGreetingNameEl) {
      userGreetingNameEl.textContent = clienteFullName;
    }

    // Configuração de API
    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : (window.AUTH_SERVER || window.location.origin);

    // =========================================================================
    // CONFIGURAÇÕES DINÂMICAS DO CHATBOT IA & RESPOSTAS PERSONALIZADAS
    // =========================================================================
    let chatbotConfig = {};
    let customRespostas = [];

    function carregarConfiguracoesChatbot() {
      try {
        chatbotConfig = JSON.parse(localStorage.getItem('chatbot_config') || '{}');
      } catch (e) {
        chatbotConfig = {};
      }
      try {
        customRespostas = JSON.parse(localStorage.getItem('chatbot_respostas_custom') || '[]');
      } catch (e) {
        customRespostas = [];
      }

      if (chatbotConfig.nomeIA && chatbotConfig.nomeIA.trim()) {
        const customIA = chatbotConfig.nomeIA.trim();
        MIX_IA.nome = `${customIA} — Inteligência Artificial 24h`;
        MIX_IA.primeiroNome = customIA;
      }
    }

    carregarConfiguracoesChatbot();

    async function sincronizarConfiguracoesServidor() {
      try {
        const res = await fetch(`${apiBase}/api/chatbot-config`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            chatbotConfig = data.config;
            localStorage.setItem('chatbot_config', JSON.stringify(chatbotConfig));
            if (chatbotConfig.nomeIA && chatbotConfig.nomeIA.trim()) {
              const customIA = chatbotConfig.nomeIA.trim();
              MIX_IA.nome = `${customIA} — Inteligência Artificial 24h`;
              MIX_IA.primeiroNome = customIA;
              atualizarVisualCabecalho();
            }
            if (Array.isArray(chatbotConfig.respostasCustom)) {
              customRespostas = chatbotConfig.respostasCustom;
              localStorage.setItem('chatbot_respostas_custom', JSON.stringify(customRespostas));
            }
          }
        }
      } catch (e) {}
    }
    sincronizarConfiguracoesServidor();

    // Protocolo e Atendente Humano Alocado
    const urlParams = new URLSearchParams(window.location.search);
    const deveForcarNovo = urlParams.get('novo') === '1' || sessionStorage.getItem('mix_forcar_novo_atendimento') === '1';

    if (deveForcarNovo) {
      try {
        sessionStorage.removeItem('mix_forcar_novo_atendimento');
        sessionStorage.removeItem('mix_cliente_protocolo');
        sessionStorage.removeItem('mix_active_conv_id');
        sessionStorage.removeItem('mix_atendente_atual');
      } catch (e) {}
    }

    let atendenteAtual = deveForcarNovo ? sortearProximoAtendente() : carregarAtendenteAtual();
    let protocolo = deveForcarNovo
      ? 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000)
      : (sessionStorage.getItem('mix_cliente_protocolo') || 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));

    sessionStorage.setItem('mix_cliente_protocolo', protocolo);

    if (urlParams.get('novo') === '1') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Estado da Sessão: Inicialmente em Modo IA (MixIA)
    let modoHumano = false;
    let isTyping = false;
    let isSending = false;
    let messages = [];
    let activeConversationId = null;
    let pollingInterval = null;
    const renderedMessageKeys = new Set();

    // =========================================================================
    // SISTEMA DE SOM DO CLIENTE (Web Audio API Synthesizer)
    // =========================================================================
    let clientAudioCtx = null;

    function unlockClientAudio() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!clientAudioCtx) clientAudioCtx = new AudioCtx();
        if (clientAudioCtx.state === 'suspended') {
          clientAudioCtx.resume();
        }
      } catch (e) {}
    }

    window.addEventListener('click', unlockClientAudio, { once: false });
    window.addEventListener('keydown', unlockClientAudio, { once: false });
    window.addEventListener('touchstart', unlockClientAudio, { once: false });

    function playAttendantReplySound() {
      try {
        unlockClientAudio();
        if (!clientAudioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) clientAudioCtx = new AudioCtx();
        }
        if (!clientAudioCtx) return;

        const now = clientAudioCtx.currentTime;

        // C5 (523.25 Hz)
        const osc1 = clientAudioCtx.createOscillator();
        const gain1 = clientAudioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.22, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc1.connect(gain1);
        gain1.connect(clientAudioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.32);

        // G5 (783.99 Hz)
        const osc2 = clientAudioCtx.createOscillator();
        const gain2 = clientAudioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.12);
        gain2.gain.setValueAtTime(0.26, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(clientAudioCtx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
      } catch (err) {
        console.warn('Erro ao tocar som de resposta:', err);
      }
    }

    // =========================================================================
    // CONTADOR DE INATIVIDADE: 3 MINUTOS (180s)
    // =========================================================================
    const TEMPO_LIMITE_INATIVIDADE = 180;
    let segundosRestantes = TEMPO_LIMITE_INATIVIDADE;
    let timerInatividadeInterval = null;
    let timerPausado = false;

    let atendimentoEncerrado = false;

    function formatarTempo(totalSegundos) {
      const m = Math.floor(totalSegundos / 60);
      const s = totalSegundos % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function encerrarPorInatividade() {
      clearInterval(timerInatividadeInterval);
      if (pollingInterval) clearInterval(pollingInterval);
      atendimentoEncerrado = true;

      // 1. Marca atendimento anterior como finalizado no backend
      if (activeConversationId) {
        try {
          fetch(`${apiBase}/api/conversations/${activeConversationId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'finalizado' })
          });
        } catch (e) {}

        // Envia mensagem do sistema para registrar no histórico do chamado
        try {
          fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'system',
              fromName: 'Sistema',
              text: '🔒 Atendimento encerrado automaticamente por inatividade (3 minutos sem interação).'
            })
          });
        } catch (e) {}
      }

      // 2. Limpa dados da sessão e define flag para iniciar um novo chamado quando o cliente voltar
      // 2. Limpa dados da sessão antiga para que o próximo acesso inicie um novo chamado
      try {
        sessionStorage.removeItem('mix_cliente_protocolo');
        sessionStorage.removeItem('mix_active_conv_id');
        sessionStorage.removeItem('mix_atendente_atual');
        sessionStorage.setItem('mix_forcar_novo_atendimento', '1');
        sessionStorage.setItem('mix_alerta_inatividade', 'Você ficou 3 minutos sem interagir no chat. O atendimento foi encerrado por inatividade e você foi redirecionado para Minha Conta. Ao acessar o suporte novamente, um novo atendimento será iniciado.');
      } catch (e) {}

      // 3. Atualiza o indicador visual no cabeçalho
      const badge = document.getElementById('inactivityTimerBadge');
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Encerrado</span>';
        badge.classList.add('warning');
        badge.title = 'Atendimento encerrado por inatividade (3 minutos).';
      }

      // 4. Bloqueia a parte de digitar e o botão enviar
      if (msgInput) {
        msgInput.value = '';
        msgInput.disabled = true;
        msgInput.placeholder = 'Atendimento encerrado por inatividade.';
        msgInput.style.opacity = '0.6';
        msgInput.style.cursor = 'not-allowed';
      }
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add('disabled');
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
      }
      if (attachBtn) {
        attachBtn.disabled = true;
        attachBtn.style.opacity = '0.5';
        attachBtn.style.cursor = 'not-allowed';
      }

      // Desativa todas as opções de sugestão rápidas
      const allChips = document.querySelectorAll('.suggestion-chip');
      allChips.forEach(c => {
        c.disabled = true;
        c.style.pointerEvents = 'none';
        c.style.opacity = '0.4';
      });

      // 5. Exibe a mensagem de encerramento de atendimento no chat
      messages.push({
        type: 'closure',
        time: Date.now(),
        text: 'Atendimento encerrado por inatividade.'
      });
      renderMessages();
    }

    function atualizarVisualTimer() {
      const badge = document.getElementById('inactivityTimerBadge');
      const segEl = document.getElementById('segundosRestantes');
      if (segEl) {
        segEl.textContent = formatarTempo(segundosRestantes);
      }
      if (badge) {
        if (segundosRestantes <= 20) {
          badge.classList.add('warning');
        } else {
          badge.classList.remove('warning');
        }
      }
    }

    function reiniciarTimerInatividade() {
      if (timerPausado || atendimentoEncerrado) return;
      segundosRestantes = TEMPO_LIMITE_INATIVIDADE;
      atualizarVisualTimer();

      clearInterval(timerInatividadeInterval);
      timerInatividadeInterval = setInterval(() => {
        if (timerPausado || atendimentoEncerrado) return;
        segundosRestantes--;
        atualizarVisualTimer();

        if (segundosRestantes <= 0) {
          clearInterval(timerInatividadeInterval);
          encerrarPorInatividade();
        }
      }, 1000);
    }

    function pausarTimerInatividade() {
      timerPausado = true;
      const segEl = document.getElementById('segundosRestantes');
      if (segEl) segEl.textContent = '...';
      const badge = document.getElementById('inactivityTimerBadge');
      if (badge) badge.classList.remove('warning');
    }

    function retomarTimerInatividade() {
      timerPausado = false;
      reiniciarTimerInatividade();
    }

    // =========================================================================
    // ATUALIZAÇÃO VISUAL: CABEÇALHO E MODO DE ATENDIMENTO
    // =========================================================================
    function atualizarVisualCabecalho() {
      const protoExibicao = protocolo.startsWith('#') ? protocolo : '#' + protocolo;
      if (protocolEl) protocolEl.textContent = protoExibicao;
      if (protocolSubEl) protocolSubEl.textContent = protoExibicao;

      if (!modoHumano) {
        // MODO 1: MIXIA (IA 24H)
        if (chatHeaderNameEl) chatHeaderNameEl.textContent = MIX_IA.nome;
        if (chatHeaderBadgeEl) {
          chatHeaderBadgeEl.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> IA Oficial`;
        }
        if (chatHeaderStatusEl) {
          chatHeaderStatusEl.innerHTML = `<span class="pulse-dot"></span><span>Online agora • Autoatendimento Inteligente • Protocolo <strong class="header-proto-code">${protoExibicao}</strong></span>`;
        }
        if (attendantAvatarIconEl) attendantAvatarIconEl.className = MIX_IA.icone;
        if (attendantAvatarWrapEl) attendantAvatarWrapEl.style.background = MIX_IA.gradiente;
        if (msgInput) msgInput.placeholder = "Tire sua dúvida com a MixIA no chat...";
      } else {
        // MODO 2: ATENDENTE HUMANO CONECTADO
        if (chatHeaderNameEl) chatHeaderNameEl.textContent = atendenteAtual.nome;
        if (chatHeaderBadgeEl) {
          chatHeaderBadgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Oficial`;
        }
        if (chatHeaderStatusEl) {
          chatHeaderStatusEl.innerHTML = `<span class="pulse-dot"></span><span>Atendente Online • ${atendenteAtual.cargo} • Protocolo <strong class="header-proto-code">${protoExibicao}</strong></span>`;
        }
        if (attendantAvatarIconEl) attendantAvatarIconEl.className = atendenteAtual.icone;
        if (attendantAvatarWrapEl) attendantAvatarWrapEl.style.background = atendenteAtual.gradiente;
        if (msgInput) msgInput.placeholder = `Mensagem para ${atendenteAtual.primeiroNome}...`;
      }
    }

    function scrollToBottom() {
      if (messagesEl) {
        setTimeout(() => {
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 50);
      }
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
    // RENDERIZAÇÃO DAS MENSAGENS (COM IDENTIFICAÇÃO DE BOT IA E ATENDENTE)
    // =========================================================================
    function renderMessages() {
      if (!messagesEl) return;
      messagesEl.innerHTML = '';

      messages.forEach((msg, idx) => {
        if (msg.type === 'closure') {
          const div = document.createElement('div');
          div.className = 'msg-closure-banner';
          div.style.cssText = 'margin: 22px auto; max-width: 520px; padding: 20px 24px; background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 14px; text-align: center; color: #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.35);';
          div.innerHTML = `
            <div style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <h4 style="margin: 0 0 6px 0; color: #f87171; font-size: 1.15rem; font-weight: 700;">Atendimento Encerrado por Inatividade</h4>
            <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 0.92rem; line-height: 1.45;">
              Este atendimento foi encerrado automaticamente devido a <strong>3 minutos de inatividade</strong>. O envio de novas mensagens neste chamado foi bloqueado.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button id="btnNovoAtendimentoInativo" type="button" style="background: linear-gradient(135deg, #00c6ff, #0072ff); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 10px rgba(0,198,255,0.3);">
                <i class="fa-solid fa-rotate-right"></i> Iniciar Novo Atendimento
              </button>
              <a href="meu-perfil.html" style="background: rgba(255,255,255,0.08); color: #94a3b8; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 18px; font-weight: 600; font-size: 0.92rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-user"></i> Minha Conta
              </a>
            </div>
          `;
          messagesEl.appendChild(div);

          const btnRestart = div.querySelector('#btnNovoAtendimentoInativo');
          if (btnRestart) {
            btnRestart.addEventListener('click', () => {
              sessionStorage.removeItem('mix_cliente_protocolo');
              sessionStorage.removeItem('mix_active_conv_id');
              sessionStorage.removeItem('mix_atendente_atual');
              sessionStorage.setItem('mix_forcar_novo_atendimento', '1');
              window.location.reload();
            });
          }
          return;
        }

        if (msg.type === 'system') {
          const div = document.createElement('div');
          div.className = 'msg-system';
          div.innerHTML = escapeHtml(msg.text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          messagesEl.appendChild(div);
          return;
        }

        const div = document.createElement('div');
        const isMe = msg.type === 'client';
        const isBot = msg.type === 'bot' || msg.from === 'bot' || msg.from === 'ia';

        div.className = `msg ${isMe ? 'me client' : (isBot ? 'other bot-msg' : 'other attendant')}`;

        let authorHtml = '';
        if (isMe) {
          authorHtml = '<i class="fa-solid fa-user"></i> Você';
        } else if (isBot) {
          authorHtml = '<i class="fa-solid fa-robot"></i> MixIA (Assistente Virtual)';
        } else {
          authorHtml = `<i class="${atendenteAtual.icone}"></i> ${escapeHtml(msg.author || atendenteAtual.nome)}`;
        }

        let html = `<div class="author">${authorHtml}</div>`;

        let formattedText = escapeHtml(msg.text)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        html += `<div class="msg-content">${formattedText}</div>`;

        if (msg.attachmentUrl) {
          html += `<img src="${msg.attachmentUrl}" class="msg-attachment" alt="Anexo enviado" onclick="window.open(this.src, '_blank')" title="Clique para ampliar" />`;
        }

        html += `<span class="time">${formatTime(msg.time)} ${isMe ? '<i class="fa-solid fa-check-double" style="margin-left:3px;opacity:0.8;"></i>' : ''}</span>`;

        div.innerHTML = html;
        messagesEl.appendChild(div);

        // Renderiza botões de sugestões interativas:
        // Exibe se a mensagem tiver sugestões E for a última mensagem de bot E não estivermos em modo humano
        const isLatestBotMsg = (isBot || msg.type === 'bot') && !messages.slice(idx + 1).some(m => m.type === 'bot' || m.from === 'bot');
        if (!modoHumano && isLatestBotMsg && msg.suggestions && msg.suggestions.length > 0) {
          const sugWrap = document.createElement('div');
          sugWrap.className = 'quick-suggestions';
          msg.suggestions.forEach(sug => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-chip';
            btn.type = 'button';
            btn.innerHTML = escapeHtml(sug);
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              if (isSending) return;
              reiniciarTimerInatividade();
              const chips = sugWrap.querySelectorAll('.suggestion-chip');
              chips.forEach(c => {
                c.disabled = true;
                c.style.pointerEvents = 'none';
                c.style.opacity = '0.5';
              });
              enviarMensagem(sug);
            });
            sugWrap.appendChild(btn);
          });
          if (sugWrap.children.length > 0) {
            messagesEl.appendChild(sugWrap);
          }
        }
      });

      scrollToBottom();
    }

    function showTypingIndicator(nomePersonalizado = null) {
      removeTypingIndicator();
      isTyping = true;
      pausarTimerInatividade();

      const typing = document.createElement('div');
      typing.id = 'activeTypingIndicator';
      typing.className = 'typing-indicator';
      const quem = nomePersonalizado || (modoHumano ? atendenteAtual.primeiroNome : 'MixIA');
      typing.innerHTML = `
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
        <span>${escapeHtml(quem)} está digitando...</span>
      `;
      messagesEl.appendChild(typing);
      scrollToBottom();
    }

    function removeTypingIndicator() {
      isTyping = false;
      const existing = document.getElementById('activeTypingIndicator');
      if (existing) existing.remove();
    }

    // =========================================================================
    // MENSAGEM DE BOAS-VINDAS DA MIXIA (COM OPÇÕES INTERATIVAS)
    // =========================================================================
    function criarMensagemBoasVindas() {
      const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;
      const nomeLoja = chatbotConfig.nomeLoja || 'MIX-PROMOÇÃO';
      const nomeIA = MIX_IA.nome;

      const msgSys = {
        type: 'system',
        text: `🔒 Atendimento Inicializado • Protocolo: ${protoFormatado} • ${nomeLoja} Central Oficial`,
        time: Date.now()
      };

      let textoBoasVindas = '';
      if (chatbotConfig.msgBoasVindas && chatbotConfig.msgBoasVindas.trim()) {
        let customMsg = chatbotConfig.msgBoasVindas.trim()
          .replace(/\{cliente\}/gi, clienteFullName)
          .replace(/\{nome\}/gi, clienteFullName)
          .replace(/\{loja\}/gi, nomeLoja);
        if (!customMsg.toLowerCase().includes(clienteFullName.toLowerCase())) {
          textoBoasVindas = `Olá, **${clienteFullName}**! 👋\n\n${customMsg}\n\n💡 **Selecione uma das opções abaixo ou digite sua dúvida no chat:**`;
        } else {
          textoBoasVindas = `${customMsg}\n\n💡 **Selecione uma das opções abaixo ou digite sua dúvida no chat:**`;
        }
      } else {
        textoBoasVindas = `Olá, **${clienteFullName}**! 👋 Seja muito bem-vindo(a) à **${nomeLoja}**!\n\nEu sou a **${MIX_IA.primeiroNome || 'MixIA'}**, sua Assistente Virtual Inteligente 24 horas. Fui programada para tirar todas as suas dúvidas e te ajudar de forma imediata!\n\n💡 **Selecione uma das opções abaixo ou digite sua dúvida no chat:**`;
      }

      const msgIA = {
        type: 'bot',
        author: nomeIA,
        text: textoBoasVindas,
        time: Date.now(),
        suggestions: [
          '📦 Rastrear meu Pedido',
          '🚚 Prazos de Entrega & Frete',
          '💳 Formas de Pagamento & PIX',
          '🔄 Trocas e Devoluções (CDC)',
          '🛍️ Ver Produtos & Promoções',
          '🛒 Como Comprar no Site',
          '👤 Falar com Atendente Humano'
        ]
      };

      // Define mensagens iniciais se ainda não houver mensagens de bot
      if (!messages.some(m => m.type === 'bot' || m.from === 'bot')) {
        messages = [msgSys, msgIA];
        renderedMessageKeys.add(`sys_${msgSys.time}_${msgSys.text.slice(0, 30)}`);
        renderedMessageKeys.add(`welcome_${msgIA.time}_${msgIA.text.slice(0, 30)}`);
        renderMessages();
        reiniciarTimerInatividade();
      }

      // Persiste boas-vindas no backend se já houver conversa criada
      if (activeConversationId) {
        try {
          fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'bot',
              fromName: MIX_IA.primeiroNome || 'MixIA',
              text: msgIA.text
            })
          }).then(res => res.json()).then(data => {
            if (data && data.message && data.message.id) {
              msgIA.id = data.message.id;
              renderedMessageKeys.add(String(data.message.id));
              renderedMessageKeys.add(`${data.message.id}_bot_${data.message.time || ''}_${(msgIA.text || '').slice(0, 35)}`);
            }
          }).catch(() => {});
        } catch (e) {}
      }
    }

    // =========================================================================
    // INTELIGÊNCIA ARTIFICIAL: BASE DE CONHECIMENTO DA MIXIA
    // =========================================================================
    function gerarRespostaMixIA(textoCliente) {
      const txt = (textoCliente || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      // 1. Verificação de Palavras-chave para Atendimento Humano
      if (verificarPedidoAtendenteHumano(textoCliente)) {
        return { escalar: true };
      }

      // 2. Respostas Personalizadas cadastradas no Painel Admin/Funcionário
      try {
        const respostas = (Array.isArray(customRespostas) && customRespostas.length > 0)
          ? customRespostas
          : JSON.parse(localStorage.getItem('chatbot_respostas_custom') || '[]');
        for (const r of respostas) {
          if (r && Array.isArray(r.palavras)) {
            const match = r.palavras.some(p => {
              const pNorm = (p || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              return pNorm && txt.includes(pNorm);
            });
            if (match && r.resposta) {
              return {
                texto: r.resposta,
                sugestoes: [
                  '📦 Rastrear meu Pedido',
                  '🚚 Prazos de Entrega & Frete',
                  '💳 Formas de Pagamento & PIX',
                  '👤 Falar com Atendente Humano'
                ]
              };
            }
          }
        }
      } catch (e) {}

      // 3. Pedidos & Rastreamento
      if (/rastre|pedido|localizar|encomenda|onde est[aá]|cad[eê]|codigo de rastreio/i.test(txt)) {
        return {
          texto: `Com certeza, ${clienteFullName}! 📦\n\n**Como acompanhar o seu pedido na MIX-PROMOÇÃO:**\n\n1. **Área do Cliente:** Acesse **"Minha Conta"** no menu superior e clique na aba **"Pedidos e Itens"** para conferir todos os seus pedidos finalizados e seu status em tempo real.\n2. **Código de Rastreamento:** Enviamos o código de rastreamento oficial dos Correios diretamente para o seu e-mail cadastrado em até **1 a 3 dias úteis** após a aprovação do pagamento.\n3. **Rastreio Nacional:** Com o código em mãos, você pode rastrear a movimentação diretamente no portal dos Correios ou aqui no site.`,
          sugestoes: [
            '🚚 Prazos de Entrega & Frete',
            '💳 Formas de Pagamento & PIX',
            '🛒 Como Comprar no Site'
          ]
        };
      }

      // 3. Frete, Prazos de Entrega e CEP
      if (/frete|entrega|prazo|quanto tempo|quando chega|dias [uú]teis|demora|envio|cep/i.test(txt)) {
        return {
          texto: `🚚 **Prazos de Entrega e Frete na MIX-PROMOÇÃO:**\n\n• **Expedição Ágil:** Nossos pedidos são despachados em até **24h a 48h úteis** após a confirmação do pagamento.\n• **Prazo de Entrega Médio:** O prazo padrão é de **7 a 15 dias úteis** para capitais e principais regiões do Brasil.\n• 🎉 **FRETE GRÁTIS:** Todas as compras com valor a partir de **R$ 100,00** contam com Frete 100% Grátis para todo o Brasil!\n• **Seguro Carga Incluso:** Todos os pacotes são enviados com código rastreável e seguro integral contra extravio ou danos.`,
          sugestoes: [
            '📦 Rastrear meu Pedido',
            '💳 Formas de Pagamento & PIX',
            '🛍️ Ver Produtos & Promoções'
          ]
        };
      }

      // 4. Pagamentos, PIX, Cartão e Boletos
      if (/pagamento|pix|cart[aã]o|parcel|boleto|aprov|comprovante|pagar/i.test(txt)) {
        return {
          texto: `💳 **Formas de Pagamento Seguras na MIX-PROMOÇÃO:**\n\n• ⚡ **PIX Instantâneo:** Aprovação em tempo real, sem tarifas e separação prioritária do seu pacote.\n• 💳 **Cartão de Crédito:** Em até **12x**, com proteção anti-fraude e confirmação em segundos.\n• 📄 **Boleto Bancário:** Compensação bancária em até 3 dias úteis.\n\n🔒 Todas as transações são protegidas por criptografia SSL de ponta a ponta. Se você já efetuou o pagamento e deseja nos enviar o comprovante, utilize o botão do clipe 📎 aqui no chat!`,
          sugestoes: [
            '🚚 Prazos de Entrega & Frete',
            '🔄 Trocas e Devoluções (CDC)',
            '🛒 Como Comprar no Site'
          ]
        };
      }

      // 5. Trocas, Devoluções e Garantia CDC
      if (/troca|devolu|arrependimento|defeito|danificad|estorno|reembolso|cancelar|garantia|cdc/i.test(txt)) {
        return {
          texto: `🔄 **Política Oficial de Trocas, Devoluções e Reembolso (CDC):**\n\n• **Garantia de 7 Dias (Art. 49 CDC):** Caso queira trocar ou devolver por qualquer motivo, você tem até **7 dias corridos** a contar do recebimento. O frete de devolução é 100% por nossa conta!\n• **Garantia contra Avarias:** Se o produto chegar danificado ou com vício, providenciamos a troca imediata sem burocracia.\n• **Reembolso Total:** O valor é estornado imediatamente para pagamentos via PIX ou lançado em até 2 faturas no cartão de crédito.`,
          sugestoes: [
            '📦 Rastrear meu Pedido',
            '🚚 Prazos de Entrega & Frete',
            '🛒 Como Comprar no Site'
          ]
        };
      }

      // 6. Produtos, Loja e Promoções
      if (/promo[cç][aã]o|oferta|desconto|produto|catalogo|loja|roupa|calcado|departamento|tenis/i.test(txt)) {
        let totalProdutos = 0;
        try {
          const lista = JSON.parse(localStorage.getItem('loja') || '[]');
          totalProdutos = lista.length;
        } catch (e) {}

        return {
          texto: `🛍️ **Catálogo de Produtos & Promoções Ativas:**\n\n• Temos diversas ofertas exclusivas com descontos de até **50% OFF** em vestuário, calçados e tênis selecionados! ${totalProdutos > 0 ? `(Mais de **${totalProdutos} produtos** disponíveis no momento)` : ''}\n• Frete grátis para compras acima de R$ 100,00.\n\nVocê pode conferir todas as novidades navegando na aba **"Loja"** no topo da página. Se estiver procurando por um modelo específico, digite o nome aqui!`,
          sugestoes: [
            '🛒 Como Comprar no Site',
            '🚚 Prazos de Entrega & Frete',
            '💳 Formas de Pagamento & PIX'
          ]
        };
      }

      // 7. Como comprar
      if (/como comprar|como funciona|fazer pedido|passo a passo|adicionar ao carrinho/i.test(txt)) {
        return {
          texto: `🛒 **Como Comprar na MIX-PROMOÇÃO (Passo a Passo Rápido):**\n\n1. **Escolha o produto:** Vá na seção **"Loja"** e selecione o item desejado.\n2. **Defina variações:** Escolha o tamanho, cor e clique em **"Adicionar ao Carrinho"**.\n3. **Acesse o carrinho:** Clique no ícone de sacola no topo e depois em **"Finalizar Compra"**.\n4. **Endereço & Pagamento:** Informe o endereço de entrega e escolha PIX ou Cartão de Crédito.\n5. **Confirmação:** Pronto! Você receberá a confirmação e o código de rastreamento por e-mail e na sua Área do Cliente.`,
          sugestoes: [
            '💳 Formas de Pagamento & PIX',
            '🚚 Prazos de Entrega & Frete',
            '🛍️ Ver Produtos & Promoções'
          ]
        };
      }

      // 8. Saudações
      if (/^(oi|ola|bom dia|boa tarde|boa noite|ola mixia|hey|eai|opa|salve)\b/i.test(txt)) {
        return {
          texto: `Olá, ${clienteFullName}! 😊 É um grande prazer falar com você! Sou a **MixIA**, inteligência artificial da MIX-PROMOÇÃO.\n\nEstou pronta para te ajudar. Escolha uma das opções abaixo ou me conte o que você precisa:`,
          sugestoes: [
            '📦 Rastrear meu Pedido',
            '🚚 Prazos de Entrega & Frete',
            '💳 Formas de Pagamento & PIX',
            '🔄 Trocas e Devoluções (CDC)'
          ]
        };
      }

      // 9. Agradecimentos
      if (/obrigad|valeu|muito bom|obrigada|grato|agradeco/i.test(txt)) {
        return {
          texto: `Por nada, ${clienteFullName}! 😊 Fico muito feliz em ajudar! Se precisar de mais alguma informação, estarei sempre por aqui! 🌟`,
          sugestoes: [
            '📦 Rastrear meu Pedido',
            '🛍️ Ver Produtos & Promoções',
            '🛒 Como Comprar no Site'
          ]
        };
      }

      // 10. Fallback padrão da IA
      return {
        texto: `Entendi sua mensagem, ${clienteFullName}! Como assistente virtual inteligente da MIX-PROMOÇÃO, posso te orientar sobre **pedidos, rastreamento, frete, pagamentos, trocas e produtos**.\n\n💡 *Caso precise falar diretamente com nossa equipe humana, basta digitar **"quero falar com um atendente"** a qualquer momento aqui no chat!*`,
        sugestoes: [
          '📦 Rastrear meu Pedido',
          '🚚 Prazos de Entrega & Frete',
          '💳 Formas de Pagamento & PIX',
          '🔄 Trocas e Devoluções (CDC)'
        ]
      };
    }

    // =========================================================================
    // SINCRONIZAÇÃO COM O BACKEND & POLLING (COM DEDUPLICAÇÃO INTELIGENTE)
    // =========================================================================
    async function sincronizarMensagensServidor() {
      if (!activeConversationId) return;

      try {
        const res = await fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`);
        if (!res.ok) return;
        const msgs = await res.json();
        if (!Array.isArray(msgs)) return;

        let novaMensagemAtendente = false;
        let novoConteudo = false;
        let ultimoNomeAtendente = null;

        msgs.forEach(m => {
          const isAttendant = m.from === 'attendant' || m.from === 'admin';
          const isBot = m.from === 'bot' || m.from === 'ia';
          const isSystem = m.from === 'system';

          let msgType = 'client';
          if (isAttendant) msgType = 'attendant';
          else if (isBot) msgType = 'bot';
          else if (isSystem) msgType = 'system';

          const mIdStr = m.id ? String(m.id) : null;
          const mTextNorm = (m.text || '').trim();
          const uniqueKey = `${mIdStr || ''}_${m.from}_${m.time || ''}_${mTextNorm.slice(0, 35)}`;

          // 1. Se o ID já foi registrado ou a chave já foi renderizada, ignora
          if (mIdStr && renderedMessageKeys.has(mIdStr)) return;
          if (renderedMessageKeys.has(uniqueKey)) return;

          // 2. Se já existe mensagem local idêntica (mesmo ID ou mesmo tipo + texto)
          const indexExistente = messages.findIndex(existing => {
            if (mIdStr && existing.id && String(existing.id) === mIdStr) return true;
            const mesmoTipo = existing.type === msgType;
            const mesmoTexto = (existing.text || '').trim() === mTextNorm;
            return mesmoTipo && mesmoTexto;
          });

          if (indexExistente !== -1) {
            // Associa o ID do banco à mensagem existente sem duplicar na tela!
            if (m.id) {
              messages[indexExistente].id = m.id;
              renderedMessageKeys.add(mIdStr);
            }
            renderedMessageKeys.add(uniqueKey);
            return;
          }

          // 3. Nova mensagem genuína vinda da central
          renderedMessageKeys.add(uniqueKey);
          if (mIdStr) renderedMessageKeys.add(mIdStr);
          novoConteudo = true;

          messages.push({
            id: m.id,
            type: msgType,
            author: m.fromName || (isAttendant ? (atendenteAtual.nome || 'Atendente Oficial') : (isBot ? 'MixIA' : (isSystem ? 'Sistema' : clienteFullName))),
            text: m.text,
            time: m.time || Date.now()
          });

          if (isAttendant) {
            novaMensagemAtendente = true;
            ultimoNomeAtendente = m.fromName || 'Atendente Oficial';
          }
        });

        if (novaMensagemAtendente) {
          removeTypingIndicator();
          playAttendantReplySound();

          if (!modoHumano) {
            modoHumano = true;
          }
          if (ultimoNomeAtendente) {
            atendenteAtual.nome = ultimoNomeAtendente;
          }
          atualizarVisualCabecalho();
          retomarTimerInatividade();
        }

        if (novoConteudo) {
          renderMessages();
        }
      } catch (err) {
        console.warn('Erro ao sincronizar mensagens do servidor:', err);
      }
    }

    async function conectarOuCriarChamado() {
      const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;

      try {
        const res = await fetch(`${apiBase}/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: protoFormatado,
            name: clienteFullName,
            cliente_email: clienteEmail || null,
            status: modoHumano ? 'aguardando_atendente' : 'ia_atendimento',
            lastMessagePreview: ''
          })
        });

        if (res.ok) {
          const conv = await res.json();
          activeConversationId = conv.id;
          sessionStorage.setItem('mix_active_conv_id', String(conv.id));

          // Se a conversa recuperada do banco já estiver finalizada, inicia um novo atendimento imediatamente
          if (conv.status === 'finalizado') {
            sessionStorage.removeItem('mix_cliente_protocolo');
            sessionStorage.removeItem('mix_active_conv_id');
            sessionStorage.removeItem('mix_atendente_atual');
            protocolo = 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
            sessionStorage.setItem('mix_cliente_protocolo', protocolo);
            atendenteAtual = sortearProximoAtendente();
            modoHumano = false;
            messages = [];
            renderedMessageKeys.clear();
            atualizarVisualCabecalho();
            criarMensagemBoasVindas();
            reiniciarTimerInatividade();
            return conectarOuCriarChamado();
          }

          // Se a conversa já existia no banco e estava em atendimento humano, preserva
          if (conv.status === 'aguardando_atendente' || conv.status === 'em_atendimento') {
            modoHumano = true;
            atualizarVisualCabecalho();
          }

          await sincronizarMensagensServidor();
        }
      } catch (e) {
        console.warn('Erro ao registrar chamado no backend:', e);
      }

      // Se após conectar/sincronizar não temos mensagens de bot, garante boas-vindas
      const hasBotMsg = messages.some(m => m.type === 'bot' || m.from === 'bot');
      if (!hasBotMsg) {
        criarMensagemBoasVindas();
      }

      // Inicia polling a cada 2 segundos
      clearInterval(pollingInterval);
      pollingInterval = setInterval(sincronizarMensagensServidor, 2000);
    }

    // =========================================================================
    // ESCALAÇÃO PARA ATENDENTE HUMANO (DISPARA ALERTA NA CENTRAL)
    // Só é acionada quando o cliente digita palavras-chave sobre atendente humano!
    // =========================================================================
    async function escalarParaAtendenteHumano() {
      if (modoHumano) return;
      modoHumano = true;

      showTypingIndicator('MixIA');
      setTimeout(async () => {
        removeTypingIndicator();

        // 1. Mensagem da MixIA anunciando transferência
        const msgTransferencia = {
          type: 'bot',
          author: 'MixIA (Assistente Virtual)',
          text: `Perfeito, ${clienteFullName}! Identifiquei sua solicitação para atendimento com nossa equipe. Estou transferindo você agora mesmo para um atendente oficial! ⏳🔔`,
          time: Date.now()
        };
        messages.push(msgTransferencia);

        // 2. Mensagem do sistema avisando chamado aberto
        const msgSys = {
          type: 'system',
          text: `🔔 **Chamado Aberto com Atendente Humano!** Um operador foi acionado na central e responderá você aqui em tempo real.`,
          time: Date.now()
        };
        messages.push(msgSys);
        renderMessages();

        // 3. Atualiza cabeçalho
        atualizarVisualCabecalho();

        // 4. Salva no servidor: mensagem do bot + alteração de status para aguardando_atendente
        if (activeConversationId) {
          try {
            const resTransf = await fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'bot',
                fromName: 'MixIA',
                text: msgTransferencia.text
              })
            });

            if (resTransf.ok) {
              const dataTransf = await resTransf.json();
              if (dataTransf && dataTransf.message && dataTransf.message.id) {
                msgTransferencia.id = dataTransf.message.id;
                renderedMessageKeys.add(String(dataTransf.message.id));
                renderedMessageKeys.add(`${dataTransf.message.id}_bot_${dataTransf.message.time || ''}_${msgTransferencia.text.slice(0, 35)}`);
              }
            }

            await fetch(`${apiBase}/api/conversations/${activeConversationId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'aguardando_atendente' })
            });
          } catch (e) {
            console.warn('Erro ao atualizar status para aguardando_atendente:', e);
          }
        }

        // 5. Mensagem automática de apresentação e boas-vindas do Atendente Humano
        setTimeout(() => {
          showTypingIndicator(atendenteAtual.primeiroNome);
          setTimeout(async () => {
            removeTypingIndicator();
            playAttendantReplySound();

            const msgAtendenteBoasVindas = {
              type: 'attendant',
              author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
              text: `Olá, **${clienteFullName}**! 👋 Me chamo **${atendenteAtual.nome}**, ${atendenteAtual.cargo} da MIX-PROMOÇÃO.\n\nJá estou acompanhando seu chamado aqui na central! Como posso te ajudar hoje?`,
              time: Date.now()
            };
            messages.push(msgAtendenteBoasVindas);
            renderMessages();
            retomarTimerInatividade();

            if (activeConversationId) {
              try {
                const resAtend = await fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    from: 'attendant',
                    fromName: atendenteAtual.nome,
                    text: msgAtendenteBoasVindas.text
                  })
                });
                if (resAtend.ok) {
                  const dataAtend = await resAtend.json();
                  if (dataAtend && dataAtend.message && dataAtend.message.id) {
                    msgAtendenteBoasVindas.id = dataAtend.message.id;
                    renderedMessageKeys.add(String(dataAtend.message.id));
                    renderedMessageKeys.add(`${dataAtend.message.id}_attendant_${dataAtend.message.time || ''}_${msgAtendenteBoasVindas.text.slice(0, 35)}`);
                  }
                }
              } catch (e) {}
            }
          }, 800);
        }, 400);

        // 6. Dispara evento via BroadcastChannel (aviso instantâneo multi-aba)
        const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;
        try {
          const bus = new BroadcastChannel('mix_support_bus');
          bus.postMessage({
            type: 'CLIENT_NEW_TICKET',
            protocol: protoFormatado,
            conversationId: activeConversationId,
            clientName: clienteFullName,
            pediuAtendente: true
          });
        } catch (e) {}

        retomarTimerInatividade();
      }, 400);
    }

    // =========================================================================
    // ENVIO DE MENSAGENS PELO CLIENTE (COM LOCK DE ENVIO ÚNICO & DEBOUNCE)
    // =========================================================================
    async function enviarMensagem(texto = null) {
      if (isSending) return;
      if (atendimentoEncerrado || isSending) return;

      const conteudo = (texto !== null ? texto : (msgInput ? msgInput.value : '')).trim();
      if (!conteudo) return;

      // Ativa lock de envio e desativa botão para impedir duplo disparo
      isSending = true;
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add('disabled');
      }
      if (msgInput) {
        msgInput.value = '';
      }

      reiniciarTimerInatividade();

      // Desativa todos os botões de sugestão visíveis para evitar múltiplos cliques
      const allChips = document.querySelectorAll('.suggestion-chip');
      allChips.forEach(c => {
        c.disabled = true;
        c.style.pointerEvents = 'none';
        c.style.opacity = '0.5';
      });

      const liberarEnvio = () => {
        setTimeout(() => {
          isSending = false;
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.classList.remove('disabled');
          }
          if (msgInput) {
            msgInput.focus();
          }
        }, 400);
      };

      const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;

      // Adiciona mensagem do cliente na interface
      const localKey = `client_${Date.now()}_${conteudo.slice(0, 30)}`;
      renderedMessageKeys.add(localKey);

      const msgCliente = {
        type: 'client',
        author: clienteFullName,
        text: conteudo,
        time: Date.now()
      };
      messages.push(msgCliente);
      renderMessages();

      // Garante que o chamado exista no servidor
      if (!activeConversationId) {
        await conectarOuCriarChamado();
      }

      // Envia a mensagem do cliente ao backend
      if (activeConversationId) {
        try {
          const resClient = await fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'client',
              fromName: clienteFullName,
              text: conteudo
            })
          });

          if (resClient.ok) {
            const dataClient = await resClient.json();
            if (dataClient && dataClient.message && dataClient.message.id) {
              msgCliente.id = dataClient.message.id;
              renderedMessageKeys.add(String(dataClient.message.id));
              renderedMessageKeys.add(`${dataClient.message.id}_client_${dataClient.message.time || ''}_${conteudo.slice(0, 35)}`);
            }
          }

          // Se já estava em modo humano, garante que o status esteja em aguardando_atendente
          if (modoHumano) {
            await fetch(`${apiBase}/api/conversations/${activeConversationId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'aguardando_atendente' })
            });
          }
        } catch (err) {
          console.warn('Falha ao enviar mensagem ao servidor:', err);
        }
      }

      // Verifica se o usuário digitou palavras-chave para atendimento humano
      const ehPedidoHumano = verificarPedidoAtendenteHumano(conteudo);

      if (ehPedidoHumano) {
        liberarEnvio();
        escalarParaAtendenteHumano();
        return;
      }

      // Se ainda não está em modo humano, a MixIA responde automaticamente!
      if (!modoHumano) {
        const respostaIA = gerarRespostaMixIA(conteudo);
        if (respostaIA.escalar) {
          liberarEnvio();
          escalarParaAtendenteHumano();
          return;
        }

        showTypingIndicator('MixIA');
        setTimeout(async () => {
          removeTypingIndicator();

          const msgBot = {
            type: 'bot',
            author: 'MixIA (Assistente Virtual)',
            text: respostaIA.texto,
            time: Date.now(),
            suggestions: respostaIA.sugestoes
          };
          messages.push(msgBot);
          renderMessages();
          retomarTimerInatividade();
          liberarEnvio();

          // Persiste mensagem da IA no backend
          if (activeConversationId) {
            try {
              const resBot = await fetch(`${apiBase}/api/conversations/${activeConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from: 'bot',
                  fromName: 'MixIA',
                  text: respostaIA.texto
                })
              });

              if (resBot.ok) {
                const dataBot = await resBot.json();
                if (dataBot && dataBot.message && dataBot.message.id) {
                  msgBot.id = dataBot.message.id;
                  renderedMessageKeys.add(String(dataBot.message.id));
                  renderedMessageKeys.add(`${dataBot.message.id}_bot_${dataBot.message.time || ''}_${respostaIA.texto.slice(0, 35)}`);
                }
              }
            } catch (e) {}
          }
        }, 650);
      } else {
        // Modo humano ativo: notifica canal de suporte
        liberarEnvio();
        try {
          const bus = new BroadcastChannel('mix_support_bus');
          bus.postMessage({
            type: 'CLIENT_NEW_MESSAGE',
            protocol: protoFormatado,
            conversationId: activeConversationId,
            clientName: clienteFullName,
            text: conteudo,
            pediuAtendente: true
          });
        } catch (e) {}
      }
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isSending) {
          enviarMensagem();
        }
      });
    }

    if (msgInput) {
      msgInput.disabled = false;
      msgInput.addEventListener('input', () => reiniciarTimerInatividade());
      msgInput.addEventListener('keydown', (e) => {
        reiniciarTimerInatividade();
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!isSending) {
            enviarMensagem();
          }
        }
      });
    }

    // Botão de Chamar Atendente Humano na barra lateral (se existir)
    if (btnSidebarChamarHumano) {
      btnSidebarChamarHumano.addEventListener('click', () => {
        reiniciarTimerInatividade();
        escalarParaAtendenteHumano();
      });
    }

    // =========================================================================
    // BROADCASTCHANNEL: RESPOSTA DO ATENDENTE HUMANO EM TEMPO REAL
    // =========================================================================
    try {
      const bus = new BroadcastChannel('mix_support_bus');
      bus.onmessage = function (event) {
        const data = event.data;
        if (data && data.type === 'EMPLOYEE_REPLY_TO_CLIENT') {
          const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;
          const matchesConv = (activeConversationId && String(data.conversationId) === String(activeConversationId));
          const matchesProto = (data.protocol === protoFormatado || data.protocolo === protoFormatado || data.protocol === protocolo || data.protocolo === protocolo);

          if (matchesConv || matchesProto) {
            removeTypingIndicator();
            const busKey = `bus_${data.time}_${data.author}_${(data.text || '').slice(0, 35)}`;
            if (!renderedMessageKeys.has(busKey)) {
              renderedMessageKeys.add(busKey);

              // Ativa modo humano
              modoHumano = true;
              if (data.author) {
                atendenteAtual.nome = data.author;
              }
              atualizarVisualCabecalho();

              const jaExiste = messages.some(m => m.type === 'attendant' && (m.text || '').trim() === (data.text || '').trim());
              if (!jaExiste) {
                messages.push({
                  type: 'attendant',
                  author: data.author || data.fromName || 'Atendente Oficial',
                  text: data.text,
                  time: data.time || Date.now()
                });

                playAttendantReplySound();
                renderMessages();
                retomarTimerInatividade();
              }
            }
          }
        }
      };
    } catch (e) {}

    // =========================================================================
    // ANEXAR ARQUIVO
    // =========================================================================
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        reiniciarTimerInatividade();
        fileInput.click();
      });

      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        reiniciarTimerInatividade();

        const reader = new FileReader();
        reader.onload = function (evt) {
          const dataUrl = evt.target.result;
          const textoAnexo = `[Arquivo anexado: ${file.name}]`;

          enviarMensagem(textoAnexo);

          if (file.type.startsWith('image/')) {
            const last = messages[messages.length - 1];
            if (last) last.attachmentUrl = dataUrl;
            renderMessages();
          }
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      });
    }

    // =========================================================================
    // EXPORTAR HISTÓRICO DE MENSAGENS (.TXT)
    // =========================================================================
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        reiniciarTimerInatividade();
        const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;

        let log = `=====================================================\n`;
        log += `MIX-PROMOÇÃO - PROTOCOLO DE ATENDIMENTO AO CONSUMIDOR\n`;
        log += `=====================================================\n`;
        log += `Protocolo: ${protoFormatado}\n`;
        log += `Cliente: ${clienteFullName}\n`;
        log += `Modalidade: ${modoHumano ? 'Atendimento Humano' : 'Autoatendimento MixIA'}\n`;
        log += `Atendente Alocado: ${atendenteAtual.nome} (${atendenteAtual.cargo})\n`;
        log += `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
        log += `=====================================================\n\n`;

        messages.forEach(m => {
          if (m.type === 'system') {
            log += `[SISTEMA - ${formatTime(m.time)}] ${m.text}\n\n`;
          } else {
            const remetente = m.type === 'client' ? clienteFullName : (m.type === 'bot' ? 'MixIA' : (m.author || atendenteAtual.nome));
            log += `[${remetente} - ${formatTime(m.time)}]:\n${m.text}\n\n`;
          }
        });

        const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atendimento_cliente_${protocolo}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    // =========================================================================
    // NOVO ATENDIMENTO
    // =========================================================================
    if (btnNovo) {
      btnNovo.addEventListener('click', () => {
        if (confirm('Deseja iniciar um novo atendimento sob um novo protocolo?')) {
          clearInterval(pollingInterval);
          sessionStorage.removeItem('mix_cliente_protocolo');
          sessionStorage.removeItem('mix_active_conv_id');
          protocolo = 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
          sessionStorage.setItem('mix_cliente_protocolo', protocolo);
          atendenteAtual = sortearProximoAtendente();
          modoHumano = false;
          messages = [];
          renderedMessageKeys.clear();
          activeConversationId = null;
          atualizarVisualCabecalho();
          criarMensagemBoasVindas();
          conectarOuCriarChamado();
        }
      });
    }

    // =========================================================================
    // ENCERRAR ATENDIMENTO
    // =========================================================================
    if (btnEncerrar) {
      btnEncerrar.addEventListener('click', async () => {
        reiniciarTimerInatividade();
        const protoFormatado = protocolo.startsWith('#') ? protocolo : '#' + protocolo;

        if (confirm(`Deseja encerrar o atendimento do protocolo ${protoFormatado} agora?`)) {
          if (activeConversationId) {
            try {
              await fetch(`${apiBase}/api/conversations/${activeConversationId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'finalizado' })
              });
            } catch (e) {}
          }

          messages.push({
            type: 'system',
            text: `🔒 Atendimento ${protoFormatado} encerrado pelo cliente em ${new Date().toLocaleTimeString('pt-BR')}.`,
            time: Date.now()
          });
          messages.push({
            type: modoHumano ? 'attendant' : 'bot',
            author: modoHumano ? `${atendenteAtual.nome} (${atendenteAtual.cargo})` : 'MixIA (Assistente Virtual)',
            text: `Obrigado(a) pelo contato, ${clienteFullName}! O atendimento ${protoFormatado} foi finalizado com sucesso. Estaremos sempre à disposição! 🌟`,
            time: Date.now()
          });
          renderMessages();
        }
      });
    }

    // =========================================================================
    // ATALHO LATERAL: BOTÃO "SUPORTE HUMANO VIA CHAT"
    // =========================================================================
    const pillChamarAtendente = document.getElementById('pillChamarAtendente') || document.getElementById('btnSidebarChamarHumano');
    if (pillChamarAtendente) {
      pillChamarAtendente.style.cursor = 'pointer';
      pillChamarAtendente.addEventListener('click', () => {
        if (!modoHumano) {
          enviarMensagem('Quero falar com um atendente humano');
        }
      });
    }

    // =========================================================================
    // INICIALIZAÇÃO IMEDIATA (SEMPRE INICIA COM AUTOATENDIMENTO MIXIA)
    // =========================================================================
    criarMensagemBoasVindas();
    atualizarVisualCabecalho();
    conectarOuCriarChamado();
    reiniciarTimerInatividade();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAtendimento);
  } else {
    initAtendimento();
  }
})();
