document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const tbody = document.getElementById("estatisticasProdutosBody");
  const totalVisualizacoesEl = document.getElementById("totalVisualizacoes");
  const produtosVisualizadosEl = document.getElementById("produtosVisualizados");
  const produtoLiderEl = document.getElementById("produtoLider");

  if (!token || !tbody) return;

  try {
    const response = await fetch("http://localhost:3000/api/produtos/estatisticas", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("A API de estatisticas nao retornou JSON. Reinicie o servidor Node e abra a pagina pelo backend.");
    }

    if (!response.ok || !data.sucesso || !Array.isArray(data.produtos)) {
      throw new Error(data.mensagem || "Nao foi possivel carregar as estatisticas.");
    }

    const produtos = data.produtos;
    const totalVisualizacoes = produtos.reduce((acc, produto) => acc + (produto.visualizacoes || 0), 0);
    const produtosVisualizados = produtos.filter(produto => (produto.visualizacoes || 0) > 0).length;
    const lider = produtos[0];

    if (totalVisualizacoesEl) totalVisualizacoesEl.textContent = String(totalVisualizacoes);
    if (produtosVisualizadosEl) produtosVisualizadosEl.textContent = String(produtosVisualizados);
    if (produtoLiderEl) produtoLiderEl.textContent = lider ? lider.nome : "-";

    if (!produtos.length) {
      tbody.innerHTML = `<tr><td colspan="5">Nenhum produto cadastrado ainda.</td></tr>`;
      return;
    }

    tbody.innerHTML = produtos.map(produto => `
      <tr>
        <td>
          <div class="admin-estatisticas-produto">
            <img src="${produto.imagem || "https://via.placeholder.com/80x80?text=Produto"}" alt="${produto.nome}">
            <div>
              <strong>${produto.nome}</strong>
              <span>ID ${produto.id}</span>
            </div>
          </div>
        </td>
        <td>${produto.categoria || "outros"}</td>
        <td>${produto.precoAtual || "-"}</td>
        <td><span class="admin-estatisticas-badge">${produto.visualizacoes || 0}</span></td>
        <td>${produto.dataCadastro || "-"}</td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Erro ao carregar estatisticas:", error);
    tbody.innerHTML = `<tr><td colspan="5">${error.message || "Erro ao carregar estatísticas."}</td></tr>`;
  }
});
