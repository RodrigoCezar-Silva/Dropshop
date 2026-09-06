/**
 * CANAL DE ATENDIMENTO INTEGRADO NA ÁREA DO CLIENTE - MIX-PROMOÇÃO
 * Sistema de Atendimento com Rotação de Funcionários:
 * Sempre que o cliente clica no suporte ou inicia novo atendimento,
 * abre um novo protocolo com um atendente diferente!
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
    saudacao: "Sou a **Beatriz Rocha**, supervisora de trocas, devoluções e pós-venda."
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
    especialidade: "Ouvidoria & Resoluções",
    gradiente: "linear-gradient(135deg, #0f766e, #06b6d4)",
    icone: "fa-solid fa-handshake-angle",
    saudacao: "Sou o **Thiago Albuquerque**, especialista da central de soluções da MIX-PROMOÇÃO."
  }
];

// Função para sortear sempre OUTRO funcionário diferente do atual
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
  const messagesEl = document.getElementById('suporteMessages');
  const msgInput = document.getElementById('suporteMsgInput');
  const sendBtn = document.getElementById('btnSuporteEnviar');
  const attachBtn = document.getElementById('btnSuporteAttach');
  const fileInput = document.getElementById('suporteFileInput');
  const btnExport = document.getElementById('btnSuporteExport');
  const btnNovo = document.getElementById('btnSuporteNovo');
  const btnEncerrar = document.getElementById('btnSuporteEncerrar');
  const protocolEl = document.getElementById('suporteProtocoloNum');

  // Elementos do Atendente
  const attendantNameEl = document.getElementById('suporteAttendantName');
  const attendantRoleEl = document.getElementById('suporteAttendantRole');
  const attendantAvatarEl = document.getElementById('suporteAvatarIcon');
  const chatTitleTextEl = document.getElementById('suporteChatTitleText');

  if (!messagesEl) return;

  // Identificação do Cliente
  const nomeCliente = (localStorage.getItem('nome') || '').trim();
  const sobrenomeCliente = (localStorage.getItem('sobrenome') || '').trim();
  const clienteFullName = [nomeCliente, sobrenomeCliente].filter(Boolean).join(' ').trim() || 'Cliente';

  let atendenteAtual = carregarAtendenteAtual();
  let protocolo = sessionStorage.getItem('mix_cliente_protocolo');
  if (!protocolo) {
    protocolo = 'CLI-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    sessionStorage.setItem('mix_cliente_protocolo', protocolo);
  }

  let isTyping = false;
  let messages = [];

  // Broadcast Channel para sincronizar com painel interno de funcionários
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
      }
    };
  } catch (e) {}

  function atualizarVisualAtendente() {
    if (protocolEl) protocolEl.textContent = '#' + protocolo;
    if (attendantNameEl) attendantNameEl.textContent = atendenteAtual.nome;
    if (attendantRoleEl) {
      attendantRoleEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${atendenteAtual.cargo}`;
    }
    if (attendantAvatarEl) {
      attendantAvatarEl.innerHTML = `<i class="${atendenteAtual.icone}"></i>`;
      attendantAvatarEl.style.background = atendenteAtual.gradiente;
    }
    if (chatTitleTextEl) {
      chatTitleTextEl.textContent = `Chat ao Vivo com ${atendenteAtual.nome}`;
    }
  }

  // Inicializa ou recria um atendimento com outro atendente
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
        text: `🔒 Novo Atendimento Aberto • Protocolo: #${protocolo} • Atendente: ${atendenteAtual.nome} (${atendenteAtual.especialidade})`,
        time: new Date().toISOString()
      },
      {
        type: 'attendant',
        author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
        text: `Olá, ${clienteFullName}! 👋 Seja muito bem-vindo(a) ao Canal de Atendimento da MIX-PROMOÇÃO.\n\n${atendenteAtual.saudacao}\n\nEstou assumindo o seu atendimento pelo protocolo **#${protocolo}**. Como posso te ajudar hoje?`,
        time: new Date().toISOString(),
        suggestions: [
          '📦 Onde está meu pedido?',
          '💳 Dúvidas sobre PIX e Pagamento',
          '🚚 Qual o prazo de entrega?',
          '🔄 Quero solicitar uma troca ou devolução',
          '💬 Falar com atendente sobre outro assunto'
        ]
      }
    ];

    saveMessages();
    renderMessages();

    if (msgInput) {
      msgInput.value = '';
      setTimeout(() => msgInput.focus(), 150);
    }
  }

  // Expõe a função globalmente para quando o usuário clicar em "Suporte" abrir novo com outro funcionário
  window.iniciarNovoAtendimentoSuporte = iniciarNovoAtendimento;

  // Carregar mensagens salvas ou iniciar o primeiro atendimento
  try {
    const saved = localStorage.getItem('mix_cliente_chat_' + protocolo);
    if (saved) {
      messages = JSON.parse(saved);
    }
  } catch (e) {}

  if (!messages || messages.length === 0) {
    iniciarNovoAtendimento(false);
  } else {
    atualizarVisualAtendente();
    renderMessages();
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
    const typing = document.createElement('div');
    typing.id = 'activeSuporteTyping';
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
    const existing = document.getElementById('activeSuporteTyping');
    if (existing) existing.remove();
  }

  function gerarRespostaAtendente(textoCliente) {
    const txt = (textoCliente || '').toLowerCase().trim();

    if (/onde está meu pedido|rastrear|rastreio|código de rastreio|localizar|cadê meu pedido|meu pedido/i.test(txt)) {
      return {
        text: `Com certeza, ${clienteFullName}! Para pedidos realizados na MIX-PROMOÇÃO, o código de rastreamento é gerado e enviado para seu e-mail assim que o produto é despachado.\n\nVocê também pode consultar a aba **"Pedidos e Itens"** logo acima aqui no seu painel para ver todos os seus pedidos em tempo real!\n\nSe tiver o número do pedido em mãos, me envie aqui que consulto para você agora.`,
        suggestions: ['📋 Como consultar na aba Pedidos?', '🚚 Qual o prazo de entrega?', '💬 Falar de outro assunto']
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
        text: `Entendido! De acordo com o Código de Defesa do Consumidor e a política da MIX-PROMOÇÃO, você tem até **7 dias corridos** após o recebimento para solicitar troca ou devolução sem custo algum.\n\nVocê pode acessar a página de **Trocas e Devoluções** pelo card abaixo ou me descrever o motivo da solicitação aqui pelo chat com fotos do produto!`,
        suggestions: ['🔄 Abrir página de Trocas', '💬 Enviar fotos do produto', '📦 Falar com atendente']
      };
    }

    if (/como consultar na aba pedidos/i.test(txt)) {
      return {
        text: `Basta clicar na aba **"Pedidos e Itens"** no menu de abas aqui em cima. Lá você verá o histórico completo com status de entrega e itens comprados!`,
        suggestions: ['📦 Rastrear meu pedido', '💬 Tenho outra dúvida']
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
    }, delay);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => enviarMensagem());
  }

  if (msgInput) {
    msgInput.disabled = false;
    msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }

  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

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
        }, 1300);
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
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
      if (confirm('Deseja encerrar este atendimento agora?')) {
        messages.push({
          type: 'system',
          text: `Atendimento #${protocolo} encerrado pelo cliente em ${new Date().toLocaleTimeString('pt-BR')}.`,
          time: new Date().toISOString()
        });
        messages.push({
          type: 'attendant',
          author: `${atendenteAtual.nome} (${atendenteAtual.cargo})`,
          text: `Obrigada pelo contato, ${clienteFullName}! O seu atendimento #${protocolo} foi finalizado. Caso precise de um novo chamado, estou ou outro atendente da equipe à disposição! 🌟`,
          time: new Date().toISOString()
        });
        saveMessages();
        renderMessages();
      }
    });
  }
});
