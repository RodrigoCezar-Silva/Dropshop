document.addEventListener("DOMContentLoaded", () => {
  // Só permite acesso de administrador
  if (localStorage.getItem("tipoUsuario") !== "Administrador") {
    window.location.href = "admin-login.html";
    return;
  }

  const lista = document.getElementById("listaPedidosAdmin");
  const filtroStatus = document.getElementById("filtroStatus");
  const filtroBusca = document.getElementById("filtroBusca");
  const contagemEl = document.getElementById("contagemPedidos");

  // SVG inline como fallback para evitar 404 em ambientes de Live Server
  const defaultAvatarSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3' fill='%23e6eef8'/><path d='M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6' fill='%23e6eef8'/></svg>`;
  const defaultAvatarDataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(defaultAvatarSvg);

  if (!lista) return;

  if (filtroStatus) filtroStatus.addEventListener("change", renderizarPedidos);
  if (filtroBusca) filtroBusca.addEventListener("input", renderizarPedidos);

  renderizarPedidos();

  function obterTodosPedidos() {
    return JSON.parse(localStorage.getItem("mixPedidosCliente")) || [];
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
  }

  function formatarData(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function classeStatus(status) {
    if (!status) return "status-confirmado";
    const s = status.toLowerCase();
    if (s.includes("cancel")) return "status-cancelado";
    if (s.includes("teste")) return "status-teste";
    return "status-confirmado";
  }

  function renderizarPedidos() {
    let pedidos = obterTodosPedidos();

    const status = filtroStatus ? filtroStatus.value : "todos";
    if (status !== "todos") {
      pedidos = pedidos.filter(p => p.status === status);
    }

    const busca = filtroBusca ? String(filtroBusca.value).trim().toLowerCase() : "";
    if (busca) {
      pedidos = pedidos.filter(p =>
        (p.id || "").toLowerCase().includes(busca) ||
        (p.cliente?.nome || "").toLowerCase().includes(busca) ||
        (p.cliente?.email || "").toLowerCase().includes(busca)
      );
    }

    if (contagemEl) contagemEl.textContent = pedidos.length + " pedido" + (pedidos.length !== 1 ? "s" : "");

    if (pedidos.length === 0) {
      lista.innerHTML = '<p class="admin-pedidos-vazio"><i class="fa-solid fa-inbox"></i> Nenhum pedido encontrado.</p>';
      return;
    }

    lista.innerHTML = pedidos.map(pedido => {
      const statusCl = classeStatus(pedido.status);

      const itensHtml = (pedido.itens || []).map(item => `
        <div class="adm-item">
          <img src="${item.imagem || ''}" alt="${item.nome || 'Produto'}" onerror="this.style.display='none'">
          <div class="adm-item-dados">
            <strong>${item.nome || "Produto"}</strong>
            <span>Qtd: ${item.qtd || 1}</span>
            <span>Preço: ${formatarMoeda(item.preco)}</span>
          </div>
        </div>
      `).join("");

      const freteTexto = (!pedido.frete?.valor || pedido.frete?.tipo === "GRATIS")
        ? "Frete Grátis"
        : pedido.frete.tipo + " — " + formatarMoeda(pedido.frete.valor);

      const end = pedido.cliente?.endereco;
      const enderecoHtml = end
        ? `${end.rua || "—"}, ${end.numero || "S/N"} — ${end.bairro || "—"}`
        : "Não informado";

      // foto do cliente: pode ser URL absoluta, caminho relativo, ou base64. Usa fallback inline se não existir
      const clienteFoto = pedido.cliente?.foto || defaultAvatarDataUri;

      return `
        <article class="adm-pedido">
          <div class="adm-pedido-topo">
            <div class="adm-pedido-id">
              <h2>${pedido.id}</h2>
              <time>${formatarData(pedido.criadoEm)}</time>
            </div>
            <span class="adm-badge ${statusCl}">${pedido.status || "Confirmado"}</span>
          </div>

          <div class="adm-secao">
            <h3><i class="fa-solid fa-user"></i> Dados do Cliente</h3>
            <div class="adm-cliente-foto-wrap">
              <img class="adm-cliente-foto" src="${clienteFoto}" alt="Foto do cliente" onerror="this.onerror=null;this.src='${defaultAvatarDataUri}'">
            </div>
            <div class="adm-grid-2">
              <div class="adm-campo">
                <label>Nome completo</label>
                <span>${pedido.cliente?.nome || "—"}</span>
              </div>
              <div class="adm-campo">
                <label>E-mail</label>
                <span>${pedido.cliente?.email || "—"}</span>
              </div>
              <div class="adm-campo">
                <label>Telefone</label>
                <span>${pedido.cliente?.telefone || "—"}</span>
              </div>
              <div class="adm-campo">
                <label>Endereço de entrega</label>
                <span>${enderecoHtml}</span>
              </div>
            </div>
          </div>

          <div class="adm-secao">
            <h3><i class="fa-solid fa-credit-card"></i> Pagamento e Envio</h3>
            <div class="adm-grid-2">
              <div class="adm-campo">
                <label>Forma de pagamento</label>
                <span>${pedido.formaPagamento || "—"}</span>
              </div>
              <div class="adm-campo">
                <label>Frete</label>
                <span>${freteTexto}</span>
              </div>
            </div>
          </div>

          <div class="adm-secao">
            <h3><i class="fa-solid fa-box-open"></i> Produtos (${(pedido.itens || []).length})</h3>
            <div class="adm-itens-grid">${itensHtml}</div>
          </div>

          <div class="adm-pedido-total">
            <span>Subtotal: ${formatarMoeda(pedido.subtotal)}</span>
            <span>Frete: ${(!pedido.frete?.valor || pedido.frete?.tipo === "GRATIS") ? "Grátis" : formatarMoeda(pedido.frete.valor)}</span>
            <strong>Total: ${formatarMoeda(pedido.total)}</strong>
          </div>
        </article>
      `;
    }).join("");
  }
});
