// FAQ Acordeão
// Este script ativa o comportamento de acordeão para as perguntas frequentes

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-pergunta').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const resposta = btn.nextElementSibling;
      const jaAtivo = item.classList.contains('ativo');

      // Fecha todos
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('ativo');
        if (el.querySelector('.faq-resposta')) {
          el.querySelector('.faq-resposta').style.maxHeight = null;
        }
      });

      // Abre o clicado (se não estava ativo)
      if (!jaAtivo) {
        item.classList.add('ativo');
        if (resposta) {
          resposta.style.maxHeight = resposta.scrollHeight + 40 + 'px';
          resposta.style.opacity = '1';
        }
      }
    });
  });

  // Garante que ao abrir, o conteúdo todo fique visível
  document.querySelectorAll('.faq-item.ativo .faq-resposta').forEach(resposta => {
    resposta.style.maxHeight = resposta.scrollHeight + 40 + 'px';
    resposta.style.opacity = '1';
  });
});
