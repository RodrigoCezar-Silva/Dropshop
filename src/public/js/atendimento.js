(function(){
  'use strict';
  // API base: prefer explicit `window.__API_BASE__` if set, otherwise use relative paths
  const API_BASE = (typeof window !== 'undefined' && typeof window.__API_BASE__ !== 'undefined') ? window.__API_BASE__ : '';
  // backendBase será preenchido com a URL do backend (ex: http://localhost:3000) quando detectado
  let backendBase = API_BASE || '';
  // Se a página estiver sendo servida por Live Server (portas 5500/5501 ou qualquer porta !=3000)
  // e não houver `API_BASE` definido, entramos em modo offline local para evitar fetchs que causam 404/ERR.
  const isLiveServerFallback = (!API_BASE) && (location.port && String(location.port) !== '3000');

  function normalizeApiPath(path){
    if(!path) return path;
    try{
      // already absolute
      const u = new URL(path, location.href);
      if(u.hostname && u.pathname.startsWith('/api/')){
        // If host is same-origin but page is served by Live Server, ensure port 3000
        if((u.port && u.port !== '3000') || (!u.port && location.port && location.port !== '3000')){
          return (API_BASE||'') + u.pathname + u.search;
        }
        return u.origin + u.pathname + u.search;
      }
    }catch(e){}
    // relative API paths
    if(path.startsWith('/api/')) return (API_BASE||'') + path;
    return path;
  }

  const mensagensEl = document.getElementById('mensagens');
  const listaConversasEl = document.getElementById('listaConversas');
  const currentConvNameEl = document.getElementById('currentConvName');
  const form = document.getElementById('formAtendimento');
  const input = document.getElementById('inputMsg');
  const btnEnviar = document.getElementById('btnEnviar');
  const newConvBtn = document.getElementById('newConv');

  let conversationId = null;
  let polling = null;
  let backendAvailable = true;
  let backendCheckInterval = null;
  const BACKEND_POLL_INTERVAL = 5000; // ms

  function fetchWithTimeout(resource, options = {}){
    const { timeout = 2000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
  }

  function apiUrl(path){
    const base = (API_BASE || backendBase || '');
    return (base || '') + path;
  }

  async function apiFetch(path, opts){
    const url = apiUrl(path);
    return fetch(url, opts);
  }

  async function checkBackend(){
    // Não probe o backend quando estivermos no Live Server: evita 404/ERR_CONNECTION_REFUSED.
    if (isLiveServerFallback) return false;
    if (backendBase) return true;
    const candidates = [];
    if (API_BASE) candidates.push(API_BASE);
    candidates.push('http://localhost:3000', 'http://127.0.0.1:3000');
    for (const c of candidates) {
      try {
        const r = await fetchWithTimeout(c + '/api/conversations', { timeout: 1000 });
        if (r && r.ok) { backendBase = c; return true; }
      } catch (e) {
        // ignore probe errors
      }
    }
    return false;
  }

  function scheduleBackendChecks(){
    if (isLiveServerFallback) return; // não agendar checagens no modo Live Server offline
    if(backendCheckInterval) return;
    backendCheckInterval = setInterval(async ()=>{
      const ok = await checkBackend();
      if(ok){
        backendAvailable = true;
        clearInterval(backendCheckInterval); backendCheckInterval = null;
        appendLocalNotice('Conexão com o servidor restabelecida. Sincronizando conversas offline...');
        try{ await syncOfflineStore(); }catch(e){ console.error('syncOfflineStore failed', e); }
        try{ await criarOuAbrirConversacao(); }catch(e){}
      }
    }, BACKEND_POLL_INTERVAL);
  }

  async function syncOfflineStore(){
    try{
      const raw = localStorage.getItem('offline_chat_store');
      if(!raw) return;
      const store = JSON.parse(raw);
      if(!store || !Array.isArray(store.conversations) || store.conversations.length === 0) return;
      // enviar para o servidor
      const r = await fetch(backendBase + '/api/sync-offline-chats', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(store) });
      if(!r.ok) {
        console.warn('syncOfflineStore: server rejected sync', r.status);
        return;
      }
      const resp = await r.json();
      if(resp && resp.sucesso && resp.mapping){
        // atualizar localStorage para refletir novos ids (mapear offline_conversation e atendimento_conversation)
        const mapping = resp.mapping || {};
        // se havia offline_conversation (id), mapear para novo id
        const offConv = localStorage.getItem('offline_conversation');
        if(offConv && mapping[offConv]){
          localStorage.setItem('atendimento_conversation', String(mapping[offConv]));
          localStorage.removeItem('offline_conversation');
        }
        // opcional: limpar offline_chat_store após sincronizar
        localStorage.removeItem('offline_chat_store');
        appendLocalNotice('Conversas offline sincronizadas com sucesso.');
      }
    }catch(e){ console.error('syncOfflineStore error', e); }
  }

  function esc(html){
    const d = document.createElement('div'); d.textContent = html; return d.innerHTML;
  }

  // Extrai nome e sobrenome do título da conversa.
  // Ex.: "Atendimento - Rodrigo Cezar silva de souza null" => "Rodrigo souza"
  function formatAdminShortName(fullName){
    if(!fullName) return '';
    let s = String(fullName || '').trim();
    // remover prefixos comuns
    s = s.replace(/^Atendimento\s*-\s*/i, '');
    // remover tokens 'null' e múltiplos espaços
    s = s.replace(/\bnull\b/ig, '').replace(/\s+/g, ' ').trim();
    if(!s) return '';
    const parts = s.split(' ');
    if(parts.length === 1) return parts[0];
    // retornar primeiro + último
    const first = parts[0];
    const last = parts[parts.length-1];
    return `${first} ${last}`;
  }

  function capitalizeWords(str){
    if(!str) return '';
    return String(str).split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
  }

  async function criarOuAbrirConversacao(createIfMissing = false){
    // Se estivermos em Live Server (modo offline), usar store local em localStorage
    if (isLiveServerFallback) {
      try {
        // garantir store local
        const raw = localStorage.getItem('offline_chat_store');
        let store = raw ? JSON.parse(raw) : { conversations: [] };
        // tenta reutilizar conversa já criada no armazenamento local (offline_conversation)
        const storedId = localStorage.getItem('offline_conversation');
        if (storedId) {
          conversationId = Number(storedId);
          const conv = (store.conversations || []).find(c => String(c.id) === String(conversationId));
          if (conv) {
            renderMensagens(conv.messages || []);
            renderConversationList([ { id: conv.id, name: conv.name } ]);
            try{ input.focus(); }catch(e){}
            return;
          }
        }
        // se não existir conversa offline e não estivermos pedindo criação, apenas renderizar lista local
        if (!createIfMissing) {
          const list = (store.conversations || []).slice();
          if (list.length) {
            renderConversationList(list);
            // abrir a mais recente
            const first = list[0];
            conversationId = first.id;
            localStorage.setItem('offline_conversation', String(conversationId));
            renderMensagens(first.messages || []);
            try{ input.focus(); }catch(e){}
            return;
          }
          // nada para abrir localmente e createIfMissing === false -> não criar
        }
        // criar nova conversa local (quando createIfMissing === true)
        const nome = (localStorage.getItem('nome') || '') + ' ' + (localStorage.getItem('sobrenome') || '');
        const now = Date.now();
        const conv = { id: now, name: `Atendimento - ${nome.trim() || 'Cliente'}`, messages: [], lastMessagePreview: '', unread: 0, online: false, createdAt: now, status: 'open', escalated: false };
        store.conversations = store.conversations || [];
        store.conversations.unshift(conv);
        localStorage.setItem('offline_chat_store', JSON.stringify(store));
        localStorage.setItem('offline_conversation', String(now));
        conversationId = now;
        renderMensagens([]);
        renderConversationList([ { id: conv.id, name: conv.name } ]);
        try{ input.focus(); }catch(e){}
        return;
      } catch (e) { console.error('criarOuAbrirConversacao offline error', e); appendLocalNotice('Erro ao inicializar atendimento offline.'); return; }
    }
    // tentar carregar conversas antigas do servidor (por cliente_email) e renderizá-las
    try{
      const clienteEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || null;
      if (clienteEmail) {
        try {
          const resp = await apiFetch(`/api/conversations?cliente_email=${encodeURIComponent(clienteEmail)}`, { credentials: 'same-origin' });
          if (resp && resp.ok) {
            const convs = await resp.json();
            if (Array.isArray(convs) && convs.length) {
              renderConversationList(convs);
              // abrir a conversa ativa armazenada se existir
              const stored = localStorage.getItem('atendimento_conversation');
              if (stored) {
                conversationId = Number(stored);
                await fetchAndRender();
                return;
              }
              // caso contrário, abrir a mais recente automaticamente (se não estivermos apenas pedindo criação)
              if (!createIfMissing) {
                conversationId = convs[0].id;
                localStorage.setItem('atendimento_conversation', String(conversationId));
                await fetchAndRender();
                return;
              }
            }
          }
        } catch (e) { /* ignore failure to load historical convs */ }
      }
    }catch(e){}

    // criar nova conversa
    const nome = (localStorage.getItem('nome') || '') + ' ' + (localStorage.getItem('sobrenome') || '');
    const rawPhoto = localStorage.getItem('foto') || localStorage.getItem('userPhoto') || null;
    const body = { name: `Atendimento - ${nome.trim() || 'Cliente'}`, photo: normalizeApiPath(rawPhoto) };
    try{
      // quick backend availability check before attempting to create conversation
      try{
        const ok = await checkBackend();
        if (!ok) {
          console.warn('Backend health check failed');
          backendAvailable = false;
          appendLocalNotice('Servidor indisponível. Tente recarregar a página ou inicie o servidor Node.');
          scheduleBackendChecks();
          return;
        }
        backendAvailable = true;
      }catch(err){
        console.warn('Backend check error', err && err.message);
        backendAvailable = false;
        appendLocalNotice('Servidor indisponível. Tente recarregar a página ou inicie o servidor Node.');
        scheduleBackendChecks();
        return;
      }

      // proceed with creating conversation (this path is reached only when API_BASE is empty)
      const r = await fetch(backendBase + '/api/conversations', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      if(!r.ok) {
        const txt = await r.text().catch(()=>null);
        console.error('Criar conversa falhou:', r.status, r.statusText, txt);
        const msg = `Failed to load resource: the server responded with a status of ${r.status} (Not Found)`;
        try{ currentConvNameEl.textContent = msg; }catch(e){}
        try{ mensagensEl.innerHTML = `<div class="error">${esc(msg)}</div>`; }catch(e){}
        throw new Error('erro criar conversa: '+r.status + ' ' + (txt||''));
      }
      const conv = await r.json();
      conversationId = conv.id;
      localStorage.setItem('atendimento_conversation', String(conversationId));
      // se existir escalamento do widget (mensagem do usuário), enviar automaticamente
      try{
        const escMsg = JSON.parse(localStorage.getItem('chatbot_escalamento') || 'null');
        if(escMsg && escMsg.msg){
          await enviarMensagem(escMsg.msg);
          localStorage.removeItem('chatbot_escalamento');
        }
      }catch(e){}
      startPolling();
      renderConversationList([{ id: conversationId, name: conv.name || 'Atendimento' }]);
      try{ input.focus(); }catch(e){}
    }catch(e){
      console.error('criarOuAbrirConversacao error:', e && e.stack ? e.stack : e);
      // se erro contiver status 404, exibir a mensagem legível
      const emsg = (e && e.message) ? String(e.message) : '';
      if(emsg.includes('404')){
        const msg = `Failed to load resource: the server responded with a status of 404 (Not Found)`;
        try{ currentConvNameEl.textContent = msg; }catch(e){}
        try{ mensagensEl.innerHTML = `<div class="error">${esc(msg)}</div>`; }catch(e){}
      } else {
        appendLocalNotice('Não foi possível iniciar o atendimento agora. Erro: ' + (e && e.message ? e.message : String(e)));
      }
    }
  }

  // remove manual connect flow; when served by Live Server we remain offline to avoid
  // generating repeated network errors. Avatars use data-src and will load
  // when the page is opened from the correct origin.

  // render simples da lista de conversas (cliente tem só a sua)
  function renderConversationList(list){
    listaConversasEl.innerHTML = '';
    if(!list || list.length === 0){
      listaConversasEl.innerHTML = '<div class="empty">Nenhuma conversa<br><span>Quando um cliente iniciar um atendimento, a conversa aparecerá aqui.</span></div>';
      currentConvNameEl.textContent = 'Selecione uma conversa';
      return;
    }
    list.forEach(c=>{
        const d = document.createElement('div'); d.className='conv-item'; d.dataset.id = c.id;
      let avatarHtml;
      if(c.photo){
        const photoPath = normalizeApiPath(c.photo);
        if(API_BASE){
          // don't set src to avoid connection attempts when backend not connected; store in data-src
          avatarHtml = `<img class="avatar-img" data-src="${escapeHtml(photoPath)}" alt="avatar" onerror="this.style.display='none'"/>`;
        } else {
          avatarHtml = `<img class="avatar-img" src="${escapeHtml(photoPath)}" alt="avatar" onerror="this.style.display='none'"/>`;
        }
      } else {
        avatarHtml = `<div class=\"avatar\">${(c.name||'C').slice(0,1)}</div>`;
      }
      const displayName = formatAdminShortName(c.name || 'Atendimento');
      const shown = 'Atendente ' + capitalizeWords(displayName || 'Atendimento');
      d.innerHTML = avatarHtml + `<div class="meta"><div class="name">${escapeHtml(shown)}</div><div class="last">Clique para abrir</div></div>`;
      d.addEventListener('click', async ()=>{
        // ao clicar, tentar carregar todas as conversas desse cliente do DB (se tivermos o email)
        const clienteEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || null;
        if (clienteEmail) {
          try {
            const resp = await apiFetch(`/api/conversations?cliente_email=${encodeURIComponent(clienteEmail)}`, { credentials: 'same-origin' });
            if (resp && resp.ok) {
              const convs = await resp.json();
              if (Array.isArray(convs) && convs.length) {
                // renderizar a lista de conversas do cliente e abrir a primeira
                renderConversationList(convs);
                const first = convs[0];
                conversationId = first.id;
                localStorage.setItem('atendimento_conversation', String(conversationId));
                currentConvNameEl.textContent = first.name || 'Atendimento';
                await fetchAndRender();
                try{ input.focus(); }catch(e){}
                return;
              }
            }
          } catch (e) { console.warn('load client convs failed', e); }
        }
        // fallback: abrir apenas a conversa clicada
        conversationId = Number(d.dataset.id);
        localStorage.setItem('atendimento_conversation', String(conversationId));
        currentConvNameEl.textContent = 'Atendente ' + capitalizeWords(formatAdminShortName(c.name) || (c.name || 'Atendimento'));
        await fetchAndRender();
        try{ input.focus(); }catch(e){}
      });
      listaConversasEl.appendChild(d);
    });
  }

  // helper to load avatars that were held as data-src (called after successful connect)
  function loadPendingAvatars(){
    const imgs = document.querySelectorAll('img.avatar-img[data-src]');
    imgs.forEach(img => {
      try{
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }catch(e){}
    });
  }

  function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function appendLocalNotice(text){
    // Suprimir notices quando estivermos em modo Live Server offline
    if (isLiveServerFallback) return;
    const d = document.createElement('div'); d.className='msg system'; d.innerHTML=`<div class="balao">${esc(text)}</div>`; mensagensEl.appendChild(d); scrollDown();
  }

  function renderMensagens(list){
    mensagensEl.innerHTML = '';
    list.forEach(m => appendMsg(m));
    scrollDown();
  }

  function appendMsg(m){
    const div = document.createElement('div');
    const from = (m.fromName || m.from || '').toLowerCase().includes('admin') ? 'atendente' : (m.from === 'me' ? 'atendente' : (m.from === 'user' ? 'cliente' : 'cliente'));
    div.className = `msg ${from}`;
    const html = `<div class="balao">${m.text ? esc(m.text) : ''}${m.extra || ''}</div><div class="hora">${new Date(m.time||Date.now()).toLocaleString()}</div>`;
    div.innerHTML = html;
    mensagensEl.appendChild(div);
  }

  function scrollDown(){ requestAnimationFrame(()=>{ mensagensEl.scrollTop = mensagensEl.scrollHeight; }); }

  async function enviarMensagem(text){
    if(!conversationId) return appendLocalNotice('Conversa não iniciada.');
    if(!text || !text.trim()) return;
    // send message as client
    const payload = { text, from: 'user', fromName: (localStorage.getItem('nome') || '') + ' ' + (localStorage.getItem('sobrenome') || ''), photo: normalizeApiPath(localStorage.getItem('foto') || null) };
    try{
      // se estivermos em modo Live Server offline, salvar localmente
      if (isLiveServerFallback) {
        try {
          const raw = localStorage.getItem('offline_chat_store');
          const store = raw ? JSON.parse(raw) : { conversations: [] };
          const conv = (store.conversations||[]).find(c => String(c.id) === String(conversationId));
          const now = Date.now();
          const msg = { id: now, from: 'user', fromName: payload.fromName, text: payload.text, time: now };
          if (conv) {
            conv.messages = conv.messages || [];
            conv.messages.push(msg);
            conv.lastMessagePreview = String(msg.text||'').slice(0,200);
          }
          localStorage.setItem('offline_chat_store', JSON.stringify(store));
          renderMensagens(conv ? conv.messages : []);
          try{ input.focus(); }catch(e){}
          return;
        } catch (e) { console.error('enviarMensagem offline error', e); appendLocalNotice('Falha ao salvar mensagem localmente.'); return; }
      }

      backendAvailable = await checkBackend();
      if(!backendAvailable){
        appendLocalNotice('Servidor indisponível. Mensagem salva localmente e será enviada quando a conexão for restabelecida.');
        scheduleBackendChecks();
        return;
      }

      // tentar enviar para o backend usando apiFetch
      let r = await apiFetch(`/api/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (r.status === 404) {
        // possivelmente a conversa foi criada localmente e não existe no servidor.
        // Tentar sincronizar o offline store e reenviar.
        await syncOfflineStore();
        const newConv = localStorage.getItem('atendimento_conversation');
        if (newConv && String(newConv) !== String(conversationId)) {
          conversationId = Number(newConv);
          r = await apiFetch(`/api/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        }
      }

      if(!r.ok) {
        // ainda falhou
        const status = r.status || 'error';
        appendLocalNotice(`Falha ao enviar mensagem (status ${status}). Mensagem salva localmente.`);
        // salvar localmente como fallback
        try {
          const raw2 = localStorage.getItem('offline_chat_store');
          const store2 = raw2 ? JSON.parse(raw2) : { conversations: [] };
          const conv2 = (store2.conversations||[]).find(c => String(c.id) === String(conversationId));
          const now2 = Date.now();
          const msg2 = { id: now2, from: 'user', fromName: payload.fromName, text: payload.text, time: now2 };
          if (conv2) { conv2.messages = conv2.messages || []; conv2.messages.push(msg2); conv2.lastMessagePreview = String(msg2.text||'').slice(0,200); }
          localStorage.setItem('offline_chat_store', JSON.stringify(store2));
        } catch (ee) { console.error('fallback save failed', ee); }
        scheduleBackendChecks();
        return;
      }

      const msg = await r.json();
      // após envio, buscar mensagens atuais
      await fetchAndRender();
      try{ input.focus(); }catch(e){}
    }catch(e){
      console.error(e);
      appendLocalNotice('Falha ao enviar mensagem.');
    }
  }

  async function fetchAndRender(){
    if(!conversationId) return;
    try{
      if (isLiveServerFallback) {
        const raw = localStorage.getItem('offline_chat_store');
        const store = raw ? JSON.parse(raw) : { conversations: [] };
        const conv = (store.conversations||[]).find(c => String(c.id) === String(conversationId));
        const msgs = conv ? (conv.messages || []) : [];
        renderMensagens(msgs);
        return;
      }
      const r = await fetch(backendBase + `/api/conversations/${conversationId}/messages`);
      if(!r.ok) return;
      const msgs = await r.json();
      renderMensagens(msgs);
    }catch(e){ console.error(e); }
  }

  function startPolling(){
    if(polling) clearInterval(polling);
    polling = setInterval(fetchAndRender, 2500);
  }

  // suporte tanto a submit quanto ao botão enviar (novo layout)
  if(form){
    form.addEventListener('submit', async function(ev){
      ev.preventDefault();
      const t = input.value.trim();
      if(!t) return;
      btnEnviar.disabled = true;
      await enviarMensagem(t);
      input.value = '';
      btnEnviar.disabled = false;
    });
  }
  if(btnEnviar){
    btnEnviar.addEventListener('click', async function(){
      const t = input.value.trim();
      if(!t) return;
      btnEnviar.disabled = true;
      await enviarMensagem(t);
      input.value = '';
      btnEnviar.disabled = false;
    });
  }

  if(newConvBtn){
    newConvBtn.addEventListener('click', async ()=>{
      try{
        // Forçar criação de nova conversa: limpar referencias e criar uma nova
        localStorage.removeItem('atendimento_conversation');
        localStorage.removeItem('offline_conversation');
        await criarOuAbrirConversacao(true);
      }catch(e){ console.error('newConv error', e); }
    });
  }

  // inicializa
  document.addEventListener('DOMContentLoaded', criarOuAbrirConversacao);
})();
