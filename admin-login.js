document.addEventListener('DOMContentLoaded', function() {
  const senhaInput = document.getElementById('senha');
  const toggleSenha = document.getElementById('toggleSenha');
  const iconeOlho = document.getElementById('iconeOlho');
  const senhaWrapper = document.querySelector('.senha-wrapper');
  if (senhaInput && senhaWrapper) {
    senhaInput.addEventListener('focus', function() {
      senhaWrapper.classList.add('focado');
    });
    senhaInput.addEventListener('blur', function() {
      senhaWrapper.classList.remove('focado');
    });
  }
  if (toggleSenha && senhaInput && iconeOlho) {
    toggleSenha.addEventListener('click', function() {
      if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        iconeOlho.classList.remove('fa-eye');
        iconeOlho.classList.add('fa-eye-slash');
      } else {
        senhaInput.type = 'password';
        iconeOlho.classList.remove('fa-eye-slash');
        iconeOlho.classList.add('fa-eye');
      }
    });
  }
});
