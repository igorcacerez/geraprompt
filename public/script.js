/**
 * script.js — Gerador de Prompt
 * Lógica completa do frontend com:
 * - Gerenciamento de sessões com histórico persistente (localStorage)
 * - Novo Contexto (como ChatGPT / Gemini)
 * - Histórico de conversas por sessão
 */

/* ════════════════════════════════════════════════════════════════
   CONSTANTES & CONFIGURAÇÃO
   ════════════════════════════════════════════════════════════════ */
const STORAGE_KEY    = 'geraprompt_sessions';
const MAX_SESSIONS   = 50;  // máximo de sessões salvas
const MAX_TITLE_LEN  = 40;  // máximo de chars no título da sessão

/* ════════════════════════════════════════════════════════════════
   ESTADO DA APLICAÇÃO
   ════════════════════════════════════════════════════════════════ */
const state = {
  isLoading:        false,
  currentSessionId: null,
  sidebarOpen:      true,   // sidebar de histórico aberta/fechada
};

/* ════════════════════════════════════════════════════════════════
   REFERÊNCIAS DOM
   ════════════════════════════════════════════════════════════════ */
const el = {
  modeloSelect:    () => document.getElementById('modelo-select'),
  saidaSelect:     () => document.getElementById('saida-select'),
  nivelSelect:     () => document.getElementById('nivel-select'),
  idiomaSelect:    () => document.getElementById('idioma-select'),
  userMessage:     () => document.getElementById('user-message'),
  btnGenerate:     () => document.getElementById('btn-generate'),
  btnClear:        () => document.getElementById('btn-clear'),
  chatMessages:    () => document.getElementById('chat-messages'),
  charCount:       () => document.getElementById('char-count'),
  charCounter:     () => document.getElementById('char-counter'),
  levelFill:       () => document.getElementById('level-fill'),
  levelLabel:      () => document.getElementById('level-label'),
  toast:           () => document.getElementById('toast'),
  validationModal: () => document.getElementById('validation-modal'),
  modalMessage:    () => document.getElementById('modal-message'),
  modalClose:      () => document.getElementById('modal-close'),
  // History sidebar
  historyNav:      () => document.getElementById('history-nav'),
  historyList:     () => document.getElementById('history-list'),
  btnNewSession:   () => document.getElementById('btn-new-session'),
  btnToggleSidebar:() => document.getElementById('btn-toggle-sidebar'),
  sessionTitle:    () => document.getElementById('session-title'),
};

/* ════════════════════════════════════════════════════════════════
   MAPA DE NÍVEIS
   ════════════════════════════════════════════════════════════════ */
const levelConfig = {
  'Simples':         { width: '20%',  label: 'Simples' },
  'Médio':           { width: '40%',  label: 'Médio' },
  'Avançado':        { width: '60%',  label: 'Avançado' },
  'Profissional':    { width: '80%',  label: 'Profissional' },
  'Ultra detalhado': { width: '100%', label: 'Ultra detalhado' },
};

/* ════════════════════════════════════════════════════════════════
   ★ GERENCIAMENTO DE SESSÕES (localStorage)
   ════════════════════════════════════════════════════════════════ */

