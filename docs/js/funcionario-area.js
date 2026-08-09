document.addEventListener('DOMContentLoaded', () => {
  function unique(values) {
    return values.filter((value, index) => value && values.indexOf(value) === index);
  }

  function getApiBases() {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const rawBase = window.AUTH_SERVER || null;
    const isInvalidAuthServer = rawBase && (
      rawBase.includes('.html') ||
      rawBase.includes('/admin-login') ||
      rawBase.includes('/repos') ||
      /SEU_API_DOMAIN|your-api|example\.com/i.test(rawBase)
    );
    const bases = [];

    if (rawBase && !isInvalidAuthServer) bases.push(rawBase);
    if (isLocalHost && window.location.port === '3000') bases.push(window.location.origin);
    if (isLocalHost || window.location.protocol === 'file:') {
      bases.push(`${protocol}//localhost:3000`, `${protocol}//127.0.0.1:3000`);
    } else {
      bases.push(window.location.origin);
    }

    return unique(bases).map((base) => base.replace(/\/$/, ''));
  }

  function getPhotoDataUrl(base64, mime) {
    if (!base64 || base64 === 'null') return '';
    if (base64.startsWith('data:')) return base64;
    return `data:${mime || 'image/jpeg'};base64,${base64}`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Nao foi possivel ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }

  function splitDataUrl(dataUrl, fallbackMime) {
    const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    return {
      mime: match ? match[1] : fallbackMime || 'image/jpeg',
      base64: match ? match[2] : ''
    };
  }

  function logoutFuncionario() {
    localStorage.removeItem('tipoUsuario');
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('sobrenome');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('foto');
    localStorage.removeItem('fotoMime');
    window.location.href = 'index.html';
  }

  const tipoUsuario = localStorage.getItem('tipoUsuario');
  if (tipoUsuario !== 'Funcionario') {
    window.location.href = 'admin-login.html';
    return;
  }

  const nav = document.querySelector('nav.menu');
  const loginButtons = document.getElementById('loginButtons');
  const menuToggle = document.getElementById('menuToggle');

  if (nav) nav.style.display = 'none';
  if (loginButtons) loginButtons.style.display = 'none';
  if (menuToggle) menuToggle.style.display = 'none';
  document.body.classList.add('is-funcionario-mode');

  const statusAdmin = document.getElementById('statusLogado');
  const btnLogoutHeader = document.getElementById('btnLogoutHeader');
  if (statusAdmin) statusAdmin.style.display = 'none';
  if (btnLogoutHeader) btnLogoutHeader.style.display = 'none';

  const nomeUsuario = document.getElementById('nomeUsuario');
  const heroProfile = document.getElementById('funcionarioHeroProfile');
  const heroFoto = document.getElementById('funcionarioHeroFoto');
  const heroFallbackIcon = document.getElementById('funcionarioPhotoFallbackIcon');
  const heroNome = document.getElementById('funcionarioHeroNome');
  const fotoInput = document.getElementById('funcionarioFotoInput');
  const fotoStatus = document.getElementById('funcionarioFotoStatus');
  const fotoEl = document.getElementById('fotoFuncionario');
  const nomeCompleto = [localStorage.getItem('nome') || '', localStorage.getItem('sobrenome') || ''].filter(Boolean).join(' ').trim() || 'Funcionario';

  function setFotoStatus(texto, tipo) {
    if (!fotoStatus) return;
    fotoStatus.textContent = texto || '';
    fotoStatus.classList.toggle('is-error', tipo === 'erro');
    fotoStatus.classList.toggle('is-success', tipo === 'sucesso');
  }

  function setFuncionarioPhoto(dataUrl) {
    const hasPhoto = !!dataUrl;
    if (heroFoto) {
      heroFoto.src = hasPhoto ? dataUrl : '';
      heroFoto.style.display = hasPhoto ? 'block' : 'none';
    }
    if (heroFallbackIcon) {
      heroFallbackIcon.style.display = hasPhoto ? 'none' : 'inline-flex';
    }
    if (fotoEl) {
      fotoEl.src = hasPhoto ? dataUrl : '';
      fotoEl.style.display = hasPhoto ? '' : 'none';
    }
    if (heroProfile) heroProfile.style.display = 'flex';
  }

  if (nomeUsuario) nomeUsuario.textContent = nomeCompleto;
  if (heroNome) heroNome.textContent = nomeCompleto;

  try {
    const header = document.querySelector('header.site-header') || document.querySelector('header');
    if (header) {
      let funcionarioBadgeExit = document.getElementById('adminBadgeExit');
      if (!funcionarioBadgeExit) {
        funcionarioBadgeExit = document.createElement('button');
        funcionarioBadgeExit.id = 'adminBadgeExit';
        funcionarioBadgeExit.className = 'admin-badge-exit';
        funcionarioBadgeExit.type = 'button';
        funcionarioBadgeExit.textContent = 'Sair';
        header.appendChild(funcionarioBadgeExit);
      }
      funcionarioBadgeExit.style.display = 'inline-flex';
      funcionarioBadgeExit.onclick = logoutFuncionario;
    }
  } catch (e) { /* ignore */ }

  try {
    const fotoBase64 = localStorage.getItem('foto');
    const fotoMime = localStorage.getItem('fotoMime') || 'image/jpeg';
    setFuncionarioPhoto(getPhotoDataUrl(fotoBase64, fotoMime));
  } catch (e) {
    setFuncionarioPhoto('');
  }

  if (fotoInput) {
    fotoInput.addEventListener('change', async () => {
      const file = fotoInput.files && fotoInput.files[0];
      if (!file) return;

      if (!file.type || !file.type.startsWith('image/')) {
        setFotoStatus('Escolha uma imagem valida.', 'erro');
        fotoInput.value = '';
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setFotoStatus('Use uma imagem de ate 8 MB.', 'erro');
        fotoInput.value = '';
        return;
      }

      let previewUrl = '';
      try {
        previewUrl = await readFileAsDataUrl(file);
        setFuncionarioPhoto(previewUrl);
        setFotoStatus('Salvando...', '');
      } catch (error) {
        setFotoStatus('Nao foi possivel carregar a foto.', 'erro');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setFotoStatus('Faca login novamente para salvar.', 'erro');
        return;
      }

      let lastError = null;
      for (const base of getApiBases()) {
        try {
          const formData = new FormData();
          formData.append('foto', file);
          const response = await fetch(`${base}/api/admin/me/foto`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.sucesso) {
            throw new Error(data.mensagem || `Erro ${response.status}`);
          }

          const savedMime = data.fotoMime || file.type || 'image/jpeg';
          const savedBase64 = data.fotoBase64 || splitDataUrl(previewUrl, savedMime).base64;
          localStorage.setItem('foto', savedBase64);
          localStorage.setItem('fotoMime', savedMime);
          setFuncionarioPhoto(getPhotoDataUrl(savedBase64, savedMime));
          setFotoStatus('Foto salva.', 'sucesso');
          fotoInput.value = '';
          return;
        } catch (error) {
          lastError = error;
        }
      }

      console.error('Erro ao salvar foto do funcionario:', lastError);
      setFotoStatus('Nao foi possivel salvar no banco.', 'erro');
    });
  }

  [
    document.getElementById('btnLogoutInline'),
    document.getElementById('btnExitNearStatus'),
    document.getElementById('btnExitRight'),
    document.getElementById('logout')
  ].forEach((button) => {
    if (button) button.addEventListener('click', logoutFuncionario);
  });
});
