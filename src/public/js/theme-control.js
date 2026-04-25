// Controlador público de tema: permite que botões externos alternem o tema
(function(){
  function getTheme(){
    try{ var t = localStorage.getItem('mixTema'); return t==='dark' ? 'dark' : 'light'; }catch(e){ return document.body.classList.contains('theme-dark') ? 'dark':'light'; }
  }
  function setTheme(next){
    try{ localStorage.setItem('mixTema', next); }catch(e){}
    if(next==='dark') document.body.classList.add('theme-dark'); else document.body.classList.remove('theme-dark');
    // atualizar switch (se existir) e disparar change
    var cb = document.getElementById('siteThemeCheckbox');
    if(cb){ cb.checked = next==='dark'; try{ cb.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} }
    // dispatch custom event para listeners externos
    try{ window.dispatchEvent(new CustomEvent('mix:themeChanged',{detail:{theme:next}})); }catch(e){}
  }
  function toggleTheme(){ var next = getTheme()==='dark' ? 'light' : 'dark'; setTheme(next); return next; }

  // init: expose API
  window.MixTheme = window.MixTheme || {};
  window.MixTheme.get = getTheme;
  window.MixTheme.set = setTheme;
  window.MixTheme.toggle = toggleTheme;

  // attach listeners to elements that request theme toggle
  function attachButtons(){
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-theme-toggle], #mpToggleTheme, .theme-button, .btn-tema'));
    els.forEach(function(el){
      if(el._mixThemeAttached) return; el._mixThemeAttached = true;
      el.addEventListener('click', function(e){
        e.preventDefault();
        var newTheme = toggleTheme();
        // atualizar label/text se for botão de controle (opcional)
        try{
          if(el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'){
            if(el.dataset && el.dataset.labelDark && el.dataset.labelLight){
              el.textContent = newTheme === 'dark' ? el.dataset.labelDark : el.dataset.labelLight;
            } else if(el.getAttribute('aria-pressed')!==null){
              el.setAttribute('aria-pressed', newTheme==='dark' ? 'true':'false');
            }
          }
        }catch(e){}
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    attachButtons();
    // observar mudanças no DOM e reanexar se novos botões forem inseridos
    try{
      var obs = new MutationObserver(function(){ attachButtons(); });
      obs.observe(document.body, { childList:true, subtree:true });
    }catch(e){}
  });
})();