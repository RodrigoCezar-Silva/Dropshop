/**
 * CORRETOR ORTOGRÁFICO EM TEMPO REAL (PT-BR) - MIX-PROMOÇÃO
 * Verificação ortográfica, acentuação automática e sugestões inteligentes
 * para os canais de atendimento (Cliente e Funcionário).
 */

(function () {
  'use strict';

  // Base de dados léxica de correções comuns em Português do Brasil
  const DICIONARIO_PT_BR = {
    // Pronomes e Tratamento
    'voce': 'você', 'voces': 'vocês', 'vc': 'você', 'vcs': 'vocês',
    'nois': 'nós', 'nos': 'nós',

    // Negações e Afirmações
    'nao': 'não', 'naum': 'não', 'nn': 'não',

    // Conectivos, Preposições e Advérbios
    'tambem': 'também', 'tb': 'também', 'tbm': 'também',
    'ninguem': 'ninguém', 'alguem': 'alguém', 'porem': 'porém', 'alem': 'além',
    'ja': 'já', 'ha': 'há', 'ate': 'até', 'so': 'só', 'la': 'lá', 'ca': 'cá',
    'ola': 'olá', 'alo': 'alô', 'pq': 'por que', 'oq': 'o que', 'agr': 'agora',
    'dps': 'depois', 'hj': 'hoje', 'amanha': 'amanhã', 'ontem': 'ontem',
    'qdo': 'quando', 'qto': 'quanto', 'qtos': 'quantos', 'td': 'tudo',
    'tds': 'todos', 'blz': 'beleza', 'msg': 'mensagem', 'pfv': 'por favor',
    'plz': 'por favor', 'obg': 'obrigado', 'obgd': 'obrigado', 'valeu': 'valeu',
    'abs': 'abraços', 'cmg': 'comigo', 'cntg': 'contigo', 'concerteza': 'com certeza',
    'apois': 'após', 'apos': 'após',

    // Verbos e Conjugações
    'esta': 'está', 'estao': 'estão', 'entao': 'então', 'sao': 'são',
    'estara': 'estará', 'estarao': 'estarão', 'estavamos': 'estávamos',
    'sera': 'será', 'serao': 'serão', 'tera': 'terá', 'terao': 'terão',
    'ira': 'irá', 'irao': 'irão', 'podera': 'poderá', 'poderao': 'poderão',
    'podiamos': 'podíamos', 'falar': 'falar', 'digita': 'digitar',
    'bloquiart': 'bloquear', 'bloquiar': 'bloquear',
    'concerte': 'conserte', 'concertei': 'consertei',
    'seje': 'seja', 'esteje': 'esteja',

    // Atendimento, E-commerce e Loja
    'duvida': 'dúvida', 'duvidas': 'dúvidas',
    'preco': 'preço', 'precos': 'preços',
    'codigo': 'código', 'codigos': 'códigos',
    'numero': 'número', 'numeros': 'números',
    'politica': 'política', 'politicas': 'políticas',
    'reclamacao': 'reclamação', 'reclamacoes': 'reclamações',
    'informacao': 'informação', 'informacoes': 'informações',
    'atencao': 'atenção', 'atendente': 'atendente',
    'funcionario': 'funcionário', 'funcionarios': 'funcionários',
    'fucionario': 'funcionário', 'fucionarios': 'funcionários',
    'ficionario': 'funcionário',
    'cartao': 'cartão', 'cartoes': 'cartões',
    'horario': 'horário', 'horarios': 'horários',
    'util': 'útil', 'uteis': 'úteis',
    'facil': 'fácil', 'dificil': 'difícil',
    'otimo': 'ótimo', 'otima': 'ótima', 'otimos': 'ótimos', 'otimas': 'ótimas',
    'possivel': 'possível', 'impossivel': 'impossível',
    'servico': 'serviço', 'servicos': 'serviços',
    'endereco': 'endereço', 'enderecos': 'endereços',
    'devolucao': 'devolução', 'devolucoes': 'devoluções',
    'promocao': 'promoção', 'promocoes': 'promoções',
    'situacao': 'situação', 'solucao': 'solução', 'solucoes': 'soluções',
    'condicao': 'condição', 'condicoes': 'condições',
    'opcao': 'opção', 'opcoes': 'opções',
    'confirmacao': 'confirmação',
    'prioritario': 'prioritário', 'urgencia': 'urgência',
    'agradeco': 'agradeço', 'abracos': 'abraços',
    'disposicao': 'disposição',
    'conclusao': 'conclusão', 'conclusoes': 'conclusões',
    'avaliacao': 'avaliação', 'avaliacoes': 'avaliações',
    'descricao': 'descrição', 'descricoes': 'descrições',
    'observacao': 'observação', 'observacoes': 'observações',
    'solicitacao': 'solicitação', 'solicitacoes': 'solicitações',
    'notificacao': 'notificação', 'notificacoes': 'notificações',
    'pos': 'pós', 'pre': 'pré',
    'rapido': 'rápido', 'rapida': 'rápida', 'rapidos': 'rápidos', 'rapidas': 'rápidas',
    'ultimo': 'último', 'ultima': 'última', 'ultimos': 'últimos', 'ultimas': 'últimas',
    'padrao': 'padrão', 'padroes': 'padrões',
    'pagina': 'página', 'paginas': 'páginas',
    'conteudo': 'conteúdo', 'conteudos': 'conteúdos',
    'saude': 'saúde', 'mes': 'mês', 'tres': 'três',
    'gratis': 'grátis', 'nivel': 'nível', 'niveis': 'níveis',
    'valido': 'válido', 'valida': 'válida',
    'automatico': 'automático', 'automatica': 'automática',
    'altomatico': 'automático', 'altomatica': 'automática',
    'eletronico': 'eletrônico', 'eletronica': 'eletrônica',
    'modulo': 'módulo', 'modulos': 'módulos',
    'periodo': 'período', 'periodos': 'períodos',
    'historia': 'história', 'historico': 'histórico',
    'proximo': 'próximo', 'proxima': 'próxima',
    'mintuso': 'minutos', 'mintus': 'minutos', 'minusto': 'minutos',
    'funao': 'função', 'chate': 'chat', 'chacer': 'chat',
    'antedimento': 'atendimento', 'atedimento': 'atendimento',
    'antendente': 'atendente', 'atentente': 'atendente',
    'menas': 'menos'
  };

  // Regras morfológicas para palavras não acentuadas em português
  function derivarCorrecaoMorfologica(termoLower) {
    if (termoLower.length <= 4) return null;

    if (termoLower.endsWith('cao') && !termoLower.includes('ç')) {
      return termoLower.slice(0, -3) + 'ção';
    }
    if (termoLower.endsWith('coes') && !termoLower.includes('ç')) {
      return termoLower.slice(0, -4) + 'ções';
    }
    if (termoLower.endsWith('sao') && !termoLower.includes('são') && !termoLower.includes('ssão')) {
      return termoLower.slice(0, -3) + 'são';
    }
    if (termoLower.endsWith('ario') && !termoLower.includes('á')) {
      return termoLower.slice(0, -4) + 'ário';
    }
    if (termoLower.endsWith('arios') && !termoLower.includes('á')) {
      return termoLower.slice(0, -5) + 'ários';
    }
    if (termoLower.endsWith('avel') && !termoLower.includes('á')) {
      return termoLower.slice(0, -4) + 'ável';
    }
    if (termoLower.endsWith('ivel') && !termoLower.includes('í')) {
      return termoLower.slice(0, -4) + 'ível';
    }

    return null;
  }

  // Preserva a caixa alta / primeira letra maiúscula
  function aplicarCaixa(original, correcao) {
    if (!correcao || !original) return correcao;
    if (original === original.toUpperCase() && original.length > 1) {
      return correcao.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return correcao.charAt(0).toUpperCase() + correcao.slice(1);
    }
    return correcao;
  }

  // Analisa o texto e detecta palavras corrigíveis
  function analisarTexto(texto) {
    if (!texto || typeof texto !== 'string') return [];
    const tokens = texto.match(/[\wÀ-ÿ]+|[^\wÀ-ÿ]+/g) || [];
    const correcoes = [];
    const seenWords = new Set();

    tokens.forEach(tok => {
      if (!/^[a-zA-ZÀ-ÿ]+$/.test(tok)) return;

      const lower = tok.toLowerCase();
      let sugestao = DICIONARIO_PT_BR[lower] || derivarCorrecaoMorfologica(lower);

      if (sugestao && sugestao.toLowerCase() !== lower) {
        const correcaoFinal = aplicarCaixa(tok, sugestao);
        const chave = tok.toLowerCase() + '->' + correcaoFinal.toLowerCase();
        if (!seenWords.has(chave)) {
          seenWords.add(chave);
          correcoes.push({
            original: tok,
            sugestao: correcaoFinal
          });
        }
      }
    });

    return correcoes;
  }

  // Substitui uma palavra específica mantendo o cursor
  function substituirPalavraNoInput(input, palavraOriginal, palavraCorreta) {
    const val = input.value;
    const regex = new RegExp('\\b' + palavraOriginal + '\\b', 'i');
    const novoValor = val.replace(regex, palavraCorreta);
    input.value = novoValor;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  // Substitui todas as correções encontradas no input
  function corrigirTudoNoInput(input, listaCorrecoes) {
    let val = input.value;
    listaCorrecoes.forEach(item => {
      const regex = new RegExp('\\b' + item.original + '\\b', 'gi');
      val = val.replace(regex, item.sugestao);
    });
    input.value = val;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  // Inicializa o corretor em um elemento de input
  function anexarCorretor(input) {
    if (!input || input.__corretorPtBrAtivo) return;
    input.__corretorPtBrAtivo = true;

    // 1. Ativa suporte nativo do navegador
    input.setAttribute('spellcheck', 'true');
    input.setAttribute('lang', 'pt-BR');
    input.setAttribute('autocorrect', 'on');
    input.setAttribute('autocapitalize', 'sentences');

    // 2. Encontra ou cria o container da barra do corretor
    const composer = input.closest('.chat-composer') || input.parentElement;
    if (!composer) return;

    let bar = composer.parentElement.querySelector('.chat-spellcheck-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'chat-spellcheck-bar';
      bar.style.display = 'none';

      bar.innerHTML = `
        <div class="chat-spellcheck-header">
          <div class="chat-spellcheck-title">
            <span class="flag">🇧🇷</span>
            <i class="fa-solid fa-spell-check"></i>
            <span>Corretor de Português</span>
            <span class="chat-spellcheck-pulse" title="Verificação em tempo real ativa"></span>
          </div>
          <div class="chat-spellcheck-actions">
            <button type="button" class="btn-corrigir-tudo" style="display:none;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Corrigir Tudo
            </button>
          </div>
        </div>
        <div class="chat-spellcheck-suggestions">
          <span class="spellcheck-hint"><i class="fa-solid fa-keyboard"></i> Digite para verificação ortográfica...</span>
        </div>
      `;

      composer.parentNode.insertBefore(bar, composer);
    }

    const suggestionsEl = bar.querySelector('.chat-spellcheck-suggestions');
    const btnCorrigirTudo = bar.querySelector('.btn-corrigir-tudo');
    let listaAtualCorrecoes = [];

    function renderizarCorrecoes() {
      const texto = input.value || '';

      if (!texto.trim()) {
        listaAtualCorrecoes = [];
        btnCorrigirTudo.style.display = 'none';
        suggestionsEl.innerHTML = '<span class="spellcheck-hint"><i class="fa-solid fa-keyboard"></i> Digite para verificação ortográfica em tempo real...</span>';
        return;
      }

      listaAtualCorrecoes = analisarTexto(texto);

      if (listaAtualCorrecoes.length === 0) {
        btnCorrigirTudo.style.display = 'none';
        suggestionsEl.innerHTML = '<span class="spellcheck-status-ok"><i class="fa-solid fa-circle-check"></i> Ortografia e acentuação corretas</span>';
      } else {
        btnCorrigirTudo.style.display = 'inline-flex';
        suggestionsEl.innerHTML = '';

        listaAtualCorrecoes.forEach(item => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'spellcheck-chip';
          chip.title = 'Clique para corrigir "' + item.original + '" por "' + item.sugestao + '"';
          chip.innerHTML = `
            <span class="chip-err">${escapeHtml(item.original)}</span>
            <span class="chip-arrow">➔</span>
            <span class="chip-fix">${escapeHtml(item.sugestao)}</span>
            <i class="fa-solid fa-check"></i>
          `;

          chip.addEventListener('mousedown', (e) => {
            e.preventDefault();
            substituirPalavraNoInput(input, item.original, item.sugestao);
          });

          suggestionsEl.appendChild(chip);
        });
      }
    }

    if (btnCorrigirTudo) {
      btnCorrigirTudo.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (listaAtualCorrecoes.length > 0) {
          corrigirTudoNoInput(input, listaAtualCorrecoes);
        }
      });
    }

    input.addEventListener('focus', () => {
      bar.style.display = 'flex';
      renderizarCorrecoes();
    });

    input.addEventListener('input', () => {
      bar.style.display = 'flex';
      renderizarCorrecoes();
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement !== input && (!input.value || !input.value.trim())) {
          bar.style.display = 'none';
        }
      }, 250);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => {
          if (!input.value || !input.value.trim()) {
            renderizarCorrecoes();
          }
        }, 100);
      }
    });

    if (input.value && input.value.trim()) {
      bar.style.display = 'flex';
      renderizarCorrecoes();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function autoInit() {
    const inputs = document.querySelectorAll('#msgInput, input[data-corretor="pt-br"]');
    inputs.forEach(anexarCorretor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.ativarCorretorOrtografico = anexarCorretor;
})();
