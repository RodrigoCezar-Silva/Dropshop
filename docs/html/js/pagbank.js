// Integração PagBank - Frontend
// Encripta cartão, envia pagamento e exibe resultado (PIX QR, Boleto, Cartão)

(function () {
  let pagBankPublicKey = null;
  let pagBankEncrypt = null;
  let processando = false;

  // ===== Buscar chave pública ao carregar =====
  async function carregarChavePublica() {
    try {
      const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.protocol === "file:";
      const headers = { "Content-Type": "application/json" };
      if (isLocal) headers['x-use-pagbank-fake'] = '1';
      const resp = await fetch("http://localhost:3000/api/pagbank/public-key", { headers });
      if (!resp.ok) {
        if (resp.status === 404) {
          console.warn("PagBank: endpoint /api/pagbank/public-key não encontrado. O backend está rodando?");
        } else {
          console.warn(`PagBank: erro ao buscar chave pública (status ${resp.status})`);
        }
        return;
      }
      const data = await resp.json();
      if (data.sucesso && data.publicKey) {
        pagBankPublicKey = data.publicKey;
        console.log("PagBank: chave pública carregada");
      } else {
        console.warn("PagBank: resposta inesperada ao buscar chave pública", data);
      }
    } catch (e) {
      console.warn("PagBank: não foi possível carregar chave pública", e);
    }
  }

  // ===== Encriptar dados do cartão =====
  function encriptarCartao(numero, mes, ano, cvv, titular) {
    if (typeof PagSeguro !== "undefined" && PagSeguro.encryptCard) {
      const result = PagSeguro.encryptCard({
        publicKey: pagBankPublicKey,
        holder: (titular || "CLIENTE MIXPROMOCAO").trim(),
        number: numero.replace(/\s/g, ""),
        expMonth: mes,
        expYear: ano.length === 2 ? "20" + ano : ano,
        securityCode: cvv
      });
      return result.hasErrors ? null : result.encryptedCard;
    }
    return null;
  }

  // ===== Coletar dados do cliente =====
  function coletarDadosCliente() {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    return {
      nome: `${localStorage.getItem("nome") || ""} ${localStorage.getItem("sobrenome") || ""}`.trim() || "Cliente",
      email: val("email") || localStorage.getItem("email") || "",
      telefone: val("telefone"),
      cpf: val("cpf") || localStorage.getItem("clienteCPF") || "",
      cep: localStorage.getItem("freteCep") || "",
      endereco: {
        rua: val("rua"),
        bairro: val("bairro"),
        numero: val("numero"),
        complemento: val("complemento"),
        estado: val("estado")
      }
    };
  }

  // ===== Coletar itens do carrinho =====
  function coletarItens() {
    const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
    return carrinho.map(item => ({
      id: item.id || "item",
      nome: item.nome || "Produto",
      quantidade: Number(item.qtd || 1),
      precoUnitario: Number(item.preco || 0)
    }));
  }

  // ===== Obter valor do frete =====
  function obterFrete() {
    const subtotal = coletarItens().reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    if (subtotal >= 100) return 0;
    const val = parseFloat(localStorage.getItem("valorFreteSelecionado"));
    return !isNaN(val) && val > 0 ? val : 0;
  }

  // ===== Exibir resultado do pagamento =====
  function exibirResultadoPagamento(tipo, dados) {
    // Remove resultado anterior
    const anterior = document.getElementById("pagbankResultado");
    if (anterior) anterior.remove();

    const container = document.getElementById("secaoPagamento");
    if (!container) return;

    const div = document.createElement("div");
    div.id = "pagbankResultado";
    div.className = "pagbank-resultado";

    if (tipo === "pix" && dados.qrCode) {
      div.innerHTML = `
        <div class="pagbank-resultado-header pagbank-pix">
          <i class="fa-brands fa-pix"></i>
          <h4>PIX Gerado com Sucesso!</h4>
        </div>
        <div class="pagbank-resultado-body">
          ${dados.qrCode.imagemBase64 ? `<img src="${dados.qrCode.imagemBase64}" alt="QR Code PIX" class="pagbank-qrcode">` : ""}
          <p class="pagbank-instrucao">Escaneie o QR Code ou copie o código abaixo:</p>
          <div class="pagbank-codigo-pix">
            <input type="text" value="${dados.qrCode.texto || ""}" readonly id="pixCopiaCola">
            <button type="button" class="btn-copiar-pix" onclick="copiarPix()">
              <i class="fa-solid fa-copy"></i> Copiar
            </button>
          </div>
          <p class="pagbank-expiracao"><i class="fa-solid fa-clock"></i> Expira em 24 horas</p>
          <p class="pagbank-pedido-id">Pedido: <strong>${dados.pedidoId}</strong></p>
        </div>
      `;
    } else if (tipo === "boleto" && dados.boleto) {
      div.innerHTML = `
        <div class="pagbank-resultado-header pagbank-boleto">
          <i class="fa-solid fa-barcode"></i>
          <h4>Boleto Gerado com Sucesso!</h4>
        </div>
        <div class="pagbank-resultado-body">
          <div class="pagbank-boleto-info">
            <p><strong>Linha Digitável:</strong></p>
            <div class="pagbank-codigo-pix">
              <input type="text" value="${dados.boleto.linhaDigitavel || dados.boleto.codigoBarras}" readonly id="boletoLinha">
              <button type="button" class="btn-copiar-pix" onclick="copiarBoleto()">
                <i class="fa-solid fa-copy"></i> Copiar
              </button>
            </div>
          </div>
          ${dados.boleto.linkPdf ? `
            <a href="${dados.boleto.linkPdf}" target="_blank" class="btn-baixar-boleto">
              <i class="fa-solid fa-download"></i> Baixar Boleto PDF
            </a>
          ` : ""}
          <p class="pagbank-expiracao"><i class="fa-solid fa-calendar"></i> Vencimento: ${formatarData(dados.boleto.vencimento)}</p>
          <p class="pagbank-pedido-id">Pedido: <strong>${dados.pedidoId}</strong></p>
        </div>
      `;
    } else if (tipo === "cartao") {
      const aprovado = dados.status === "PAID" || dados.status === "AUTHORIZED";
      div.innerHTML = `
        <div class="pagbank-resultado-header ${aprovado ? "pagbank-aprovado" : "pagbank-pendente"}">
          <i class="fa-solid ${aprovado ? "fa-circle-check" : "fa-clock"}"></i>
          <h4>${aprovado ? "Pagamento Aprovado!" : "Pagamento em Processamento"}</h4>
        </div>
        <div class="pagbank-resultado-body">
          <p class="pagbank-status-msg">${aprovado
          ? "Seu pagamento foi aprovado. O pedido está sendo processado!"
          : "Seu pagamento está sendo analisado. Acompanhe na sua área do cliente."}</p>
          <p class="pagbank-pedido-id">Pedido: <strong>${dados.pedidoId}</strong></p>
        </div>
      `;
    }

    // Insere antes dos btns de navegação
    const btnsNav = container.querySelector(".btns-navegacao");
    if (btnsNav) container.insertBefore(div, btnsNav);
    else container.appendChild(div);

    div.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function formatarData(str) {
    if (!str) return "-";
    const d = new Date(str);
    return d.toLocaleDateString("pt-BR");
  }

  // ===== Funções globais para copiar =====
  window.copiarPix = function () {
    const input = document.getElementById("pixCopiaCola");
    if (input) { navigator.clipboard.writeText(input.value); mostrarToast("Código PIX copiado!"); }
  };
  window.copiarBoleto = function () {
    const input = document.getElementById("boletoLinha");
    if (input) { navigator.clipboard.writeText(input.value); mostrarToast("Linha digitável copiada!"); }
  };

  function mostrarToast(msg) {
    const toast = document.createElement("div");
    toast.className = "pagbank-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // ===== Exibir loading no botão =====
  function setBotaoLoading(loading) {
    const btn = document.getElementById("btnConfirmarPedido");
    if (!btn) return;
    if (loading) {
      btn.dataset.textoOriginal = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
      btn.disabled = true;
      btn.style.opacity = "0.7";
    } else {
      btn.innerHTML = btn.dataset.textoOriginal || '<i class="fa-solid fa-lock"></i> Confirmar Pedido';
      btn.disabled = false;
      btn.style.opacity = "";
    }
  }

  // ===== Processar pagamento PagBank =====
  async function processarPagamentoPagBank(formaPagamento) {
    if (processando) return false;
    processando = true;
    setBotaoLoading(true);


    const cliente = coletarDadosCliente();
    const itens = coletarItens();
    const frete = obterFrete();
    const referencia = `MIX-${Date.now()}`;

    // ===== Validação de campos obrigatórios para PIX/BOLETO =====
    if (formaPagamento === "pix" || formaPagamento === "boleto") {
      const camposObrigatorios = [
        cliente.nome, cliente.email, cliente.cpf, cliente.telefone,
        cliente.endereco.rua, cliente.endereco.bairro, cliente.endereco.numero, cliente.endereco.estado, cliente.cep
      ];
      if (camposObrigatorios.some(v => !v || v.length < 3) || !Array.isArray(itens) || itens.length === 0) {
        mostrarMsgCheckout("Preencha todos os dados obrigatórios do cliente, endereço e carrinho para continuar.", "erro");
        processando = false;
        setBotaoLoading(false);
        return false;
      }
    }

    try {
      let endpoint, payload;

      if (formaPagamento === "pix") {
        endpoint = "http://localhost:3000/api/pagbank/pix";
        payload = { referencia, cliente, itens, frete };

      } else if (formaPagamento === "boleto") {
        endpoint = "http://localhost:3000/api/pagbank/boleto";
        payload = { referencia, cliente, itens, frete };

      } else if (formaPagamento === "credito" || formaPagamento === "debito") {
        const numCartao = (document.getElementById("numeroCartao")?.value || "").replace(/\s/g, "");
        const validade = document.getElementById("validade")?.value || "";
        const cvv = document.getElementById("cvv")?.value || "";

        if (!numCartao || !validade || !cvv) {
          mostrarMsgCheckout("Preencha todos os dados do cartão.", "erro");
          processando = false;
          setBotaoLoading(false);
          return false;
        }

        const [mes, ano] = validade.split("/");
        const titular = document.getElementById("nomeTitular")?.value || cliente.nome || "CLIENTE MIXPROMOCAO";
        let encrypted = null;

        // Tentar encriptar com o SDK PagBank
        if (pagBankPublicKey) {
          encrypted = encriptarCartao(numCartao, mes, ano, cvv, titular);
        }

        if (!encrypted) {
          // Fallback: enviar dados raw (sandbox aceita)
          encrypted = btoa(JSON.stringify({ number: numCartao, exp_month: mes, exp_year: "20" + ano, security_code: cvv }));
        }

        endpoint = "http://localhost:3000/api/pagbank/cartao";
        payload = {
          referencia, cliente, itens, frete,
          tipo: formaPagamento,
          cartao: { encrypted }
        };
      } else {
        processando = false;
        setBotaoLoading(false);
        return false;
      }

      const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.protocol === "file:";
      const headers = { "Content-Type": "application/json" };
      if (isLocal) headers['x-use-pagbank-fake'] = '1';
      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!data.sucesso) {
        const detalhe = data.detalhes ? JSON.stringify(data.detalhes) : data.mensagem;
        mostrarMsgCheckout(`Erro no pagamento: ${detalhe}`, "erro");
        processando = false;
        setBotaoLoading(false);
        return false;
      }

      // Exibir resultado visual
      exibirResultadoPagamento(formaPagamento === "credito" || formaPagamento === "debito" ? "cartao" : formaPagamento, data);

      // Salvar referência no pedido local
      localStorage.setItem("ultimoPagBankPedido", JSON.stringify({
        pedidoId: data.pedidoId,
        referencia,
        forma: formaPagamento,
        data: new Date().toISOString()
      }));

      processando = false;
      setBotaoLoading(false);
      return true; // pagamento enviado com sucesso

    } catch (error) {
      console.error("Erro PagBank:", error);
      mostrarMsgCheckout("Erro ao se comunicar com o servidor de pagamento. Tente novamente.", "erro");
      processando = false;
      setBotaoLoading(false);
      return false;
    }
  }

  function mostrarMsgCheckout(texto, tipo) {
    const msg = document.getElementById("checkoutMensagem");
    if (msg) {
      msg.textContent = texto;
      msg.className = `checkout-mensagem show ${tipo}`;
    }
  }

  // ===== Apenas carrega a chave pública ao iniciar =====
  document.addEventListener("DOMContentLoaded", () => {
    carregarChavePublica();
  });

  // Expor para uso externo
  window.processarPagamentoPagBank = processarPagamentoPagBank;
})();
