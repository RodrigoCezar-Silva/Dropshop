async function loadProdutos() {
  try {
    const res = await fetch('./data/produtos.json');
    if (!res.ok) return;
    const produtos = await res.json();
    const container = document.getElementById('carrosselVitrines') || document.body;
    container.innerHTML = '';
    const max = Math.min(produtos.length, 12);
    for (let i = 0; i < max; i++) {
      const p = produtos[i];
      const nome = p.titulo || p.nome || p.nome_produto || p.title || 'Produto';
      const preco = p.preco_venda || p.preco || p.precoFinal || p.price || '';
      const img = p.foto || p.imagem || p.url_imagem || p.image || '';

      const card = document.createElement('div');
      card.className = 'card-produto';
      card.innerHTML = `
        <div class="card-img"><img src="${img || './images/placeholder.png'}" alt="${nome}"></div>
        <div class="card-body">
          <h3 class="card-title">${nome}</h3>
          <div class="card-price">${preco ? 'R$ ' + preco : ''}</div>
        </div>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    console.error('Erro carregando produtos:', err);
  }
}

// Run on load
window.addEventListener('load', () => {
  loadProdutos();
});
