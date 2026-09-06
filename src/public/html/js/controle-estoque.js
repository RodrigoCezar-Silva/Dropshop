window.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("estoque-pro-tbody");
  const contador = document.getElementById("estoque-pro-contador");
  const placeholderImagem = "https://via.placeholder.com/80x80?text=Sem+Imagem";

  if (!tbody) return;

  let produtos = [];

  const API_BASE = (() => {
    try {
      const host = location.hostname;
      const port = location.port;
      if (port && port !== "3000") return `${location.protocol}//${host}:3000`;
    } catch (error) {
      console.warn("Nao foi possivel detectar a base da API:", error);
    }
    return "";
  })();

  function apiUrl(path) {
    return `${API_BASE}${path}`;
  }

  function lerProdutosLocais() {
    const chaves = ["produtosLoja", "loja"];
    for (const chave of chaves) {
      try {
        const lista = JSON.parse(localStorage.getItem(chave) || "[]");
        if (Array.isArray(lista) && lista.length) return lista;
      } catch (error) {
        console.warn(`Nao foi possivel ler ${chave}:`, error);
      }
    }
    return [];
  }

  function sincronizarLocalStorage(lista) {
    localStorage.setItem("loja", JSON.stringify(lista));
    localStorage.setItem("produtosLoja", JSON.stringify(lista));
  }

  function escapeHtml(valor) {
    const div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
  }

  function formatarPreco(produto) {
    if (produto.precoAtual) {
      const texto = String(produto.precoAtual);
      return texto.trim().startsWith("R$") ? texto : `R$ ${texto}`;
    }
    if (typeof produto.preco === "number") {
      return `R$ ${produto.preco.toFixed(2).replace(".", ",")}`;
    }
    return "-";
  }

  function formatarData(produto) {
    const dataBruta = produto.dataCadastro || produto.dataPostagem || produto.data_cadastro;
    if (!dataBruta) return "-";

    const data = new Date(dataBruta);
    if (Number.isNaN(data.getTime())) return String(dataBruta);

    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function mostrarMensagem(mensagem, detalhe = "") {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="color:#64748b;text-align:center;padding:40px 0;font-size:1.2em;font-weight:600;background:linear-gradient(90deg,#e0e7ef 60%,#f1f5f9 100%);border-radius:12px;box-shadow:0 2px 12px #2563eb22;">
          <i class="fa-solid fa-box-open" style="font-size:2em;color:#2563eb;margin-bottom:8px;"></i><br>
          ${escapeHtml(mensagem)}
          ${detalhe ? `<br><span style="font-size:0.95em;font-weight:400;color:#94a3b8;">${escapeHtml(detalhe)}</span>` : ""}
        </td>
      </tr>
    `;
    if (contador) contador.textContent = "0";
  }

  function fadeIn(element) {
    element.style.opacity = 0;
    element.style.transition = "opacity 0.5s";
    requestAnimationFrame(() => {
      element.style.opacity = 1;
    });
  }

  function montarLinha(produto) {
    const tr = document.createElement("tr");
    tr.style.boxShadow = "0 2px 12px #2563eb11";
    tr.style.transition = "transform 0.18s, box-shadow 0.18s";
    tr.addEventListener("mouseenter", () => {
      tr.style.transform = "scale(1.012)";
      tr.style.boxShadow = "0 4px 24px #6366f133";
    });
    tr.addEventListener("mouseleave", () => {
      tr.style.transform = "";
      tr.style.boxShadow = "0 2px 12px #2563eb11";
    });

    tr.innerHTML = `
      <td><img class="estoque-pro-img" src="${escapeHtml(produto.imagem || produto.img || placeholderImagem)}" alt="${escapeHtml(produto.nome || "Produto")}" style="border:2.5px solid #6366f1;box-shadow:0 2px 8px #6366f122;"></td>
      <td style="font-weight:700;color:#232a4d;letter-spacing:-0.5px;">${escapeHtml(produto.nome || "Produto sem nome")}</td>
      <td style="color:#2563eb;font-size:1.13em;font-weight:700;">${escapeHtml(formatarPreco(produto))}</td>
      <td><input type="number" class="estoque-pro-qtd" value="${Number(produto.quantidade) || 1}" readonly style="background:#e0e7ef;font-weight:600;"></td>
      <td><span style="background:#6366f120;color:#334155;font-weight:600;padding:6px 14px;border-radius:8px;">${escapeHtml(formatarData(produto))}</span></td>
      <td class="estoque-pro-data-acoes">
        <a href="/html/produto.html?id=${encodeURIComponent(produto.id)}" class="estoque-pro-btn" target="_blank" style="background:linear-gradient(90deg,#2563eb 60%,#6366f1 100%);font-weight:700;box-shadow:0 2px 8px #2563eb22;">Ver Produto</a>
        <button class="estoque-pro-btn estoque-pro-remover" data-id="${escapeHtml(produto.id)}" style="background:linear-gradient(90deg,#ef4444 60%,#f87171 100%);font-weight:700;box-shadow:0 2px 8px #ef444422;">Remover</button>
      </td>
    `;

    tr.querySelector(".estoque-pro-remover").addEventListener("click", () => removerProduto(produto.id, tr));
    return tr;
  }

  function renderizar(lista) {
    produtos = Array.isArray(lista) ? lista : [];

    if (contador) contador.textContent = String(produtos.length);
    if (!produtos.length) {
      mostrarMensagem("Nenhum produto cadastrado no estoque.", "Adicione produtos para comecar a gerenciar seu estoque!");
      return;
    }

    tbody.innerHTML = "";
    produtos.forEach(produto => {
      const tr = montarLinha(produto);
      tbody.appendChild(tr);
      fadeIn(tr);
    });
  }

  async function carregarProdutos() {
    mostrarMensagem("Carregando produtos cadastrados...");

    try {
      const response = await fetch(apiUrl("/api/produtos"));
      const data = await response.json();

      if (!response.ok || !data.sucesso || !Array.isArray(data.produtos)) {
        throw new Error(data.mensagem || "Nao foi possivel carregar os produtos do banco.");
      }

      sincronizarLocalStorage(data.produtos);
      renderizar(data.produtos);
    } catch (error) {
      console.error("Erro ao carregar produtos do banco:", error);
      const produtosLocais = lerProdutosLocais();
      renderizar(produtosLocais);

      if (!produtosLocais.length) {
        mostrarMensagem("Nao foi possivel carregar os produtos.", "Verifique se o servidor Node esta rodando e conectado ao banco de dados.");
      }
    }
  }

  async function removerProduto(id, tr) {
    if (!confirm("Tem certeza que deseja remover este produto do estoque?")) return;

    const token = localStorage.getItem("token");
    const produtoRemovido = produtos.find(produto => String(produto.id) === String(id));
    const listaAnterior = [...produtos];
    const listaAtualizada = produtos.filter(produto => String(produto.id) !== String(id));

    tr.style.transition = "opacity 0.5s, transform 0.5s";
    tr.style.opacity = 0;
    tr.style.transform = "scale(0.97)";

    try {
      if (token) {
        const response = await fetch(apiUrl(`/api/produtos/${encodeURIComponent(id)}`), {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.sucesso) {
          throw new Error(data.mensagem || "Nao foi possivel remover o produto do banco.");
        }
      } else {
        alert("Produto removido apenas desta tela. Para remover do banco, faca login como administrador.");
      }

      sincronizarLocalStorage(listaAtualizada);
      setTimeout(() => renderizar(listaAtualizada), 480);
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      alert(error.message || "Nao foi possivel remover o produto.");
      renderizar(listaAnterior);
      if (produtoRemovido) sincronizarLocalStorage(listaAnterior);
    }
  }

  carregarProdutos();
});
