document.addEventListener('DOMContentLoaded', function () {
  // Modo de produção: sem conversas de teste.
  const convContainer = document.getElementById('conversations');
  const messagesEl = document.getElementById('messages');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderStatus = document.getElementById('chatHeaderStatus');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendMsgBtn');
  const searchInput = document.getElementById('chatSearch');
  const emptyConversations = document.getElementById('emptyConversations');
  const emptyMessages = document.getElementById('emptyMessages');

  let conversations = [];
  let selectedConversationId = null;
  const API_BASE = (typeof window !== 'undefined' && typeof window.__API_BASE__ !== 'undefined') ? window.__API_BASE__ : '';
  const isLiveServerFallback = (!API_BASE) && (location.port && String(location.port) !== '3000');

  function apiUrl(path){
    const base = (API_BASE || '');
    return (base || '') + path;
  }
  function apiFetch(path, opts){
    return fetch(apiUrl(path), opts);
  }

  function formatTime(ts) {
    const d = new Date(ts || Date.now());
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function showEmptyConversations(show) {
    if (!emptyConversations) return;
    emptyConversations.style.display = show ? 'block' : 'none';
  }

  function showEmptyMessages(show) {
    if (!emptyMessages) return;
    emptyMessages.style.display = show ? 'block' : 'none';
  }

  function setComposerEnabled(enabled) {
    if (msgInput) msgInput.disabled = !enabled;
    if (sendBtn) sendBtn.disabled = !enabled;
  }

  function renderConversations(list) {
    if (!convContainer) return;
    convContainer.innerHTML = '';
    if (!list || list.length === 0) {
      showEmptyConversations(true);
      return;
    }
    showEmptyConversations(false);
    list.forEach(c => {
      const el = document.createElement('div');
      el.className = 'conv-item';
      el.setAttribute('data-id', c.id);
      if (c.cliente_email) el.setAttribute('data-email', c.cliente_email);
      const initials = (c.name || '').split(' ').map(s => s[0]).slice(0,2).join('') || 'U';
      const last = c.lastMessagePreview || '';
      const unread = c.unread || 0;
      el.innerHTML = `
        <div class="conv-avatar">${initials}</div>
        <div class="conv-info"><div class="name">${c.name || 'Cliente'}</div><div class="meta">${last}</div></div>
        <div class="conv-right">${unread?'<span class="conv-unread">'+unread+'</span>':''}
          <button class="conv-download" title="Baixar histórico" data-id="${c.id}" style="margin-left:8px;border:none;background:transparent;color:inherit;cursor:pointer"><i class="fa-solid fa-download"></i></button>
        </div>`;
      el.addEventListener('click', async () => {
        // ao clicar, se tivermos cliente_email, carregar todas as conversas desse cliente do backend
        const email = c.cliente_email || el.getAttribute('data-email');
        if (email && !isLiveServerFallback) {
          try {
            const resp = await apiFetch(`/api/conversations?cliente_email=${encodeURIComponent(email)}`, { credentials: 'same-origin' });
            if (resp && resp.ok) {
              const convs = await resp.json();
              if (Array.isArray(convs) && convs.length) {
                conversations = convs;
                renderConversations(conversations);
                // abrir a primeira conversa do cliente
                setTimeout(()=>{ try{ openConversation(convs[0].id); }catch(e){} }, 80);
                return;
              }
            }
          } catch (e) { console.warn('Failed to load client conversations', e); }
        }
        // fallback: abrir apenas a conversa clicada
        openConversation(c.id);
      });
      // handler do botão de download dentro do item (não propagar o clique)
      const dlBtn = el.querySelector('.conv-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const cid = dlBtn.getAttribute('data-id') || c.id;
          try {
            const url = apiUrl(`/api/conversations/${cid}/export-doc`);
            const resp = await fetch(url, { credentials: 'same-origin' });
            if (!resp.ok) {
              const j = await resp.json().catch(()=>null);
              throw new Error((j && j.mensagem) ? j.mensagem : 'Falha ao exportar');
            }
            const blob = await resp.blob();
            const cd = resp.headers.get('content-disposition') || '';
            const m = cd.match(/filename="?([^";]+)"?/i);
            const filename = (m && m[1]) ? m[1] : `conversa_${cid}.doc`;
            const urlBlob = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(urlBlob);
          } catch (e) {
            console.error('export item error', e);
            alert('Erro ao baixar histórico: ' + (e && e.message ? e.message : ''));
          }
        });
      }
      convContainer.appendChild(el);
    });
  }

  async function loadConversations() {
    // modo Live Server (sem API definida): usar fallback local imediatamente
    if (isLiveServerFallback) {
      try {
        const raw = localStorage.getItem('offline_chat_store');
        if (raw) {
          const store = JSON.parse(raw);
          conversations = (store.conversations || []).map(c => ({ id: c.id, name: c.name || c.title || ('Cliente ' + c.id), lastMessagePreview: (c.messages && c.messages.length) ? String(c.messages[c.messages.length-1].text).slice(0,200) : '', unread: 0, online: false }));
        } else {
          conversations = [];
          if (emptyConversations) {
            emptyConversations.style.display = 'block';
            const title = emptyConversations.querySelector('.empty-title');
            const desc = emptyConversations.querySelector('.empty-desc');
            if (title) title.textContent = 'Failed to load resource: the server responded with a status of 404 (Not Found)';
            if (desc) desc.textContent = 'A API não está disponível nesta origem. Inicie o servidor Node (porta 3000) ou use a origem correta.';
          }
        }
        renderConversations(conversations);
        tryAutoOpenNew(conversations);
        showEmptyConversations(conversations.length === 0);
        return;
      } catch (e) {
        conversations = [];
        renderConversations(conversations);
        showEmptyConversations(true);
        return;
      }
    }

    // quando não for Live Server, tentar consultar a API (API_BASE opcional)
    const candidates = [];
    if (typeof window !== 'undefined' && typeof window.__API_BASE__ !== 'undefined' && window.__API_BASE__) candidates.push(window.__API_BASE__);
    candidates.push('');

    let fetched = false;
    let data = null;
    for (const base of candidates) {
      try {
        const url = (base || '') + '/api/conversations';
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) continue;
        data = await res.json();
        fetched = true;
        break;
      } catch (e) {
        // continue para próximo candidato
        continue;
      }
    }

    if (fetched) {
      conversations = Array.isArray(data) ? data : [];
      renderConversations(conversations);
      tryAutoOpenNew(conversations);
      showEmptyConversations(conversations.length === 0);
      return;
    }

    // fallback: localStorage
    try {
      const raw = localStorage.getItem('offline_chat_store');
      if (raw) {
        const store = JSON.parse(raw);
        conversations = (store.conversations || []).map(c => ({ id: c.id, name: c.name || c.title || ('Cliente ' + c.id), lastMessagePreview: (c.messages && c.messages.length) ? String(c.messages[c.messages.length-1].text).slice(0,200) : '', unread: 0, online: false }));
      } else {
        conversations = [];
      }
    } catch (e) {
      conversations = [];
    }
    renderConversations(conversations);
    tryAutoOpenNew(conversations);
    showEmptyConversations(conversations.length === 0);
    return;
  }

  function tryAutoOpenNew(list){
    if(!Array.isArray(list) || list.length===0) return;
    // find first with unread > 0
    const unread = list.find(c => (c.unread || 0) > 0);
    if(unread){
      // if not already opened, open it
      if(selectedConversationId !== unread.id){
        // reload conversations to ensure selection appears
        selectedConversationId = unread.id;
        // refresh conversations rendering then open
        renderConversations(list);
        setTimeout(()=>{ try{ openConversation(unread.id); }catch(e){} }, 120);
      }
    }
  }

  async function openConversation(id) {
    selectedConversationId = id;
    setComposerEnabled(false);
    // limpar área de mensagens
    messagesEl.innerHTML = '';
    showEmptyMessages(true);
    chatHeaderName.textContent = 'Carregando...';
    chatHeaderStatus.textContent = '';

    try {
      // tentar buscar mensagens do backend
      let res;
      try {
        res = await apiFetch(`/api/conversations/${id}/messages`, { credentials: 'same-origin' });
      } catch (e) { res = null; }

      if (res && res.ok) {
        const data = await res.json();
        renderMessages(data || []);
      } else {
        // se não conseguiu pelo backend, tentar fallback localStorage (modo Live Server)
        const raw = localStorage.getItem('offline_chat_store');
        if (raw) {
          const store = JSON.parse(raw);
          const conv = (store.conversations || []).find(c => String(c.id) === String(id));
          const msgs = conv ? (conv.messages || []) : [];
          renderMessages(msgs);
        } else {
          throw new Error('Erro ao carregar mensagens');
        }
      }

      // update header
      const conv = conversations.find(c => c.id === id) || {};
      chatHeaderName.textContent = conv.name || 'Cliente';
      chatHeaderStatus.textContent = conv.online ? 'online' : '';
      // se não houver mensagens, tentar acionar bot (somente se backend disponível)
      try{
        const hasMsgs = messagesEl.querySelectorAll('.msg').length > 0;
        if (!hasMsgs) await triggerBotInitial(id);
      }catch(e){}
      setComposerEnabled(true);
    } catch (err) {
      console.error('openConversation:', err);
      // fallback final: mostrar erro na UI
      chatHeaderName.textContent = 'Erro ao carregar mensagens';
      chatHeaderStatus.textContent = '';
      setComposerEnabled(false);
    }
  }

  async function triggerBotInitial(conversationId) {
    try {
      const res = await fetch((API_BASE||'') + '/api/chatbot/respond', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });
      if (!res.ok) throw new Error('Erro chatbot');
      const data = await res.json();
      if (data && data.message) {
        // append bot message and options
        appendBotMessage(data.message, data.options || []);
        if (data.escalate) appendSystemMessage('Conversa marcada para atendimento humano.');
      }
    } catch (e) {
      console.error('triggerBotInitial', e);
    }
  }

  function appendBotMessage(msg, options) {
    // bot message
    const mEl = document.createElement('div');
    mEl.className = 'msg other bot-msg';
    const time = formatTime(msg.time);
    mEl.innerHTML = `<div class="author">${escapeHtml(msg.fromName || 'Assistente')}</div><div class="text">${escapeHtml(msg.text || '')}</div><span class="time">${time}</span>`;
    messagesEl.appendChild(mEl);
    // options
    if (options && options.length) {
      const optWrap = document.createElement('div');
      optWrap.className = 'bot-options';
      options.forEach(o => {
        const b = document.createElement('button');
        b.className = 'bot-opt';
        b.type = 'button';
        b.textContent = o.label;
        b.addEventListener('click', () => handleBotOptionClick(o.id, b, optWrap));
        optWrap.appendChild(b);
      });
      messagesEl.appendChild(optWrap);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function handleBotOptionClick(optionId, btnEl, optWrap) {
    // disable options while processing
    Array.from(optWrap.querySelectorAll('button')).forEach(b => b.disabled = true);
    try {
      const res = await fetch((API_BASE||'') + '/api/chatbot/respond', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConversationId, input: optionId })
      });
      if (!res.ok) throw new Error('Erro chatbot');
      const data = await res.json();
      if (data && data.message) {
        appendBotMessage(data.message, data.options || []);
        if (data.escalate) appendSystemMessage('Conversa marcada para atendimento humano.');
      }
    } catch (e) {
      console.error('handleBotOptionClick', e);
      appendSystemMessage('Erro ao processar opção do bot.');
    }
  }

  function appendSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg system';
    el.innerHTML = `<div class="text">${escapeHtml(text)}</div>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderMessages(list) {
    messagesEl.innerHTML = '';
    if (!list || list.length === 0) {
      showEmptyMessages(true);
      return;
    }
    showEmptyMessages(false);
    list.forEach(m => {
      const who = m.from === 'me' ? 'me' : 'other';
      const mEl = document.createElement('div');
      mEl.className = 'msg ' + (who === 'me' ? 'me' : 'other');
      const time = formatTime(m.time);
      const author = who === 'me' ? '' : `<div class="author">${m.fromName || 'Cliente'}</div>`;
      mEl.innerHTML = `${author}<div class="text">${escapeHtml(m.text || '')}</div><span class="time">${time}</span>`;
      messagesEl.appendChild(mEl);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]); });
  }

  if (sendBtn && msgInput) {
    sendBtn.addEventListener('click', async () => {
      const text = msgInput.value && msgInput.value.trim();
      if (!text || !selectedConversationId) return;
      // enviar para API
      try {
        const payload = { text };
        const res = await fetch((API_BASE||'') + `/api/conversations/${selectedConversationId}/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falha ao enviar mensagem');
        const saved = await res.json();
        // re-render ou inserir mensagem retornada
        appendLocalMessage(saved);
        msgInput.value = '';
      } catch (err) {
        console.error('send message:', err);
        alert('Não foi possível enviar a mensagem.');
      }
    });
    msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });
  }

  function appendLocalMessage(m) {
    const who = m.from === 'me' ? 'me' : 'me';
    const mEl = document.createElement('div');
    mEl.className = 'msg ' + who;
    mEl.innerHTML = `<div class="text">${escapeHtml(m.text)}</div><span class="time">${formatTime(m.time)}</span>`;
    messagesEl.appendChild(mEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Polling de conversas (mantém a lista atualizada)
  let _conversationsPollId = null;
  function startPollingConversations(interval = 5000) {
    if (_conversationsPollId) return;
    _conversationsPollId = setInterval(() => {
      try { loadConversations(); } catch (e) { console.warn('poll error', e); }
    }, interval);
  }
  function stopPollingConversations(){ if(_conversationsPollId){ clearInterval(_conversationsPollId); _conversationsPollId = null; } }

  // Buscar conversas ao abrir a página
  loadConversations();
  startPollingConversations();

  // Criar nova conversa (botão +)
  const newConvBtn = document.getElementById('newConvBtn');
  if (newConvBtn) {
    newConvBtn.addEventListener('click', async () => {
      const name = window.prompt('Nome do cliente / título da conversa:', 'Novo Cliente');
      if (!name) return;
      try {
        const resp = await fetch((API_BASE||'') + '/api/conversations', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        if (!resp.ok) throw new Error('falha');
        const conv = await resp.json();
        // recarregar e abrir
        await loadConversations();
        setTimeout(() => { try { openConversation(conv.id); } catch(e){} }, 200);
      } catch (e) {
        console.error('create conversation', e);
        alert('Não foi possível criar a conversa.');
      }
    });
  }

  // demo button removed

  // Busca local para conversas (filtrar nomes)
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = conversations.filter(c => (c.name||'').toLowerCase().includes(q) || (c.lastMessagePreview||'').toLowerCase().includes(q));
      renderConversations(filtered);
    });
  }

  // Botão de exportar conversa selecionada para .doc
  const exportBtn = document.getElementById('btnExportDoc');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!selectedConversationId) { alert('Selecione uma conversa primeiro.'); return; }
      try {
        const url = apiUrl(`/api/conversations/${selectedConversationId}/export-doc`);
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) {
          const j = await resp.json().catch(()=>null);
          throw new Error((j && j.mensagem) ? j.mensagem : 'Falha ao exportar');
        }
        const blob = await resp.blob();
        const cd = resp.headers.get('content-disposition') || '';
        const m = cd.match(/filename="?([^";]+)"?/i);
        const filename = (m && m[1]) ? m[1] : `conversa_${selectedConversationId}.doc`;
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(urlBlob);
      } catch (e) {
        console.error('export error', e);
        alert('Erro ao baixar histórico: ' + (e && e.message ? e.message : '')); 
      }
    });
  }
});