document.addEventListener("DOMContentLoaded", () => {
  const _defaultAvatarSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3' fill='%23e6eef8'/><path d='M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6' fill='%23e6eef8'/></svg>`;
  const _defaultAvatarDataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(_defaultAvatarSvg);
    // Busca endereço pelo CEP ao sair do campo
    const cepInput = document.getElementById("cep");
    if (cepInput) {
      cepInput.addEventListener("blur", async () => {
        const cep = cepInput.value.replace(/\D/g, "");
        if (cep.length !== 8) return;
        try {
          // Tenta buscar endereço do cliente pelo backend
          const email = document.getElementById("email")?.value || localStorage.getItem("email") || "";
          if (!email) return;
          const resp = await fetch(`http://localhost:3000/api/cliente/cep/${cep}?email=${encodeURIComponent(email)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.sucesso && data.endereco) {
              definirValor("rua", data.endereco.rua || "");
              definirValor("bairro", data.endereco.bairro || "");
              definirValor("numero", data.endereco.numero || "");
              definirValor("complemento", data.endereco.complemento || "");
              definirValor("estado", data.endereco.estado || "");
            }
          }
        } catch (e) { /* ignora erro */ }
      });
    }
  const form = document.getElementById("checkoutForm");
  const pagamentoSelect = document.getElementById("pagamento");
  const mensagem = document.getElementById("checkoutMensagem");
  const listaItens = document.getElementById("checkoutListaItens");
  const btnPreencherTeste = document.getElementById("btnPreencherTeste");
  const btnGerarPedidoTeste = document.getElementById("btnGerarPedidoTeste");
  const totalResumo = document.getElementById("totalResumo");
  const areaTeste = document.getElementById("checkoutAreaTeste");
  const checkoutAmbiente = document.getElementById("checkoutAmbiente");

  const carrinho = () => JSON.parse(localStorage.getItem("carrinho")) || [];
  const chavePedidos = "mixPedidosCliente";
  const ambienteLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) || window.location.protocol === "file:";
  const tipoUsuario = localStorage.getItem("tipoUsuario") || "";

  if (checkoutAmbiente) {
    checkoutAmbiente.textContent = ambienteLocal ? "Local / teste" : "Hospedagem";
  }

  // Mostrar área de teste apenas para administradores
  if (areaTeste) {
    if (tipoUsuario !== "Administrador") {
      areaTeste.classList.add("oculto");
    }
  }

  renderizarResumoItens();
  atualizarTotalCheckoutLocal();
  preencherDadosCliente();

  window.addEventListener("storage", event => {
    if (event.key === "carrinho" || event.key === "tipoFreteSelecionado") {
      renderizarResumoItens();
      atualizarTotalCheckoutLocal();
    }
  });

  if (btnPreencherTeste) {
    btnPreencherTeste.addEventListener("click", () => {
      if (!ambienteLocal && tipoUsuario !== "Administrador") return;
      preencherCheckoutTeste();
      exibirMensagem("Dados de teste preenchidos. Agora você pode confirmar o pedido.", "sucesso");
    });
  }

  // Botão específico para preencher dados do cartão e atualizar o preview
  const btnPreencherCartaoTeste = document.getElementById('btnPreencherCartaoTeste');
  if (btnPreencherCartaoTeste) {
    btnPreencherCartaoTeste.addEventListener('click', () => {
      if (!ambienteLocal && tipoUsuario !== "Administrador") return;
      // Dados fake
      const fakeNome = (localStorage.getItem('nome') || 'Rodrigo Cezar Silva de Souza').toUpperCase();
      definirValor('nomeTitular', fakeNome);
      definirValor('numeroCartao', '4111 1111 1111 1111');
      definirValor('validade', '12/30');
      definirValor('cvv', '123');
      // Disparar eventos para atualizar preview e detectar bandeira
      const nomeEl = document.getElementById('nomeTitular');
      if (nomeEl) nomeEl.dispatchEvent(new Event('input'));
      const numEl = document.getElementById('numeroCartao');
      if (numEl) numEl.dispatchEvent(new Event('input'));
      const valEl = document.getElementById('validade');
      if (valEl) valEl.dispatchEvent(new Event('input'));
      exibirMensagem('Dados de cartão de teste preenchidos.', 'sucesso');
    });
  }

  if (btnGerarPedidoTeste) {
    btnGerarPedidoTeste.addEventListener("click", () => {
      if (!ambienteLocal && tipoUsuario !== "Administrador") return;
      preencherCheckoutTeste();
      if (pagamentoSelect) pagamentoSelect.value = "pix";
      if (pagamentoSelect) pagamentoSelect.dispatchEvent(new Event("change"));
      gerarPedido(true);
    });
  }

  if (form) {
    form.addEventListener("submit", async event => {
      event.preventDefault();

      const pagamento = pagamentoSelect ? pagamentoSelect.value : "";
      if (!pagamento) {
        exibirMensagem("Escolha uma forma de pagamento.", "erro");
        return;
      }

      // Se PagBank estiver disponível, processar pagamento real primeiro
      if (typeof window.processarPagamentoPagBank === "function") {
        const sucesso = await window.processarPagamentoPagBank(pagamento);
        if (sucesso) {
          gerarPedido(false);
        }
      } else {
        gerarPedido(false);
      }
    });
  }

  function preencherDadosCliente() {
    const nome = localStorage.getItem("nome") || "";
    const email = localStorage.getItem("email") || "";
    if (email && document.getElementById("email")) {
      document.getElementById("email").value = email;
    }
    if (!nome) return;
  }

  function preencherCheckoutTeste() {
    definirValor("rua", "Rua das Ofertas");
    definirValor("bairro", "Centro");
    definirValor("numero", "123");
    definirValor("complemento", "Apto 202");
    definirValor("estado", "RJ");
    definirValor("cep", "20000-000");
    definirValor("telefone", "(21) 98888-7766");
    definirValor("email", localStorage.getItem("email") || "cliente.teste@mixpromocao.com");
    definirValor("cpf", "123.456.789-09");

    if (pagamentoSelect && !pagamentoSelect.value) {
      pagamentoSelect.value = "credito";
      pagamentoSelect.dispatchEvent(new Event("change"));
    }

    // Preencher nome do titular no cartão (preview) e disparar eventos para atualizar visual
    definirValor("nomeTitular", localStorage.getItem("nome") || "CLIENTE TESTE");
    const nomeTitularEl = document.getElementById("nomeTitular");
    if (nomeTitularEl) nomeTitularEl.dispatchEvent(new Event('input'));

    definirValor("numeroCartao", "4111 1111 1111 1111");
    definirValor("validade", "12/30");
    definirValor("cvv", "123");
    // Disparar eventos para atualizar preview e detectar bandeira
    const numCartaoEl = document.getElementById("numeroCartao");
    if (numCartaoEl) numCartaoEl.dispatchEvent(new Event('input'));
    const validadeEl = document.getElementById("validade");
    if (validadeEl) validadeEl.dispatchEvent(new Event('input'));
  }

  function renderizarResumoItens() {
    if (!listaItens) return;

    const itens = carrinho();
    if (!itens.length) {
      listaItens.innerHTML = "<li class='lista-vazia'>Seu carrinho está vazio. Adicione produtos antes de fechar o pedido.</li>";
      atualizarTotalCheckoutLocal();
      return;
    }

    listaItens.innerHTML = itens.map(item => {
      const quantidade = Number(item.qtd || 1);
      const preco = Number(item.preco || 0);
      const imagem = item.imagem || item.imagemPrincipal || _defaultAvatarDataUri;
      return `
        <li class="checkout-resumo-item">
          <img src="${imagem}" alt="${item.nome || "Produto"}">
          <div>
            <strong>${item.nome || "Produto sem nome"}</strong>
            <span>Quantidade: ${quantidade}</span>
            <small>${formatarMoeda(preco * quantidade)}</small>
          </div>
          <span>${formatarMoeda(preco)} cada</span>
        </li>
      `;
    }).join("");

    atualizarTotalCheckoutLocal();
  }

  function atualizarTotalCheckoutLocal() {
    if (!totalResumo) return;

    const subtotal = carrinho().reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.qtd || 1), 0);
    const tipoFrete = localStorage.getItem("tipoFreteSelecionado") || "GRATIS";
    const valorFrete = obterValorFrete(tipoFrete, subtotal);
    totalResumo.textContent = (subtotal + valorFrete).toFixed(2).replace(".", ",");
  }

  function gerarPedido(modoTeste) {
    const itens = carrinho();
    const clienteId = localStorage.getItem("clienteId");
    const tipoUsuario = localStorage.getItem("tipoUsuario");

    if (tipoUsuario !== "Cliente" || !clienteId) {
      exibirMensagem("Você precisa estar logado como cliente para confirmar o pedido.", "erro");
      return;
    }

    if (!itens.length) {
      exibirMensagem("Seu carrinho está vazio. Adicione produtos antes de confirmar.", "erro");
      return;
    }

    if (!form.reportValidity()) {
      exibirMensagem("Preencha os campos obrigatórios do checkout.", "erro");
      return;
    }

    const pagamento = pagamentoSelect ? pagamentoSelect.value : "";
    if (!pagamento) {
      exibirMensagem("Escolha uma forma de pagamento.", "erro");
      return;
    }

    const subtotal = itens.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.qtd || 1), 0);
    let tipoFrete = localStorage.getItem("tipoFreteSelecionado") || "GRATIS";
    const valorFrete = obterValorFrete(tipoFrete, subtotal);
    if (valorFrete === 0) tipoFrete = "GRATIS";
    const pedido = {
      id: `PED-${Date.now()}`,
      clienteId,
      criadoEm: new Date().toISOString(),
      status: modoTeste ? "Pedido de teste" : "Confirmado",
      teste: !!modoTeste,
      formaPagamento: obterDescricaoPagamento(pagamento),
      pagamentoCodigo: pagamento,
      frete: {
        tipo: tipoFrete,
        valor: valorFrete
      },
      cliente: {
        nome: `${localStorage.getItem("nome") || ""} ${localStorage.getItem("sobrenome") || ""}`.trim(),
        email: valorCampo("email"),
        telefone: valorCampo("telefone"),
        cpf: valorCampo("cpf").replace(/\D/g, ""),
        endereco: {
          rua: valorCampo("rua"),
          bairro: valorCampo("bairro"),
          numero: valorCampo("numero"),
          complemento: valorCampo("complemento"),
          estado: valorCampo("estado")
        }
      },
      itens: itens.map(item => ({
        id: item.id || null,
        nome: item.nome || "Produto",
        descricao: item.descricao || "Sem descrição cadastrada.",
        imagem: item.imagem || item.imagemPrincipal || _defaultAvatarDataUri,
        quantidade: Number(item.qtd || 1),
        precoUnitario: Number(item.preco || 0),
        subtotal: Number(item.preco || 0) * Number(item.qtd || 1)
      })),
      total: subtotal + valorFrete,
      subtotal
    };

    // Tenta enviar para o backend (se disponível), senão salva localmente
    (async () => {
      try {
        const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : window.location.origin;
        const resp = await fetch(`${apiBase}/api/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedido)
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.sucesso && data.pedido) {
            // usar id do banco quando disponível
            pedido.id = data.pedido.id;
          }
        } else {
          console.warn('Backend /api/pedidos retornou não-ok, salvando localmente');
          const pedidos = JSON.parse(localStorage.getItem(chavePedidos)) || [];
          pedidos.unshift(pedido);
          localStorage.setItem(chavePedidos, JSON.stringify(pedidos));
        }
      } catch (e) {
        // fallback local
        const pedidos = JSON.parse(localStorage.getItem(chavePedidos)) || [];
        pedidos.unshift(pedido);
        localStorage.setItem(chavePedidos, JSON.stringify(pedidos));
      }
    })();

    localStorage.removeItem("carrinho");
    localStorage.removeItem("tipoFreteSelecionado");
    window.dispatchEvent(new StorageEvent("storage", { key: "carrinho" }));

    renderizarResumoItens();
    atualizarTotalCheckoutLocal();
    exibirMensagem(`Pedido ${modoTeste ? "de teste" : "confirmado"} com sucesso! Ele já aparece na sua Área do Cliente.`, "sucesso");
    form.reset();
    if (pagamentoSelect) pagamentoSelect.dispatchEvent(new Event("change"));
    setTimeout(() => {
      window.location.href = "/html/meu-perfil.html";
    }, 1600);
  }

  function obterDescricaoPagamento(codigo) {
    const mapa = {
      credito: "Cartão de Crédito",
      debito: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto Bancário"
    };
    return mapa[codigo] || "Pagamento não informado";
  }

  function obterValorFrete(tipoFrete, subtotal) {
    if (subtotal >= 100 || !tipoFrete || tipoFrete === "GRATIS" || tipoFrete === "-") return 0;
    const valor = parseFloat(localStorage.getItem('valorFreteSelecionado'));
    return (!isNaN(valor) && valor > 0) ? valor : 0;
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
  }

  function valorCampo(id) {
    const campo = document.getElementById(id);
    return campo ? campo.value.trim() : "";
  }

  function definirValor(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor;
  }

  function exibirMensagem(texto, tipo) {
    if (!mensagem) return;
    mensagem.textContent = texto;
    mensagem.className = `checkout-mensagem show ${tipo}`;
  }
});