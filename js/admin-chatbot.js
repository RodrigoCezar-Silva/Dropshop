/* ========================================
   ADMIN CHATBOT IA - MIX-PROMOÇÃO
   Gerenciamento e configuração do chatbot
   ======================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "chatbot_config";
  const RESPOSTAS_KEY = "chatbot_respostas_custom";
  const STATS_KEY = "chatbot_stats";
  const FAQ_KEY = "chatbot_faq";

  // Elementos
  const configNomeLoja = document.getElementById("configNomeLoja");
  const configNomeIA = document.getElementById("configNomeIA");
  const configWhatsapp = document.getElementById("configWhatsapp");
  const configMsgBoasVindas = document.getElementById("configMsgBoasVindas");
  const configAtivo = document.getElementById("configAtivo");
  const btnSalvarConfig = document.getElementById("btnSalvarConfig");
  const configSalvo = document.getElementById("configSalvo");

  const respostaPalavras = document.getElementById("respostaPalavras");
  const respostaTexto = document.getElementById("respostaTexto");
  const btnAddResposta = document.getElementById("btnAddResposta");
  const btnGerarIA = document.getElementById("btnGerarIA");
  const iaGerando = document.getElementById("iaGerando");
  const respostasLista = document.getElementById("respostasLista");

  const statConversas = document.getElementById("statConversas");
  const statPerguntas = document.getElementById("statPerguntas");
  const statWhatsapp = document.getElementById("statWhatsapp");
  const statResolvidos = document.getElementById("statResolvidos");
  const faqLista = document.getElementById("faqLista");

  // ===== Carregar config =====
  function carregarConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      configNomeLoja.value = cfg.nomeLoja || "";
      configNomeIA.value = cfg.nomeIA || "";
      configWhatsapp.value = cfg.whatsappNumero || "";
      configMsgBoasVindas.value = cfg.msgBoasVindas || "";
      configAtivo.checked = cfg.ativo !== false;
    } catch {}
  }

  // ===== Salvar config =====
  function salvarConfig() {
    const cfg = {
      nomeLoja: configNomeLoja.value.trim(),
      nomeIA: configNomeIA.value.trim(),
      whatsappNumero: configWhatsapp.value.trim().replace(/\D/g, ""),
      msgBoasVindas: configMsgBoasVindas.value.trim(),
      ativo: configAtivo.checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

    configSalvo.style.display = "inline";
    setTimeout(() => {
      configSalvo.style.display = "none";
    }, 2000);
  }

  btnSalvarConfig.addEventListener("click", salvarConfig);

  // ===== Respostas customizadas =====
  function getRespostas() {
    try {
      return JSON.parse(localStorage.getItem(RESPOSTAS_KEY) || "[]");
    } catch { return []; }
  }

  function salvarRespostas(lista) {
    localStorage.setItem(RESPOSTAS_KEY, JSON.stringify(lista));
  }

  function renderRespostas() {
    const lista = getRespostas();
    if (lista.length === 0) {
      respostasLista.innerHTML = `<div style="text-align:center;padding:16px;color:#94a3b8;font-size:0.85rem;">Nenhuma resposta personalizada.</div>`;
      return;
    }

    respostasLista.innerHTML = lista.map((r, i) => `
      <div class="resposta-item" data-index="${i}">
        <div class="resposta-conteudo">
          <div class="resposta-palavras">
            ${r.palavras.map(p => `<span class="resposta-tag">${escHtml(p)}</span>`).join("")}
          </div>
          <div class="resposta-texto">${escHtml(r.resposta)}</div>
        </div>
        <button class="btn-remover-resposta" title="Remover" data-idx="${i}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join("");

    respostasLista.querySelectorAll(".btn-remover-resposta").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const arr = getRespostas();
        arr.splice(idx, 1);
        salvarRespostas(arr);
        renderRespostas();
      });
    });
  }

  // ===== Gerador IA de respostas =====
  function gerarRespostaIA(palavrasChave) {
    const keywords = palavrasChave.toLowerCase().split(",").map(p => p.trim()).filter(p => p);
    if (keywords.length === 0) return null;

    const nomeLoja = configNomeLoja.value.trim() || "MIX-PROMOÇÃO";
    const produtos = (() => { try { return JSON.parse(localStorage.getItem("loja") || "[]"); } catch { return []; } })();

    // Base de conhecimento da loja para gerar respostas contextualizadas
    const temas = {
      garantia: {
        termos: ["garantia", "garantir", "garantido", "defeito", "danificado"],
        respostas: [
          `Todos os produtos da ${nomeLoja} possuem garantia de 30 dias contra defeitos de fabricação! 🛡️ Se houver qualquer problema, entre em contato que resolveremos rapidamente.`,
          `Na ${nomeLoja}, oferecemos garantia de 30 dias em todos os produtos. Caso receba um item com defeito, faremos a troca ou devolução do valor sem complicação! ✅`,
          `Fique tranquilo(a)! A ${nomeLoja} garante 30 dias de garantia em todas as compras. Produtos com defeito são trocados sem custo adicional. 🔒`
        ]
      },
      entrega: {
        termos: ["entrega", "entregar", "prazo", "envio", "frete", "dias", "demora", "rapido", "cep", "correio", "transportadora"],
        respostas: [
          `O prazo de entrega da ${nomeLoja} varia de 3 a 12 dias úteis, dependendo da sua região 🚚. O frete é calculado automaticamente no checkout pelo seu CEP. Em promoções especiais, oferecemos FRETE GRÁTIS! 🎉`,
          `Enviamos para todo o Brasil! 📦 O prazo é de 3 a 12 dias úteis e o valor do frete é calculado no momento da compra. Fique de olho nas promoções com frete grátis da ${nomeLoja}!`,
          `Na ${nomeLoja}, trabalhamos com envio rápido e seguro 🚀. Geralmente de 3 a 12 dias úteis. Informe seu CEP no checkout para ver o prazo e valor exatos para sua região.`
        ]
      },
      pagamento: {
        termos: ["pagamento", "pagar", "cartao", "pix", "boleto", "parcela", "parcelar", "credito", "debito", "dinheiro"],
        respostas: [
          `Na ${nomeLoja} aceitamos: 💳 Cartão de Crédito (até 12x), ⚡ Pix (aprovação instantânea) e 📄 Boleto Bancário. Todas as transações são 100% seguras com criptografia! 🔒`,
          `Formas de pagamento na ${nomeLoja}: Pix com aprovação na hora ⚡, Cartão de Crédito parcelado em até 12x 💳, e Boleto Bancário 📄. Compre com total segurança!`,
          `Você pode pagar com Pix, Cartão ou Boleto na ${nomeLoja}! O Pix é o mais rápido ⚡ e o cartão pode ser parcelado em até 12 vezes sem juros. 💳`
        ]
      },
      troca: {
        termos: ["troca", "trocar", "devolucao", "devolver", "devolvido", "arrependimento", "errado", "tamanho errado", "nao gostei"],
        respostas: [
          `A ${nomeLoja} aceita trocas e devoluções em até 7 dias após o recebimento! 🔄 O produto deve estar na embalagem original e sem sinais de uso. Para solicitar, entre em contato pelo WhatsApp ou formulário de contato.`,
          `Política de trocas da ${nomeLoja}: Você tem 7 dias corridos para trocar ou devolver 🔄. Basta entrar em contato com o produto na embalagem original. Simples e sem burocracia! ✅`,
          `Recebeu o tamanho errado ou não gostou? Sem problemas! Na ${nomeLoja} você tem até 7 dias para solicitar troca ou devolução 🔄. Fale conosco pelo WhatsApp para resolver rapidamente!`
        ]
      },
      produto: {
        termos: ["produto", "item", "mercadoria", "qualidade", "original", "material", "tecido"],
        respostas: [
          `Todos os produtos da ${nomeLoja} são selecionados com cuidado para garantir a melhor qualidade! ⭐ Temos ${produtos.length > 0 ? produtos.length + " produtos" : "diversas opções"} disponíveis. Visite nossa loja para conferir!`,
          `Na ${nomeLoja}, trabalhamos apenas com produtos de qualidade verificada ✅. Cada item passa por curadoria antes de ser disponibilizado. Confira nosso catálogo com ${produtos.length > 0 ? produtos.length + " itens" : "várias opções"}!`,
          `Os produtos da ${nomeLoja} são 100% verificados e de alta qualidade! 🏆 Temos ${produtos.length > 0 ? produtos.length + " produtos" : "muitas opções"} incríveis esperando por você. Confira na loja!`
        ]
      },
      tamanho: {
        termos: ["tamanho", "size", "numero", "numeracao", "pp", "gg", "medir", "medida", "tabela"],
        respostas: [
          `Na ${nomeLoja}, cada produto mostra os tamanhos disponíveis na página de detalhes 📏. Selecione o tamanho desejado antes de adicionar ao carrinho. Na dúvida sobre qual escolher, fale conosco pelo WhatsApp!`,
          `Os tamanhos disponíveis são exibidos na página de cada produto 📏. Se ficar em dúvida entre dois tamanhos, recomendamos escolher o maior. Qualquer dúvida, estamos no WhatsApp da ${nomeLoja}!`,
          `Cada produto da ${nomeLoja} tem a grade de tamanhos na sua página 📏. Basta selecionar antes de comprar. Em caso de tamanho errado, fazemos troca em até 7 dias! 🔄`
        ]
      },
      seguranca: {
        termos: ["seguro", "seguranca", "confiavel", "golpe", "fraude", "roubo", "site seguro", "confianca"],
        respostas: [
          `A ${nomeLoja} é 100% segura! 🔒 Seus dados são protegidos com criptografia, os pagamentos são processados por plataformas confiáveis e temos política de trocas e devoluções transparente. Compre tranquilo(a)!`,
          `Pode confiar! A ${nomeLoja} utiliza criptografia em todos os pagamentos 🔒, oferece garantia de 30 dias e atendimento humano pelo WhatsApp. Sua segurança é nossa prioridade! ✅`,
          `Segurança é prioridade na ${nomeLoja}! 🛡️ Site protegido, pagamentos criptografados, garantia em todos os produtos e suporte humano disponível. Compre sem preocupações!`
        ]
      },
      horario: {
        termos: ["horario", "horarios", "funciona", "atendimento", "aberto", "fecha", "expediente"],
        respostas: [
          `A loja online da ${nomeLoja} funciona 24 horas, 7 dias por semana! 🕐 Compre a qualquer momento. O atendimento pelo WhatsApp é de segunda a sábado, em horário comercial.`,
          `Nosso site está sempre aberto para compras! 🛒 O atendimento humano via WhatsApp da ${nomeLoja} funciona de segunda a sábado, das 9h às 18h.`,
          `Na ${nomeLoja}, você pode comprar online a qualquer hora! 🕐 Nosso suporte via WhatsApp funciona em horário comercial (seg-sáb). Para dúvidas fora desse horário, use nosso chatbot IA! 🤖`
        ]
      },
      desconto: {
        termos: ["desconto", "cupom", "promocao", "oferta", "barato", "economizar", "codigo", "voucher"],
        respostas: [
          `A ${nomeLoja} está sempre com promoções imperdíveis! 🔥 Confira a vitrine principal para ver os descontos do momento. Fique de olho também no nosso WhatsApp para ofertas exclusivas! 🏷️`,
          `Quer economizar? Na ${nomeLoja} temos descontos de até 70%! 🏷️ Acompanhe as promoções na loja e no nosso WhatsApp para não perder nenhuma oferta especial! 🔥`,
          `Na ${nomeLoja}, nossos preços já são promocionais! 💰 Vários produtos com descontos incríveis esperando por você. Visite a loja e aproveite as ofertas antes que acabem! 🔥`
        ]
      },
      pedido: {
        termos: ["pedido", "meu pedido", "rastrear", "rastreio", "acompanhar", "status", "onde esta", "rastreamento"],
        respostas: [
          `Para acompanhar seu pedido da ${nomeLoja}: acesse "Meu Perfil" e confira a seção de pedidos 📦. Se precisar de ajuda com um pedido específico, envie o número pelo WhatsApp!`,
          `Quer rastrear seu pedido? 📦 Acesse sua conta em "Meu Perfil" para ver o status. Se tiver o código de rastreio, consulte no site dos Correios. Dúvidas? Fale no WhatsApp da ${nomeLoja}!`,
          `O status do seu pedido fica disponível em "Meu Perfil" na ${nomeLoja} 📦. Se precisar de mais detalhes ou tiver algum problema, nosso atendimento pelo WhatsApp resolve rapidamente!`
        ]
      },
      cancelamento: {
        termos: ["cancelar", "cancelamento", "cancela", "desistir", "desistencia", "estorno", "reembolso"],
        respostas: [
          `Para cancelar um pedido na ${nomeLoja}, entre em contato pelo WhatsApp o mais rápido possível ⚡. Se o pedido ainda não foi enviado, cancelamos sem custo. Após o envio, segue a política de devolução (7 dias).`,
          `Quer cancelar sua compra? Na ${nomeLoja}, cancelamentos antes do envio são feitos sem custo 💰. Após o recebimento, você tem 7 dias para devolução. Fale conosco pelo WhatsApp para resolver!`,
          `Cancelamentos na ${nomeLoja} são rápidos! ⚡ Se o pedido não foi despachado, cancelamos e fazemos o estorno. Fale pelo WhatsApp informando o número do pedido.`
        ]
      }
    };

    // Encontrar o melhor tema baseado nas palavras-chave
    let melhorTema = null;
    let maiorMatch = 0;

    for (const [nome, tema] of Object.entries(temas)) {
      let matches = 0;
      for (const kw of keywords) {
        const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (tema.termos.some(t => t.includes(kwNorm) || kwNorm.includes(t))) {
          matches++;
        }
      }
      if (matches > maiorMatch) {
        maiorMatch = matches;
        melhorTema = tema;
      }
    }

    if (melhorTema) {
      // Escolher uma resposta aleatória do tema
      const idx = Math.floor(Math.random() * melhorTema.respostas.length);
      return melhorTema.respostas[idx];
    }

    // Fallback: gerar resposta genérica usando as palavras-chave
    const kwLista = keywords.join(", ");
    const genericas = [
      `Sobre ${kwLista}: a ${nomeLoja} está sempre pronta para ajudar! 😊 Se precisar de mais informações, fale com a nossa equipe pelo WhatsApp. Estamos à disposição!`,
      `Obrigado por perguntar sobre ${kwLista}! Na ${nomeLoja}, buscamos oferecer o melhor atendimento. Para detalhes específicos, entre em contato pelo WhatsApp e teremos prazer em ajudar! 💬`,
      `Entendido! Sobre ${kwLista}: a equipe da ${nomeLoja} pode te ajudar melhor via WhatsApp com informações detalhadas. Estamos sempre disponíveis para você! 🤝`
    ];
    return genericas[Math.floor(Math.random() * genericas.length)];
  }

  btnGerarIA.addEventListener("click", () => {
    const palavras = respostaPalavras.value.trim();
    if (!palavras) {
      alert("Digite as palavras-chave primeiro para a IA gerar a resposta.");
      respostaPalavras.focus();
      return;
    }

    btnGerarIA.disabled = true;
    iaGerando.style.display = "flex";
    respostaTexto.value = "";

    // Simular delay de "pensando"
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const resposta = gerarRespostaIA(palavras);
      respostaTexto.value = resposta;
      respostaTexto.style.height = "auto";
      respostaTexto.style.height = respostaTexto.scrollHeight + "px";
      btnGerarIA.disabled = false;
      iaGerando.style.display = "none";
    }, delay);
  });

  btnAddResposta.addEventListener("click", () => {
    const palavras = respostaPalavras.value.trim();
    const texto = respostaTexto.value.trim();

    if (!palavras || !texto) {
      alert("Preencha as palavras-chave e a resposta.");
      return;
    }

    const arr = getRespostas();
    arr.push({
      palavras: palavras.split(",").map(p => p.trim()).filter(p => p),
      resposta: texto
    });
    salvarRespostas(arr);
    renderRespostas();

    respostaPalavras.value = "";
    respostaTexto.value = "";
  });

  // ===== Estatísticas =====
  function carregarStats() {
    try {
      const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      const hoje = new Date().toISOString().slice(0, 10);
      const diaStats = stats[hoje] || { conversas: 0, perguntas: 0, whatsapp: 0, resolvidos: 0 };

      statConversas.textContent = diaStats.conversas || 0;
      statPerguntas.textContent = diaStats.perguntas || 0;
      statWhatsapp.textContent = diaStats.whatsapp || 0;
      statResolvidos.textContent = diaStats.resolvidos || 0;
    } catch {}
  }

  // ===== FAQs =====
  function carregarFaq() {
    try {
      const faq = JSON.parse(localStorage.getItem(FAQ_KEY) || "{}");
      const entries = Object.entries(faq).sort((a, b) => b[1] - a[1]).slice(0, 15);

      if (entries.length === 0) {
        faqLista.innerHTML = `<div class="faq-vazio">Nenhuma pergunta registrada ainda. As perguntas aparecerão aqui quando os clientes usarem o chatbot.</div>`;
        return;
      }

      faqLista.innerHTML = entries.map(([pergunta, count]) => `
        <div class="faq-item">
          <span class="faq-count">${count}x</span>
          <span class="faq-text">${escHtml(pergunta)}</span>
        </div>
      `).join("");
    } catch {}
  }

  // ===== Escape HTML =====
  function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ===== Init =====
  carregarConfig();
  renderRespostas();
  carregarStats();
  carregarFaq();

})();