/** Gera UUID simples */
function generateId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/** Carrega todas as sessões do localStorage */
function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** Salva todas as sessões no localStorage */
function saveSessions(sessions) {
  try {
    // Mantém no máximo MAX_SESSIONS (remove as mais antigas)
    const trimmed = sessions.slice(-MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Erro ao salvar sessões:', e.message);
  }
}

/** Retorna a sessão atual */
function getCurrentSession() {
  const sessions = loadSessions();
  return sessions.find(s => s.id === state.currentSessionId) || null;
}

/** Atualiza ou insere uma sessão */
function upsertSession(session) {
  let sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
}

/** Cria uma nova sessão vazia e a ativa */
function createNewSession() {
  const session = {
    id:        generateId(),
    title:     'Nova conversa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages:  [],   // { type: 'user'|'prompt'|'error', content, formData, timestamp }
  };
  upsertSession(session);
  return session;
}

/** Exclui uma sessão pelo id */
function deleteSession(id) {
  let sessions = loadSessions();
  sessions = sessions.filter(s => s.id !== id);
  saveSessions(sessions);
}

/** Adiciona mensagem à sessão atual e persiste */
function addMessageToSession(type, content, formData = null) {
  const sessions = loadSessions();
  const sess = sessions.find(s => s.id === state.currentSessionId);
  if (!sess) return;

  const message = {
    id:        'msg_' + Date.now(),
    type,
    content,
    formData,
    timestamp: new Date().toISOString(),
  };

  sess.messages.push(message);
  sess.updatedAt = new Date().toISOString();

  // Gera título a partir da primeira mensagem do usuário
  if (type === 'user' && sess.messages.filter(m => m.type === 'user').length === 1) {
    sess.title = content.slice(0, MAX_TITLE_LEN) + (content.length > MAX_TITLE_LEN ? '…' : '');
  }

  const idx = sessions.findIndex(s => s.id === state.currentSessionId);
  if (idx >= 0) sessions[idx] = sess;
  saveSessions(sessions);

  return message;
}

/* ════════════════════════════════════════════════════════════════
   ★ RENDERIZAÇÃO DO HISTÓRICO LATERAL
   ════════════════════════════════════════════════════════════════ */

/** Formata data relativa */
function formatDate(isoStr) {
  const date = new Date(isoStr);
  const now  = new Date();
  const diff = (now - date) / 1000; // segundos

  if (diff < 60)       return 'Agora';
  if (diff < 3600)     return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400)    return 'Hoje';
  if (diff < 172800)   return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Agrupa sessões por período */
function groupSessions(sessions) {
  const now    = new Date();
  const groups = { hoje: [], ontem: [], semana: [], anteriores: [] };

  const sorted = [...sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  sorted.forEach(sess => {
    const diff = (now - new Date(sess.updatedAt)) / 86400000; // dias
    if (diff < 1)      groups.hoje.push(sess);
    else if (diff < 2) groups.ontem.push(sess);
    else if (diff < 7) groups.semana.push(sess);
    else               groups.anteriores.push(sess);
  });

  return groups;
}

/** Renderiza a lista de histórico na sidebar */
function renderHistoryList() {
  const listEl   = el.historyList();
  if (!listEl) return;

  const sessions = loadSessions();
  listEl.innerHTML = '';

  if (sessions.length === 0) {
    listEl.innerHTML = `
      <div class="history-empty">
        <span aria-hidden="true">💬</span>
        <p>Nenhuma conversa ainda</p>
      </div>`;
    return;
  }

  const groups  = groupSessions(sessions);
  const labels  = { hoje: 'Hoje', ontem: 'Ontem', semana: 'Últimos 7 dias', anteriores: 'Anteriores' };

  for (const [key, label] of Object.entries(labels)) {
    const group = groups[key];
    if (!group || group.length === 0) continue;

    const groupEl = document.createElement('div');
    groupEl.className = 'history-group';
    groupEl.innerHTML = `<span class="history-group-label">${label}</span>`;

    group.forEach(sess => {
      const isActive = sess.id === state.currentSessionId;
      const item = document.createElement('div');
      item.className = `history-item${isActive ? ' active' : ''}`;
      item.setAttribute('data-id', sess.id);
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Conversa: ${sess.title}`);
      item.setAttribute('aria-current', isActive ? 'true' : 'false');

      item.innerHTML = `
        <div class="history-item-content">
          <span class="history-item-title">${escapeHtml(sess.title)}</span>
          <span class="history-item-meta">${formatDate(sess.updatedAt)} · ${sess.messages.filter(m => m.type === 'prompt').length} prompt(s)</span>
        </div>
        <div class="history-item-actions">
          <button class="history-item-delete" data-id="${sess.id}" title="Excluir conversa" aria-label="Excluir conversa: ${escapeHtml(sess.title)}">
            🗑️
          </button>
        </div>`;

      // Click → carrega sessão
      item.addEventListener('click', (e) => {
        if (e.target.closest('.history-item-delete')) return;
        loadSession(sess.id);
        // Em mobile, fecha a sidebar
        if (window.innerWidth < 900) toggleHistorySidebar(false);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadSession(sess.id);
        }
      });

      // Delete button
      item.querySelector('.history-item-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteSession(sess.id, sess.title);
      });

      groupEl.appendChild(item);
    });

    listEl.appendChild(groupEl);
  }
}

/** Atualiza visual do item ativo na lista */
function updateActiveHistoryItem() {
  document.querySelectorAll('.history-item').forEach(item => {
    const isActive = item.getAttribute('data-id') === state.currentSessionId;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

/* ════════════════════════════════════════════════════════════════
   ★ CARREGAMENTO DE SESSÃO
   ════════════════════════════════════════════════════════════════ */

/** Carrega uma sessão existente pelo id e renderiza o chat */
function loadSession(id) {
  const sessions = loadSessions();
  const sess = sessions.find(s => s.id === id);
  if (!sess) return;

  state.currentSessionId = id;

  // Limpa chat
  const chatEl = el.chatMessages();
  chatEl.innerHTML = '';

  if (sess.messages.length === 0) {
    chatEl.appendChild(createWelcomeScreen());
  } else {
    // Re-renderiza todas as mensagens da sessão
    sess.messages.forEach(msg => {
      if (msg.type === 'user') {
        renderUserMessage(msg.content);
      } else if (msg.type === 'prompt') {
        renderPromptResult(msg.content, msg.formData, msg.timestamp, false);
      } else if (msg.type === 'error') {
        renderErrorMessage(msg.content);
      }
    });
  }

  // Atualiza título da sessão no header
  updateSessionTitle(sess.title);
  updateActiveHistoryItem();
  scrollToBottom();
}

/** Atualiza o título exibido no header */
function updateSessionTitle(title) {
  const titleEl = el.sessionTitle();
  if (titleEl) titleEl.textContent = title === 'Nova conversa' ? '' : title;
}

/* ════════════════════════════════════════════════════════════════
   ★ NOVO CONTEXTO (equivalente ao "New Chat" do ChatGPT)
   ════════════════════════════════════════════════════════════════ */

function handleNewSession() {
  const sess = createNewSession();
  state.currentSessionId = sess.id;

  // Limpa o chat e restaura a tela de boas-vindas
  const chatEl = el.chatMessages();
  chatEl.innerHTML = '';
  chatEl.appendChild(createWelcomeScreen());

  // Limpa o campo de texto
  el.userMessage().value = '';
  updateCharCounter();
  autoResizeTextarea();

  updateSessionTitle('');
  renderHistoryList();
  el.userMessage().focus();

  showToast('✨ Nova conversa iniciada!', 'success', 2000);
}

/* ════════════════════════════════════════════════════════════════
   ★ SIDEBAR DE HISTÓRICO
   ════════════════════════════════════════════════════════════════ */

function toggleHistorySidebar(forceState) {
  const nav = el.historyNav();
  const btn = el.btnToggleSidebar();
  if (!nav) return;

  state.sidebarOpen = forceState !== undefined ? forceState : !state.sidebarOpen;
  nav.classList.toggle('collapsed', !state.sidebarOpen);

  if (btn) {
    btn.setAttribute('aria-expanded', state.sidebarOpen ? 'true' : 'false');
    btn.setAttribute('aria-label', state.sidebarOpen ? 'Fechar histórico' : 'Abrir histórico');
    btn.title = state.sidebarOpen ? 'Fechar histórico' : 'Ver histórico';
  }
}

/* ════════════════════════════════════════════════════════════════
   ★ CONFIRMAR EXCLUSÃO DE SESSÃO
   ════════════════════════════════════════════════════════════════ */

function confirmDeleteSession(id, title) {
  // Usa o modal existente como confirmação simples
  const modalMsg = el.modalMessage();
  const modalEl  = el.validationModal();
  const closeBtn = el.modalClose();

  modalMsg.textContent = `Excluir a conversa "${title.slice(0, 40)}"? Esta ação não pode ser desfeita.`;
  modalEl.removeAttribute('hidden');

  // Substitui o botão temporariamente para confirmar exclusão
  closeBtn.textContent = 'Excluir';
  closeBtn.style.background = '#ef4444';

  const onConfirm = () => {
    deleteSession(id);
    if (state.currentSessionId === id) {
      handleNewSession();
    } else {
      renderHistoryList();
    }
    closeModal();
    showToast('🗑️ Conversa excluída', 'default', 2000);
    closeBtn.removeEventListener('click', onConfirm);
  };

  closeBtn.addEventListener('click', onConfirm, { once: true });
}

/* ════════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ════════════════════════════════════════════════════════════════ */

function init() {
  setupEventListeners();
  updateLevelIndicator();
  autoResizeTextarea();

  // Inicializa sessão
  const existingSessions = loadSessions();
  if (existingSessions.length > 0) {
    // Carrega a sessão mais recente
    const sorted = [...existingSessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    state.currentSessionId = sorted[0].id;
    loadSession(sorted[0].id);
  } else {
    // Cria primeira sessão
    const sess = createNewSession();
    state.currentSessionId = sess.id;
    el.chatMessages()?.appendChild(createWelcomeScreen());
  }

  renderHistoryList();

  // Fecha sidebar no mobile por padrão
  if (window.innerWidth < 900) {
    toggleHistorySidebar(false);
  }
}

/* ════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ════════════════════════════════════════════════════════════════ */

function setupEventListeners() {
  // Textarea
  el.userMessage().addEventListener('input', () => {
    updateCharCounter();
    autoResizeTextarea();
  });

  el.nivelSelect().addEventListener('change', updateLevelIndicator);

  el.userMessage().addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  });

  el.btnGenerate().addEventListener('click', handleGenerate);
  el.btnClear().addEventListener('click', handleClearSession);

  // Modal
  el.modalClose().addEventListener('click', closeModal);
  el.validationModal().addEventListener('click', (e) => {
    if (e.target === el.validationModal()) closeModal();
  });

  // History sidebar
  const btnNew = el.btnNewSession();
  if (btnNew) btnNew.addEventListener('click', handleNewSession);

  const btnToggle = el.btnToggleSidebar();
  if (btnToggle) btnToggle.addEventListener('click', () => toggleHistorySidebar());

  // Resize: em mobile fecha sidebar, em desktop abre
  window.addEventListener('resize', () => {
    if (window.innerWidth < 900 && state.sidebarOpen) {
      toggleHistorySidebar(false);
    }
  });
}

/* ════════════════════════════════════════════════════════════════
   COUNTER & RESIZE
   ════════════════════════════════════════════════════════════════ */

function updateCharCounter() {
  const len = el.userMessage().value.length;
  el.charCount().textContent = len;
  const counter = el.charCounter();
  counter.classList.remove('warning', 'danger');
  if (len > 1800) counter.classList.add('danger');
  else if (len > 1500) counter.classList.add('warning');
}

function autoResizeTextarea() {
  const ta = el.userMessage();
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}

function updateLevelIndicator() {
  const nivel  = el.nivelSelect().value;
  const config = levelConfig[nivel] || { width: '60%', label: nivel };
  el.levelFill().style.width  = config.width;
  el.levelLabel().textContent = config.label;
}

/* ════════════════════════════════════════════════════════════════
   TOAST & MODAL
   ════════════════════════════════════════════════════════════════ */

function showToast(message, type = 'default', duration = 3000) {
  const toast = el.toast();
  toast.textContent  = message;
  toast.className    = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.className = 'toast'; }, 300);
  }, duration);
}

function showModal(message) {
  const closeBtn = el.modalClose();
  el.modalMessage().textContent = message;
  el.validationModal().removeAttribute('hidden');
  // Reseta o botão para estado normal de "Entendido"
  closeBtn.textContent    = 'Entendido';
  closeBtn.style.background = '';
  closeBtn.focus();
}

function closeModal() {
  const closeBtn = el.modalClose();
  el.validationModal().setAttribute('hidden', '');
  closeBtn.textContent    = 'Entendido';
  closeBtn.style.background = '';
  el.userMessage().focus();
}

/* ════════════════════════════════════════════════════════════════
   VALIDAÇÃO & FORMULÁRIO
   ════════════════════════════════════════════════════════════════ */

function validateForm() {
  const modelo = el.modeloSelect().value;
  const saida  = el.saidaSelect().value;
  const msg    = el.userMessage().value.trim();

  if (!modelo) { showModal('Por favor, selecione o modelo de IA.'); el.modeloSelect().focus(); return false; }
  if (!saida)  { showModal('Por favor, selecione o tipo de saída.'); el.saidaSelect().focus(); return false; }
  if (!msg)    { showModal('Por favor, descreva o que você precisa.'); el.userMessage().focus(); return false; }
  if (msg.length < 10) { showModal('Descreva com mais detalhes (mínimo 10 caracteres).'); el.userMessage().focus(); return false; }

  return true;
}

function getFormData() {
  return {
    modeloSelecionado: el.modeloSelect().value,
    tipoSaida:         el.saidaSelect().value,
    nivelDetalhamento: el.nivelSelect().value,
    idioma:            el.idiomaSelect().value,
    mensagemUsuario:   el.userMessage().value.trim(),
  };
}

/* ════════════════════════════════════════════════════════════════
   ★ HANDLER PRINCIPAL: GERAR PROMPT
   ════════════════════════════════════════════════════════════════ */

async function handleGenerate() {
  if (state.isLoading) return;
  if (!validateForm()) return;

  const formData = getFormData();

  // Esconde welcome screen se existir
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';

  // Adiciona mensagem do usuário ao chat E à sessão
  appendUserMessage(formData.mensagemUsuario);
  addMessageToSession('user', formData.mensagemUsuario, formData);
  updateSessionTitleFromSession();

  // Loading
  const loadingId = appendLoadingMessage();
  setLoadingState(true);

  try {
    const response = await fetch('/api/generate-prompt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });

    const data = await response.json();
    removeLoadingMessage(loadingId);

    if (!response.ok || !data.success) {
      const errMsg = data.message || 'Não foi possível gerar o prompt agora. Tente novamente.';
      appendErrorMessage(errMsg);
      addMessageToSession('error', errMsg);
      return;
    }

    // Renderiza resultado no chat
    appendPromptResult(data.prompt, formData);
    // Persiste na sessão
    addMessageToSession('prompt', data.prompt, formData);

    // Atualiza sidebar de histórico
    renderHistoryList();

    // Limpa o campo
    el.userMessage().value = '';
    updateCharCounter();
    autoResizeTextarea();

  } catch (err) {
    removeLoadingMessage(loadingId);
    const errMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
    appendErrorMessage(errMsg);
    addMessageToSession('error', errMsg);
    console.error('Erro:', err);
  } finally {
    setLoadingState(false);
  }
}

/** Atualiza título da sessão no header após persistência */
function updateSessionTitleFromSession() {
  const sess = getCurrentSession();
  if (sess) updateSessionTitle(sess.title);
}

/* ════════════════════════════════════════════════════════════════
   HANDLER: LIMPAR SESSÃO ATUAL (não apaga histórico)
   ════════════════════════════════════════════════════════════════ */

function handleClearSession() {
  el.userMessage().value = '';
  updateCharCounter();
  autoResizeTextarea();

  const chatEl = el.chatMessages();
  chatEl.innerHTML = '';
  chatEl.appendChild(createWelcomeScreen());

  showToast('🧹 Chat limpo!', 'default', 2000);
  el.userMessage().focus();
}

/* ════════════════════════════════════════════════════════════════
   HANDLER: GERAR NOVAMENTE
   ════════════════════════════════════════════════════════════════ */

async function handleRegenerate(formDataAttr) {
  if (state.isLoading) return;

  let formData;
  try {
    formData = typeof formDataAttr === 'string' ? JSON.parse(formDataAttr) : formDataAttr;
  } catch {
    showToast('Erro ao reutilizar dados do prompt.', 'default');
    return;
  }

  const loadingId = appendLoadingMessage();
  setLoadingState(true);

  try {
    const response = await fetch('/api/generate-prompt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });

    const data = await response.json();
    removeLoadingMessage(loadingId);

    if (!response.ok || !data.success) {
      appendErrorMessage(data.message || 'Não foi possível gerar o prompt. Tente novamente.');
      return;
    }

    appendPromptResult(data.prompt, formData);
    addMessageToSession('prompt', data.prompt, formData);
    renderHistoryList();

  } catch (err) {
    removeLoadingMessage(loadingId);
    appendErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    setLoadingState(false);
  }
}

/* ════════════════════════════════════════════════════════════════
   ESTADO DE LOADING
   ════════════════════════════════════════════════════════════════ */

function setLoadingState(loading) {
  state.isLoading = loading;
  const btn = el.btnGenerate();
  btn.disabled = loading;
  btn.querySelector('.btn-text').textContent     = loading ? 'Gerando...' : 'Gerar Prompt';
  btn.querySelector('.btn-icon-right').textContent = loading ? '⏳' : '⚡';
}

/* ════════════════════════════════════════════════════════════════
   RENDERIZAÇÃO DE MENSAGENS
   ════════════════════════════════════════════════════════════════ */

/** Adiciona bolha do usuário ao chat */
function appendUserMessage(text) {
  renderUserMessage(text);
  scrollToBottom();
}

function renderUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'message-user';
  div.innerHTML = `<div class="message-bubble-user">${escapeHtml(text)}</div>`;
  el.chatMessages().appendChild(div);
}

/** Loading skeleton */
function appendLoadingMessage() {
  const id  = 'loading-' + Date.now();
  const div = document.createElement('div');
  div.id        = id;
  div.className = 'loading-message';
  div.innerHTML = `
    <div class="system-avatar" aria-hidden="true">⚡</div>
    <div class="loading-content">
      <div class="loading-text">
        <span>Criando um prompt incrível...</span>
        <div class="loading-dots" aria-hidden="true">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </div>
      <div class="loading-skeleton" aria-hidden="true">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>`;
  el.chatMessages().appendChild(div);
  scrollToBottom();
  return id;
}

function removeLoadingMessage(id) {
  const el2 = document.getElementById(id);
  if (el2) el2.remove();
}

/** Adiciona card de prompt gerado ao chat */
function appendPromptResult(promptText, formData) {
  renderPromptResult(promptText, formData, new Date().toISOString(), true);
  scrollToBottom();
}

function renderPromptResult(promptText, formData, timestampIso, animate = true) {
  if (!formData) formData = {};

  const ts        = new Date(timestampIso || Date.now());
  const timeStr   = ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;
  const charCount = promptText.length;
  const contentId = 'content-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
  const formDataJson = JSON.stringify(formData).replace(/\\/g, '\\\\').replace(/"/g, '&quot;');

  const div = document.createElement('div');
  div.className = `message-system${animate ? '' : ' no-animate'}`;
  div.innerHTML = `
    <div class="message-system-header">
      <div class="system-avatar" aria-hidden="true">⚡</div>
      <div>
        <span class="system-label">Prompt Gerado</span>
        <span class="system-meta"> · ${timeStr}</span>
      </div>
    </div>
    <div class="prompt-card">
      <div class="prompt-card-header">
        <div class="prompt-card-tags">
          ${formData.modeloSelecionado ? `<span class="prompt-tag tag-model">${escapeHtml(formData.modeloSelecionado)}</span>` : ''}
          ${formData.tipoSaida         ? `<span class="prompt-tag">${escapeHtml(formData.tipoSaida)}</span>` : ''}
          ${formData.nivelDetalhamento ? `<span class="prompt-tag">${escapeHtml(formData.nivelDetalhamento)}</span>` : ''}
          ${formData.idioma            ? `<span class="prompt-tag">${escapeHtml(formData.idioma)}</span>` : ''}
        </div>
        <div class="prompt-card-actions">
          <button class="btn-secondary btn-copy" data-target="${contentId}" title="Copiar prompt" aria-label="Copiar prompt">
            📋 Copiar
          </button>
          <button class="btn-icon btn-download" data-target="${contentId}" title="Baixar como .txt" aria-label="Baixar prompt como .txt">
            ⬇️
          </button>
          <button class="btn-icon btn-expand" data-target="${contentId}" title="Expandir" aria-label="Expandir ou recolher">
            ⬆️
          </button>
        </div>
      </div>
      <div class="prompt-content" id="${contentId}">${escapeHtml(promptText)}</div>
      <div class="prompt-card-footer">
        <div class="prompt-actions-row">
          <button class="btn-secondary btn-regen" data-form="${formDataJson}" aria-label="Gerar novamente">
            🔄 Gerar Novamente
          </button>
        </div>
        <span class="prompt-word-count">${wordCount} palavras · ${charCount} chars</span>
      </div>
    </div>`;

  // Bind eventos de forma segura (sem inline handlers)
  div.querySelector('.btn-copy').addEventListener('click', function() {
    copyPrompt(contentId, this);
  });
  div.querySelector('.btn-download').addEventListener('click', () => downloadPrompt(contentId));
  div.querySelector('.btn-expand').addEventListener('click', function() {
    toggleExpand(contentId, this);
  });
  div.querySelector('.btn-regen').addEventListener('click', function() {
    const fd = this.getAttribute('data-form');
    handleRegenerate(fd);
  });

  el.chatMessages().appendChild(div);
}

/** Mensagem de erro no chat */
function appendErrorMessage(message) {
  renderErrorMessage(message);
  scrollToBottom();
}

function renderErrorMessage(message) {
  const div = document.createElement('div');
  div.className = 'error-message';
  div.innerHTML = `
    <span class="error-icon" aria-hidden="true">⚠️</span>
    <p class="error-text">${escapeHtml(message)}</p>`;
  el.chatMessages().appendChild(div);
}

/* ════════════════════════════════════════════════════════════════
   AÇÕES DOS CARDS DE PROMPT
   ════════════════════════════════════════════════════════════════ */

function copyPrompt(contentId, btn) {
  const contentEl = document.getElementById(contentId);
  if (!contentEl) return;
  const text = contentEl.textContent || '';

  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copiado!';
    btn.classList.add('copied');
    showToast('✅ Prompt copiado!', 'success');
    setTimeout(() => { btn.textContent = '📋 Copiar'; btn.classList.remove('copied'); }, 2500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✅ Prompt copiado!', 'success');
  });
}

function downloadPrompt(contentId) {
  const contentEl = document.getElementById(contentId);
  if (!contentEl) return;
  const text = contentEl.textContent || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `prompt-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('⬇️ Prompt baixado!', 'default', 2000);
}

function toggleExpand(contentId, btn) {
  const contentEl = document.getElementById(contentId);
  if (!contentEl) return;
  const expanded = contentEl.classList.toggle('expanded');
  btn.textContent = expanded ? '⬇️' : '⬆️';
  btn.title = expanded ? 'Recolher' : 'Expandir';
  btn.setAttribute('aria-label', expanded ? 'Recolher o prompt' : 'Expandir o prompt');
}

/* ════════════════════════════════════════════════════════════════
   WELCOME SCREEN
   ════════════════════════════════════════════════════════════════ */

function createWelcomeScreen() {
  const div = document.createElement('div');
  div.className = 'welcome-screen';
  div.id        = 'welcome-screen';
  div.innerHTML = `
    <div class="welcome-icon" aria-hidden="true">⚡</div>
    <h1 class="welcome-title">Gerador de Prompt</h1>
    <p class="welcome-subtitle">Transforme suas ideias em prompts profissionais para qualquer modelo de IA</p>
    <div class="welcome-features" role="list">
      <div class="feature-chip" role="listitem"><span aria-hidden="true">🎯</span> Engenharia de Prompt</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">🤖</span> 15+ Modelos de IA</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">⚡</span> Resposta Instantânea</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">💾</span> Histórico Salvo</div>
    </div>
    <p class="welcome-hint">Configure os parâmetros ao lado e descreva o que você precisa abaixo.</p>`;
  return div;
}

/* ════════════════════════════════════════════════════════════════
   UTILITÁRIOS
   ════════════════════════════════════════════════════════════════ */

function scrollToBottom() {
  const chat = el.chatMessages();
  if (!chat) return;
  if (chat.scrollHeight > chat.clientHeight) {
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/* ════════════════════════════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
