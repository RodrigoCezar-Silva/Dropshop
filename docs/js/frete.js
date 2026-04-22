/**
 * Cálculo de frete do carrinho/checkout.
 * Atualiza subtotal, opções de envio e total final com base no CEP e na região.
 */
document.addEventListener("DOMContentLoaded", () => {

  // Tabela de frete por região (primeiro dígito do CEP)
  function getTabelaFretePorRegiao(digito) {
    const regioes = {
      "0": { nome: "São Paulo (Capital/Grande SP)", PAC: 18.90, SEDEX: 32.90, SEDEX10: 48.90, pacDias: "3 a 5", sedexDias: "1 a 2", sedex10Dias: "1" },
      "1": { nome: "São Paulo (Interior)", PAC: 20.90, SEDEX: 35.90, SEDEX10: 50.90, pacDias: "3 a 6", sedexDias: "1 a 3", sedex10Dias: "1" },
      "2": { nome: "Rio de Janeiro / Espírito Santo", PAC: 22.90, SEDEX: 38.90, SEDEX10: 54.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "3": { nome: "Minas Gerais", PAC: 23.90, SEDEX: 39.90, SEDEX10: 55.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "4": { nome: "Bahia / Sergipe", PAC: 28.90, SEDEX: 45.90, SEDEX10: 62.90, pacDias: "5 a 9", sedexDias: "2 a 4", sedex10Dias: "1 a 2" },
      "5": { nome: "Pernambuco / Alagoas / Paraíba / RN", PAC: 30.90, SEDEX: 48.90, SEDEX10: 65.90, pacDias: "6 a 10", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "6": { nome: "Ceará / Piauí / Maranhão / Norte", PAC: 34.90, SEDEX: 52.90, SEDEX10: 72.90, pacDias: "7 a 12", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "7": { nome: "Centro-Oeste / Norte", PAC: 32.90, SEDEX: 50.90, SEDEX10: 68.90, pacDias: "6 a 10", sedexDias: "3 a 5", sedex10Dias: "2 a 3" },
      "8": { nome: "Paraná / Santa Catarina", PAC: 24.90, SEDEX: 40.90, SEDEX10: 56.90, pacDias: "4 a 7", sedexDias: "2 a 3", sedex10Dias: "1 a 2" },
      "9": { nome: "Rio Grande do Sul", PAC: 26.90, SEDEX: 42.90, SEDEX10: 58.90, pacDias: "5 a 8", sedexDias: "2 a 4", sedex10Dias: "1 a 2" }
    };
    return regioes[digito] || regioes["0"];
  }

  const btnCalcularFrete = document.getElementById("btnCalcularFrete");
  const resultadoFrete = document.getElementById("resultadoFrete");
  const resumoSubtotal = document.getElementById("resumoSubtotal");
  const valorFreteEl = document.getElementById("valorFrete");
  const tipoFreteEl = document.getElementById("tipoFreteSelecionado");
  const resumoTotal = document.getElementById("resumoTotal");
  const cepInput = document.getElementById("cep");

  const formatarValor = valor => (valor ? valor.toFixed(2).replace(".", ",") : "0,00");

  function getSubtotal() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * p.qtd), 0);
  }
  let subtotal = getSubtotal();

  if (resumoSubtotal) resumoSubtotal.textContent = formatarValor(subtotal);
  if (valorFreteEl) valorFreteEl.textContent = "-";
  if (tipoFreteEl) tipoFreteEl.textContent = "-";
  if (resumoTotal) resumoTotal.textContent = formatarValor(subtotal);

  // Esconde campos de CEP/frete se subtotal >= 100
  function atualizarVisibilidadeFrete() {
    subtotal = getSubtotal();
    if (resumoSubtotal) resumoSubtotal.textContent = formatarValor(subtotal);
    const linhaCep = document.getElementById('cep')?.closest('.linha-resumo');
    const btnFrete = document.getElementById('btnCalcularFrete')?.closest('.linha-resumo');
    let frete = 0;
    if (subtotal >= 100) {
      if (linhaCep) linhaCep.style.display = 'none';
      if (btnFrete) btnFrete.style.display = 'none';
      if (resultadoFrete) resultadoFrete.innerHTML = `<div class="frete-gratis" style="font-size:1.2em;padding:18px 0;margin:12px 0;background:linear-gradient(90deg,#e0ffe6,#b2f2d7);color:#219150;border:2px solid #43e97b;box-shadow:0 2px 12px #43e97b33;">🚚 Frete Grátis para compras acima de R$ 100,00!</div>`;
      if (valorFreteEl) valorFreteEl.textContent = "Grátis";
      if (tipoFreteEl) tipoFreteEl.textContent = "Frete Grátis";
      if (resumoTotal) resumoTotal.textContent = formatarValor(subtotal);
    } else {
      if (linhaCep) linhaCep.style.display = '';
      if (btnFrete) btnFrete.style.display = '';
      if (resultadoFrete) resultadoFrete.innerHTML = '';
      let tipoFreteSalvo = localStorage.getItem('tipoFreteSelecionado');
      if (["PAC","SEDEX","SEDEX10"].includes(tipoFreteSalvo)) {
        const calculouFrete = localStorage.getItem('calculouFrete') === '1';
        if (calculouFrete) {
          // Recuperar valor do frete salvo no localStorage (calculado por região)
          frete = parseFloat(localStorage.getItem('valorFreteSelecionado')) || 0;
          if (valorFreteEl) valorFreteEl.textContent = formatarValor(frete);
          if (tipoFreteEl) tipoFreteEl.textContent = tipoFreteSalvo;
          if (resumoTotal) resumoTotal.textContent = formatarValor(subtotal + frete);
        } else {
          if (valorFreteEl) valorFreteEl.textContent = "-";
          if (tipoFreteEl) tipoFreteEl.textContent = "-";
          if (resumoTotal) resumoTotal.textContent = formatarValor(subtotal);
        }
      } else {
        if (valorFreteEl) valorFreteEl.textContent = "-";
        if (tipoFreteEl) tipoFreteEl.textContent = "-";
        if (resumoTotal) resumoTotal.textContent = formatarValor(subtotal);
      }
    }
  }
  atualizarVisibilidadeFrete();

  // Atualiza automaticamente ao adicionar/remover produtos
  window.addEventListener('storage', function(e) {
    if (e.key === 'carrinho') {
      atualizarVisibilidadeFrete();
    }
  });

  if (btnCalcularFrete && cepInput && resultadoFrete) {
    btnCalcularFrete.addEventListener("click", () => {
      subtotal = getSubtotal();
      if (subtotal >= 100) {
        atualizarVisibilidadeFrete();
        return;
      }
      const cep = cepInput.value.trim();
      if (!cep || !/^\d{8}$/.test(cep)) {
        alert("Digite um CEP válido (apenas números, 8 dígitos).");
        return;
      }

      // Mostrar loading
      resultadoFrete.innerHTML = `<p style="text-align:center;padding:12px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Consultando CEP...</p>`;
      btnCalcularFrete.disabled = true;

      // Consultar ViaCEP para validar e obter localidade
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r => r.json())
        .then(dados => {
          btnCalcularFrete.disabled = false;

          if (dados.erro) {
            resultadoFrete.innerHTML = `<p style="color:#dc2626;font-weight:600;padding:10px;">❌ CEP não encontrado. Verifique e tente novamente.</p>`;
            return;
          }

          const cidade = dados.localidade || "";
          const estado = dados.uf || "";
          const digito = cep.charAt(0);
          const tabelaFrete = getTabelaFretePorRegiao(digito);

          // Salvar região no localStorage
          localStorage.setItem("freteCep", cep);
          localStorage.setItem("freteRegiao", tabelaFrete.nome);

          resultadoFrete.innerHTML = `
            <div class="frete-regiao-info">
              <span class="frete-local">📍 ${cidade} - ${estado}</span>
              <span class="frete-regiao-nome">${tabelaFrete.nome}</span>
            </div>
            <p style="font-weight:bold;margin:10px 0 6px;">Escolha o tipo de frete:</p>
            <div class="frete-opcao" data-valor="${tabelaFrete.PAC}">
              <input type="radio" name="fretePedido" value="PAC" id="fretePac">
              <label for="fretePac">
                <span class="frete-opcao-nome">📦 PAC</span>
                <span class="frete-opcao-preco">R$ ${formatarValor(tabelaFrete.PAC)}</span>
                <span class="frete-opcao-prazo">🕐 ${tabelaFrete.pacDias} dias úteis</span>
              </label>
            </div>
            <div class="frete-opcao" data-valor="${tabelaFrete.SEDEX}">
              <input type="radio" name="fretePedido" value="SEDEX" id="freteSedex">
              <label for="freteSedex">
                <span class="frete-opcao-nome">🚀 SEDEX</span>
                <span class="frete-opcao-preco">R$ ${formatarValor(tabelaFrete.SEDEX)}</span>
                <span class="frete-opcao-prazo">🕐 ${tabelaFrete.sedexDias} dias úteis</span>
              </label>
            </div>
            <div class="frete-opcao" data-valor="${tabelaFrete.SEDEX10}">
              <input type="radio" name="fretePedido" value="SEDEX10" id="freteSedex10">
              <label for="freteSedex10">
                <span class="frete-opcao-nome">⚡ SEDEX 10</span>
                <span class="frete-opcao-preco">R$ ${formatarValor(tabelaFrete.SEDEX10)}</span>
                <span class="frete-opcao-prazo">🕐 ${tabelaFrete.sedex10Dias} dia(s) útil(eis)</span>
              </label>
            </div>
          `;

          // Eventos nos radios
          document.querySelectorAll("input[name='fretePedido']").forEach(radio => {
            radio.addEventListener("change", () => {
              const tipoFrete = radio.value;
              const valorFrete = tabelaFrete[tipoFrete];
              localStorage.setItem("tipoFreteSelecionado", tipoFrete);
              localStorage.setItem("valorFreteSelecionado", valorFrete.toString());
              localStorage.setItem("calculouFrete", "1");
              valorFreteEl.textContent = formatarValor(valorFrete);
              tipoFreteEl.textContent = tipoFrete;
              resumoTotal.textContent = formatarValor(getSubtotal() + valorFrete);

              // Destacar opção selecionada
              document.querySelectorAll(".frete-opcao").forEach(op => op.classList.remove("frete-opcao-ativa"));
              radio.closest(".frete-opcao").classList.add("frete-opcao-ativa");

              // Atualiza coluna de frete no carrinho
              const cor = tipoFrete === 'PAC' ? '#1976d2' : tipoFrete === 'SEDEX' ? '#43a047' : '#fbc02d';
              const freteHtml = `<span class='frete-escolhido' style='font-weight:bold;color:${cor};background:#f8f9fa;border:1.5px solid ${cor};border-radius:6px;padding:4px 10px;display:inline-block;'>${tipoFrete} - R$ ${formatarValor(valorFrete)}</span>`;
              document.querySelectorAll('.carrinho-tabela tr').forEach(tr => {
                const tdFrete = tr.querySelectorAll('td')[4];
                if (tdFrete) tdFrete.innerHTML = freteHtml;
              });
            });
          });
        })
        .catch(() => {
          btnCalcularFrete.disabled = false;
          resultadoFrete.innerHTML = `<p style="color:#dc2626;font-weight:600;padding:10px;">⚠️ Erro ao consultar o CEP. Tente novamente.</p>`;
        });
    });
  }
});

