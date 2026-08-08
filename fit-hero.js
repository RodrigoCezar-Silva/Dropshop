// fit-hero.js
// Diminui a fonte do título hero até caber em uma única linha (não usar ellipsis)
(function(){
  function adjustHeroTitle() {
    const h1 = document.querySelector('.hero-index h1');
    if (!h1) return;

    const container = h1.parentElement;
    const availableWidth = container.clientWidth;
    // pega tamanho inicial como limite máximo
    const style = window.getComputedStyle(h1);
    const initialSize = parseFloat(style.fontSize);
    let fontSize = initialSize;
    const minSize = 12; // px, ajuste se desejar menor

    // aplica nowrap forçado (CSS já aplica), garante medida atual
    h1.style.whiteSpace = 'nowrap';
    h1.style.display = 'block';

    // Se já cabe, garante retorno ao tamanho inicial
    if (h1.scrollWidth <= h1.clientWidth) {
      h1.style.fontSize = initialSize + 'px';
      return;
    }

    // reduzir gradualmente até caber ou atingir minSize
    while (h1.scrollWidth > h1.clientWidth && fontSize > minSize) {
      fontSize = Math.max(minSize, fontSize - 1);
      h1.style.fontSize = fontSize + 'px';
      // safety break to avoid infinite loops in odd cases
      if (fontSize <= minSize) break;
    }
  }

  // debounce helper
  function debounce(fn, delay){
    let t;
    return function(){
      clearTimeout(t);
      t = setTimeout(fn, delay);
    };
  }

  document.addEventListener('DOMContentLoaded', function(){
    adjustHeroTitle();
    window.addEventListener('resize', debounce(adjustHeroTitle, 120));
  });
})();
