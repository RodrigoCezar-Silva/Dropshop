// Interações do Hero - loja
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    // Anima entradas sutis
    const stats = document.querySelectorAll('.loja-hero__stat');
    stats.forEach((el, idx)=>{
      el.style.transform = 'translateY(8px)';
      el.style.opacity = '0';
      setTimeout(()=>{ el.style.transition='transform .5s cubic-bezier(.2,.9,.3,1), opacity .4s ease'; el.style.transform='translateY(0)'; el.style.opacity='1'; }, 80*idx);
      // click bounce
      el.addEventListener('click', ()=>{
        el.animate([{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:220});
      });
    });

    // Atualiza contador de produtos no hero caso exista um contador global
    const heroCount = document.getElementById('heroTotalProdutos');
    const globalCount = document.getElementById('contadorProdutos');
    if(heroCount){
      // tenta usar contadorProdutos (texto) ou atributo data
      let v = parseInt(heroCount.textContent||'0',10);
      if(globalCount && globalCount.textContent.trim().length){
        const g = parseInt(globalCount.textContent.replace(/[^0-9]/g,'')) || v;
        heroCount.textContent = g;
      } else if(heroCount.dataset && heroCount.dataset.init){
        heroCount.textContent = heroCount.dataset.init;
      } else {
        // anima incremento demo até valor real (se 0)
        let val = v;
        const target = Math.max(v, Math.floor(Math.random()*120 + 40));
        const iv = setInterval(()=>{
          val += Math.ceil((target - val)/6);
          heroCount.textContent = val;
          if(val>=target) clearInterval(iv);
        }, 360);
      }
    }
  });
})();