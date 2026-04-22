document.getElementById("formaPagamento").addEventListener("change", function() {
  const campos = document.getElementById("pagamentoCampos");
  campos.innerHTML = "";
  campos.classList.remove("active");

  if (this.value === "credito" || this.value === "debito") {
    campos.innerHTML = `
      <h3>💳 Dados do Cartão</h3>
      <div class="form-group">
        <label for="numeroCartao">Número do Cartão</label>
        <input type="text" id="numeroCartao" placeholder="0000 0000 0000 0000" required>
      </div>
      <div class="form-group">
        <label for="validade">Validade</label>
        <input type="text" id="validade" placeholder="MM/AA" required>
      </div>
      <div class="form-group">
        <label for="cvv">CVV</label>
        <input type="text" id="cvv" placeholder="123" required>
      </div>
      <div class="form-group">
        <label for="bandeira">Bandeira</label>
        <select id="bandeira" required>
          <option value="">Selecione...</option>
          <option value="visa">Visa</option>
          <option value="mastercard">MasterCard</option>
          <option value="elo">Elo</option>
          <option value="amex">American Express</option>
        </select>
      </div>
    `;
    campos.classList.add("active");

  } else if (this.value === "pix") {
    campos.innerHTML = `
      <h3>🔑 Pagamento via PIX</h3>
      <p>Escaneie o QR Code ou copie a chave PIX abaixo:</p>
      <div class="form-group">
        <img src="img/qrcode-pix.png" alt="QR Code PIX" style="max-width:200px; margin:10px auto; display:block;">
      </div>
      <div class="form-group">
        <input type="text" value="contato@mixpromocao.com" readonly>
        <button type="button" onclick="navigator.clipboard.writeText('contato@mixpromocao.com')">Copiar Chave PIX</button>
      </div>
    `;
    campos.classList.add("active");

  } else if (this.value === "boleto") {
    campos.innerHTML = `
      <h3>📄 Pagamento via Boleto</h3>
      <p>O boleto será gerado após a confirmação do pedido.</p>
      <div class="form-group">
        <input type="text" value="Código do Boleto: 1234.5678.9012.3456" readonly>
        <button type="button" onclick="navigator.clipboard.writeText('1234.5678.9012.3456')">Copiar Código do Boleto</button>
      </div>
    `;
    campos.classList.add("active");
  }
});