/**
 * Sistema de comentários e avaliações do produto.
 * Controla abertura do popup, envio das notas,
 * renderização dos comentários e estatísticas de estrelas.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Confere se o usuário atual é administrador.
  let isAdmin = localStorage.getItem("isAdmin") === "true";

  const btnComentar = document.getElementById("btnComentar");
  const btnAvaliar = document.querySelector(".btn-avaliar");
  const popup = document.getElementById("popupComentario");
  const fecharPopup = document.getElementById("fecharPopup");
  const fotosInput = document.getElementById("fotosComentario");
  const previewDiv = document.getElementById("previewFotos");
  const videoInput = document.getElementById("videoComentario");
  const previewVideo = document.getElementById("previewVideo");
  const formComentario = document.getElementById("formComentario");

  // Se não estiver logado como Cliente ou Administrador, limpa chaves residuais de cliente
  const tipoAtual = localStorage.getItem("tipoUsuario");
  if (tipoAtual !== "Cliente" && tipoAtual !== "Administrador") {
    try {
      localStorage.removeItem("clienteId");
      localStorage.removeItem("token");
      sessionStorage.removeItem("activeClienteSession");
    } catch (e) {}
  }

  // Popup estilizado para login obrigatório
  const popupLoginObrigatorio = document.getElementById("popupLoginObrigatorio");
  const fecharPopupLogin = document.getElementById("fecharPopupLogin");
  const btnFecharLoginPopup = document.getElementById("btnFecharLoginPopup");
  const btnIrLoginPopup = document.getElementById("btnIrLoginPopup");
  const btnCancelarLoginPopup = document.getElementById("btnCancelarLoginPopup");

  // Garantir que os popups estejam sempre escondidos inicialmente
  if (popup) popup.style.display = 'none';
  if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = 'none';

  // Mostrar o botão de avaliar sempre visível para todos os visitantes
  if (btnComentar) btnComentar.style.display = "inline-block";
  if (btnAvaliar) btnAvaliar.style.display = "inline-block";

  function mostrarPopupLoginObrigatorio() {
    if (popup) popup.style.display = "none";
    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "flex";
  }
  function fecharPopupLoginObrigatorio() {
    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "none";
  }

  // Popup Estiloso de Sucesso / Feedback
  function garantirPopupFeedback() {
    let popupSucesso = document.getElementById("popupSucessoComentario");
    if (!popupSucesso) {
      popupSucesso = document.createElement("div");
      popupSucesso.id = "popupSucessoComentario";
      popupSucesso.className = "popup-sucesso-overlay modo-criacao";
      popupSucesso.innerHTML = `
        <div class="popup-sucesso-card">
          <span id="fecharPopupSucesso" class="popup-sucesso-close" title="Fechar">&times;</span>
          <div id="popupSucessoIcone" class="popup-sucesso-icon">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <h2 id="popupSucessoTitulo">Avaliação Enviada!</h2>
          <p id="popupSucessoMensagem">Sua avaliação foi enviada com sucesso e já está disponível para todos os clientes.</p>
          <div class="popup-sucesso-acoes">
            <button id="btnFecharSucessoPopup" class="btn-fechar-sucesso">
              <i class="fa-solid fa-check"></i> Entendido
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(popupSucesso);
    }
    const btnFechar = popupSucesso.querySelector("#fecharPopupSucesso");
    const btnAcao = popupSucesso.querySelector("#btnFecharSucessoPopup");
    if (btnFechar) btnFechar.onclick = fecharPopupFeedback;
    if (btnAcao) btnAcao.onclick = fecharPopupFeedback;
    popupSucesso.onclick = (e) => {
      if (e.target === popupSucesso) fecharPopupFeedback();
    };
    return popupSucesso;
  }

  function mostrarPopupFeedback(tipo = 'criacao') {
    const popupSucesso = garantirPopupFeedback();
    const icone = popupSucesso.querySelector("#popupSucessoIcone");
    const titulo = popupSucesso.querySelector("#popupSucessoTitulo");
    const mensagem = popupSucesso.querySelector("#popupSucessoMensagem");
    const btnAcao = popupSucesso.querySelector("#btnFecharSucessoPopup");

    if (tipo === 'edicao') {
      popupSucesso.className = "popup-sucesso-overlay modo-edicao";
      if (icone) icone.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      if (titulo) titulo.textContent = "Avaliação Atualizada!";
      if (mensagem) mensagem.textContent = "Suas alterações foram salvas com sucesso no banco de dados e já estão visíveis na página.";
      if (btnAcao) btnAcao.innerHTML = '<i class="fa-solid fa-check"></i> Concluído';
    } else {
      popupSucesso.className = "popup-sucesso-overlay modo-criacao";
      if (icone) icone.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      if (titulo) titulo.textContent = "Avaliação Enviada!";
      if (mensagem) mensagem.textContent = "Obrigado por sua opinião! Sua avaliação foi cadastrada com sucesso e já está visível para todos os clientes.";
      if (btnAcao) btnAcao.innerHTML = '<i class="fa-solid fa-check"></i> Excelente!';
    }

    if (popup) popup.style.display = "none";
    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "none";
    popupSucesso.style.display = "flex";
  }

  function fecharPopupFeedback() {
    const popupSucesso = document.getElementById("popupSucessoComentario");
    if (popupSucesso) popupSucesso.style.display = "none";
  }
  if (fecharPopupLogin) fecharPopupLogin.onclick = fecharPopupLoginObrigatorio;
  if (btnFecharLoginPopup) btnFecharLoginPopup.onclick = fecharPopupLoginObrigatorio;
  if (btnCancelarLoginPopup) btnCancelarLoginPopup.onclick = fecharPopupLoginObrigatorio;
  if (btnIrLoginPopup) btnIrLoginPopup.addEventListener('click', function() {
    // redireciona para a página de login incluindo returnTo = página atual
    // adiciona o parâmetro openComment=1 para que, após login e retorno, o formulário abra automaticamente
    let current = window.location.pathname + window.location.search + window.location.hash;
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      params.set('openComment', '1');
      const path = url.pathname + '?' + params.toString() + (url.hash || '');
      current = path;
    } catch (err) {
      // fallback simples
      if (current.indexOf('?') === -1) current += '?openComment=1'; else current += '&openComment=1';
    }
    const isHtmlDir = window.location.pathname.includes('/html/');
    const loginUrl = (isHtmlDir ? 'login-cliente.html' : 'html/login-cliente.html') + '?returnTo=' + encodeURIComponent(current);
    window.location.href = loginUrl;
  });

  function usuarioLogado() {
    const tipoUsuario = localStorage.getItem("tipoUsuario");
    const token = localStorage.getItem("token");
    const clienteId = localStorage.getItem("clienteId");

    // Validação estrita: somente se for Cliente autenticado com token/id válidos
    if (tipoUsuario === "Cliente") {
      const temToken = Boolean(token && token !== "null" && token !== "undefined" && token.trim() !== "");
      const temId = Boolean(clienteId && clienteId !== "null" && clienteId !== "undefined" && String(clienteId).trim() !== "");
      return temToken || temId;
    }

    // Administrador autenticado
    if (tipoUsuario === "Administrador") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      const temToken = Boolean(token && token !== "null" && token !== "undefined" && token.trim() !== "");
      return isAdmin || temToken;
    }

    // Qualquer outro caso (visitante / não logado)
    return false;
  }

  function resetarFormComentario() {
    if (formComentario) {
      delete formComentario.dataset.editId;
      formComentario.reset();
      const tituloPopup = popup ? popup.querySelector("h2") : null;
      if (tituloPopup) tituloPopup.textContent = "Deixe seu comentário";
      const btnSubmit = formComentario.querySelector("button[type='submit']");
      if (btnSubmit) btnSubmit.textContent = "Enviar";
    }
    if (previewDiv) previewDiv.innerHTML = "";
    if (previewVideo) previewVideo.innerHTML = "";
  }

  function fecharModalComentario() {
    if (popup) popup.style.display = "none";
    resetarFormComentario();
  }

  function abrirPopupComentario() {
    if (usuarioLogado()) {
      resetarFormComentario();
      if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "none";
      if (popup) {
        popup.style.display = "flex";
        // Preenche o nome do cliente se estiver logado e o campo estiver vazio
        const autorInput = document.getElementById("autor");
        if (autorInput && !autorInput.value) {
          const nome = localStorage.getItem("nome");
          const sobrenome = localStorage.getItem("sobrenome");
          if (nome && nome !== "null") autorInput.value = `${nome} ${sobrenome && sobrenome !== 'null' ? sobrenome : ''}`.trim();
        }
      }
    } else {
      if (popup) popup.style.display = "none";
      mostrarPopupLoginObrigatorio();
    }
  }

  function iniciarEdicaoComentario(comentario) {
    if (!usuarioLogado()) {
      mostrarPopupLoginObrigatorio();
      return;
    }

    if (!formComentario) return;
    formComentario.dataset.editId = comentario.id || comentario._id;

    const tituloPopup = popup ? popup.querySelector("h2") : null;
    if (tituloPopup) tituloPopup.textContent = "Editar sua avaliação";

    const textoInput = document.getElementById("texto");
    const autorInput = document.getElementById("autor");
    const notaSelect = document.getElementById("notaProduto");
    const btnSubmit = formComentario.querySelector("button[type='submit']");

    if (textoInput) textoInput.value = comentario.texto || "";
    if (autorInput) autorInput.value = comentario.autor || "";
    const notaValor = comentario.nota || comentario.notaProduto || "";
    if (notaSelect) notaSelect.value = String(notaValor);
    if (btnSubmit) btnSubmit.textContent = "Salvar alterações";

    if (previewDiv) previewDiv.innerHTML = "";
    if (previewVideo) previewVideo.innerHTML = "";

    if (popupLoginObrigatorio) popupLoginObrigatorio.style.display = "none";
    if (popup) popup.style.display = "flex";
  }

  const botoesAvaliar = document.querySelectorAll("#btnComentar, .btn-avaliar");
  botoesAvaliar.forEach((btn) => {
    btn.style.display = "inline-block";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      abrirPopupComentario();
    });
  });

  // Garante que o popupComentario nunca aparece inicialmente para não logados
  if (!usuarioLogado()) {
    if (popup) popup.style.display = "none";
  }
  // Se a URL contém openComment=1 e o usuário está logado, abre o formulário automaticamente
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('openComment') === '1') {
      if (usuarioLogado() && popup) {
        abrirPopupComentario();
      }
      // remover o parâmetro da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete('openComment');
      window.history.replaceState({}, document.title, url.toString());
    }
  } catch (e) {
    // ignore
  }
  if (fecharPopup) fecharPopup.addEventListener("click", () => fecharModalComentario());
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) fecharModalComentario();
    });
  }
  if (popupLoginObrigatorio) {
    popupLoginObrigatorio.addEventListener("click", (e) => {
      if (e.target === popupLoginObrigatorio) fecharPopupLoginObrigatorio();
    });
  }

  // Buscar comentários do servidor para este produto
  let comentarios = [];
  async function carregarComentariosDoServidor() {
    const params = new URLSearchParams(window.location.search);
    const produtoId = params.get('id') || params.get('produtoId') || params.get('produto');
    // construir base da API: prioriza a configuração carregada por auth-links (`window.AUTH_SERVER`)
    const host = window.location.hostname;
    const proto = window.location.protocol;
    const defaultBase = `${proto}//${host}:3000`;
    const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
    const apiUrl = `${apiBase}/api/comentarios` + (produtoId ? ('?produtoId=' + encodeURIComponent(produtoId)) : '');

    // tenta primeiro API configurada (AUTH_SERVER ou host:3000), se falhar tenta relativo (útil em produção se API for proxy)
    try {
      let resp = await fetch(apiUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Resposta não OK: ' + resp.status);
      const lista = await resp.json();
      comentarios = Array.isArray(lista) ? lista : [];
      atualizarComentarios(comentarios);
      atualizarEstatisticas(comentarios);
      return;
    } catch (err) {
      try {
        const relativePath = '/api/comentarios' + (produtoId ? ('?produtoId=' + encodeURIComponent(produtoId)) : '');
        const resp2 = await fetch(relativePath);
        if (!resp2.ok) throw new Error('Resposta relativa não OK: ' + resp2.status);
        const lista2 = await resp2.json();
        comentarios = Array.isArray(lista2) ? lista2 : [];
        atualizarComentarios(comentarios);
        atualizarEstatisticas(comentarios);
        return;
      } catch (err2) {
        console.warn('Erro ao carregar comentarios do servidor (apiBase e relativo):', err && err.message, err2 && err2.message);
        comentarios = [];
        atualizarComentarios(comentarios);
        atualizarEstatisticas(comentarios);
        return;
      }
    }
  }
  carregarComentariosDoServidor();

  // Filtro de comentários por estrela
  const filtroTudo = document.getElementById("filtro-tudo");
  const botoesFiltro = document.querySelectorAll(".filtros-avaliacoes button");
  if (botoesFiltro.length > 0) {
    botoesFiltro.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        // idx 0 = Tudo, 1 = 5 estrelas, 2 = 4, ...
        botoesFiltro.forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
            if (idx === 0) {
              atualizarComentarios(comentarios);
            } else {
              const estrela = 6 - idx;
              const filtrados = comentarios.filter(c => Number(c.nota || c.notaProduto || 0) === estrela);
              atualizarComentarios(filtrados);
            }
      });
    });
  }

  // Pré-visualização de fotos no formulário
  fotosInput.addEventListener("change", () => {
    previewDiv.innerHTML = "";
    const files = fotosInput.files;
    for (let i = 0; i < files.length && i < 5; i++) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "60px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.style.margin = "5px";
        img.style.borderRadius = "6px";
        previewDiv.appendChild(img);
      };
      reader.readAsDataURL(files[i]);
    }
  });

  // Pré-visualização de vídeo no formulário
  videoInput.addEventListener("change", () => {
    previewVideo.innerHTML = "";
    if (videoInput.files.length > 0) {
      const file = videoInput.files[0];
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.style.width = "120px";
      video.style.height = "80px";
      video.style.marginTop = "10px";
      video.style.borderRadius = "6px";
      previewVideo.appendChild(video);
    }
  });

  // Salva ou atualiza a avaliação enviada pelo usuário.
  // Também atualiza a lista de comentários e os gráficos de estrelas.
  formComentario.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!usuarioLogado()) {
      if (popup) popup.style.display = "none";
      mostrarPopupLoginObrigatorio();
      return;
    }

    let autor = document.getElementById("autor").value.trim();
    if (!autor) {
      const nome = localStorage.getItem("nome");
      const sobrenome = localStorage.getItem("sobrenome");
      if (nome) autor = `${nome} ${sobrenome || ''}`.trim();
    }
    const texto = document.getElementById("texto").value.trim();
    const notaProduto = parseInt(document.getElementById("notaProduto").value) || 0;

    if (!texto || !notaProduto) {
      alert("Preencha comentário e selecione uma nota.");
      return;
    }

    const editId = formComentario.dataset.editId;

    // preparar FormData para envio ao servidor
    try {
      const params = new URLSearchParams(window.location.search);
      const produtoId = params.get('id') || params.get('produtoId') || params.get('produto');
      const fd = new FormData();
      fd.append('autor', autor || '');
      fd.append('texto', texto);
      fd.append('nota', String(notaProduto));
      if (produtoId) fd.append('produtoId', produtoId);
      const clienteId = localStorage.getItem('clienteId');
      if (clienteId) fd.append('clienteId', clienteId);

      // anexar fotos
      for (let i = 0; i < fotosInput.files.length && i < 5; i++) {
        fd.append('fotos', fotosInput.files[i]);
      }
      // anexar video (apenas 1)
      if (videoInput.files.length > 0) fd.append('video', videoInput.files[0]);

      // enviar para API configurada (AUTH_SERVER ou host:3000) e, se falhar, tentar caminho relativo
      const host = window.location.hostname;
      const proto = window.location.protocol;
      const defaultBase = `${proto}//${host}:3000`;
      const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
      const endpoint = editId ? `/api/comentarios/${encodeURIComponent(editId)}` : '/api/comentarios';
      const method = editId ? 'PUT' : 'POST';

      let resp = null;
      try {
        resp = await fetch(apiBase + endpoint, { method, body: fd });
      } catch (err) {
        // tentativa fallback
        const fallbackUrl = (function(){ try{ const port = location.port; if(port && port !== '3000') return `${location.protocol}//${location.hostname}:3000`; }catch(e){} return ''; })() + endpoint;
        resp = await fetch(fallbackUrl, { method, body: fd });
      }

      let j = {};
      try {
        j = await resp.json();
      } catch (e) {
        j = { sucesso: false, mensagem: `Erro ${resp ? resp.status : ''}: Não foi possível processar a resposta do servidor.` };
      }

      if (!resp || !resp.ok || !j.sucesso) {
        alert(j.mensagem || (editId ? 'Erro ao atualizar comentário' : 'Erro ao enviar comentário'));
        return;
      }

      const ehEdicao = Boolean(editId);

      // limpar formulário e recarregar comentários do servidor
      fecharModalComentario();
      await carregarComentariosDoServidor();

      // Exibe o popup estiloso de sucesso
      mostrarPopupFeedback(ehEdicao ? 'edicao' : 'criacao');
    } catch (err) {
      console.error('Erro ao enviar/atualizar comentario:', err && err.message);
      alert(err && err.message ? `Erro ao salvar: ${err.message}` : 'Erro ao salvar comentário. Tente mais tarde.');
    }
  });

  // Função para remover comentário do servidor
  async function removerComentario(c) {
    try {
      const id = c.id || c._id;
      if (!id) return alert('Comentário sem id.');

      const host = window.location.hostname;
      const proto = window.location.protocol;
      const defaultBase = `${proto}//${host}:3000`;
      const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
      const clienteId = localStorage.getItem("clienteId");
      const urlQuery = clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : '';

      let resp = null;
      try {
        resp = await fetch(apiBase + '/api/comentarios/' + encodeURIComponent(id) + urlQuery, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        const fallbackUrl = (function(){ try{ const port = location.port; if(port && port !== '3000') return `${location.protocol}//${location.hostname}:3000`; }catch(e){} return ''; })() + '/api/comentarios/' + encodeURIComponent(id) + urlQuery;
        resp = await fetch(fallbackUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      let j = {};
      try {
        j = await resp.json();
      } catch (e) {
        j = { sucesso: false, mensagem: `Erro ${resp ? resp.status : ''}: Resposta inválida do servidor.` };
      }
      if (!resp || !resp.ok || !j.sucesso) return alert(j.mensagem || 'Falha ao remover comentário');
      alert("Comentário removido com sucesso!");
      await carregarComentariosDoServidor();
    } catch (err) {
      console.error('Erro ao remover comentario:', err);
      alert('Erro ao remover comentário. Tente mais tarde.');
    }
  }

  // Renderiza cada comentário na tela e controla botões de editar e remover.
  function atualizarComentarios(listaComentarios) {
    const lista = document.getElementById("lista-comentarios");
    if (!lista) return;
    lista.innerHTML = "";
    isAdmin = localStorage.getItem("isAdmin") === "true";

    function resolverUrlMidia(src) {
      if (!src || typeof src !== "string") return "";
      if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
        return src;
      }
      const host = window.location.hostname;
      const proto = window.location.protocol;
      const defaultBase = `${proto}//${host}:3000`;
      const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
      return apiBase + (src.startsWith('/') ? src : ('/' + src));
    }

    const clienteLogadoId = localStorage.getItem("clienteId");
    const clienteLogadoNome = (localStorage.getItem("nome") || "").trim().toLowerCase();
    const clienteLogadoSobrenome = (localStorage.getItem("sobrenome") || "").trim().toLowerCase();
    const clienteLogadoNomeCompleto = [clienteLogadoNome, clienteLogadoSobrenome].filter(Boolean).join(" ").trim();
    const tipoUsuario = localStorage.getItem("tipoUsuario");
    const isClienteLogado = tipoUsuario === "Cliente" && Boolean(clienteLogadoId || clienteLogadoNome);

    listaComentarios.forEach((c) => {
      const div = document.createElement("div");
      div.classList.add("comentario");

      const topo = document.createElement("div");
      topo.classList.add("comentario-topo");

      const info = document.createElement("div");
      info.classList.add("comentario-info");

      // Avatar do cliente (à esquerda do nome)
      const avatarDiv = document.createElement("div");
      avatarDiv.classList.add("comentario-avatar");

      const nomeAutor = (c.autor || 'Anônimo').trim();
      const inicial = nomeAutor ? nomeAutor.charAt(0).toUpperCase() : 'U';

      // Permissão e verificação de autor
      const commentAutor = (c.autor || "").trim().toLowerCase();
      const ehAutor = Boolean(
        (clienteLogadoId && c.clienteId && String(c.clienteId) === String(clienteLogadoId)) ||
        (clienteLogadoNomeCompleto && commentAutor === clienteLogadoNomeCompleto) ||
        (clienteLogadoNome && commentAutor.startsWith(clienteLogadoNome))
      );

      // Identifica URL da foto do cliente
      let fotoUrl = null;
      if (c.clienteFoto) {
        fotoUrl = resolverUrlMidia(c.clienteFoto);
      } else if (c.clienteId) {
        fotoUrl = resolverUrlMidia(`/api/cliente/${c.clienteId}/foto`);
      } else if (isClienteLogado && ehAutor && localStorage.getItem("foto")) {
        fotoUrl = resolverUrlMidia(localStorage.getItem("foto"));
      }

      if (fotoUrl) {
        const imgAvatar = document.createElement("img");
        imgAvatar.src = fotoUrl;
        imgAvatar.alt = nomeAutor;
        imgAvatar.classList.add("avatar-img");
        imgAvatar.onerror = () => {
          imgAvatar.style.display = "none";
          avatarDiv.textContent = inicial;
        };
        avatarDiv.appendChild(imgAvatar);
      } else {
        avatarDiv.textContent = inicial;
      }
      info.appendChild(avatarDiv);

      const autorDetalhes = document.createElement("div");
      autorDetalhes.classList.add("comentario-autor-detalhes");
      const notaCur = Number(c.nota || c.notaProduto || 0);
      autorDetalhes.innerHTML = `<strong>${nomeAutor}:</strong> <span class="estrelas">${"★".repeat(notaCur)}</span>`;
      info.appendChild(autorDetalhes);

      topo.appendChild(info);

      // Permissão: Administrador ou o próprio Cliente que publicou
      const podeGerenciar = Boolean(isAdmin || (isClienteLogado && ehAutor));

      if (podeGerenciar) {
        const acoesDiv = document.createElement("div");
        acoesDiv.classList.add("comentario-acoes");

        // Botão Editar
        const btnEditar = document.createElement("button");
        btnEditar.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar';
        btnEditar.classList.add("btn-editar-comentario");
        btnEditar.title = "Editar este comentário";
        btnEditar.addEventListener("click", () => iniciarEdicaoComentario(c));
        acoesDiv.appendChild(btnEditar);

        // Botão Remover
        const btnRemover = document.createElement("button");
        btnRemover.innerHTML = '<i class="fa-solid fa-trash"></i> Remover';
        btnRemover.classList.add("btn-remover-comentario");
        btnRemover.title = "Remover este comentário";
        btnRemover.addEventListener("click", async () => {
          if (!confirm("Deseja realmente remover esta avaliação?")) return;
          await removerComentario(c);
        });
        acoesDiv.appendChild(btnRemover);

        topo.appendChild(acoesDiv);
      }

      div.appendChild(topo);

      const texto = document.createElement("p");
      texto.textContent = c.texto;
      div.appendChild(texto);

      const midiaDiv = document.createElement("div");
      midiaDiv.classList.add("comentario-midia");

      if (c.fotos && c.fotos.length > 0) {
        c.fotos.forEach(foto => {
          const img = document.createElement("img");
          const urlResolvida = resolverUrlMidia(foto);
          img.src = urlResolvida;
          img.addEventListener("click", () => abrirMediaPopup(c, "img", urlResolvida));
          midiaDiv.appendChild(img);
        });
      }

      if (c.video) {
        const video = document.createElement("video");
        const rawVideoSrc = typeof c.video === 'string' ? c.video : (c.video.dataUri || (c.video.data && c.video.data));
        const videoSrc = resolverUrlMidia(rawVideoSrc);
        video.src = videoSrc;
        video.controls = true;
        video.addEventListener("click", () => abrirMediaPopup(c, "video", videoSrc));
        midiaDiv.appendChild(video);
      }

      div.appendChild(midiaDiv);
      lista.appendChild(div);
    });
  }

  // Abre um popup ampliado para visualizar fotos e vídeos enviados
  // nos comentários, com troca entre miniaturas.
  function abrirMediaPopup(comentario, tipoInicial, srcInicial) {
    const mediaPopup = document.getElementById("mediaPopup");
    const mediaContent = document.getElementById("mediaContent");
    mediaContent.innerHTML = "";

    function resolverUrlMidia(src) {
      if (!src || typeof src !== "string") return "";
      if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
        return src;
      }
      const host = window.location.hostname;
      const proto = window.location.protocol;
      const defaultBase = `${proto}//${host}:3000`;
      const apiBase = (window.AUTH_SERVER && window.AUTH_SERVER.replace(/\/$/, '')) || defaultBase;
      return apiBase + (src.startsWith('/') ? src : ('/' + src));
    }

    const principal = document.createElement("div");
    principal.style.textAlign = "center";

    if (tipoInicial === "img") {
      const img = document.createElement("img");
      img.src = resolverUrlMidia(srcInicial);
      principal.appendChild(img);
    } else if (tipoInicial === "video") {
      const video = document.createElement("video");
      video.src = resolverUrlMidia(srcInicial);
      video.controls = true;
      video.autoplay = true;
      principal.appendChild(video);
    }
    mediaContent.appendChild(principal);

    const miniaturas = document.createElement("div");
    miniaturas.style.display = "flex";
    miniaturas.style.gap = "8px";
    miniaturas.style.marginTop = "12px";
    miniaturas.style.flexWrap = "wrap";
    miniaturas.style.justifyContent = "center";

    if (comentario.fotos && comentario.fotos.length > 0) {
      comentario.fotos.forEach(foto => {
        const thumb = document.createElement("img");
        const resolved = resolverUrlMidia(foto);
        thumb.src = resolved;
        thumb.style.width = "60px";
        thumb.style.height = "60px";
        thumb.style.objectFit = "cover";
        thumb.style.cursor = "pointer";
        thumb.style.borderRadius = "6px";
        thumb.addEventListener("click", () => {
          principal.innerHTML = "";
          const img = document.createElement("img");
          img.src = resolved;
          principal.appendChild(img);
        });
        miniaturas.appendChild(thumb);
      });
    }

    if (comentario.video) {
      const thumbVideo = document.createElement("video");
      const rawV = typeof comentario.video === 'string' ? comentario.video : (comentario.video.dataUri || (comentario.video.data && comentario.video.data));
      const resolvedV = resolverUrlMidia(rawV);
      thumbVideo.src = resolvedV;
      thumbVideo.muted = true;
      thumbVideo.loop = true;
      thumbVideo.autoplay = true;
      thumbVideo.style.width = "80px";
      thumbVideo.style.height = "60px";
      thumbVideo.style.cursor = "pointer";
      thumbVideo.style.borderRadius = "6px";
      thumbVideo.addEventListener("click", () => {
        principal.innerHTML = "";
        const video = document.createElement("video");
        video.src = resolvedV;
        video.controls = true;
        video.autoplay = true;
        principal.appendChild(video);
      });
      miniaturas.appendChild(thumbVideo);
    }

    mediaContent.appendChild(miniaturas);
    mediaPopup.style.display = "flex";
  }

    const closeMedia = document.getElementById("closeMedia");
  if (closeMedia) {
    closeMedia.addEventListener("click", () => {
      document.getElementById("mediaPopup").style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    const mediaPopup = document.getElementById("mediaPopup");
    if (e.target === mediaPopup) {
      mediaPopup.style.display = "none";
    }
  });

  // Calcula média, porcentagem e distribuição das notas.
  // Esses dados alimentam as barras e os percentuais exibidos na página.
  function atualizarEstatisticas(listaComentarios) {
    const estatisticasDiv = document.getElementById("estatisticasComentarios");
    if (!estatisticasDiv) return;

    if (listaComentarios.length === 0) {
      estatisticasDiv.textContent = "Nenhum comentário ainda.";
      document.getElementById("mediaEstrelas").textContent = "-";
      document.getElementById("estrelasMedia").textContent = "☆☆☆☆☆";
      return;
    }

    const total = listaComentarios.length;
    const somaNotas = listaComentarios.reduce((acc, c) => acc + (Number(c.nota || c.notaProduto || 0)), 0);
    const media = (somaNotas / total).toFixed(1);

    // Calcular distribuição de estrelas
    const contador = [0, 0, 0, 0, 0, 0]; // índice 1-5
    listaComentarios.forEach(c => {
      const nota = Number(c.nota || c.notaProduto || 0);
      if (nota >= 1 && nota <= 5) contador[nota]++;
    });

    for (let i = 1; i <= 5; i++) {
      const porcent = total ? ((contador[i] / total) * 100).toFixed(0) : 0;
      const barra = document.getElementById(`barra${i}`);
      const perc = document.getElementById(`perc${i}`);
      if (barra) barra.style.width = `${porcent}%`;
      if (perc) perc.textContent = `${porcent}%`;

      // Atualiza contagem nos botões já existentes de filtro
      const btnFiltro = document.querySelector(`.filtros-avaliacoes button:nth-child(${6 - i + 1})`);
      if (btnFiltro) {
        btnFiltro.textContent = `${i} Estrela${i > 1 ? "s" : ""} (${contador[i]})`;
      }
    }

    const ratingPercent = ((media / 5) * 100).toFixed(0);
    estatisticasDiv.innerHTML = `Total de avaliações: <strong>${total}</strong> | Média: <strong>${media} ★</strong> (<strong>${ratingPercent}%</strong>)`;

    // Atualiza média visual
    const mediaEstrelas = document.getElementById("mediaEstrelas");
    const estrelasMedia = document.getElementById("estrelasMedia");
    if (mediaEstrelas) mediaEstrelas.textContent = media;
    if (estrelasMedia) {
      const cheias = Math.round(media);
      estrelasMedia.textContent = "★".repeat(cheias) + "☆".repeat(5 - cheias);
    }
  }
});
