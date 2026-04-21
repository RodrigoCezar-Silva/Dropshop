/**
 * Página de contato do site.
 * Valida o formulário, salva a mensagem localmente e mostra retorno visual ao usuário.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contatoForm");
  const mensagem = document.getElementById("mensagem");
  const fotosInput = document.getElementById('fotos');
  const videoInput = document.getElementById('video');
  const previewFotos = document.getElementById('previewFotos');
  const previewVideo = document.getElementById('previewVideo');
  const fotosBtn = document.querySelector('.file-btn[for="fotos"]');
  const videoBtn = document.querySelector('.file-btn[for="video"]');

  if (!form || !mensagem) return;

// cria popup de confirmação e redireciona após alguns segundos
function showConfirmationPopup(message, redirectUrl, seconds) {
  seconds = typeof seconds === 'number' ? seconds : 4;
  const overlay = document.createElement('div');
  overlay.className = 'mix-popup-overlay';
  overlay.setAttribute('aria-hidden', 'false');

  const box = document.createElement('div');
  box.className = 'mix-popup-box';

  const msg = document.createElement('p');
  msg.className = 'mix-popup-message';
  msg.textContent = message;

  const countdown = document.createElement('p');
  countdown.className = 'mix-popup-countdown';
  countdown.textContent = `Redirecionando em ${seconds}s...`;

  const btn = document.createElement('button');
  btn.className = 'mix-popup-btn';
  btn.textContent = 'Ir agora';
  btn.addEventListener('click', () => {
    cleanup();
    window.location.href = redirectUrl;
  });

  box.appendChild(msg);
  box.appendChild(countdown);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  let remaining = seconds;
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      cleanup();
      window.location.href = redirectUrl;
    } else {
      countdown.textContent = `Redirecionando em ${remaining}s...`;
    }
  }, 1000);

  function cleanup() {
    clearInterval(interval);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
}

  function bytesToSize(bytes) {
    const sizes = ['B','KB','MB','GB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  }

  async function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      const clean = () => { try { URL.revokeObjectURL(url); } catch (e) {} };

      video.addEventListener('loadeddata', () => {
        try {
          const seekTo = Math.min(0.1, (video.duration || 0));
          const capture = () => {
            const canvas = document.createElement('canvas');
            const w = video.videoWidth || 320;
            const h = video.videoHeight || 180;
            const maxW = 320;
            const scale = Math.min(1, maxW / w);
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            clean();
            resolve(dataUrl);
          };
          video.currentTime = seekTo;
          video.addEventListener('seeked', capture, { once: true });
          // fallback
          setTimeout(capture, 1200);
        } catch (e) { clean(); resolve(''); }
      });

      video.addEventListener('error', () => { clean(); resolve(''); });
    });
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone") ? document.getElementById("telefone").value.trim() : '';
    const assunto = document.getElementById("assunto").value.trim();
    const reclamacao = document.getElementById("reclamacao").value.trim();

    if (!nome || !email || !assunto || !reclamacao) {
      mensagem.classList.remove("sucesso");
      mensagem.classList.add("erro");
      mensagem.style.display = "block";
      mensagem.textContent = "❌ Por favor, preencha todos os campos!";
      return;
    }

    const imagens = fotosInput && fotosInput.files ? Array.from(fotosInput.files) : [];
    const videoFile = videoInput && videoInput.files && videoInput.files[0] ? videoInput.files[0] : null;

    if (imagens.length > 5) { alert('Envie no máximo 5 imagens.'); return; }
    if (videoFile && imagens.length >= 6) { alert('Remova algumas imagens antes de adicionar um vídeo.'); return; }

    // valida tamanhos
    for (const f of imagens) {
      if (f.size > 500 * 1024 * 1024) { alert('Cada imagem deve ter no máximo 500MB: ' + f.name); return; }
    }
    if (videoFile && videoFile.size > 500 * 1024 * 1024) { alert('Vídeo excede 500MB: ' + videoFile.name); return; }

    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('email', email);
    fd.append('telefone', telefone);
    fd.append('assunto', assunto);
    fd.append('reclamacao', reclamacao);

    imagens.forEach(f => fd.append('anexos', f, f.name));
    if (videoFile) fd.append('anexos', videoFile, videoFile.name);

    // Detect API base: if page served by Live Server (porta 5501) try backend at 3000
    const currentPort = window.location.port;
    const apiBase = (currentPort && currentPort !== '3000') ? 'http://localhost:3000' : '';
    const apiUrl = `${apiBase}/api/reclamacao`;

    fetch(apiUrl, { method: 'POST', body: fd })
      .then(async (r) => {
        if (!r.ok) {
          // try to read text body for better error
          const txt = await r.text().catch(() => '');
          throw new Error(`Status ${r.status} ${r.statusText} - ${txt}`);
        }
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('application/json')) return r.json();
        const txt = await r.text().catch(() => '');
        throw new Error('Resposta inesperada do servidor: ' + txt);
      })
      .then(result => {
        if (!result || !result.sucesso) {
          throw new Error((result && result.mensagem) || 'Erro ao enviar');
        }
        const reclamacoes = JSON.parse(localStorage.getItem('mixReclamacoes') || '[]');
        reclamacoes.push(result.reclamacao);
        localStorage.setItem('mixReclamacoes', JSON.stringify(reclamacoes));

        // marcar para abrir a aba de reclamações e mostrar popup de confirmação
        try { localStorage.setItem('abrirReclamacoes', '1'); } catch(e){}
        showConfirmationPopup('✅ Sua mensagem foi enviada com sucesso! Redirecionando para sua área...', 'meu-perfil.html', 4);

        this.reset();
        if (previewFotos) previewFotos.innerHTML = '';
        if (previewVideo) previewVideo.innerHTML = '';
        if (fotosBtn) fotosBtn.querySelector('.file-count').textContent = '(0)';
        if (videoBtn) videoBtn.querySelector('.file-count').textContent = '(0)';
      })
      .catch(err => {
        console.error('Erro envio reclamacao:', err);
        mensagem.classList.remove('sucesso');
        mensagem.classList.add('erro');
        mensagem.style.display = 'block';
        mensagem.textContent = '❌ Falha ao enviar: ' + (err.message || 'Tente novamente mais tarde.');
      });
  });

  // Fotos preview
  if (fotosInput && previewFotos) {
    fotosInput.addEventListener('change', function () {
      previewFotos.innerHTML = '';
      const files = Array.from(this.files).slice(0,5);
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 500 * 1024 * 1024) { alert('Cada imagem deve ter no máximo 500MB: ' + file.name); return; }
        const url = URL.createObjectURL(file);
        const div = document.createElement('div'); div.className = 'thumb';
        const img = document.createElement('img'); img.src = url; img.alt = file.name;

        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'remove-btn'; btn.textContent = '×';
        btn.addEventListener('click', function () {
          const dt = new DataTransfer();
          let removed = false;
          Array.from(fotosInput.files).forEach(f => {
            if (!removed && f.name === file.name && f.size === file.size) { removed = true; return; }
            dt.items.add(f);
          });
          fotosInput.files = dt.files;
          div.remove();
          if (fotosBtn) fotosBtn.querySelector('.file-count').textContent = `(${fotosInput.files.length})`;
        });

        div.appendChild(img); div.appendChild(btn); previewFotos.appendChild(div);
      });
      if (fotosBtn) fotosBtn.querySelector('.file-count').textContent = `(${this.files.length})`;
    });
  }

  // Video preview (thumbnail)
  if (videoInput && previewVideo) {
    videoInput.addEventListener('change', async function () {
      previewVideo.innerHTML = '';
      const file = this.files[0];
      if (!file) { if (videoBtn) videoBtn.querySelector('.file-count').textContent = '(0)'; return; }
      if (!file.type.startsWith('video/')) { alert('Formato de vídeo inválido.'); this.value = ''; return; }
      if (file.size > 500 * 1024 * 1024) { alert('Vídeo excede 500MB.'); this.value = ''; return; }

      const thumbData = await generateVideoThumbnail(file);
      const div = document.createElement('div'); div.className = 'thumb';
      if (thumbData) {
        const img = document.createElement('img'); img.src = thumbData; img.alt = file.name;
        img.style.objectFit = 'cover';
        div.appendChild(img);
        // play overlay
        const overlay = document.createElement('span'); overlay.className = 'play-overlay'; overlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        div.appendChild(overlay);
      } else {
        const v = document.createElement('video'); v.controls = true; v.src = URL.createObjectURL(file); div.appendChild(v);
      }

      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'remove-btn'; btn.textContent = '×';
      btn.addEventListener('click', function () {
        videoInput.value = '';
        div.remove();
        if (videoBtn) videoBtn.querySelector('.file-count').textContent = '(0)';
      });
      div.appendChild(btn);
      previewVideo.appendChild(div);
      if (videoBtn) videoBtn.querySelector('.file-count').textContent = `(1)`;
    });
  }
});

