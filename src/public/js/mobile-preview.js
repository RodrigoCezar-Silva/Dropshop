(function(){
  const deviceSelect = document.getElementById('mpDevice');
  const osSelect = document.getElementById('mpOs');
  const rotateBtn = document.getElementById('mpRotate');
  const frame = document.getElementById('mpFrame');
  const iframe = document.getElementById('mpIframe');
  const forceMobile = document.getElementById('mpForceMobile');
  const showAll = document.getElementById('mpShowAll');
  const multiContainer = document.getElementById('mpMultiContainer');
  const loadBtn = document.getElementById('mpLoad');
  const urlInput = document.getElementById('mpUrl');
  const showChrome = document.getElementById('mpShowChrome');
  const toggleThemeBtn = document.getElementById('mpToggleTheme');

  const THEME_KEY = 'mobilePreviewTheme'; // 'light' | 'dark'
  let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

  const presets = {
    // Phones
    iphone13: {name:'iPhone 13', w:390,h:844, type:'phone', os:'ios'},
    iphone14: {name:'iPhone 14', w:390,h:844, type:'phone', os:'ios'},
    iphone14pro: {name:'iPhone 14 Pro', w:393,h:852, type:'phone', os:'ios'},
    pixel5: {name:'Pixel 5', w:393,h:851, type:'phone', os:'android'},
    pixel7: {name:'Pixel 7', w:393,h:852, type:'phone', os:'android'},
    galaxyS9: {name:'Galaxy S9', w:360,h:740, type:'phone', os:'android'},
    galaxyS22: {name:'Galaxy S22', w:360,h:804, type:'phone', os:'android'},
    oneplus9: {name:'OnePlus 9', w:360,h:800, type:'phone', os:'android'},
    // Tablets
    ipad: {name:'iPad (9.7")', w:768,h:1024, type:'tablet', os:'ios'},
    ipadPro: {name:'iPad Pro', w:1024,h:1366, type:'tablet', os:'ios'},
    galaxyTabS7: {name:'Galaxy Tab S7', w:800,h:1280, type:'tablet', os:'android'},
    tabletLand: {name:'Tablet (landscape)', w:1024,h:768, type:'tablet', os:'android'}
  };

  const categories = { phone: 'Phones', tablet: 'Tablets' };
  const deviceInfo = document.getElementById('mpDeviceInfo');

  function applyPreset(key){
    const p = presets[key];
    frame.className = 'device ' + (osSelect.value === 'ios' ? 'ios ' : 'android ' ) + (p.type==='tablet' && key!=='tablet-land' ? 'portrait' : '') + (frame.classList.contains('landscape')? ' landscape':' portrait');
    frame.classList.remove(...Object.keys(presets).map(k=>k.replace(/\s+/g,'-')));
    frame.classList.add(key.replace(/\s+/g,'-'));
    // set iframe size via CSS height
    const wrap = frame.querySelector('.screen-wrap');
    wrap.style.width = p.w + 'px';
    wrap.style.height = p.h + 'px';
    // set iframe inner size
    iframe.style.width = p.w + 'px';
    iframe.style.height = p.h + 'px';
    // update info panel
    if(deviceInfo){
      deviceInfo.textContent = `${p.name} — ${p.w}×${p.h} (${categories[p.type] || p.type})`;
    }
  }

  function updateOs(){
    frame.classList.toggle('ios', osSelect.value==='ios');
    frame.classList.toggle('android', osSelect.value==='android');
  }

  deviceSelect.addEventListener('change', ()=>{
    applyPreset(deviceSelect.value);
    // force mobile class into iframe after reload
    setTimeout(()=>injectMobileClass(),300);
  });

  function populateDeviceSelect(){
    deviceSelect.innerHTML = '';
    const groups = {};
    Object.keys(presets).forEach(key=>{
      const p = presets[key];
      const cat = p.type || 'other';
      groups[cat] = groups[cat] || [];
      groups[cat].push({key,name:p.name,w:p.w,h:p.h});
    });
    Object.keys(categories).forEach(catKey=>{
      if(!groups[catKey]) return;
      const og = document.createElement('optgroup');
      og.label = categories[catKey];
      groups[catKey].forEach(item=>{
        const opt = document.createElement('option');
        opt.value = item.key;
        opt.textContent = `${item.name} (${item.w}×${item.h})`;
        og.appendChild(opt);
      });
      deviceSelect.appendChild(og);
    });
  }
  osSelect.addEventListener('change', ()=>{ updateOs(); });

  rotateBtn.addEventListener('click', ()=>{
    if(frame.classList.contains('portrait')){
      frame.classList.remove('portrait'); frame.classList.add('landscape');
      // swap width/height
      const w = iframe.offsetWidth, h = iframe.offsetHeight;
      iframe.style.width = h + 'px'; iframe.style.height = w + 'px';
      frame.querySelector('.screen-wrap').style.width = iframe.style.width; frame.querySelector('.screen-wrap').style.height = iframe.style.height;
    } else {
      frame.classList.remove('landscape'); frame.classList.add('portrait');
      const w = iframe.offsetWidth, h = iframe.offsetHeight;
      iframe.style.width = h + 'px'; iframe.style.height = w + 'px';
      frame.querySelector('.screen-wrap').style.width = iframe.style.width; frame.querySelector('.screen-wrap').style.height = iframe.style.height;
    }
    setTimeout(()=>injectMobileClass(),200);
  });

  function injectMobileClass(){
    try{
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if(!doc) return;
      if(forceMobile.checked) doc.body.classList.add('theme-mobile');
      else doc.body.classList.remove('theme-mobile');
      // apply preview theme into iframe when same-origin
      if(currentTheme === 'dark') doc.body.classList.add('theme-dark'); else doc.body.classList.remove('theme-dark');
    }catch(e){ /* ignore cross-origin if any */ }
  }

  iframe.addEventListener('load', injectMobileClass);

  loadBtn.addEventListener('click', ()=>{
    const url = (urlInput.value || '/html/index.html').trim();
    iframe.src = url;
  });

  showAll.addEventListener('change', ()=>{
    if(showAll.checked){
      // hide single and render all presets
      document.getElementById('mpSingleWrap').style.display = 'none';
      multiContainer.style.display = 'grid';
      renderAll(urlInput.value || '/html/index.html');
    } else {
      multiContainer.innerHTML = '';
      multiContainer.style.display = 'none';
      document.getElementById('mpSingleWrap').style.display = '';
    }
  });

  // Theme toggle handling (applies to preview page itself and propagates to iframes when possible)
  function applyThemeToPage(theme){
    document.body.classList.toggle('theme-dark', theme === 'dark');
    currentTheme = theme;
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
    // update button label
    if(toggleThemeBtn) toggleThemeBtn.textContent = theme === 'dark' ? 'Tema: Claro' : 'Tema: Escuro';
  }

  if(toggleThemeBtn){
    toggleThemeBtn.addEventListener('click', ()=>{
      const next = currentTheme === 'dark' ? 'light' : 'dark';
      applyThemeToPage(next);
      // try to propagate to already loaded iframes
      try{ injectMobileClass(); }catch(e){}
      // propagate to multi frames
      multiContainer.querySelectorAll('iframe').forEach(ifr=>{
        try{
          const doc = ifr.contentDocument || ifr.contentWindow.document;
          if(!doc) return;
          if(next === 'dark') doc.body.classList.add('theme-dark'); else doc.body.classList.remove('theme-dark');
        }catch(e){}
      });
    });
  }

  // apply saved theme on load
  applyThemeToPage(currentTheme);

  function renderAll(url){
    multiContainer.innerHTML = '';
    Object.keys(presets).forEach(key=>{
      const p = presets[key];
      const el = document.createElement('div');
      el.className = 'device ' + (p.type==='tablet' ? 'tablet' : 'phone') + ' portrait';
      el.innerHTML = `
        <div class="device-brand"></div>
        <div class="screen-wrap">
          <iframe src="${url}" frameborder="0" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
        </div>
        <div class="device-footer"></div>
        <div class="device-label">${key} — ${p.w}×${p.h}</div>
      `;
      // size adjustments
      const wrap = el.querySelector('.screen-wrap');
      const ifr = el.querySelector('iframe');
      wrap.style.width = p.w + 'px'; wrap.style.height = (p.h>800?640:p.h) + 'px';
      ifr.style.width = p.w + 'px'; ifr.style.height = (p.h>800?640:p.h) + 'px';
      // inject mobile class when loaded
      ifr.addEventListener('load', ()=>{
        try{
          const doc = ifr.contentDocument || ifr.contentWindow.document;
          if(doc){
            if(forceMobile.checked) doc.body.classList.add('theme-mobile'); else doc.body.classList.remove('theme-mobile');
            if(currentTheme === 'dark') doc.body.classList.add('theme-dark'); else doc.body.classList.remove('theme-dark');
          }
        }catch(e){}
      });
      multiContainer.appendChild(el);
    });
  }

  // initialize
  populateDeviceSelect();
  // set default selection
  deviceSelect.value = 'iphone13';
  updateOs(); applyPreset(deviceSelect.value);
})();
