// FAQ animado, cards com efeito, fade-in e pulse nos botões

document.addEventListener('DOMContentLoaded', function() {
  // FAQ animação
  document.querySelectorAll('.faq-pergunta').forEach(btn => {
    btn.addEventListener('click', function() {
      const resposta = btn.nextElementSibling;
      const aberto = btn.classList.toggle('aberto');
      resposta.style.maxHeight = aberto ? resposta.scrollHeight + 'px' : null;
      resposta.style.opacity = aberto ? '1' : '0';
      btn.querySelector('i').classList.toggle('fa-chevron-down', !aberto);
      btn.querySelector('i').classList.toggle('fa-chevron-up', aberto);
      // Ícone animado
      btn.querySelector('i').style.transition = 'transform 0.4s cubic-bezier(.4,2,.6,1)';
    });
  });

  // Cards de regra com efeito
  document.querySelectorAll('.regra-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('hover');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hover');
    });
  });

  // Pulse nos botões de contato e CTA
  document.querySelectorAll('.btn-contato, .trocas-cta a, .trocas-cta button').forEach(btn => {
    btn.classList.add('pulse-anim');
  });

  // Fade-in nos blocos ao rolar
  const fadeBlocks = document.querySelectorAll('.trocas-hero-content, .trocas-intro, .trocas-etapas, .trocas-regras, .trocas-faq, .trocas-cta');
  const fadeInOnScroll = () => {
    fadeBlocks.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('fade-in');
      }
    });
  };
  window.addEventListener('scroll', fadeInOnScroll);
  fadeInOnScroll();
});
