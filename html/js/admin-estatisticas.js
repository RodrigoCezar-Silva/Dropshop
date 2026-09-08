document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token") || localStorage.getItem("tokenAdmin");
  const tbody = document.getElementById("estatisticasProdutosBody");
  const totalVisualizacoesEl = document.getElementById("totalVisualizacoes");
  const produtosVisualizadosEl = document.getElementById("produtosVisualizados");
  const produtoLiderEl = document.getElementById("produtoLider");
  const produtoLiderSubEl = document.getElementById("produtoLiderSub");
  const mediaVisualizacoesEl = document.getElementById("mediaVisualizacoes");
  const filtroInput = document.getElementById("filtroProdutoInput");
  const btnRecarregar = document.getElementById("btnRecarregarEstatisticas");

  if (!tbody) return;

  let produtosCarregados = [];

  const apiBase = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : (window.AUTH_SERVER || window.location.origin);

  function obterClasseCategoria(cat) {
    const normalizada = String(cat || "").toLowerCase().trim();
    if (normalizada.includes("eletron") || normalizada.includes("gamer") || normalizada.includes("tecnologia")) return "categoria-eletronicos";
    if (normalizada.includes("moda") || normalizada.includes("roupa") || normalizada.includes("calcado")) return "categoria-moda";
    if (normalizada.includes("casa") || normalizada.includes("decor") || normalizada.includes("tapete")) return "categoria-casa";
    return "";
  }

  function renderizarTabela(produtos) {
    if (!produtos || !produtos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-cell">
            <i class="fa-solid fa-box-open" style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px; display: block;"></i>
            Nenhum produto encontrado.
          </td>
        </tr>
      `;
      return;
    }

    const maxVisualizacoes = Math.max(...produtos.map(p => Number(p.visualizacoes) || 0), 1);

    tbody.innerHTML = produtos.map((produto, index) => {
      const pos = index + 1;
      let rankHtml = `<span class="rank-badge rank-default">#${pos}</span>`;
      if (pos === 1) rankHtml = `<span class="rank-badge rank-top1" title="1º Lugar">🥇</span>`;
      else if (pos === 2) rankHtml = `<span class="rank-badge rank-top2" title="2º Lugar">🥈</span>`;
      else if (pos === 3) rankHtml = `<span class="rank-badge rank-top3" title="3º Lugar">🥉</span>`;

      const views = Number(produto.visualizacoes) || 0;
      const porcentagem = Math.min(Math.round((views / maxVisualizacoes) * 100), 100);
      const catClass = obterClasseCategoria(produto.categoria);

      return `
        <tr>
          <td style="text-align: center;">${rankHtml}</td>
          <td>
            <div class="admin-estatisticas-produto">
              <img src="${produto.imagem || "https://via.placeholder.com/80x80?text=Produto"}" alt="${produto.nome}" loading="lazy">
              <div class="produto-info-texto">
                <strong title="${produto.nome}">${produto.nome}</strong>
                <span class="produto-id-tag">ID #${produto.id}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="admin-categoria-pill ${catClass}">${produto.categoria || "outros"}</span>
          </td>
          <td>
            <span class="admin-preco-texto">${produto.precoAtual || "-"}</span>
          </td>
          <td>
            <div class="views-cell-wrapper">
              <span class="admin-estatisticas-badge">
                <i class="fa-solid fa-eye"></i> ${views} ${views === 1 ? "acesso" : "acessos"}
              </span>
              <div class="views-progress-bg" title="${porcentagem}% do produto mais visto">
                <div class="views-progress-fill" style="width: ${porcentagem}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <span style="color: #64748b; font-size: 0.86rem; white-space: nowrap;">
              <i class="fa-regular fa-calendar" style="margin-right: 4px; color: #94a3b8;"></i>${produto.dataCadastro || "-"}
            </span>
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <div class="admin-table-acoes">
              <a href="admin-avaliacoes.html?id=${produto.id}" class="btn-ver-produto btn-acao-avaliar" title="Ver avaliações deste produto">
                <i class="fa-solid fa-star"></i> Avaliações
              </a>
              <a href="produto.html?id=${produto.id}" target="_blank" class="btn-ver-produto btn-acao-ver" title="Visualizar página do produto na loja">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function carregarEstatisticas() {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          <div class="loading-spinner-box">
            <div class="loading-spinner"></div>
            <span>Carregando estatísticas atualizadas...</span>
          </div>
        </td>
      </tr>
    `;

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${apiBase}/api/produtos/estatisticas`, {
        headers
      });
      const raw = await response.text();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("A API de estatísticas não retornou JSON. Verifique se o servidor Node está ativo.");
      }

      if (!response.ok || !data.sucesso || !Array.isArray(data.produtos)) {
        throw new Error(data.mensagem || "Não foi possível carregar as estatísticas.");
      }

      produtosCarregados = data.produtos;

      // Atualiza KPIs
      const totalVisualizacoes = produtosCarregados.reduce((acc, p) => acc + (Number(p.visualizacoes) || 0), 0);
      const produtosVisualizados = produtosCarregados.filter(p => (Number(p.visualizacoes) || 0) > 0).length;
      const lider = produtosCarregados.find(p => (Number(p.visualizacoes) || 0) > 0) || null;
      const media = produtosCarregados.length > 0
        ? (totalVisualizacoes / produtosCarregados.length).toFixed(1).replace(".", ",")
        : "0";

      if (totalVisualizacoesEl) totalVisualizacoesEl.textContent = String(totalVisualizacoes);
      if (produtosVisualizadosEl) produtosVisualizadosEl.textContent = String(produtosVisualizados);
      
      if (produtoLiderEl) {
        produtoLiderEl.textContent = lider ? lider.nome : "-";
        produtoLiderEl.title = lider ? lider.nome : "";
      }

      if (produtoLiderSubEl) {
        if (lider && Number(lider.visualizacoes) > 0) {
          produtoLiderSubEl.textContent = `${lider.visualizacoes} acessos registrados`;
          produtoLiderSubEl.style.color = "#d97706";
          produtoLiderSubEl.style.fontWeight = "700";
        } else {
          produtoLiderSubEl.textContent = "Nenhum acesso registrado ainda";
          produtoLiderSubEl.style.color = "#94a3b8";
          produtoLiderSubEl.style.fontWeight = "500";
        }
      }

      if (mediaVisualizacoesEl) mediaVisualizacoesEl.textContent = media;

      // Renderiza tabela completa
      renderizarTabela(produtosCarregados);

    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-cell" style="color: #ef4444;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
            ${error.message || "Erro ao carregar estatísticas."}
          </td>
        </tr>
      `;
    }
  }

  // Filtro de busca em tempo real
  if (filtroInput) {
    filtroInput.addEventListener("input", () => {
      const termo = filtroInput.value.toLowerCase().trim();
      if (!termo) {
        renderizarTabela(produtosCarregados);
        return;
      }
      const filtrados = produtosCarregados.filter(p => {
        const nome = String(p.nome || "").toLowerCase();
        const cat = String(p.categoria || "").toLowerCase();
        const id = String(p.id || "");
        return nome.includes(termo) || cat.includes(termo) || id === termo;
      });
      renderizarTabela(filtrados);
    });
  }

  // Botão de recarregar
  if (btnRecarregar) {
    btnRecarregar.addEventListener("click", () => {
      carregarEstatisticas();
    });
  }

  // Carga inicial
  await carregarEstatisticas();
});
