document.addEventListener('DOMContentLoaded', function(){
  const fileInput = document.getElementById('fileInput');
  const useDefault = document.getElementById('useDefault');
  const srcImg = document.getElementById('sourceImg');
  const exportBtn = document.getElementById('exportBtn');
  const wrapper = document.getElementById('avatarWrapper');
  const canvas = document.getElementById('exportCanvas');

  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(ev){ srcImg.src = ev.target.result; };
    reader.readAsDataURL(f);
  });

  useDefault.addEventListener('click', ()=>{
    // tries to load docs/img/atendente.jpg
    srcImg.src = './img/atendente.jpg';
  });

  // Export composite: draw image then overlays onto canvas
  exportBtn.addEventListener('click', ()=>{
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    // draw the photo
    const img = srcImg;
    // Wait until image is loaded
    if(!img.complete){
      img.onload = () => drawComposite(ctx,img,w,h);
    } else {
      drawComposite(ctx,img,w,h);
    }
  });

  function drawComposite(ctx,img,w,h){
    // background white
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
    // draw image with cover fit
    const ratio = Math.max(w/img.naturalWidth, h/img.naturalHeight);
    const iw = img.naturalWidth * ratio;
    const ih = img.naturalHeight * ratio;
    const ix = (w - iw)/2;
    const iy = (h - ih)/2;
    try{ ctx.drawImage(img, ix, iy, iw, ih); } catch(e){ console.error(e); }

    // Cap overlay (approx)
    const capW = w * 0.61; const capH = h * 0.13;
    const capX = (w - capW)/2; const capY = h * 0.06;
    // red rounded cap
    roundRect(ctx, capX, capY, capW, capH, capH*0.45, '#e31b23');
    // cap text
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(capH*0.36)}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('MixPromoção', capX + capW/2, capY + capH*0.53);

    // badge
    const bX = w * 0.08; const bY = h * 0.75; const bW = w * 0.22; const bH = h * 0.09;
    roundRect(ctx, bX, bY, bW, bH, 6, '#ffffff');
    ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=2; ctx.strokeRect(bX, bY, bW, bH);
    ctx.fillStyle='#e31b23'; ctx.font=`bold ${Math.round(bH*0.42)}px Arial`; ctx.textAlign='left'; ctx.fillText('Atendente', bX+8, bY + bH*0.56);

    // polo (rectangle at bottom)
    const poloH = h * 0.34; ctx.fillStyle='#e31b23'; ctx.fillRect(0, h - poloH, w, poloH);

    // offer download
    const link = document.createElement('a');
    link.download = 'atendente_mixpromocao.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function roundRect(ctx, x, y, width, height, radius, fillStyle){
    ctx.beginPath();
    ctx.moveTo(x+radius, y);
    ctx.arcTo(x+width, y, x+width, y+height, radius);
    ctx.arcTo(x+width, y+height, x, y+height, radius);
    ctx.arcTo(x, y+height, x, y, radius);
    ctx.arcTo(x, y, x+width, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillStyle; ctx.fill();
  }
});
