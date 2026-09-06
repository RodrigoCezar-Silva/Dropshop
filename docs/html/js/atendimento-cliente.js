/**
 * CANAL DE ATENDIMENTO AO CLIENTE - MIX-PROMOÇÃO (atendimento.html)
 * Sistema Dedicado de Suporte ao Consumidor com Rotação de Atendentes
 * & Timer de Inatividade de 3 Minutos:
 * Se após 3 minutos a pessoa não responder no chat, retorna automaticamente
 * para a Área do Cliente (meu-perfil.html).
 */

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

// Sorteia sempre um funcionário diferente do último
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

document.addEventListener('DOMContentLoaded', function () {
  const messagesEl = document.getElementById('messages');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendMsgBtn');
  const attachBtn = document.getElementById('btnAttach');
  const fileInput = document.getElementById('fileAttachInput');
  const btnExport = document.getElementById('btnExportChat');
  const btnNovo = document.getElementById('btnNovoAtendimento');
  const btnEncerrar = document.getElementById('btnEncerrarAtendimento');
  const protocolEl = document.getElementById('protocolNumber');
  const protocolSubEl = document.getElementById('protocolSubtitle');
  const userGreetingNameEl = document.getElementById('userGreetingName');

  // Elementos do Atendente na barra do chat
  const chatHeaderNameEl = document.getElementById('chatHeaderName');
  const chatHeaderStatusEl = document.getElementById('chatHeaderStatus');
  const attendantAvatarIconEl = document.querySelector('.attendant-avatar i');
  const attendantAvatarWrapEl = document.querySelector('.attendant-avatar');
  const sidebarAttendantNameEl = document.querySelector('.conv-item[data-topic="geral"] .name');
  const sidebarAttendantMetaEl = document.querySelector('.conv-item[data-topic="geral"] .meta');

  // Identificação do Cliente
  const nomeCliente = (localStorage.getItem('nome') || '').trim();
  const sobrenomeCliente = (localStorage.getItem('sobrenome') || '').trim();
  const clienteFullName = [nomeCliente, sobrenomeCliente].filter(Boolean).join(' ').trim() || 'Cliente';

  if (userGreetingNameEl) {
    userGreetingNameEl.textContent = clienteFullName;
  }

  // Verifica se veio com flag de novo atendimento (?novo=1)
  const urlParams = new URLSearchParams(window.location.search);
  const deveForcarNovo = urlParams.get('novo') === '1' || !sessionStorage.getItem('mix_cliente_protocolo');

  let atendenteAtual = deveForcarNovo ? sortearProximoAtendente() : carregarAtendenteAtual();
  let protocolo = deveForcarNovo
    ? 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000)
    : (sessionStorage.getItem('mix_cliente_protocolo') || 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));

  sessionStorage.setItem('mix_cliente_protocolo', protocolo);

  // Remove o param ?novo da URL de forma limpa
  if (urlParams.get('novo') === '1') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  let isTyping = false;
  let messages = [];

  // ==========================================
  // CONTADOR DE INATIVIDADE: 3 MINUTOS (180s)
  // Se após 3 minutos a pessoa não responder no chat,
  // retorna automaticamente para meu-perfil.html
  // ==========================================
  const TEMPO_LIMITE_INATIVIDADE = 180; // 3 minutos
  let segundosRestantes = TEMPO_LIMITE_INATIVIDADE;
  let timerInatividadeInterval = null;
  let timerPausado = false;

  function formatarTempo(totalSegundos) {
    const m = Math.floor(totalSegundos / 60);
    const s = totalSegundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function redirecionarParaAreaClientePorInatividade() {
    clearInterval(timerInatividadeInterval);
    try {
      sessionStorage.setItem('mix_alerta_inatividade', 'Você ficou 3 minutos sem responder no chat. O atendimento foi pausado e retornamos para sua Área do Cliente.');
    } catch (e) {}

    const badge = document.getElementById('inactivityTimerBadge');
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-hourglass-end"></i> <span>Retornando...</span>';
      badge.classList.add('warning');
    }

    const isHtmlDir = window.location.pathname.includes('/html/');
    window.location.href = isHtmlDir ? "meu-perfil.html" : "./meu-perfil.html";
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
    if (timerPausado) return;
    segundosRestantes = TEMPO_LIMITE_INATIVIDADE;
    atualizarVisualTimer();

    clearInterval(timerInatividadeInterval);
    timerInatividadeInterval = setInterval(() => {
      if (timerPausado) return;
      segundosRestantes--;
      atualizarVisualTimer();

      if (segundosRestantes <= 0) {
        clearInterval(timerInatividadeInterval);
        redirecionarParaAreaClientePorInatividade();
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

  // Broadcast Channel para sincronizar com o suporte do funcionário
  let bus = null;
  try {
    bus = new BroadcastChannel('mix_support_bus');
    bus.onmessage = function (event) {
      const data = event.data;
      if (data && data.type === 'EMPLOYEE_REPLY_TO_CLIENT' && data.protocolo === protocolo) {
        removeTypingIndicator();
        messages.push({
          type: 'attendant',
          author: data.author || `${atendenteAtual.nome} (Atendimento)`,
          text: data.text,
          time: new Date().toISOString()
        });
        saveMessages();
        renderMessages();
        retomarTimerInatividade();
      }
    };
  } catch (e) {}

  function atualizarVisualAtendente() {
    if (protocolEl) protocolEl.textContent = '#' + protocolo;
    if (protocolSubEl) protocolSubEl.textContent = '#' + protocolo;

    if (chatHeaderNameEl) chatHeaderNameEl.textContent = atendenteAtual.nome;
    if (chatHeaderStatusEl) {
      chatHeaderStatusEl.innerHTML = `<span class="pulse-dot"></span><span>Atendente Online • ${atendenteAtual.cargo} • Protocolo <strong class="header-proto-code">#${protocolo}</strong></span>`;
    }

    if (attendantAvatarIconEl) {
      attendantAvatarIconEl.className = atendenteAtual.icone;
    }
    if (attendantAvatarWrapEl) {
      attendantAvatarWrapEl.style.background = atendenteAtual.gradiente;
    }

    if (sidebarAttendantNameEl) {
      sidebarAttendantNameEl.textContent = `Atendente ${atendenteAtual.primeiroNome} (Ao Vivo)`;
    }
    if (sidebarAttendantMetaEl) {
      sidebarAttendantMetaEl.textContent = `${atendenteAtual.especialidade} • Online agora`;
    }
  }

  function iniciarNovoAtendimento(forcarOutro = true) {
    if (forcarOutro) {
      atendenteAtual = sortearProximoAtendente();
    }
    protocolo = 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    sessionStorage.setItem('mix_cliente_protocolo', protocolo);

    atualizarVisualAtendente();

    messages = [
      {
        type: 'system',
        text: `🔒 Atendimento Inicializado • Protocolo: #${protocolo} • Atendente: ${atendenteAtual.nome} (${atendenteAtual.cargo})`,
        time: new Date().toISOString()
      },
      {
        type: 'attendant',
        author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
        text: `Olá, ${clienteFullName}! 👋 Seja muito bem-vindo(a) ao Canal de Atendimento da MIX-PROMOÇÃO.\n\n${atendenteAtual.saudacao}\n\nEstou assumindo o seu atendimento sob o protocolo **#${protocolo}**. Como posso te ajudar hoje?`,
        time: new Date().toISOString(),
        suggestions: [
          '📦 Onde está meu pedido?',
          '💳 Dúvidas sobre PIX e Pagamento',
          '🚚 Qual o prazo de entrega?',
          '🔄 Quero solicitar uma troca ou devolução',
          '💬 Falar sobre outro assunto'
        ]
      }
    ];

    saveMessages();
    renderMessages();

    if (msgInput) {
      msgInput.value = '';
      setTimeout(() => msgInput.focus(), 150);
    }

    reiniciarTimerInatividade();
  }

  // Se forçado novo ou não tiver mensagens salvas
  if (deveForcarNovo) {
    iniciarNovoAtendimento(false);
  } else {
    try {
      const saved = localStorage.getItem('mix_cliente_chat_' + protocolo);
      if (saved) messages = JSON.parse(saved);
    } catch (e) {}

    if (!messages || messages.length === 0) {
      iniciarNovoAtendimento(false);
    } else {
      atualizarVisualAtendente();
      renderMessages();
      reiniciarTimerInatividade();
    }
  }

  function scrollToBottom() {
    if (messagesEl) {
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 50);
    }
  }

  function saveMessages() {
    try {
      localStorage.setItem('mix_cliente_chat_' + protocolo, JSON.stringify(messages));
    } catch (e) {}
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso || Date.now());
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

  function renderMessages() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';

    messages.forEach((msg, idx) => {
      if (msg.type === 'system') {
        const div = document.createElement('div');
        div.className = 'msg-system';
        div.textContent = msg.text;
        messagesEl.appendChild(div);
        return;
      }

      const div = document.createElement('div');
      const isMe = msg.type === 'client';
      div.className = `msg ${isMe ? 'me client' : 'other attendant'}`;

      let html = '';
      html += `<div class="author">${isMe ? '<i class="fa-solid fa-user"></i> Você' : '<i class="' + atendenteAtual.icone + '"></i> ' + (msg.author || atendenteAtual.nome)}</div>`;

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

      if (!isMe && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1) {
        const sugWrap = document.createElement('div');
        sugWrap.className = 'quick-suggestions';
        msg.suggestions.forEach(sug => {
          const btn = document.createElement('button');
          btn.className = 'suggestion-chip';
          btn.type = 'button';
          btn.textContent = sug;
          btn.addEventListener('click', () => {
            reiniciarTimerInatividade();
            enviarMensagem(sug);
          });
          sugWrap.appendChild(btn);
        });
        messagesEl.appendChild(sugWrap);
      }
    });

    scrollToBottom();
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    isTyping = true;
    pausarTimerInatividade();

    const typing = document.createElement('div');
    typing.id = 'activeTypingIndicator';
    typing.className = 'typing-indicator';
    typing.innerHTML = `
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
      <span>${atendenteAtual.primeiroNome} está digitando...</span>
    `;
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    isTyping = false;
    const existing = document.getElementById('activeTypingIndicator');
    if (existing) existing.remove();
  }

  function gerarRespostaAtendente(textoCliente) {
    const txt = (textoCliente || '').toLowerCase().trim();

    if (/onde está meu pedido|rastrear|rastreio|código de rastreio|localizar|cadê meu pedido|meu pedido/i.test(txt)) {
      return {
        text: `Com certeza, ${clienteFullName}! Para pedidos realizados na MIX-PROMOÇÃO, o código de rastreamento é gerado e enviado para seu e-mail assim que o produto é despachado.\n\nVocê também pode consultar a aba **"Pedidos e Itens"** na sua Área do Cliente para ver todos os seus pedidos em tempo real!\n\nSe tiver o número do pedido em mãos, me envie aqui que consulto para você agora.`,
        suggestions: ['📋 Consultar pedidos cadastrados', '🚚 Qual o prazo de entrega?', '💬 Falar de outro assunto']
      };
    }

    if (/prazo de entrega|quanto tempo|quando chega|dias úteis|frete/i.test(txt)) {
      return {
        text: `O prazo de entrega médio em nossa loja é de **7 a 15 dias úteis** após o envio. Todas as encomendas possuem rastreio dos Correios ou transportadora oficial e seguro completo contra imprevistos.\n\nAssim que houver uma nova atualização de trânsito, o sistema avisa você por e-mail!`,
        suggestions: ['📦 Rastrear meu pedido', '💳 Confirmar pagamento', '💬 Falar com atendente']
      };
    }

    if (/pagamento|pix|boleto|cartão|cartao|aprov|comprovante/i.test(txt)) {
      return {
        text: `Sobre as formas de pagamento:\n\n• **PIX:** Aprovação instantânea em nosso sistema!\n• **Cartão de Crédito:** Aprovação imediata ou em poucos minutos.\n• **Boleto Bancário:** Compensação bancária de 1 a 3 dias úteis.\n\nSe você já efetuou o pagamento e deseja confirmação imediata, pode anexar o comprovante pelo botão 📎 aqui no chat!`,
        suggestions: ['📎 Enviar comprovante', '📦 Consultar status do pedido', '💬 Falar com atendente']
      };
    }

    if (/troca|trocas|devolu|devolver|estorno|reembolso|defeito|cancelar|cancelamento/i.test(txt)) {
      return {
        text: `Entendido! De acordo com o Código de Defesa do Consumidor e a política da MIX-PROMOÇÃO, você tem até **7 dias corridos** após o recebimento para solicitar troca ou devolução sem custo algum.\n\nVocê pode me descrever o motivo da solicitação aqui pelo chat e enviar fotos do item recebido!`,
        suggestions: ['🔄 Quero trocar produto', '💬 Enviar fotos do produto', '📦 Falar com atendente']
      };
    }

    if (/humano|atendente humano|falar com atendente|pessoa real|fala com atendente|outro atendente|outro funcionario/i.test(txt)) {
      return {
        text: `Você já está no Canal de Atendimento direto com suporte online! 👋 Meu nome é **${atendenteAtual.nome}** (${atendenteAtual.cargo}), atuo no time oficial da MIX-PROMOÇÃO.\n\nPode me descrever com detalhes o que ocorreu que vou te orientar passo a passo até resolvermos tudo!`,
        suggestions: ['📦 Dúvida sobre pedido', '💳 Dúvida sobre pagamento', '🔄 Solicitar troca']
      };
    }

    if (/obrigado|obrigada|valeu|agradeço|grato|grata|tks/i.test(txt)) {
      return {
        text: `Foi um prazer enorme te atender, ${clienteFullName}! 😊 Se precisar de mais alguma orientação, estou sempre à sua disposição por este canal de atendimento.\n\nTenha um dia fantástico e ótimas compras! ✨`,
        suggestions: ['⭐ Avaliar atendimento', '🔄 Novo Atendimento', '🛒 Ir para a Loja']
      };
    }

    return {
      text: `Entendi perfeitamente! Já registrei sua mensagem no protocolo de atendimento **#${protocolo}**.\n\nDeseja que eu consulte essa informação em nosso sistema agora ou gostaria de adicionar mais detalhes sobre a sua dúvida?`,
      suggestions: ['📦 Consultar no sistema', '📎 Anexar documento ou foto', '💬 Falar mais detalhes']
    };
  }

  function enviarMensagem(texto) {
    const conteudo = (texto || (msgInput ? msgInput.value : '')).trim();
    if (!conteudo) return;

    reiniciarTimerInatividade();

    if (msgInput) {
      msgInput.value = '';
      msgInput.focus();
    }

    const newMsg = {
      type: 'client',
      author: clienteFullName,
      text: conteudo,
      time: new Date().toISOString()
    };

    messages.push(newMsg);
    saveMessages();
    renderMessages();

    // Notifica canal corporativo para funcionários
    try {
      if (bus) {
        bus.postMessage({
          type: 'CLIENT_NEW_MESSAGE',
          protocolo: protocolo,
          cliente: clienteFullName,
          atendente: atendenteAtual.nome,
          text: conteudo,
          time: new Date().toISOString()
        });
      }
      const fila = JSON.parse(localStorage.getItem('mix_clientes_fila_atendimento') || '[]');
      fila.push({
        protocolo: protocolo,
        cliente: clienteFullName,
        atendente: atendenteAtual.nome,
        text: conteudo,
        time: new Date().toISOString()
      });
      localStorage.setItem('mix_clientes_fila_atendimento', JSON.stringify(fila.slice(-30)));
    } catch (e) {}

    showTypingIndicator();

    const delay = Math.floor(1100 + Math.random() * 800);
    setTimeout(() => {
      removeTypingIndicator();
      const resposta = gerarRespostaAtendente(conteudo);
      messages.push({
        type: 'attendant',
        author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
        text: resposta.text,
        time: new Date().toISOString(),
        suggestions: resposta.suggestions
      });
      saveMessages();
      renderMessages();
      retomarTimerInatividade();
    }, delay);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => enviarMensagem());
  }

  if (msgInput) {
    msgInput.disabled = false;
    msgInput.addEventListener('input', () => {
      reiniciarTimerInatividade();
    });
    msgInput.addEventListener('keydown', (e) => {
      reiniciarTimerInatividade();
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }

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
        messages.push({
          type: 'client',
          author: clienteFullName,
          text: `[Arquivo anexado: ${file.name}]`,
          attachmentUrl: file.type.startsWith('image/') ? dataUrl : null,
          time: new Date().toISOString()
        });
        saveMessages();
        renderMessages();

        showTypingIndicator();
        setTimeout(() => {
          removeTypingIndicator();
          messages.push({
            type: 'attendant',
            author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
            text: `Arquivo **${file.name}** recebido com sucesso no protocolo #${protocolo}! Já estou analisando o documento anexado.`,
            time: new Date().toISOString()
          });
          saveMessages();
          renderMessages();
          retomarTimerInatividade();
        }, 1300);
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      reiniciarTimerInatividade();
      let log = `=====================================================\n`;
      log += `MIX-PROMOÇÃO - PROTOCOLO DE ATENDIMENTO AO CLIENTE\n`;
      log += `=====================================================\n`;
      log += `Protocolo: #${protocolo}\n`;
      log += `Cliente: ${clienteFullName}\n`;
      log += `Atendente Responsável: ${atendenteAtual.nome} (${atendenteAtual.cargo})\n`;
      log += `Especialidade: ${atendenteAtual.especialidade}\n`;
      log += `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
      log += `=====================================================\n\n`;

      messages.forEach(m => {
        if (m.type === 'system') {
          log += `[SISTEMA - ${formatTime(m.time)}] ${m.text}\n\n`;
        } else {
          const remetente = m.type === 'client' ? clienteFullName : (m.author || atendenteAtual.nome);
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

  if (btnNovo) {
    btnNovo.addEventListener('click', () => {
      iniciarNovoAtendimento(true);
    });
  }

  if (btnEncerrar) {
    btnEncerrar.addEventListener('click', () => {
      reiniciarTimerInatividade();
      if (confirm('Deseja encerrar este atendimento agora?')) {
        messages.push({
          type: 'system',
          text: `Atendimento #${protocolo} encerrado pelo cliente em ${new Date().toLocaleTimeString('pt-BR')}.`,
          time: new Date().toISOString()
        });
        messages.push({
          type: 'attendant',
          author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
          text: `Obrigada pelo contato, ${clienteFullName}! O seu atendimento #${protocolo} foi finalizado. Caso precise de um novo chamado, estamos à sua disposição! 🌟`,
          time: new Date().toISOString()
        });
        saveMessages();
        renderMessages();
      }
    });
  }

  // Alternar canais/tópicos na barra lateral
  const convItems = document.querySelectorAll('.conv-item');
  convItems.forEach(item => {
    item.addEventListener('click', () => {
      reiniciarTimerInatividade();
      convItems.forEach(c => c.classList.remove('active'));
      item.classList.add('active');

      const topic = item.dataset.topic;
      if (topic === 'pedidos') {
        enviarMensagem('Gostaria de consultar meus pedidos e código de rastreamento.');
      } else if (topic === 'pagamentos') {
        enviarMensagem('Tenho dúvidas sobre formas de pagamento e aprovação de PIX.');
      } else if (topic === 'trocas') {
        enviarMensagem('Como funciona o processo de troca ou devolução de produto?');
      } else if (topic === 'chatbot') {
        enviarMensagem('Quero conhecer as ofertas ativas e o catálogo da loja.');
      }
    });
  });
});
