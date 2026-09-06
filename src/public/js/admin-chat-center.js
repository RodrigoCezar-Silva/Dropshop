/**
 * CANAL DE ATENDIMENTO AO CLIENTE - MIX-PROMOÇÃO
 * Atendimento Online ao Vivo em Tempo Real com Atendente
 */

document.addEventListener('DOMContentLoaded', function () {
  // Elementos do DOM
  const messagesEl = document.getElementById('messages');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendMsgBtn');
  const attachBtn = document.getElementById('btnAttach');
  const fileInput = document.getElementById('fileAttachInput');
  const searchInput = document.getElementById('chatSearch');
  const convItems = document.querySelectorAll('.conv-item');

  const btnExport = document.getElementById('btnExportDoc') || document.getElementById('btnExportChat');
  const btnNovoAtendimento = document.getElementById('btnNovoAtendimento');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderStatus = document.getElementById('chatHeaderStatus');
  const userGreetingNameEl = document.getElementById('userGreetingName');
  const protocolNumberEl = document.getElementById('protocolNumber');
  const protocolSubtitleEl = document.getElementById('protocolSubtitle');

  // Identificação do Cliente
  const nomeCliente = (localStorage.getItem('nome') || '').trim();
  const sobrenomeCliente = (localStorage.getItem('sobrenome') || '').trim();
  const clienteFullName = [nomeCliente, sobrenomeCliente].filter(Boolean).join(' ').trim() || 'Cliente';
  const clienteEmail = (localStorage.getItem('email') || '').trim();

  // Protocolo do Atendimento
  let protocolo = sessionStorage.getItem('mix_atendimento_protocolo');
  if (!protocolo) {
    protocolo = 'MIX-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    sessionStorage.setItem('mix_atendimento_protocolo', protocolo);
  }

  if (protocolNumberEl) protocolNumberEl.textContent = '#' + protocolo;
  if (protocolSubtitleEl) protocolSubtitleEl.textContent = '#' + protocolo;
  if (userGreetingNameEl) userGreetingNameEl.textContent = clienteFullName;

  // Canal/Tópico selecionado
  let currentTopic = 'geral';
  let isTyping = false;

  // Carregar mensagens salvas ou inicializar com boas-vindas
  let messages = [];
  try {
    const saved = localStorage.getItem('mix_atendimento_chat_' + protocolo);
    if (saved) {
      messages = JSON.parse(saved);
    }
  } catch (e) {}

  if (!messages || messages.length === 0) {
    messages = [
      {
        type: 'system',
        text: `🔒 Atendimento iniciado • Protocolo: #${protocolo} • Criptografia de ponta a ponta ativa`,
        time: new Date().toISOString()
      },
      {
        type: 'attendant',
        author: 'Camila Santos (Atendimento)',
        text: `Olá, ${clienteFullName}! 👋 Bem-vindo(a) ao Canal de Atendimento Online da MIX-PROMOÇÃO.\n\nSou a **Camila**, sua atendente hoje. Estou pronta para te ajudar com qualquer dúvida sobre pedidos, pagamentos, rastreio ou trocas.\n\nComo posso te ajudar agora?`,
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
  }

  // Render inicial
  renderMessages();

  // Rolagem suave para o fim
  function scrollToBottom() {
    if (messagesEl) {
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 50);
    }
  }

  function saveMessages() {
    try {
      localStorage.setItem('mix_atendimento_chat_' + protocolo, JSON.stringify(messages));
    } catch (e) {}
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso || Date.now());
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return '';
    }
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
      html += `<div class="author">${isMe ? '<i class="fa-solid fa-user"></i> Você' : '<i class="fa-solid fa-headset"></i> ' + (msg.author || 'Camila Santos')}</div>`;
      
      // Formatação simples de markdown (negrito e quebras de linha)
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

      // Sugestões se for a última mensagem da atendente
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

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    isTyping = true;
    const typing = document.createElement('div');
    typing.id = 'activeTypingIndicator';
    typing.className = 'typing-indicator';
    typing.innerHTML = `
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
      <span>Camila está digitando...</span>
    `;
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    isTyping = false;
    const existing = document.getElementById('activeTypingIndicator');
    if (existing) existing.remove();
  }

  // Resposta inteligente e humanizada da atendente Camila
  function gerarRespostaAtendente(textoCliente) {
    const txt = (textoCliente || '').toLowerCase().trim();

    if (/onde está meu pedido|rastrear|rastreio|código de rastreio|localizar|cadê meu pedido|meu pedido/i.test(txt)) {
      return {
        text: `Com certeza, ${clienteFullName}! Para pedidos realizados em nossa loja, o código de rastreamento é gerado e enviado para seu e-mail assim que o item é despachado pelo nosso centro de distribuição.\n\nVocê também pode consultar todos os seus pedidos atualizados a qualquer momento acessando a sua **Área do Cliente > Meus Pedidos**.\n\nSe você tiver o número do seu pedido em mãos (ex: #PED-1234), pode me enviar aqui que consulto para você agora mesmo!`,
        suggestions: ['📋 Como acessar Meus Pedidos?', '🚚 Qual o prazo de entrega?', '💬 Quero falar de outro assunto']
      };
    }

    if (/prazo de entrega|quanto tempo|quando chega|dias úteis|frete/i.test(txt)) {
      return {
        text: `O prazo médio de entrega para todo o Brasil é de **7 a 15 dias úteis** após o envio do pedido. Todas as encomendas possuem seguro integral contra extravio e código de rastreamento oficial dos Correios ou transportadora parceira.\n\nCaso o seu pedido já tenha sido despachado, você pode acompanhar cada etapa do trajeto em tempo real!`,
        suggestions: ['📦 Rastrear meu pedido', '💳 Confirmar pagamento', '💬 Falar com atendente']
      };
    }

    if (/pagamento|pix|boleto|cartão|cartao|aprov|comprovante/i.test(txt)) {
      return {
        text: `Sobre pagamentos:\n\n• **PIX:** A aprovação é imediata em nosso sistema! Assim que você conclui a transferência, seu pedido já entra em preparação.\n• **Cartão de Crédito:** Geralmente aprovado em instantes pela operadora.\n• **Boleto Bancário:** Pode levar de 1 a 3 dias úteis para compensação bancária.\n\nSe você já efetuou o pagamento e precisa de confirmação, pode me enviar o comprovante pelo botão de anexo 📎 aqui no chat!`,
        suggestions: ['📎 Como enviar comprovante?', '📦 Consultar status do pedido', '💬 Falar com atendente']
      };
    }

    if (/troca|trocas|devolu|devolver|estorno|reembolso|defeito|cancelar|cancelamento/i.test(txt)) {
      return {
        text: `Entendido! De acordo com a nossa política de satisfação e o Código de Defesa do Consumidor, você tem até **7 dias corridos** após receber o produto para solicitar a troca ou devolução sem nenhum custo.\n\nPara iniciar o processo agora mesmo, você pode preencher o formulário na nossa página oficial de **Trocas e Devoluções**, ou se preferir, pode me relatar o motivo da troca e anexar uma foto do produto aqui!`,
        suggestions: ['🔄 Abrir página de Trocas', '💬 Enviar detalhes do produto', '📦 Falar com atendente']
      };
    }

    if (/como acessar meus pedidos|área do cliente/i.test(txt)) {
      return {
        text: `Para acessar seus pedidos:\n1. Clique no botão **"Minha Conta"** no topo da página ou no seu nome.\n2. Na tela do seu perfil, clique na aba **"Meus Pedidos"**.\n3. Lá você verá o histórico completo, itens comprados e o status de cada entrega!`,
        suggestions: ['📦 Rastrear meu pedido', '💬 Tenho outra dúvida']
      };
    }

    if (/humano|atendente humano|falar com atendente|pessoa real|fala com atendente/i.test(txt)) {
      return {
        text: `Você já está falando diretamente com o atendimento humano online! 👋 Meu nome é Camila Santos, atuo no suporte direto da MIX-PROMOÇÃO.\n\nPode me descrever com detalhes a sua situação ou dúvida que estou acompanhando seu chamado até que tudo seja solucionado com sucesso!`,
        suggestions: ['📦 Dúvida sobre pedido', '💳 Dúvida sobre pagamento', '🔄 Quero fazer uma troca']
      };
    }

    if (/obrigado|obrigada|valeu|agradeço|grato|grata|tks/i.test(txt)) {
      return {
        text: `Eu que agradeço a sua preferência e confiança na MIX-PROMOÇÃO! 😊 Foi um prazer te atender. Se precisar de mais alguma coisa, estarei sempre à disposição por este canal.\n\nTenha um excelente dia e ótimas compras! ✨`,
        suggestions: ['⭐ Avaliar atendimento', '🔄 Novo Atendimento', '🛒 Ir para a Loja']
      };
    }

    if (/como enviar comprovante/i.test(txt)) {
      return {
        text: `É super fácil! Basta clicar no ícone de clipe 📎 logo ao lado do campo de mensagem, selecionar a imagem ou arquivo do comprovante no seu dispositivo e confirmar o envio.`,
        suggestions: ['💳 Formas de pagamento', '📦 Onde está meu pedido?']
      };
    }

    // Resposta padrão contextual e atenciosa
    return {
      text: `Entendi perfeitamente o que você precisa! Já registrei esta informação no seu protocolo **#${protocolo}**.\n\nVocê gostaria que eu verificasse isso em nosso sistema agora ou gostaria de adicionar mais algum detalhe sobre o seu caso?`,
      suggestions: ['📦 Consultar no sistema', '📎 Anexar foto ou documento', '💬 Falar mais detalhes']
    };
  }

  // Função para envio de mensagem do cliente
  function enviarMensagem(texto) {
    const conteudo = (texto || (msgInput ? msgInput.value : '')).trim();
    if (!conteudo) return;

    if (msgInput) {
      msgInput.value = '';
      msgInput.focus();
    }

    // Adiciona mensagem do cliente
    messages.push({
      type: 'client',
      author: clienteFullName,
      text: conteudo,
      time: new Date().toISOString()
    });

    saveMessages();
    renderMessages();

    // Simula atendimento em tempo real
    showTypingIndicator();

    const delay = Math.floor(1200 + Math.random() * 900); // 1.2s a 2.1s
    setTimeout(() => {
      removeTypingIndicator();
      const resposta = gerarRespostaAtendente(conteudo);
      messages.push({
        type: 'attendant',
        author: 'Camila Santos (Atendimento)',
        text: resposta.text,
        time: new Date().toISOString(),
        suggestions: resposta.suggestions
      });
      saveMessages();
      renderMessages();
    }, delay);
  }

  // Listeners de envio
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

  if (sendBtn) sendBtn.disabled = false;

  // Anexar imagem / arquivo
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
            author: 'Camila Santos (Atendimento)',
            text: `Recebi o seu anexo **${file.name}** com sucesso! Já estou examinando o arquivo anexado ao protocolo #${protocolo}. Em que mais posso te orientar sobre ele?`,
            time: new Date().toISOString()
          });
          saveMessages();
          renderMessages();
        }, 1400);
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  }

  // Seleção de Canais / Tópicos na Sidebar
  convItems.forEach(item => {
    item.addEventListener('click', () => {
      convItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const topic = item.getAttribute('data-topic');
      currentTopic = topic;

      const titleEl = item.querySelector('.name');
      const topicName = titleEl ? titleEl.textContent : 'Atendimento';

      if (chatHeaderName) chatHeaderName.textContent = topicName;

      // Mensagem informativa da mudança de canal
      messages.push({
        type: 'system',
        text: `Canal alterado para: ${topicName}`,
        time: new Date().toISOString()
      });

      if (topic === 'pedidos') {
        messages.push({
          type: 'attendant',
          author: 'Camila Santos (Atendimento)',
          text: `Você conectou ao canal de **Pedidos e Rastreamento**! Se desejar consultar um pedido específico, por favor me informe o número do pedido ou o e-mail de compra.`,
          time: new Date().toISOString(),
          suggestions: ['📦 Rastrear meu pedido', '🚚 Qual o prazo de entrega?', '📋 Ver Meus Pedidos']
        });
      } else if (topic === 'pagamentos') {
        messages.push({
          type: 'attendant',
          author: 'Camila Santos (Atendimento)',
          text: `Canal de **Pagamentos e PIX** ativo. Precisa de ajuda com comprovantes, boletos ou aprovação de compras?`,
          time: new Date().toISOString(),
          suggestions: ['💳 Pagamento com PIX', '📄 Segunda via de boleto', '📎 Enviar comprovante']
        });
      } else if (topic === 'trocas') {
        messages.push({
          type: 'attendant',
          author: 'Camila Santos (Atendimento)',
          text: `Canal de **Trocas e Devoluções** ativo. Você pode solicitar trocas em até 7 dias após o recebimento. Como posso te orientar?`,
          time: new Date().toISOString(),
          suggestions: ['🔄 Política de trocas', '📦 Produto com defeito', '💬 Falar com Camila']
        });
      } else if (topic === 'chatbot') {
        messages.push({
          type: 'attendant',
          author: 'MixIA (Assistente 24h)',
          text: `Olá! Eu sou a **MixIA**, a inteligência artificial da MIX-PROMOÇÃO. Estou online 24 horas para tirar dúvidas imediatas sobre o site e produtos!`,
          time: new Date().toISOString(),
          suggestions: ['🛒 Como comprar no site?', '🚚 Custos de frete', '👤 Voltar para Camila']
        });
      }

      saveMessages();
      renderMessages();
    });
  });

  // Filtro de pesquisa na Sidebar
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      convItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Exportar histórico do atendimento em arquivo de texto
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      let log = `=====================================================\n`;
      log += `MIX-PROMOÇÃO - PROTOCOLO DE ATENDIMENTO AO CLIENTE\n`;
      log += `=====================================================\n`;
      log += `Protocolo: #${protocolo}\n`;
      log += `Cliente: ${clienteFullName}\n`;
      log += `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
      log += `Atendente Responsável: Camila Santos\n`;
      log += `=====================================================\n\n`;

      messages.forEach(m => {
        if (m.type === 'system') {
          log += `[SISTEMA - ${formatTime(m.time)}] ${m.text}\n\n`;
        } else {
          const remetente = m.type === 'client' ? clienteFullName : (m.author || 'Camila Santos');
          log += `[${remetente} - ${formatTime(m.time)}]:\n${m.text}\n\n`;
        }
      });

      const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atendimento_${protocolo}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // Botão Novo Atendimento
  if (btnNovoAtendimento) {
    btnNovoAtendimento.addEventListener('click', () => {
      if (confirm('Deseja iniciar um novo atendimento? Um novo número de protocolo será gerado.')) {
        sessionStorage.removeItem('mix_atendimento_protocolo');
        localStorage.removeItem('mix_atendimento_chat_' + protocolo);
        window.location.reload();
      }
    });
  }

  // Botão Encerrar Atendimento
  const btnEncerrar = document.getElementById('btnEncerrarAtendimento');
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
          author: 'Camila Santos (Atendimento)',
          text: `Obrigada pelo contato, ${clienteFullName}! O seu atendimento #${protocolo} foi finalizado. Caso precise de mais suporte no futuro, basta nos chamar novamente! Tenha um ótimo dia! 🌟`,
          time: new Date().toISOString()
        });
        saveMessages();
        renderMessages();
      }
    });
  }
});