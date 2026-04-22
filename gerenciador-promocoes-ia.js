// Script para gerar banners promocionais estilosos e chamativos com IA (Canvas)
document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('canvas-preview');
  const ctx = canvas.getContext('2d');
  const form = document.getElementById('form-promocao-ia');
  const btnGerar = document.getElementById('btn-gerar');
  const btnBaixar = document.getElementById('btn-baixar');
  const btnCopiar = document.getElementById('btn-copiar');
  const inputImagem = document.getElementById('imagem');

  function desenharBanner(estilo, titulo, produto, oferta, cta, descricao, imagem) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (estilo === 'neon') {
      // Fundo gradiente neon
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#ff2d92');
      grad.addColorStop(1, '#6a5cff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Efeito brilho
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, 180, 0, 2*Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    } else if (estilo === 'luxo') {
      // Fundo luxo
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#1a1a1a');
      grad.addColorStop(1, '#e0b973');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Clean
      ctx.fillStyle = '#f8f8fc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Imagem do produto
    if (imagem) {
      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.drawImage(imagem, canvas.width-220, canvas.height-220, 200, 200);
      ctx.restore();
    }
    // Título
    ctx.save();
    ctx.font = 'bold 2.1rem Inter, Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = estilo === 'luxo' ? '#e0b973' : '#fff';
    ctx.shadowColor = estilo === 'neon' ? '#fff' : 'transparent';
    ctx.shadowBlur = estilo === 'neon' ? 8 : 0;
    ctx.fillText(titulo, 36, 70);
    ctx.restore();
    // Produto
    ctx.save();
    ctx.font = 'bold 1.2rem Inter, Arial';
    ctx.fillStyle = estilo === 'luxo' ? '#fff' : '#ffe';
    ctx.fillText(produto, 36, 110);
    ctx.restore();
    // Oferta
    ctx.save();
    ctx.font = 'bold 2.2rem Inter, Arial';
    ctx.fillStyle = estilo === 'luxo' ? '#e0b973' : '#fff';
    ctx.shadowColor = estilo === 'neon' ? '#ff2d92' : 'transparent';
    ctx.shadowBlur = estilo === 'neon' ? 12 : 0;
    ctx.fillText(oferta, 36, 170);
    ctx.restore();
    // Descrição
    ctx.save();
    ctx.font = '1.05rem Inter, Arial';
    ctx.fillStyle = estilo === 'luxo' ? '#fff' : '#f8f8fc';
    ctx.globalAlpha = 0.92;
    ctx.fillText(descricao, 36, 210, 420);
    ctx.restore();
    // CTA
    ctx.save();
    ctx.font = 'bold 1.3rem Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = estilo === 'luxo' ? '#fff' : '#fff';
    ctx.shadowColor = estilo === 'neon' ? '#6a5cff' : 'transparent';
    ctx.shadowBlur = estilo === 'neon' ? 10 : 0;
    ctx.fillRect(canvas.width/2-120, 250, 240, 48);
    ctx.fillStyle = estilo === 'luxo' ? '#e0b973' : '#ff2d92';
    ctx.fillText(cta, canvas.width/2, 282);
    ctx.restore();
  }

  function gerarImagem() {
    const estilo = form.estilo.value;
    const titulo = form.titulo.value;
    const produto = form.produto.value;
    const oferta = form.oferta.value;
    const cta = form.cta.value;
    const descricao = form.descricao.value;
    const file = inputImagem.files[0];
    if (file) {
      const img = new window.Image();
      img.onload = () => desenharBanner(estilo, titulo, produto, oferta, cta, descricao, img);
      img.src = URL.createObjectURL(file);
    } else {
      desenharBanner(estilo, titulo, produto, oferta, cta, descricao, null);
    }
  }

  btnGerar.addEventListener('click', gerarImagem);

  btnBaixar.addEventListener('click', function () {
    const link = document.createElement('a');
    link.download = 'promo-ia.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  btnCopiar.addEventListener('click', function () {
    const legenda = `${form.titulo.value}\n${form.produto.value} - ${form.oferta.value}\n${form.cta.value}\n${form.descricao.value}`;
    navigator.clipboard.writeText(legenda);
    btnCopiar.textContent = 'Copiado!';
    setTimeout(() => btnCopiar.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar legenda', 1200);
  });

  // Geração inicial
  gerarImagem();
});
