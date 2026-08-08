/**
 * Página do carrinho de compras — Layout de Cards.
 * Lista os produtos escolhidos, recalcula subtotal/frete/total e permite remover itens.
 */
document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaProdutosCards");
  const carrinhoVazio = document.getElementById("carrinhoVazio");
  const totalItensTexto = document.getElementById("totalItensTexto");
  const subtotalSpan = document.getElementById("resumoSubtotal");
  const freteValorSpan = document.getElementById("valorFrete");
  const freteTipoSpan = document.getElementById("tipoFreteSelecionado");
  const totalSpan = document.getElementById("resumoTotal");
  const cartCount = document.getElementById("cart-count");

  // tabela de fretes
  const tabelaFrete = { PAC: 25, SEDEX: 40, SEDEX10: 55 };

  function atualizarContadorCarrinho() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const totalItens = carrinho.reduce((acc, p) => acc + p.qtd, 0);
    if (cartCount) {
      cartCount.textContent = totalItens;
      cartCount.style.display = totalItens > 0 ? "inline-block" : "none";
    }
    if (totalItensTexto) {
      totalItensTexto.textContent = totalItens + (totalItens === 1 ? " item" : " itens");
    }
  }

  function atualizarResumo(subtotal) {
    const btnFinalizar = document.querySelector('.btn-finalizar');
    if (subtotal >= 100) {
      freteValorSpan.textContent = "Grátis";
      freteTipoSpan.textContent = "Frete Grátis";
      totalSpan.textContent = subtotal.toFixed(2).replace(".", ",");
      if (btnFinalizar) btnFinalizar.disabled = false;
    } else {
      let tipoFreteSelecionado = localStorage.getItem("tipoFreteSelecionado");
      let calculouFrete = localStorage.getItem("calculouFrete") === '1';
      let valorFrete = (tipoFreteSelecionado && calculouFrete) ? (tabelaFrete[tipoFreteSelecionado] || 0) : 0;
      if (tipoFreteSelecionado && calculouFrete && ["PAC","SEDEX","SEDEX10"].includes(tipoFreteSelecionado)) {
        freteValorSpan.textContent = valorFrete.toFixed(2).replace(".", ",");
        freteTipoSpan.textContent = tipoFreteSelecionado;
        totalSpan.textContent = (subtotal + valorFrete).toFixed(2).replace(".", ",");
        if (btnFinalizar) btnFinalizar.disabled = false;
      } else {
        freteValorSpan.textContent = "-";
        freteTipoSpan.textContent = "-";
        totalSpan.textContent = subtotal.toFixed(2).replace(".", ",");
        if (btnFinalizar) btnFinalizar.disabled = false;
      }
    }
  }

  function carregarCarrinho() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    if (!lista) return;
    lista.innerHTML = "";

    if (carrinho.length === 0) {
      lista.style.display = "none";
      if (carrinhoVazio) carrinhoVazio.style.display = "block";
      subtotalSpan.textContent = "0,00";
      freteValorSpan.textContent = "0,00";
      freteTipoSpan.textContent = "-";
      totalSpan.textContent = "0,00";
      const btnFinalizar = document.querySelector('.btn-finalizar');
      if (btnFinalizar) btnFinalizar.disabled = true;
      atualizarContadorCarrinho();
      return;
    }

    lista.style.display = "flex";
    if (carrinhoVazio) carrinhoVazio.style.display = "none";

    // calcula subtotal geral
    let subtotal = carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);

    // monta cada card
    carrinho.forEach((produto, index) => {
      const precoUnitario = parseFloat(produto.preco);
      const subtotalProduto = precoUnitario * produto.qtd;

      // frete inline
      let freteHtml = "";
      if (subtotal >= 100) {
        freteHtml = `<div class="card-frete"><span class="frete-gratis-inline"><i class="fa-solid fa-truck"></i> Frete Grátis</span></div>`;
      }

      const tamanhoHtml = produto.tamanho ? `<span class="tamanho-badge">Tam: ${produto.tamanho}</span>` : "";

      const card = document.createElement("div");
      card.className = "carrinho-card";
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${produto.imagem}" alt="${produto.nome}" />
        </div>
        <div class="card-info">
          <span class="card-nome">${produto.nome}</span>
          <span class="card-preco-unitario">R$ ${precoUnitario.toFixed(2).replace(".", ",")} / un</span>
          ${tamanhoHtml}
          ${freteHtml}
        </div>
        <div class="card-actions">
          <span class="card-subtotal">R$ ${subtotalProduto.toFixed(2).replace(".", ",")}</span>
          <div class="qty-control">
            <button class="qty-btn qty-menos" data-index="${index}">−</button>
            <input type="number" class="qty-value" value="${produto.qtd}" min="1" data-index="${index}" />
            <button class="qty-btn qty-mais" data-index="${index}">+</button>
          </div>
          <button class="btn-remover-card" data-index="${index}"><i class="fa-solid fa-trash-can"></i> Remover</button>
        </div>
      `;
      lista.appendChild(card);
    });

    // atualiza resumo
    subtotalSpan.textContent = subtotal.toFixed(2).replace(".", ",");
    atualizarResumo(subtotal);

    atualizarContadorCarrinho();
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    configurarEventos();
  }

  function recalcularTudo() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    let subtotal = carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);
    subtotalSpan.textContent = subtotal.toFixed(2).replace(".", ",");
    atualizarResumo(subtotal);
    atualizarContadorCarrinho();
    window.dispatchEvent(new StorageEvent('storage', { key: 'carrinho' }));
  }

  function configurarEventos() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    // remover produto
    document.querySelectorAll(".btn-remover-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = btn.getAttribute("data-index");
        carrinho.splice(index, 1);
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        carregarCarrinho();
      });
    });

    // botões − e +
    document.querySelectorAll(".qty-menos").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        if (carrinho[index].qtd > 1) {
          carrinho[index].qtd--;
          localStorage.setItem("carrinho", JSON.stringify(carrinho));
          // atualizar card in-place
          const card = btn.closest(".carrinho-card");
          card.querySelector(".qty-value").value = carrinho[index].qtd;
          const sub = parseFloat(carrinho[index].preco) * carrinho[index].qtd;
          card.querySelector(".card-subtotal").textContent = "R$ " + sub.toFixed(2).replace(".", ",");
          recalcularTudo();
        }
      });
    });

    document.querySelectorAll(".qty-mais").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        carrinho[index].qtd++;
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        const card = btn.closest(".carrinho-card");
        card.querySelector(".qty-value").value = carrinho[index].qtd;
        const sub = parseFloat(carrinho[index].preco) * carrinho[index].qtd;
        card.querySelector(".card-subtotal").textContent = "R$ " + sub.toFixed(2).replace(".", ",");
        recalcularTudo();
      });
    });

    // alterar quantidade pelo input direto
    document.querySelectorAll(".qty-value").forEach(input => {
      input.addEventListener("change", () => {
        const index = parseInt(input.getAttribute("data-index"));
        const novaQtd = parseInt(input.value);
        if (novaQtd > 0) {
          carrinho[index].qtd = novaQtd;
          localStorage.setItem("carrinho", JSON.stringify(carrinho));
          const card = input.closest(".carrinho-card");
          const sub = parseFloat(carrinho[index].preco) * carrinho[index].qtd;
          card.querySelector(".card-subtotal").textContent = "R$ " + sub.toFixed(2).replace(".", ",");
          recalcularTudo();
        } else {
          input.value = carrinho[index].qtd;
        }
      });
    });
  }

  carregarCarrinho();

  // botões continuar e finalizar
  const btnContinuar = document.querySelector(".btn-continuar");
  if (btnContinuar) {
    btnContinuar.addEventListener("click", () => {
      window.location.href = "loja.html";
    });
  }

  // O fluxo de finalizar compra agora é controlado por bloqueio-finalizar.js

  // Atualiza contador em todas as páginas
  atualizarContadorCarrinho();
});

