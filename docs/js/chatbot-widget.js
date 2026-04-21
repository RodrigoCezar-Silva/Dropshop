/* ========================================
   CHATBOT WIDGET IA - MIX-PROMOÇÃO
   Assistente inteligente com conhecimento
   dos produtos e da loja
   ======================================== */

(function () {
  "use strict";

  // Não injetar o widget se já existe
  if (document.getElementById("chatbotFab")) return;

  // ===== CONFIG =====
  const NOME_LOJA = "MIX-PROMOÇÃO";
  const NOME_IA = "MixIA";
  const WHATSAPP_NUMERO = "5500000000000"; // Número padrão
  const MAX_HISTORICO = 50;
  const RESPOSTAS_KEY = "chatbot_respostas_custom";
  const STATS_KEY = "chatbot_stats";
  const FAQ_KEY = "chatbot_faq";

  // Verificar se widget está ativo
  try {
    const cfg = JSON.parse(localStorage.getItem("chatbot_config") || "{}");
    if (cfg.ativo === false) return;
  } catch {}

  // Mostrar o widget apenas para usuários logados (Cliente ou Administrador)
  try {
    const rawTipo = localStorage.getItem('tipoUsuario');
    const tipo = (rawTipo && rawTipo !== 'null' && rawTipo !== '') ? rawTipo : null;
    if (!tipo || (tipo !== 'Cliente' && tipo !== 'Administrador')) {
      return; // não injeta o widget para visitantes não autenticados
    }
  } catch (e) {
    // se erro, evita injetar
    return;
  }

  // ===== Criar HTML do widget =====
  function criarWidget() {
    // Botão FAB
    const fab = document.createElement("button");
    fab.id = "chatbotFab";
    fab.className = "chatbot-fab";
    fab.innerHTML = `<i class="fa-solid fa-robot"></i><span class="fab-badge" style="display:none">1</span>`;
    fab.title = "Conversar com a IA";
    document.body.appendChild(fab);

    // Janela
    const janela = document.createElement("div");
    janela.id = "chatbotJanela";
    janela.className = "chatbot-janela";
    janela.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="chatbot-header-info">
          <strong>${NOME_IA} — Assistente Virtual</strong>
          <span><span class="chatbot-status-dot"></span> Online agora</span>
        </div>
        <button class="chatbot-header-fechar" id="chatbotFechar" title="Fechar">&times;</button>
      </div>
      <div class="chatbot-corpo" id="chatbotCorpo"></div>
      <div class="chatbot-sugestoes" id="chatbotSugestoes"></div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbotInput" placeholder="Digite sua pergunta..." autocomplete="off" maxlength="500">
        <button id="chatbotEnviar" title="Enviar"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;
    document.body.appendChild(janela);

    return { fab, janela };
  }

  const { fab, janela } = criarWidget();

  const corpo = document.getElementById("chatbotCorpo");
  const inputEl = document.getElementById("chatbotInput");
  const btnEnviar = document.getElementById("chatbotEnviar");
  const btnFechar = document.getElementById("chatbotFechar");
  const sugestoesEl = document.getElementById("chatbotSugestoes");
  const badge = fab.querySelector(".fab-badge");

  let aberto = false;
  let historico = [];
  let jaAbriuAntes = sessionStorage.getItem("chatbot_abriu");
  let aguardandoCep = false; // Estado para saber se está esperando CEP

  // ===== Abrir / Fechar =====
  function toggleChat() {
    aberto = !aberto;
    fab.classList.toggle("aberto", aberto);
    janela.classList.toggle("aberta", aberto);
    fab.innerHTML = aberto
      ? `<i class="fa-solid fa-xmark"></i>`
      : `<i class="fa-solid fa-robot"></i><span class="fab-badge" style="display:none">1</span>`;

    if (aberto) {
      badge.style.display = "none";
      inputEl.focus();
      if (!jaAbriuAntes) {
        jaAbriuAntes = true;
        sessionStorage.setItem("chatbot_abriu", "1");
        exibirBoasVindas();
      }
      rolarParaBaixo();
    }
  }

  fab.addEventListener("click", toggleChat);
  btnFechar.addEventListener("click", toggleChat);

  // ===== Hora formatada =====
  function horaAtual() {
    const d = new Date();
    return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
  }

  // ===== Adicionar mensagem =====
  function addMsg(tipo, conteudoHtml, extra = "") {
    const div = document.createElement("div");
    div.className = `chatbot-msg ${tipo}`;
    div.innerHTML = `
      <div class="msg-balao">${conteudoHtml}${extra}</div>
      <span class="msg-hora">${horaAtual()}</span>
    `;
    corpo.appendChild(div);
    historico.push({ tipo, texto: conteudoHtml, hora: horaAtual() });
    if (historico.length > MAX_HISTORICO) historico.shift();
    rolarParaBaixo();
  }

  function rolarParaBaixo() {
    requestAnimationFrame(() => {
      corpo.scrollTop = corpo.scrollHeight;
    });
  }

  // ===== Indicador digitando =====
  function mostrarDigitando() {
    const div = document.createElement("div");
    div.className = "chatbot-digitando";
    div.id = "chatbotDigitando";
    div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    corpo.appendChild(div);
    rolarParaBaixo();
  }
  function removerDigitando() {
    const el = document.getElementById("chatbotDigitando");
    if (el) el.remove();
  }

  // ===== Sugestões =====
  function mostrarSugestoes(lista) {
    sugestoesEl.innerHTML = lista
      .map(s => `<button class="chatbot-sugestao">${s}</button>`)
      .join("");
    sugestoesEl.querySelectorAll(".chatbot-sugestao").forEach(btn => {
      btn.addEventListener("click", () => {
        enviarMensagem(btn.textContent);
      });
    });
  }

  function limparSugestoes() {
    sugestoesEl.innerHTML = "";
  }

  // ===== Boas-vindas =====
  function exibirBoasVindas() {
    const div = document.createElement("div");
    div.className = "chatbot-msg bot";
    div.innerHTML = `
      <div class="msg-balao">
        <div class="chatbot-boas-vindas">
          <div class="bv-icone">🤖</div>
          <h3>Olá! Sou a ${NOME_IA} 👋</h3>
          <p>Assistente virtual da <strong>${NOME_LOJA}</strong>. Posso ajudar com produtos, preços, pedidos, trocas e muito mais!</p>
        </div>
      </div>
      <span class="msg-hora">${horaAtual()}</span>
    `;
    corpo.appendChild(div);

    mostrarSugestoes([
      "🔍 Ver promoções",
      "🛒 Como comprar?",
      "🚚 Prazo de entrega",
      "🔄 Trocas e devoluções",
      "📞 Falar no WhatsApp"
    ]);
  }

  // ===== Carregar produtos da loja =====
  function getProdutos() {
    try {
      return JSON.parse(localStorage.getItem("loja") || "[]");
    } catch { return []; }
  }

  // ===== Escape HTML =====
  function esc(str) {
    if (!str) return "";
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ===== Lógica da IA =====
  function processarIA(msg) {
    const lower = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const produtos = getProdutos();

    // Registrar pergunta nas stats e FAQ
    registrarPergunta(msg);

    // Verificar respostas customizadas do admin primeiro
    const customResp = verificarRespostasCustom(lower);
    if (customResp) {
      registrarResolvido();
      return customResp;
    }

    // ---- Saudações ----
    if (/^(oi|ola|eai|e ai|hey|bom dia|boa tarde|boa noite|salve|hello|hi)\b/.test(lower)) {
      return {
        texto: `Olá! 😊 Que bom ter você aqui! Sou a <strong>${NOME_IA}</strong>, assistente virtual da ${NOME_LOJA}. Como posso ajudar?`,
        sugestoes: ["🔍 Ver promoções", "🛒 Como funciona?", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Agradecimentos ----
    if (/obrigad[oa]|valeu|thanks|brigad/.test(lower)) {
      return {
        texto: `De nada! 😊 Fico feliz em ajudar. Se precisar de mais alguma coisa, é só chamar!`,
        sugestoes: ["🔍 Ver promoções", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Promoções / Produtos ----
    if (/promo[cç][aã]o|oferta|desconto|barato|produto|ver produto|loja|vitrine/.test(lower)) {
      if (produtos.length === 0) {
        return {
          texto: `No momento estamos atualizando nosso catálogo 📦. Visite a <a href="./html/loja.html" style="color:#0072ff;font-weight:700">nossa loja</a> para ver os produtos disponíveis!`,
          sugestoes: ["🛒 Como comprar?", "📞 Falar no WhatsApp"]
        };
      }

      const comDesconto = produtos.filter(p => p.desconto && p.desconto.trim() !== "");
      const destaques = (comDesconto.length > 0 ? comDesconto : produtos).slice(0, 3);

      let cards = destaques.map(p => `
        <div class="chatbot-produto-card">
          <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.style.display='none'">
          <div class="produto-info">
            <strong>${esc(p.nome)}</strong>
            <span class="preco">${esc(p.precoAtual)}</span>
            ${p.desconto ? `<span class="desconto-badge">🏷️ ${esc(p.desconto)}</span>` : ""}
            <a href="./html/produto.html?id=${p.id}">Ver produto →</a>
          </div>
        </div>
      `).join("");

      return {
        texto: `🔥 Temos <strong>${produtos.length} produto(s)</strong> na loja! Aqui estão alguns destaques:${cards}<br>👉 <a href="./html/loja.html" style="color:#0072ff;font-weight:700">Ver todos os produtos</a>`,
        sugestoes: ["💰 Produto mais barato", "🛒 Como comprar?", "🚚 Tem frete grátis?"]
      };
    }

    // ---- Buscar produto específico ----
    if (/buscar|procurar|tem .+\?|quero .+|preciso de/.test(lower)) {
      const termos = lower.replace(/buscar|procurar|tem|quero|preciso de|\?/g, "").trim();
      if (termos && produtos.length > 0) {
        const encontrados = produtos.filter(p =>
          p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termos)
        );
        if (encontrados.length > 0) {
          let cards = encontrados.slice(0, 3).map(p => `
            <div class="chatbot-produto-card">
              <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.style.display='none'">
              <div class="produto-info">
                <strong>${esc(p.nome)}</strong>
                <span class="preco">${esc(p.precoAtual)}</span>
                ${p.desconto ? `<span class="desconto-badge">🏷️ ${esc(p.desconto)}</span>` : ""}
                <a href="./html/produto.html?id=${p.id}">Ver produto →</a>
              </div>
            </div>
          `).join("");
          return {
            texto: `Encontrei <strong>${encontrados.length}</strong> resultado(s) para "<em>${esc(termos)}</em>":${cards}`,
            sugestoes: ["🔍 Ver mais produtos", "🛒 Como comprar?"]
          };
        }
        return {
          texto: `Não encontrei nenhum produto com "<em>${esc(termos)}</em>" 😕. Tente outro nome ou visite a <a href="./html/loja.html" style="color:#0072ff;font-weight:700">loja completa</a>.`,
          sugestoes: ["🔍 Ver promoções", "📞 Falar no WhatsApp"]
        };
      }
    }

    // ---- Produto mais barato ----
    if (/mais barato|menor pre[cç]o|economizar|mais em conta/.test(lower)) {
      if (produtos.length > 0) {
        const ordenados = [...produtos].sort((a, b) => {
          const pA = parseFloat((a.precoAtual || "0").replace(/[^\d,]/g, "").replace(",", "."));
          const pB = parseFloat((b.precoAtual || "0").replace(/[^\d,]/g, "").replace(",", "."));
          return pA - pB;
        });
        const p = ordenados[0];
        const card = `
          <div class="chatbot-produto-card">
            <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.style.display='none'">
            <div class="produto-info">
              <strong>${esc(p.nome)}</strong>
              <span class="preco">${esc(p.precoAtual)}</span>
              ${p.desconto ? `<span class="desconto-badge">🏷️ ${esc(p.desconto)}</span>` : ""}
              <a href="./html/produto.html?id=${p.id}">Ver produto →</a>
            </div>
          </div>
        `;
        return {
          texto: `💰 O produto com melhor preço é:${card}`,
          sugestoes: ["🔍 Ver mais promoções", "🛒 Como comprar?"]
        };
      }
    }

    // ---- Como comprar ----
    if (/como comprar|como funciona|como fa[cç]o|comprar|adicionar ao carrinho|carrinho/.test(lower)) {
      return {
        texto: `Comprar na ${NOME_LOJA} é super fácil! 🛒<br><br>
          <strong>1.</strong> Acesse a <a href="./html/loja.html" style="color:#0072ff;font-weight:700">loja</a> e escolha seus produtos<br>
          <strong>2.</strong> Selecione o tamanho (se aplicável) e clique em <strong>Adicionar ao Carrinho</strong><br>
          <strong>3.</strong> Vá ao carrinho e confira os itens<br>
          <strong>4.</strong> Finalize a compra no checkout<br><br>
          Simples assim! 😉`,
        sugestoes: ["🚚 Prazo de entrega", "💳 Formas de pagamento", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Frete / Entrega ----
    if (/frete|entrega|prazo|envio|chegar|demora|dias|cep|calcular frete|quanto custa o frete|frete gr[aá]tis/.test(lower)) {
      // Verificar se o carrinho tem subtotal >= 100 (frete grátis)
      const subtotal = getSubtotalCarrinho();
      if (subtotal >= 100) {
        return {
          texto: `🎉 <strong>FRETE GRÁTIS!</strong><br><br>
            Compras acima de <strong>R$ 100,00</strong> têm frete grátis na ${NOME_LOJA}!<br>
            Seu carrinho atual: <strong>R$ ${subtotal.toFixed(2).replace(".", ",")}</strong> — você já tem frete grátis! 🚚✨`,
          sugestoes: ["🛒 Ir ao checkout", "🔍 Ver promoções", "📞 Falar no WhatsApp"]
        };
      }
      aguardandoCep = true;
      return {
        texto: `🚚 <strong>Calculadora de Frete</strong><br><br>
          Posso calcular o frete pra você agora mesmo! 📦<br><br>
          ${subtotal > 0 ? `Seu carrinho: <strong>R$ ${subtotal.toFixed(2).replace(".", ",")}</strong><br>` : ""}
          💡 <strong>Dica:</strong> Compras acima de R$ 100,00 têm <strong>FRETE GRÁTIS</strong>!<br><br>
          👇 <strong>Digite seu CEP</strong> (8 dígitos) para ver as opções de frete e valores:`,
        sugestoes: ["📞 Falar no WhatsApp", "🔍 Ver promoções"]
      };
    }

    // ---- Pagamento ----
    if (/pagamento|pagar|cart[aã]o|pix|boleto|parcela/.test(lower)) {
      return {
        texto: `💳 <strong>Formas de Pagamento:</strong><br><br>
          • Pix (aprovação instantânea) ⚡<br>
          • Cartão de Crédito (até 12x)<br>
          • Boleto Bancário<br><br>
          Todas as transações são <strong>100% seguras</strong> 🔒`,
        sugestoes: ["🛒 Como comprar?", "🚚 Prazo de entrega", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Trocas / Devoluções ----
    if (/troca|devolu[cç][aã]o|trocar|devolver|arrependimento|defeito|errado/.test(lower)) {
      return {
        texto: `🔄 <strong>Trocas e Devoluções:</strong><br><br>
          • Você tem até <strong>7 dias</strong> após o recebimento para solicitar troca ou devolução<br>
          • O produto deve estar na embalagem original e sem uso<br>
          • Para defeitos, entre em contato e resolveremos o mais rápido possível<br><br>
          📄 Veja a política completa: <a href="./html/trocas-devolucoes.html" style="color:#0072ff;font-weight:700">Trocas e Devoluções</a>`,
        sugestoes: ["📞 Falar no WhatsApp", "✉️ Enviar reclamação"]
      };
    }

    // ---- Reclamação ----
    if (/reclama[cç][aã]o|reclamar|problema|insatisfeito|ruim/.test(lower)) {
      return {
        texto: `Lamento que tenha tido algum problema 😔. Queremos resolver isso para você!<br><br>
          Você pode:<br>
          • <a href="./html/contato.html" style="color:#0072ff;font-weight:700">Enviar uma mensagem</a> pelo formulário de contato<br>
          • Falar diretamente pelo WhatsApp para atendimento rápido<br><br>
          Faremos o possível para ajudar! 💪`,
        sugestoes: ["📞 Falar no WhatsApp", "🔄 Política de trocas"],
        extra: botaoWhatsApp("Olá, tenho uma reclamação sobre um pedido")
      };
    }

    // ---- Contato / WhatsApp ----
    if (/whatsapp|whats|zap|contato|falar com|atendente|humano|pessoa|ligar|telefone/.test(lower)) {
      return {
        texto: `📱 Se preferir, fale diretamente com nossa equipe pelo <strong>WhatsApp</strong>! O atendimento é rápido e personalizado.`,
        sugestoes: ["🔍 Ver promoções", "🛒 Como comprar?"],
        extra: botaoWhatsApp("Olá! Vim pelo site da MIX-PROMOÇÃO e preciso de ajuda")
      };
    }

    // ---- Quem somos ----
    if (/quem somos|sobre|a loja|historia|sobre a loja|empresa/.test(lower)) {
      return {
        texto: `🛒 A <strong>${NOME_LOJA}</strong> é uma loja online com as melhores ofertas e preços imperdíveis!<br><br>
          Trabalhamos para oferecer produtos de qualidade com entrega rápida e atendimento humano. 💙<br><br>
          📄 Saiba mais: <a href="./html/QuemSomos.html" style="color:#0072ff;font-weight:700">Quem Somos</a>`,
        sugestoes: ["🔍 Ver promoções", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Meu pedido / rastreio ----
    if (/meu pedido|rastrear|rastreio|acompanhar|onde est[aá]|status do pedido/.test(lower)) {
      return {
        texto: `📦 Para acompanhar seu pedido:<br><br>
          <strong>1.</strong> Acesse <a href="./html/meu-perfil.html" style="color:#0072ff;font-weight:700">Meu Perfil</a><br>
          <strong>2.</strong> Verifique o status na seção de pedidos<br><br>
          Se precisar de ajuda com algum pedido específico, entre em contato pelo WhatsApp!`,
        sugestoes: ["📞 Falar no WhatsApp", "🔄 Trocas e devoluções"],
        extra: botaoWhatsApp("Olá, gostaria de rastrear meu pedido")
      };
    }

    // ---- Cadastro / Conta ----
    if (/cadastr|criar conta|registrar|login|entrar|minha conta|perfil/.test(lower)) {
      return {
        texto: `👤 Para criar sua conta ou fazer login:<br><br>
          • <a href="./html/cadastro-cliente.html" style="color:#0072ff;font-weight:700">Criar conta</a> (é rápido!)<br>
          • <a href="./html/login-cliente.html" style="color:#0072ff;font-weight:700">Fazer login</a><br><br>
          Com a conta você pode acompanhar pedidos e salvar favoritos! ⭐`,
        sugestoes: ["🛒 Como comprar?", "🔍 Ver promoções"]
      };
    }

    // ---- Segurança ----
    if (/seguro|segura|confi[aá]vel|golpe|fraude/.test(lower)) {
      return {
        texto: `🔒 Sua segurança é nossa prioridade!<br><br>
          • Site com proteção de dados<br>
          • Pagamentos processados com criptografia<br>
          • Política de trocas e devoluções transparente<br>
          • Atendimento humano sempre disponível<br><br>
          Pode comprar com tranquilidade! 😊`,
        sugestoes: ["💳 Formas de pagamento", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Tamanho ----
    if (/tamanho|size|numera[cç][aã]o|p m g|pp gg|medir/.test(lower)) {
      return {
        texto: `📏 <strong>Sobre Tamanhos:</strong><br><br>
          • Cada produto tem os tamanhos disponíveis na página do produto<br>
          • Selecione o tamanho antes de adicionar ao carrinho<br>
          • Na dúvida, entre em contato pelo WhatsApp que ajudamos a escolher!`,
        sugestoes: ["🔍 Ver produtos", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Despedida ----
    if (/tchau|ate mais|adeus|bye|flw|falou|ate logo/.test(lower)) {
      return {
        texto: `Até mais! 👋 Foi um prazer ajudar. Volte sempre que precisar! 😊💙`,
        sugestoes: ["🔍 Ver promoções", "📞 Falar no WhatsApp"]
      };
    }

    // ---- Fallback ----
    return {
      texto: `Hmm, não tenho certeza sobre isso 🤔. Posso ajudar com:<br><br>
        • 🔍 <strong>Promoções e produtos</strong> da loja<br>
        • 🛒 <strong>Como comprar</strong> no site<br>
        • 🚚 <strong>Frete e entrega</strong><br>
        • 🔄 <strong>Trocas e devoluções</strong><br>
        • 💳 <strong>Formas de pagamento</strong><br><br>
        Ou fale diretamente com nossa equipe pelo WhatsApp! 📱`,
      sugestoes: ["🔍 Ver promoções", "🛒 Como comprar?", "🚚 Frete", "📞 WhatsApp"],
      extra: botaoWhatsApp("Olá! Preciso de ajuda com uma dúvida")
    };
  }

  // ===== Botão WhatsApp =====
  function botaoWhatsApp(mensagem) {
    const tel = getNumeroWhatsApp();
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;
    return `<button class="chatbot-redirecionar-wpp" onclick="(function(){try{var h=new Date().toISOString().slice(0,10),s=JSON.parse(localStorage.getItem('chatbot_stats')||'{}');if(!s[h])s[h]={conversas:0,perguntas:0,whatsapp:0,resolvidos:0};s[h].whatsapp++;localStorage.setItem('chatbot_stats',JSON.stringify(s))}catch(e){};window.open('${url}','_blank')})()">
      <i class="fab fa-whatsapp"></i> Abrir WhatsApp
    </button>`;
  }

  function getNumeroWhatsApp() {
    // Tentar pegar número configurado pelo admin
    try {
      const cfg = JSON.parse(localStorage.getItem("chatbot_config") || "{}");
      if (cfg.whatsappNumero) return cfg.whatsappNumero;
    } catch {}
    return WHATSAPP_NUMERO;
  }

  // ===== Enviar mensagem =====
  function enviarMensagem(texto) {
    if (!texto || !texto.trim()) return;
    texto = texto.trim();

    addMsg("user", esc(texto));
    limparSugestoes();
    inputEl.value = "";
    inputEl.disabled = true;
    btnEnviar.disabled = true;

    // Verificar se está esperando CEP
    const cepLimpo = texto.replace(/\D/g, "");
    if (aguardandoCep && /^\d{8}$/.test(cepLimpo)) {
      aguardandoCep = false;
      mostrarDigitando();
      calcularFretePorCep(cepLimpo);
      return;
    }
    // Se digitou algo parecido com CEP mesmo sem estar aguardando
    if (/^\d{5}-?\d{3}$/.test(texto.trim())) {
      mostrarDigitando();
      aguardandoCep = false;
      calcularFretePorCep(cepLimpo);
      return;
    }

    // Simular "digitando"
    mostrarDigitando();

    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      removerDigitando();
      const resposta = processarIA(texto);
      addMsg("bot", resposta.texto, resposta.extra || "");

      if (resposta.sugestoes) {
        mostrarSugestoes(resposta.sugestoes);
      }

      inputEl.disabled = false;
      btnEnviar.disabled = false;
      inputEl.focus();
    }, delay);
  }

  // ===== Cálculo de Frete por CEP =====
  function getSubtotalCarrinho() {
    try {
      const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
      return carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);
    } catch { return 0; }
  }

  // Tabela de frete por região (baseado no primeiro dígito do CEP)
  // Regiões brasileiras dos Correios por faixa de CEP:
  // 0xxxx-1xxxx = SP (Grande SP e interior)
  // 2xxxx = RJ, ES
  // 3xxxx = MG
  // 4xxxx = BA, SE
  // 5xxxx = PE, AL, PB, RN
  // 6xxxx = CE, PI, MA, PA, AP, AM
  // 7xxxx = DF, GO, TO, MT, MS, AC, RO, RR
  // 8xxxx = PR, SC
  // 9xxxx = RS
  function getTabelaFretePorRegiao(digito) {
    const regioes = {
      "0": { nome: "São Paulo (Capital/Grande SP)", pac: 18.90, sedex: 32.90, sedex10: 48.90, pacDias: "3 a 5", sedexDias: "1 a 2", sedex10Dias: "1" },
      "1": { nome: "São Paulo (Interior)", pac: 20.90, sedex: 35.90, sedex10: 50.90, pacDias: "3 a 6", sedexDias: "1 a 3", sedex10Dias: "1" },
      "2": { nome: "Rio de Janeiro / Espírito Santo", pac: 22.90, sedex: 38.90, sedex10: 54.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "3": { nome: "Minas Gerais", pac: 23.90, sedex: 39.90, sedex10: 55.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "4": { nome: "Bahia / Sergipe", pac: 28.90, sedex: 45.90, sedex10: 62.90, pacDias: "5 a 9", sedexDias: "2 a 4", sedex10Dias: "1 a 2" },
      "5": { nome: "Pernambuco / Alagoas / Paraíba / Rio Grande do Norte", pac: 30.90, sedex: 48.90, sedex10: 65.90, pacDias: "6 a 10", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "6": { nome: "Ceará / Piauí / Maranhão / Norte", pac: 34.90, sedex: 52.90, sedex10: 72.90, pacDias: "7 a 12", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "7": { nome: "Centro-Oeste / Norte", pac: 32.90, sedex: 50.90, sedex10: 68.90, pacDias: "6 a 10", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "8": { nome: "Paraná / Santa Catarina", pac: 24.90, sedex: 40.90, sedex10: 56.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "9": { nome: "Rio Grande do Sul", pac: 26.90, sedex: 42.90, sedex10: 58.90, pacDias: "5 a 8", sedexDias: "2 a 4", sedex10Dias: "1 a 2" }
    };
    return regioes[digito] || regioes["0"];
  }

  function calcularFretePorCep(cep) {
    // Consultar ViaCEP para obter a localidade
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(r => r.json())
      .then(dados => {
        removerDigitando();

        if (dados.erro) {
          addMsg("bot", `❌ CEP <strong>${cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</strong> não encontrado. Verifique o número e tente novamente.`);
          mostrarSugestoes(["🚚 Calcular frete", "📞 Falar no WhatsApp"]);
          aguardandoCep = true;
          inputEl.disabled = false;
          btnEnviar.disabled = false;
          inputEl.focus();
          return;
        }

        const cidade = dados.localidade || "Cidade";
        const estado = dados.uf || "";
        const bairro = dados.bairro || "";
        const cepFmt = cep.replace(/(\d{5})(\d{3})/, "$1-$2");
        const digito = cep.charAt(0);
        const frete = getTabelaFretePorRegiao(digito);
        const subtotal = getSubtotalCarrinho();
        const formatV = (v) => `R$ ${v.toFixed(2).replace(".", ",")}`;

        // Frete grátis se subtotal >= 100
        if (subtotal >= 100) {
          addMsg("bot", `📍 <strong>${cidade} - ${estado}</strong> ${bairro ? `(${bairro})` : ""}<br>CEP: ${cepFmt}<br><br>
            🎉 <strong>FRETE GRÁTIS!</strong><br>
            Seu carrinho de <strong>${formatV(subtotal)}</strong> garante envio sem custo! 🚚✨`);
          mostrarSugestoes(["🛒 Ir ao checkout", "🔍 Ver promoções"]);
          inputEl.disabled = false;
          btnEnviar.disabled = false;
          inputEl.focus();
          return;
        }

        const freteHtml = `
          📍 <strong>${cidade} - ${estado}</strong> ${bairro ? `(${bairro})` : ""}<br>
          CEP: <strong>${cepFmt}</strong> — Região: <em>${frete.nome}</em><br><br>
          📦 <strong>Opções de Frete:</strong>
          <div class="chatbot-frete-opcoes">
            <div class="chatbot-frete-item chatbot-frete-pac" data-tipo="PAC" data-valor="${frete.pac}">
              <div class="frete-item-header">
                <span class="frete-tipo">📦 PAC</span>
                <span class="frete-valor">${formatV(frete.pac)}</span>
              </div>
              <span class="frete-prazo">🕐 ${frete.pacDias} dias úteis</span>
              ${subtotal > 0 ? `<span class="frete-total">Total: <strong>${formatV(subtotal + frete.pac)}</strong></span>` : ""}
            </div>
            <div class="chatbot-frete-item chatbot-frete-sedex" data-tipo="SEDEX" data-valor="${frete.sedex}">
              <div class="frete-item-header">
                <span class="frete-tipo">🚀 SEDEX</span>
                <span class="frete-valor">${formatV(frete.sedex)}</span>
              </div>
              <span class="frete-prazo">🕐 ${frete.sedexDias} dias úteis</span>
              ${subtotal > 0 ? `<span class="frete-total">Total: <strong>${formatV(subtotal + frete.sedex)}</strong></span>` : ""}
            </div>
            <div class="chatbot-frete-item chatbot-frete-sedex10" data-tipo="SEDEX10" data-valor="${frete.sedex10}">
              <div class="frete-item-header">
                <span class="frete-tipo">⚡ SEDEX 10</span>
                <span class="frete-valor">${formatV(frete.sedex10)}</span>
              </div>
              <span class="frete-prazo">🕐 ${frete.sedex10Dias} dia(s) útil(eis)</span>
              ${subtotal > 0 ? `<span class="frete-total">Total: <strong>${formatV(subtotal + frete.sedex10)}</strong></span>` : ""}
            </div>
          </div>
          ${subtotal > 0 && subtotal < 100 ? `<br>💡 Faltam <strong>${formatV(100 - subtotal)}</strong> para <strong>FRETE GRÁTIS</strong>!` : ""}
          ${subtotal === 0 ? `<br>💡 Compras acima de <strong>R$ 100,00</strong> têm <strong>FRETE GRÁTIS</strong>!` : ""}
        `;

        addMsg("bot", freteHtml);

        // Adicionar eventos de clique nos cards de frete para selecionar
        const opcoes = corpo.querySelectorAll(".chatbot-frete-item");
        opcoes.forEach(op => {
          op.addEventListener("click", () => {
            // Remover seleção anterior
            opcoes.forEach(o => o.classList.remove("selecionado"));
            op.classList.add("selecionado");
            const tipo = op.dataset.tipo;
            const valor = parseFloat(op.dataset.valor);
            localStorage.setItem("tipoFreteSelecionado", tipo);
            localStorage.setItem("calculouFrete", "1");

            addMsg("bot", `✅ Frete <strong>${tipo}</strong> selecionado: <strong>${formatV(valor)}</strong>! ${subtotal > 0 ? `Total da compra: <strong>${formatV(subtotal + valor)}</strong>` : ""}<br><br>
              👉 <a href="./html/checkout.html" style="color:#0072ff;font-weight:700">Finalizar compra no checkout →</a>`);
            mostrarSugestoes(["🛒 Ir ao checkout", "🔍 Ver promoções", "📞 Falar no WhatsApp"]);
          });
        });

        mostrarSugestoes(["🛒 Ir ao checkout", "🔍 Ver promoções", "📞 Falar no WhatsApp"]);
        inputEl.disabled = false;
        btnEnviar.disabled = false;
        inputEl.focus();
      })
      .catch(() => {
        removerDigitando();
        addMsg("bot", `⚠️ Não consegui consultar o CEP no momento. Tente novamente ou calcule diretamente no <a href="./html/checkout.html" style="color:#0072ff;font-weight:700">checkout</a>.`);
        mostrarSugestoes(["🚚 Calcular frete", "📞 Falar no WhatsApp"]);
        inputEl.disabled = false;
        btnEnviar.disabled = false;
        inputEl.focus();
      });
  }

  // ===== Respostas customizadas do admin =====
  function verificarRespostasCustom(lower) {
    try {
      const respostas = JSON.parse(localStorage.getItem(RESPOSTAS_KEY) || "[]");
      for (const r of respostas) {
        const match = r.palavras.some(p =>
          lower.includes(p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        );
        if (match) {
          return {
            texto: r.resposta,
            sugestoes: ["🔍 Ver promoções", "📞 Falar no WhatsApp"]
          };
        }
      }
    } catch {}
    return null;
  }

  // ===== Rastreio de estatísticas =====
  function registrarPergunta(msg) {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      if (!stats[hoje]) stats[hoje] = { conversas: 0, perguntas: 0, whatsapp: 0, resolvidos: 0 };
      stats[hoje].perguntas++;
      if (historico.length <= 1) stats[hoje].conversas++;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));

      // FAQ
      const faq = JSON.parse(localStorage.getItem(FAQ_KEY) || "{}");
      const perguntaLimpa = msg.trim().substring(0, 100);
      if (perguntaLimpa) {
        faq[perguntaLimpa] = (faq[perguntaLimpa] || 0) + 1;
        localStorage.setItem(FAQ_KEY, JSON.stringify(faq));
      }
    } catch {}
  }

  function registrarResolvido() {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      if (!stats[hoje]) stats[hoje] = { conversas: 0, perguntas: 0, whatsapp: 0, resolvidos: 0 };
      stats[hoje].resolvidos++;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  function registrarWhatsapp() {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      if (!stats[hoje]) stats[hoje] = { conversas: 0, perguntas: 0, whatsapp: 0, resolvidos: 0 };
      stats[hoje].whatsapp++;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  // ===== Eventos =====
  btnEnviar.addEventListener("click", () => {
    enviarMensagem(inputEl.value);
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enviarMensagem(inputEl.value);
    }
  });

  // ===== Auto-popup após delay (primeira vez) =====
  if (!sessionStorage.getItem("chatbot_popup")) {
    setTimeout(() => {
      if (!aberto) {
        badge.style.display = "flex";
        badge.textContent = "?";
        sessionStorage.setItem("chatbot_popup", "1");
      }
    }, 5000);
  }

})();
