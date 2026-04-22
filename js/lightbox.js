(function(){
  'use strict';

  function closeLightbox() {
    const ov = document.getElementById('lightboxOverlay');
    if (ov) ov.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  function openLightboxForImage(src, alt) {
    closeLightbox();
    const ov = document.createElement('div');
    ov.id = 'lightboxOverlay';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');

    const cont = document.createElement('div');
    cont.id = 'lightboxContent';

    const img = document.createElement('img');
    img.src = src || '';
    if (alt) img.alt = alt;
    cont.appendChild(img);

    const btn = document.createElement('button');
    btn.id = 'lightboxClose';
    btn.innerHTML = '✕';
    btn.addEventListener('click', closeLightbox);
    cont.appendChild(btn);

    ov.appendChild(cont);
    ov.addEventListener('click', function(e){ if (e.target === ov) closeLightbox(); });
    document.body.appendChild(ov);
    document.addEventListener('keydown', onKeyDown);
  }

  function openLightboxForVideo(src) {
    closeLightbox();
    const ov = document.createElement('div');
    ov.id = 'lightboxOverlay';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');

    const cont = document.createElement('div');
    cont.id = 'lightboxContent';

    const video = document.createElement('video');
    video.src = src || '';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';
    cont.appendChild(video);

    const btn = document.createElement('button');
    btn.id = 'lightboxClose';
    btn.innerHTML = '✕';
    btn.addEventListener('click', closeLightbox);
    cont.appendChild(btn);

    ov.appendChild(cont);
    ov.addEventListener('click', function(e){ if (e.target === ov) closeLightbox(); });
    document.body.appendChild(ov);
    document.addEventListener('keydown', onKeyDown);
  }

  // Delegation: click on elements with class 'reclamacao-thumb' or 'modal-thumb' (image or video)
  document.addEventListener('click', function(e){
    const tgt = e.target;
    if (!tgt) return;
    const isThumb = tgt.classList && (tgt.classList.contains('reclamacao-thumb') || tgt.classList.contains('modal-thumb'));
    if (isThumb) {
      e.preventDefault();
      const tag = tgt.tagName.toLowerCase();
      if (tag === 'img') {
        openLightboxForImage(tgt.src, tgt.alt || 'Imagem');
      } else if (tag === 'video') {
        // prefer data-src or src
        const src = tgt.currentSrc || tgt.src || tgt.getAttribute('data-src');
        openLightboxForVideo(src);
      }
    }
  }, false);
})();
