/**
 * Carrosseis da pagina inicial.
 * Exibe produtos em destaque e produtos com frete gratis.
 */
document.addEventListener("DOMContentLoaded", () => {
  const produtos = JSON.parse(localStorage.getItem("loja")) || [];
  const carrosselDestaques = document.getElementById("carrosselVitrines");
  const carrosselFrete = document.getElementById("carrosselFreteGratis");

  async function registrarVisualizacaoProduto(id) {
    try {
      const chave = `produto_visualizado_${id}`;
      if (sessionStorage.getItem(chave)) return;

      const response = await fetch(`http://localhost:3000/api/produtos/${id}/visualizacao`, {
        method: "POST",
        keepalive: true
      });

      if (response.ok) {
        sessionStorage.setItem(chave, "1");
      }
    } catch (error) {
      console.error("Erro ao registrar visualizacao do produto:", error);
    }
  }

  function extrairPreco(valor) {
    if (typeof valor === "number") return valor;
    if (!valor) return 0;
    return parseFloat(String(valor).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  }

  function formatarPreco(valor) {
    return `R$ ${extrairPreco(valor).toFixed(2).replace(".", ",")}`;
  }

  function criarCard(produto) {
    const card = document.createElement("div");
    const precoAtualNum = extrairPreco(produto.precoAtual);
    const precoAntigoNum = extrairPreco(produto.precoAntigo);
    const temFreteGratis = precoAtualNum >= 100;

    card.classList.add("card-produto");
    card.dataset.id = produto.id;

    card.innerHTML = `
      ${produto.desconto ? `<div class="desconto">${produto.desconto}</div>` : ""}
      ${temFreteGratis ? '<div class="badge-frete-gratis"><span class="frete-icon">&#128666;</span><span class="frete-texto">Frete Gratis</span></div>' : ""}
      <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-principal">
      <h3>${produto.nome}</h3>
      ${precoAntigoNum > 0 ? `<span class="preco-antigo">${formatarPreco(produto.precoAntigo)}</span>` : ""}
      <span class="preco">${formatarPreco(produto.precoAtual)}</span>
      <div class="pagamento-info">
        <ul>${Array.isArray(produto.pagamento) ? produto.pagamento.map(p => `<li>${p}</li>`).join("") : ""}</ul>
      </div>
      <div class="botoes-produto">
        <button class="btn-detalhes">Ver Detalhes</button>
      </div>
    `;

    return card;
  }

  function configurarAnimacao(carrossel, quantidadeCards, durationVarName, speedPxPorSegundo) {
    const cardWidth = 280 + 28;
    const totalWidth = quantidadeCards * cardWidth;
    const containerWidth = carrossel.parentElement.clientWidth;
    const scrollDistance = Math.max(totalWidth - containerWidth + 80, 0);
    const duration = scrollDistance > 0 ? scrollDistance / speedPxPorSegundo : 18;

    carrossel.style.setProperty(durationVarName, `${duration}s`);
    carrossel.style.setProperty("--scroll-offset", `-${scrollDistance}px`);
  }

  function ligarCliqueDetalhes(carrossel) {
    carrossel.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("btn-detalhes")) return;
      const card = e.target.closest(".card-produto");
      if (!card?.dataset.id) return;
      await registrarVisualizacaoProduto(card.dataset.id);
      window.location.href = `produto.html?id=${card.dataset.id}`;
    });
  }

  if (carrosselDestaques) {
    const destaques = produtos
      .filter(produto => produto.desconto && String(produto.desconto).trim() !== "")
      .slice(0, 12);

    if (destaques.length > 0) {
      destaques.forEach(produto => carrosselDestaques.appendChild(criarCard(produto)));
      configurarAnimacao(carrosselDestaques, destaques.length, "--scroll-duration", 35);
      ligarCliqueDetalhes(carrosselDestaques);
    }
  }

  if (carrosselFrete) {
    const produtosFreteGratis = produtos
      .filter(produto => extrairPreco(produto.precoAtual) >= 100)
      .slice(0, 12);

    if (produtosFreteGratis.length > 0) {
      produtosFreteGratis.forEach(produto => carrosselFrete.appendChild(criarCard(produto)));
      configurarAnimacao(carrosselFrete, produtosFreteGratis.length, "--scroll-duration-frete", 30);
      ligarCliqueDetalhes(carrosselFrete);
    } else {
      const secaoFrete = carrosselFrete.closest(".carrossel-frete");
      if (secaoFrete) secaoFrete.style.display = "none";
    }
  }
});
