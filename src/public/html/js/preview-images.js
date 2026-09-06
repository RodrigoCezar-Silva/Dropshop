document.addEventListener('DOMContentLoaded', () => {
  // Encontra inputs de arquivo que têm atributo data-preview or class 'preview-image'
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  inputs.forEach(input => {
    const previewSelector = input.getAttribute('data-preview') || null;
    let container = null;
    if (previewSelector) container = document.querySelector(previewSelector);
    // se não passou seletor, tenta procurar .preview-container próximo
    if (!container) {
      const next = input.nextElementSibling;
      if (next && next.classList && next.classList.contains('file-preview-container')) container = next;
    }
    // se nada, cria um preview container logo após o input
    if (!container) {
      container = document.createElement('div');
      container.className = 'file-preview-container';
      input.insertAdjacentElement('afterend', container);
    }

    function clearPrev() {
      container.innerHTML = '';
      container.classList.remove('has-file-preview');
    }

    input.addEventListener('change', () => {
      clearPrev();
      const files = Array.from(input.files || []);
      if (!files.length) return;
      files.forEach(f => {
        if (!f.type || !f.type.startsWith('image/')) return;
        const img = document.createElement('img');
        // se o container for a pré-visualização de avatar, use classe especial
        const isAvatar = container.id === 'avatarPreview' || container.classList.contains('avatar-preview');
        if (isAvatar) {
          img.className = 'avatar-preview-img';
        } else {
          img.className = 'file-preview-thumb';
        }
        img.alt = f.name || 'preview';
        img.src = URL.createObjectURL(f);
        img.onload = () => URL.revokeObjectURL(img.src);
        container.appendChild(img);
        container.classList.add('has-file-preview');
      });
    });
  });
});
