async function fetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Erro fetch', path, err);
    return null;
  }
}

function makeTable(items, columns, max=50) {
  if (!items || items.length === 0) return '<div class="empty">Nenhum registro</div>';
  const cols = columns;
  let html = '<table class="data-table"><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
  const rows = items.slice(0, max);
  for (const r of rows) {
    html += '<tr>' + cols.map(c => `<td>${(r[c]!==undefined && r[c]!==null)?String(r[c]):''}</td>`).join('') + '</tr>';
  }
  html += '</tbody></table>';
  if (items.length > max) html += `<div>Mostrando ${max} de ${items.length} registros</div>`;
  return html;
}

async function loadAll() {
  const produtos = await fetchJson('./data/produtos.json');
  const clientes = await fetchJson('./data/clientes.json');
  const pedidos = await fetchJson('./data/pedidos.json');

  const prodSummary = document.getElementById('produtosSummary');
  const cliSummary = document.getElementById('clientesSummary');
  const pedSummary = document.getElementById('pedidosSummary');

  prodSummary.textContent = produtos ? `${produtos.length} produtos` : 'Sem dados (verifique docs/data/produtos.json)';
  cliSummary.textContent = clientes ? `${clientes.length} clientes` : 'Sem dados (verifique docs/data/clientes.json)';
  pedSummary.textContent = pedidos ? `${pedidos.length} pedidos` : 'Sem dados (verifique docs/data/pedidos.json)';

  const produtosTable = document.getElementById('produtosTable');
  const clientesTable = document.getElementById('clientesTable');
  const pedidosTable = document.getElementById('pedidosTable');

  if (produtos) {
    const cols = Object.keys(produtos[0] || {}).slice(0,6);
    produtosTable.innerHTML = makeTable(produtos, cols);
  }
  if (clientes) {
    const cols = Object.keys(clientes[0] || {}).slice(0,6);
    clientesTable.innerHTML = makeTable(clientes, cols);
  }
  if (pedidos) {
    const cols = Object.keys(pedidos[0] || {}).slice(0,6);
    pedidosTable.innerHTML = makeTable(pedidos, cols);
  }
}

window.addEventListener('load', loadAll);
