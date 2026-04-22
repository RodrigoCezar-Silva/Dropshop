// Navegação por etapas do checkout + cards de pagamento + preview do cartão
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const secaoEndereco = document.getElementById("secaoEndereco");
    const secaoPagamento = document.getElementById("secaoPagamento");
    const btnAvancar = document.getElementById("btnAvancarPagamento");
    const btnVoltar = document.getElementById("btnVoltarEndereco");
    const steps = document.querySelectorAll(".checkout-step");
    const lines = document.querySelectorAll(".step-line");
    const selectPagamento = document.getElementById("pagamento");
    const cartaoCampos = document.getElementById("cartaoCampos");
    const pagamentoCards = document.querySelectorAll(".pagamento-card input[type='radio']");

    // ===== Step Navigation =====
    function irParaStep(num) {
      if (num === 1) {
        secaoEndereco.classList.remove("checkout-section-hidden");
        secaoPagamento.classList.add("checkout-section-hidden");
        steps[0].classList.add("active");
        steps[0].classList.remove("done");
        steps[1].classList.remove("active", "done");
        steps[2].classList.remove("active", "done");
        lines[0].classList.add("active");
        lines[0].classList.remove("done");
        lines[1].classList.remove("active", "done");
      } else if (num === 2) {
        secaoEndereco.classList.add("checkout-section-hidden");
        secaoPagamento.classList.remove("checkout-section-hidden");
        steps[0].classList.remove("active");
        steps[0].classList.add("done");
        steps[1].classList.add("active");
        steps[1].classList.remove("done");
        steps[2].classList.remove("active", "done");
        lines[0].classList.remove("active");
        lines[0].classList.add("done");
        lines[1].classList.add("active");
        lines[1].classList.remove("done");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (btnAvancar) {
      btnAvancar.addEventListener("click", () => {
        // Validar campos obrigatórios da seção endereço
        const campos = secaoEndereco.querySelectorAll("input[required]");
        let valido = true;
        campos.forEach(c => {
          if (!c.value.trim()) {
            c.style.borderColor = "#ef4444";
            c.style.boxShadow = "0 0 0 4px rgba(239, 68, 68, 0.1)";
            valido = false;
            c.addEventListener("input", () => {
              c.style.borderColor = "";
              c.style.boxShadow = "";
            }, { once: true });
          }
        });
        if (!valido) {
          const primeiro = secaoEndereco.querySelector("input[required]:invalid, input[required][style*='border-color: rgb(239, 68, 68)']");
          if (primeiro) primeiro.focus();
          return;
        }
        irParaStep(2);
      });
    }

    if (btnVoltar) {
      btnVoltar.addEventListener("click", () => irParaStep(1));
    }

    // ===== Payment Cards → Select =====
    pagamentoCards.forEach(radio => {
      radio.addEventListener("change", () => {
        const valor = radio.value;
        if (selectPagamento) {
          selectPagamento.value = valor;
          selectPagamento.dispatchEvent(new Event("change"));
        }
        // Mostrar/esconder campos de cartão
        if (cartaoCampos) {
          if (valor === "credito" || valor === "debito") {
            cartaoCampos.style.display = "block";
          } else {
            cartaoCampos.style.display = "none";
          }
        }
      });
    });

    // ===== Card Preview (visual do cartão) =====
    const numCartaoInput = document.getElementById("numeroCartao");
    const nomeTitularInput = document.getElementById("nomeTitular");
    const validadeInput = document.getElementById("validade");
    const numPreview = document.querySelector(".cartao-numero-preview");
    const nomePreview = document.querySelector(".cartao-nome-preview");
    const valPreview = document.querySelector(".cartao-val-preview");
    const cartaoPreview = document.getElementById("cartaoPreview");
    const cartaoBandeira = document.getElementById("cartaoBandeira");
    const cartaoBancoNome = document.getElementById("cartaoBancoNome");
    const cartaoDeco = document.getElementById("cartaoDeco");

    // ===== Nome do titular → preview =====
    if (nomeTitularInput && nomePreview) {
      nomeTitularInput.addEventListener("input", () => {
        const val = nomeTitularInput.value.toUpperCase().substring(0, 26);
        nomePreview.textContent = val || "SEU NOME";
      });
    }

    // ===== Detecção de bandeira pelo BIN =====
    function detectarBandeira(numero) {
      const n = numero.replace(/\D/g, "");
      if (!n) return null;

      const eloPrefixes = [
        '401178','401179','431274','438935','451416','457393','457631','457632',
        '504175','627780','636297','636368','636369'
      ];
      const eloRanges = [
        [650031,650033],[650035,650051],[650405,650439],[650485,650538],
        [650541,650598],[650700,650718],[650720,650727],[650901,650920],
        [651652,651679],[655000,655019],[655021,655058]
      ];
      for (const prefix of eloPrefixes) {
        if (n.startsWith(prefix)) return 'elo';
      }
      if (n.length >= 6) {
        const bin6 = parseInt(n.substring(0, 6));
        for (const [min, max] of eloRanges) {
          if (bin6 >= min && bin6 <= max) return 'elo';
        }
      }
      if (/^3[47]/.test(n)) return 'amex';
      if (n.startsWith('606282') || /^(3841)/.test(n)) return 'hipercard';
      if (/^4/.test(n)) return 'visa';
      if (/^5[1-5]/.test(n)) return 'mastercard';
      if (n.length >= 4) {
        const prefix4 = parseInt(n.substring(0, 4));
        if (prefix4 >= 2221 && prefix4 <= 2720) return 'mastercard';
      }
      return null;
    }

    // ===== Detecção do banco emissor pelo BIN =====
    function detectarBanco(numero) {
      const n = numero.replace(/\D/g, "");
      if (n.length < 4) return null;
      const bin4 = n.substring(0, 4);
      const bin6 = n.length >= 6 ? n.substring(0, 6) : '';

      // Nubank
      if (['5162','5360','5234','4002','5367','5368'].includes(bin4) ||
          ['516220','536020','523497','400209','536768','536769'].includes(bin6)) return 'nubank';
      // Inter
      if (['4072','5099','5310'].includes(bin4) ||
          ['407283','509939','531030'].includes(bin6)) return 'inter';
      // C6 Bank
      if (['5364','5504','4389'].includes(bin4) ||
          ['536404','550405'].includes(bin6)) return 'c6bank';
      // Itaú
      if (['4014','4587','5413','5350','5496'].includes(bin4) ||
          ['401448','458738','541332','535058','549601'].includes(bin6)) return 'itau';
      // Bradesco
      if (['5278','4376'].includes(bin4) ||
          ['527817','436076'].includes(bin6)) return 'bradesco';
      // Banco do Brasil
      if (['4984','5306','4019','5563'].includes(bin4) ||
          ['498401','530625','401998','556300'].includes(bin6)) return 'bb';
      // Santander
      if (['5469','5170'].includes(bin4) ||
          ['546928','517047'].includes(bin6)) return 'santander';
      // Caixa Econômica
      if (['5071','5078','5082','6362'].includes(bin4) ||
          ['507160','507833','508200'].includes(bin6)) return 'caixa';
      // PicPay
      if (bin6 === '516292' || bin6 === '506716') return 'picpay';
      // Neon
      if (['4025','5173'].includes(bin4) ||
          ['402555','517388'].includes(bin6)) return 'neon';
      // Next
      if (bin6 === '527828' || bin6 === '436077') return 'next';

      return null;
    }

    // Config por banco — modelo visual realista com SVG deco
    const bancoConfig = {
      nubank: {
        nome: 'Nubank',
        gradient: 'linear-gradient(135deg, #820ad1 0%, #9b30ff 40%, #6a0dad 100%)',
        shadow: 'rgba(130,10,209,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M280,0 Q360,80 360,200" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="60"/><path d="M320,0 Q400,100 340,200" fill="none" stroke="rgba(200,150,255,0.06)" stroke-width="40"/><circle cx="60" cy="170" r="100" fill="rgba(130,10,209,0.15)"/></svg>',
        chipColor: '#9b30ff'
      },
      inter: {
        nome: 'Inter',
        gradient: 'linear-gradient(135deg, #ff7a00 0%, #ff9500 40%, #e86800 100%)',
        shadow: 'rgba(255,122,0,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><circle cx="300" cy="40" r="120" fill="rgba(255,255,255,0.07)"/><circle cx="320" cy="60" r="80" fill="rgba(255,255,255,0.05)"/><rect x="0" y="160" width="360" height="3" rx="2" fill="rgba(255,255,255,0.1)"/></svg>',
        chipColor: '#ffb74d'
      },
      c6bank: {
        nome: 'C6 Bank',
        gradient: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 30%, #111 100%)',
        shadow: 'rgba(0,0,0,0.6)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><line x1="0" y1="0" x2="360" y2="200" stroke="rgba(255,255,255,0.03)" stroke-width="80"/><line x1="100" y1="0" x2="360" y2="130" stroke="rgba(255,255,255,0.02)" stroke-width="60"/></svg>',
        chipColor: '#555'
      },
      itau: {
        nome: 'Itaú',
        gradient: 'linear-gradient(135deg, #003399 0%, #004bb5 50%, #003399 100%)',
        shadow: 'rgba(0,51,153,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><rect x="240" y="0" width="120" height="200" fill="rgba(236,112,0,0.2)" rx="0"/><rect x="240" y="0" width="4" height="200" fill="rgba(236,112,0,0.4)"/><circle cx="310" cy="100" r="50" fill="rgba(255,165,0,0.08)"/></svg>',
        chipColor: '#ec7000'
      },
      bradesco: {
        nome: 'Bradesco',
        gradient: 'linear-gradient(135deg, #cc092f 0%, #e01040 40%, #9c0620 100%)',
        shadow: 'rgba(204,9,47,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M0,150 Q180,100 360,150 L360,200 L0,200 Z" fill="rgba(0,0,0,0.12)"/><circle cx="320" cy="30" r="60" fill="rgba(255,255,255,0.05)"/></svg>',
        chipColor: '#ff4d6a'
      },
      bb: {
        nome: 'Banco do Brasil',
        gradient: 'linear-gradient(135deg, #003882 0%, #004aad 50%, #002d6b 100%)',
        shadow: 'rgba(0,56,130,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><rect x="0" y="0" width="360" height="6" fill="rgba(252,229,0,0.5)"/><polygon points="40,90 60,70 80,90 60,110" fill="rgba(252,229,0,0.1)"/><polygon points="50,95 70,75 90,95 70,115" fill="rgba(252,229,0,0.07)"/></svg>',
        chipColor: '#fce500'
      },
      santander: {
        nome: 'Santander',
        gradient: 'linear-gradient(135deg, #ec0000 0%, #cc0000 50%, #a30000 100%)',
        shadow: 'rgba(236,0,0,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M-20,200 Q100,80 200,200" fill="rgba(255,255,255,0.04)"/><path d="M80,200 Q200,60 320,200" fill="rgba(255,255,255,0.03)"/><path d="M180,200 Q280,100 380,200" fill="rgba(255,255,255,0.02)"/></svg>',
        chipColor: '#ff6666'
      },
      caixa: {
        nome: 'Caixa',
        gradient: 'linear-gradient(135deg, #005ca9 0%, #0070c0 40%, #004a8f 100%)',
        shadow: 'rgba(0,92,169,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><rect x="260" y="0" width="100" height="200" fill="rgba(255,102,0,0.12)"/><rect x="260" y="0" width="3" height="200" fill="rgba(255,102,0,0.25)"/></svg>',
        chipColor: '#66b3ff'
      },
      picpay: {
        nome: 'PicPay',
        gradient: 'linear-gradient(135deg, #21c25e 0%, #1ba94e 40%, #15923f 100%)',
        shadow: 'rgba(33,194,94,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><circle cx="300" cy="50" r="100" fill="rgba(255,255,255,0.06)"/><circle cx="320" cy="30" r="60" fill="rgba(255,255,255,0.04)"/></svg>',
        chipColor: '#66e898'
      },
      neon: {
        nome: 'Neon',
        gradient: 'linear-gradient(135deg, #0078f0 0%, #00a8ff 40%, #0060c0 100%)',
        shadow: 'rgba(0,120,240,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><circle cx="180" cy="100" r="140" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="50"/></svg>',
        chipColor: '#66ccff'
      },
      next: {
        nome: 'Next',
        gradient: 'linear-gradient(135deg, #00e676 0%, #00c853 40%, #00a844 100%)',
        shadow: 'rgba(0,230,118,0.5)',
        deco: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M0,0 L120,0 L0,120 Z" fill="rgba(255,255,255,0.05)"/><path d="M360,200 L240,200 L360,80 Z" fill="rgba(255,255,255,0.04)"/></svg>',
        chipColor: '#004d40'
      }
    };

    // Config por bandeira (fallback)
    const bandeiraConfig = {
      visa:      { icon: 'fab fa-cc-visa',        gradient: 'linear-gradient(135deg, #1a1f71, #2557d6, #4a90e2)', shadow: 'rgba(26,31,113,0.5)',  label: 'Visa' },
      mastercard:{ icon: 'fab fa-cc-mastercard',   gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', shadow: 'rgba(26,26,46,0.5)',   label: 'Mastercard' },
      elo:       { icon: 'fa-solid fa-credit-card',gradient: 'linear-gradient(135deg, #000000, #1a1a1a, #2a2a2a)', shadow: 'rgba(0,0,0,0.6)',      label: 'Elo' },
      amex:      { icon: 'fab fa-cc-amex',         gradient: 'linear-gradient(135deg, #006fcf, #0080ff, #00aaff)', shadow: 'rgba(0,111,207,0.5)',   label: 'American Express' },
      hipercard: { icon: 'fa-solid fa-credit-card',gradient: 'linear-gradient(135deg, #822124, #a82b2e, #d43a3d)', shadow: 'rgba(130,33,36,0.5)',   label: 'Hipercard' }
    };

    let bandeiraAtual = null;
    let bancoAtual = null;

    // Deco por bandeira (quando banco não detectado)
    const bandeiraDeco = {
      visa: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M280,-10 Q380,100 280,210" fill="rgba(255,255,255,0.06)"/><path d="M300,-10 Q400,100 300,210" fill="rgba(255,255,255,0.04)"/></svg>',
      mastercard: '<svg viewBox="0 0 360 200" class="deco-svg"><circle cx="250" cy="100" r="80" fill="rgba(235,0,27,0.1)"/><circle cx="300" cy="100" r="80" fill="rgba(255,159,0,0.08)"/></svg>',
      elo: '<svg viewBox="0 0 360 200" class="deco-svg"><circle cx="300" cy="40" r="60" fill="rgba(255,215,0,0.08)"/><circle cx="60" cy="160" r="80" fill="rgba(0,114,198,0.06)"/></svg>',
      amex: '<svg viewBox="0 0 360 200" class="deco-svg"><rect x="0" y="80" width="360" height="2" fill="rgba(255,255,255,0.08)"/><rect x="0" y="86" width="360" height="1" fill="rgba(255,255,255,0.05)"/></svg>',
      hipercard: '<svg viewBox="0 0 360 200" class="deco-svg"><path d="M0,100 Q180,40 360,100 Q180,160 0,100 Z" fill="rgba(255,215,0,0.06)"/></svg>'
    };

    function atualizarCartaoVisual(numero) {
      const bandeira = detectarBandeira(numero);
      const banco = detectarBanco(numero);
      if (bandeira === bandeiraAtual && banco === bancoAtual) return;
      bandeiraAtual = bandeira;
      bancoAtual = banco;

      if (!cartaoPreview || !cartaoBandeira) return;

      // Ícone da bandeira
      if (bandeira && bandeiraConfig[bandeira]) {
        const cfg = bandeiraConfig[bandeira];
        cartaoBandeira.innerHTML = '<i class="' + cfg.icon + '"></i>';
        cartaoBandeira.title = cfg.label;
      } else {
        cartaoBandeira.innerHTML = '<i class="fa-solid fa-credit-card"></i>';
        cartaoBandeira.title = '';
      }

      const chip = cartaoPreview.querySelector('.cartao-chip');

      // Se detectou banco → modelo visual completo do banco
      if (banco && bancoConfig[banco]) {
        const bCfg = bancoConfig[banco];
        cartaoPreview.style.background = bCfg.gradient;
        cartaoPreview.style.boxShadow = '0 12px 36px ' + bCfg.shadow;
        cartaoPreview.className = 'cartao-preview cartao-banco-' + banco;
        if (cartaoBancoNome) { cartaoBancoNome.textContent = bCfg.nome; cartaoBancoNome.style.display = ''; }
        if (cartaoDeco) cartaoDeco.innerHTML = bCfg.deco || '';
        if (chip && bCfg.chipColor) chip.style.background = 'linear-gradient(135deg, ' + bCfg.chipColor + ', ' + bCfg.chipColor + 'dd)';
      }
      // Bandeira → design da bandeira
      else if (bandeira && bandeiraConfig[bandeira]) {
        const cfg = bandeiraConfig[bandeira];
        cartaoPreview.style.background = cfg.gradient;
        cartaoPreview.style.boxShadow = '0 12px 36px ' + cfg.shadow;
        cartaoPreview.className = 'cartao-preview cartao-brand-' + bandeira;
        if (cartaoBancoNome) { cartaoBancoNome.textContent = ''; cartaoBancoNome.style.display = 'none'; }
        if (cartaoDeco) cartaoDeco.innerHTML = bandeiraDeco[bandeira] || '';
        if (chip) chip.style.background = '';
      }
      // Nenhum → padrão
      else {
        cartaoPreview.style.background = '';
        cartaoPreview.style.boxShadow = '';
        cartaoPreview.className = 'cartao-preview';
        if (cartaoBancoNome) { cartaoBancoNome.textContent = ''; cartaoBancoNome.style.display = 'none'; }
        if (cartaoDeco) cartaoDeco.innerHTML = '';
        if (chip) chip.style.background = '';
      }
    }

    if (numCartaoInput && numPreview) {
      numCartaoInput.addEventListener("input", () => {
        let v = numCartaoInput.value.replace(/\D/g, "").substring(0, 16);
        let fmt = v.replace(/(.{4})/g, "$1 ").trim();
        numCartaoInput.value = fmt;
        numPreview.textContent = fmt || "•••• •••• •••• ••••";
        atualizarCartaoVisual(v);
      });
    }

    if (validadeInput && valPreview) {
      validadeInput.addEventListener("input", () => {
        let v = validadeInput.value.replace(/\D/g, "").substring(0, 4);
        if (v.length > 2) v = v.substring(0, 2) + "/" + v.substring(2);
        validadeInput.value = v;
        valPreview.textContent = v || "MM/AA";
      });
    }

    // CVV - limitar a números
    const cvvInput = document.getElementById("cvv");
    if (cvvInput) {
      cvvInput.addEventListener("input", () => {
        cvvInput.value = cvvInput.value.replace(/\D/g, "").substring(0, 4);
      });
    }

    // ===== Sidebar qty badge =====
    function atualizarBadgeQtd() {
      const badge = document.getElementById("sidebarQtd");
      const subtotalEl = document.getElementById("sidebarSubtotal");
      if (!badge) return;
      try {
        const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
        const total = carrinho.reduce((acc, p) => acc + (p.qtd || 1), 0);
        badge.textContent = total + (total === 1 ? " item" : " itens");

        if (subtotalEl) {
          const subtotal = carrinho.reduce((acc, p) => acc + (parseFloat(p.preco) * (p.qtd || 1)), 0);
          subtotalEl.textContent = "R$ " + subtotal.toFixed(2).replace(".", ",");
        }
      } catch { badge.textContent = "0 itens"; }
    }

    atualizarBadgeQtd();
    window.addEventListener("storage", e => {
      if (e.key === "carrinho") atualizarBadgeQtd();
    });

    // ===== Telefone mask =====
    const telInput = document.getElementById("telefone");
    if (telInput) {
      telInput.addEventListener("input", () => {
        let v = telInput.value.replace(/\D/g, "").substring(0, 11);
        if (v.length > 6) v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
        else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
        telInput.value = v;
      });
    }

    // ===== CPF mask =====
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
      cpfInput.addEventListener("input", () => {
        let v = cpfInput.value.replace(/\D/g, "").substring(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        cpfInput.value = v;
      });
    }
  });
})();
