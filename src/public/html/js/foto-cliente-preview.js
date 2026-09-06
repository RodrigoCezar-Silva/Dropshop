function previewFotoCliente(event) {
  const input = event.target;
  const previewContainer = document.getElementById('fotoClientePreviewContainer');
  const previewImg = document.getElementById('fotoClientePreview');
  const iconeSemFoto = document.getElementById('iconeSemFoto');
  const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'flex';
      if (iconeSemFoto) iconeSemFoto.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    previewImg.src = defaultAvatar;
    previewContainer.style.display = 'flex';
    if (iconeSemFoto) iconeSemFoto.style.display = 'block';
  }
}

// Compatibilidade com o HTML de cadastro (preview em círculo)
function previewFotoCirculo(event) {
  const input = event.target;
  const previewImg = document.getElementById('fotoCirculoPreview');
  const icone = document.getElementById('iconeFotoCirculo');
  if (!previewImg) return;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
      if (icone) icone.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    previewImg.src = '';
    previewImg.style.display = 'none';
    if (icone) icone.style.display = 'block';
  }
}
