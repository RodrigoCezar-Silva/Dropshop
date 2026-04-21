// Exibe campos personalizados para cada forma de pagamento (integrado com PagBank)

(function() {
  const selectPagamento = document.getElementById('pagamento');
  const cartaoCampos = document.getElementById('cartaoCampos');

  function criarPixInfo() {
    const div = document.createElement('div');
    div.className = 'pagbank-info-preview';
    div.id = 'pixInfoPreview';
    div.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, #f0fdfa, #ecfdf5); border-radius: 12px; border: 2px solid #99f6e4; text-align: center;">
        <i class="fa-brands fa-pix" style="font-size: 2.5rem; color: #00b4a0; margin-bottom: 10px;"></i>
        <p style="font-weight: 700; color: #0f766e; margin: 0 0 6px;">Pagamento via PIX</p>
        <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Ao confirmar o pedido, o QR Code será gerado automaticamente via PagBank.</p>
      </div>
    `;
    return div;
  }

  function criarBoletoInfo() {
    const div = document.createElement('div');
    div.className = 'pagbank-info-preview';
    div.id = 'boletoInfoPreview';
    div.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px; border: 2px solid #fcd34d; text-align: center;">
        <i class="fa-solid fa-barcode" style="font-size: 2.5rem; color: #d97706; margin-bottom: 10px;"></i>
        <p style="font-weight: 700; color: #92400e; margin: 0 0 6px;">Pagamento via Boleto</p>
        <p style="font-size: 0.85rem; color: #64748b; margin: 0;">O boleto com vencimento em 3 dias será gerado ao confirmar o pedido.</p>
      </div>
    `;
    return div;
  }

  if (selectPagamento) {
    selectPagamento.addEventListener('change', function() {
      cartaoCampos.style.display = 'none';

      // Remove previews anteriores
      const prevPix = document.getElementById('pixInfoPreview');
      const prevBoleto = document.getElementById('boletoInfoPreview');
      if (prevPix) prevPix.remove();
      if (prevBoleto) prevBoleto.remove();

      // Remove resultado PagBank anterior ao trocar forma
      const resultado = document.getElementById('pagbankResultado');
      if (resultado) resultado.remove();

      const container = document.getElementById('secaoPagamento') || this.parentElement;
      const btnsNav = container.querySelector('.btns-navegacao');

      if (this.value === 'credito' || this.value === 'debito') {
        cartaoCampos.style.display = 'block';
      } else if (this.value === 'pix') {
        const el = criarPixInfo();
        if (btnsNav) container.insertBefore(el, btnsNav);
        else container.appendChild(el);
      } else if (this.value === 'boleto') {
        const el = criarBoletoInfo();
        if (btnsNav) container.insertBefore(el, btnsNav);
        else container.appendChild(el);
      }
    });
  }
})();
