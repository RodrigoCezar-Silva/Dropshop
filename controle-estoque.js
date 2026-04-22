
// Controle de Estoque Moderno e Chamativo
window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('estoque-pro-tbody');
  const produtos = JSON.parse(localStorage.getItem('produtosLoja') || '[]');
  const contador = document.getElementById('estoque-pro-contador');

  // Função para animação de fade-in
  function fadeIn(element) {
    element.style.opacity = 0;
    element.style.transition = 'opacity 0.5s';
    requestAnimationFrame(() => {
      element.style.opacity = 1;
    });
  }

  // Mensagem estilosa se não houver produtos
  if (!produtos.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#64748b;text-align:center;padding:40px 0;font-size:1.2em;font-weight:600;background:linear-gradient(90deg,#e0e7ef 60%,#f1f5f9 100%);border-radius:12px;box-shadow:0 2px 12px #2563eb22;"><i class='fa-solid fa-box-open' style='font-size:2em;color:#2563eb;margin-bottom:8px;'></i><br>Nenhum produto cadastrado no estoque.<br><span style='font-size:0.95em;font-weight:400;color:#94a3b8;'>Adicione produtos para começar a gerenciar seu estoque!</span></td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  if (contador) contador.textContent = produtos.length;

  produtos.forEach(produto => {
    const tr = document.createElement('tr');
    tr.style.boxShadow = '0 2px 12px #2563eb11';
    tr.style.transition = 'transform 0.18s, box-shadow 0.18s';
    tr.addEventListener('mouseenter', () => {
      tr.style.transform = 'scale(1.012)';
      tr.style.boxShadow = '0 4px 24px #6366f133';
    });
    tr.addEventListener('mouseleave', () => {
      tr.style.transform = '';
      tr.style.boxShadow = '0 2px 12px #2563eb11';
    });

    // Data formatada
    let dataFormatada = '-';
    const dataBruta = produto.dataCadastro || produto.dataPostagem;
    if (dataBruta) {
      const d = new Date(dataBruta);
      if (!isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        dataFormatada = `${dia}/${mes}/${ano} ${hora}:${min}`;
      } else {
        dataFormatada = dataBruta;
      }
    }

    tr.innerHTML = `
      <td><img class="estoque-pro-img" src="${produto.imagem || produto.img || 'https://via.placeholder.com/80x80?text=Sem+Imagem'}" alt="${produto.nome}" style="border:2.5px solid #6366f1;box-shadow:0 2px 8px #6366f122;"></td>
      <td style="font-weight:700;color:#232a4d;letter-spacing:-0.5px;">${produto.nome}</td>
      <td style="color:#2563eb;font-size:1.13em;font-weight:700;">R$ ${produto.precoAtual ? produto.precoAtual : (produto.preco ? produto.preco.toFixed(2) : '-')}</td>
      <td><input type="number" class="estoque-pro-qtd" value="${produto.quantidade || 1}" readonly style="background:#e0e7ef;font-weight:600;"></td>
      <td><span style="background:#6366f120;color:#334155;font-weight:600;padding:6px 14px;border-radius:8px;">${dataFormatada}</span></td>
      <td class="estoque-pro-data-acoes">
        <a href="./html/produto.html?id=${produto.id}" class="estoque-pro-btn" target="_blank" style="background:linear-gradient(90deg,#2563eb 60%,#6366f1 100%);font-weight:700;box-shadow:0 2px 8px #2563eb22;">Ver Produto</a>
        <button class="estoque-pro-btn estoque-pro-remover" data-id="${produto.id}" style="background:linear-gradient(90deg,#ef4444 60%,#f87171 100%);font-weight:700;box-shadow:0 2px 8px #ef444422;">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
    fadeIn(tr);
  });

  // Feedback visual ao remover
  tbody.querySelectorAll('.estoque-pro-remover').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const tr = this.closest('tr');
      if (confirm('Tem certeza que deseja remover este produto do estoque?')) {
        tr.style.transition = 'opacity 0.5s, transform 0.5s';
        tr.style.opacity = 0;
        tr.style.transform = 'scale(0.97)';
        setTimeout(() => {
          let produtos = JSON.parse(localStorage.getItem('produtosLoja') || '[]');
          produtos = produtos.filter(p => String(p.id) !== String(id));
          localStorage.setItem('produtosLoja', JSON.stringify(produtos));
          let loja = JSON.parse(localStorage.getItem('loja') || '[]');
          loja = loja.filter(p => String(p.id) !== String(id));
          localStorage.setItem('loja', JSON.stringify(loja));
          tr.remove();
          if (contador) contador.textContent = produtos.length;
          if (produtos.length === 0) {
            tbody.innerHTML = `<tr><td colspan=\"6\" style=\"color:#64748b;text-align:center;padding:40px 0;font-size:1.2em;font-weight:600;background:linear-gradient(90deg,#e0e7ef 60%,#f1f5f9 100%);border-radius:12px;box-shadow:0 2px 12px #2563eb22;\"><i class='fa-solid fa-box-open' style='font-size:2em;color:#2563eb;margin-bottom:8px;'></i><br>Nenhum produto cadastrado no estoque.<br><span style='font-size:0.95em;font-weight:400;color:#94a3b8;'>Adicione produtos para começar a gerenciar seu estoque!</span></td></tr>`;
          }
        }, 480);
      }
    });
  });
});
