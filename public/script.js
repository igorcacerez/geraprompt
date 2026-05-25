/**
 * script.js
 * Lógica do frontend do Gerador de Prompt
 */

/* ─── Estado da aplicação ─────────────────────────────────────── */
const state = {
  isLoading: false,
  lastFormData: null,
  history: [],        // histórico temporário da sessão
};

/* ─── Referências DOM ─────────────────────────────────────────── */
const elements = {
  modeloSelect:     () => document.getElementById('modelo-select'),
  saidaSelect:      () => document.getElementById('saida-select'),
  nivelSelect:      () => document.getElementById('nivel-select'),
  idiomaSelect:     () => document.getElementById('idioma-select'),
  userMessage:      () => document.getElementById('user-message'),
  btnGenerate:      () => document.getElementById('btn-generate'),
  btnClear:         () => document.getElementById('btn-clear'),
  chatMessages:     () => document.getElementById('chat-messages'),
  welcomeScreen:    () => document.getElementById('welcome-screen'),
  charCount:        () => document.getElementById('char-count'),
  charCounter:      () => document.getElementById('char-counter'),
  levelFill:        () => document.getElementById('level-fill'),
  levelLabel:       () => document.getElementById('level-label'),
  toast:            () => document.getElementById('toast'),
  validationModal:  () => document.getElementById('validation-modal'),
  modalMessage:     () => document.getElementById('modal-message'),
  modalClose:       () => document.getElementById('modal-close'),
};

/* ─── Mapa de níveis de detalhamento ─────────────────────────── */
const levelConfig = {
  'Simples':          { width: '20%',  label: 'Simples' },
  'Médio':            { width: '40%',  label: 'Médio' },
  'Avançado':         { width: '60%',  label: 'Avançado' },
  'Profissional':     { width: '80%',  label: 'Profissional' },
  'Ultra detalhado':  { width: '100%', label: 'Ultra detalhado' },
};

/* ─── Inicialização ───────────────────────────────────────────── */
function init() {
  setupEventListeners();
  updateLevelIndicator();
  autoResizeTextarea();
}

/* ─── Event Listeners ─────────────────────────────────────────── */
function setupEventListeners() {
  // Atualiza contador de caracteres
  elements.userMessage().addEventListener('input', () => {
    updateCharCounter();
    autoResizeTextarea();
  });

  // Atualiza indicador de nível
  elements.nivelSelect().addEventListener('change', updateLevelIndicator);

  // Gerar prompt ao pressionar Enter (Shift+Enter = nova linha)
  elements.userMessage().addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  });

  // Botão gerar
  elements.btnGenerate().addEventListener('click', handleGenerate);

  // Botão limpar
  elements.btnClear().addEventListener('click', handleClear);

  // Fechar modal
  elements.modalClose().addEventListener('click', closeModal);
  elements.validationModal().addEventListener('click', (e) => {
    if (e.target === elements.validationModal()) closeModal();
  });
}

/* ─── Contador de caracteres ──────────────────────────────────── */
function updateCharCounter() {
  const len = elements.userMessage().value.length;
  elements.charCount().textContent = len;

  const counter = elements.charCounter();
  counter.classList.remove('warning', 'danger');

  if (len > 1800) counter.classList.add('danger');
  else if (len > 1500) counter.classList.add('warning');
}

/* ─── Auto-resize do textarea ─────────────────────────────────── */
function autoResizeTextarea() {
  const ta = elements.userMessage();
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}

/* ─── Indicador de nível ──────────────────────────────────────── */
function updateLevelIndicator() {
  const nivel = elements.nivelSelect().value;
  const config = levelConfig[nivel] || { width: '60%', label: nivel };
  elements.levelFill().style.width = config.width;
  elements.levelLabel().textContent = config.label;
}

/* ─── Toast de notificação ────────────────────────────────────── */
function showToast(message, type = 'default', duration = 3000) {
  const toast = elements.toast();
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.className = 'toast'; }, 300);
  }, duration);
}

/* ─── Modal de validação ──────────────────────────────────────── */
function showModal(message) {
  elements.modalMessage().textContent = message;
  elements.validationModal().removeAttribute('hidden');
  elements.modalClose().focus();
}

function closeModal() {
  elements.validationModal().setAttribute('hidden', '');
  elements.userMessage().focus();
}

/* ─── Validação do formulário ─────────────────────────────────── */
function validateForm() {
  const modelo = elements.modeloSelect().value;
  const saida  = elements.saidaSelect().value;
  const msg    = elements.userMessage().value.trim();

  if (!modelo) {
    showModal('Por favor, selecione o modelo de IA que deseja utilizar.');
    elements.modeloSelect().focus();
    return false;
  }
  if (!saida) {
    showModal('Por favor, selecione o tipo de saída desejada.');
    elements.saidaSelect().focus();
    return false;
  }
  if (!msg) {
    showModal('Por favor, descreva o que você precisa no campo de mensagem.');
    elements.userMessage().focus();
    return false;
  }
  if (msg.length < 10) {
    showModal('Sua solicitação está muito curta. Descreva com um pouco mais de detalhes.');
    elements.userMessage().focus();
    return false;
  }

  return true;
}

/* ─── Coleta dados do formulário ─────────────────────────────── */
function getFormData() {
  return {
    modeloSelecionado:  elements.modeloSelect().value,
    tipoSaida:          elements.saidaSelect().value,
    nivelDetalhamento:  elements.nivelSelect().value,
    idioma:             elements.idiomaSelect().value,
    mensagemUsuario:    elements.userMessage().value.trim(),
  };
}

/* ─── Handler principal: Gerar Prompt ────────────────────────── */
async function handleGenerate() {
  if (state.isLoading) return;
  if (!validateForm()) return;

  const formData = getFormData();
  state.lastFormData = formData;

  // Esconde a tela de boas-vindas
  const welcome = elements.welcomeScreen();
  if (welcome) welcome.style.display = 'none';

  // Adiciona mensagem do usuário ao chat
  appendUserMessage(formData.mensagemUsuario);

  // Mostra loading
  const loadingId = appendLoadingMessage();

  setLoadingState(true);

  try {
    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    // Remove loading
    removeLoadingMessage(loadingId);

    if (!response.ok || !data.success) {
      appendErrorMessage(data.message || 'Não foi possível gerar o prompt agora. Tente novamente.');
      return;
    }

    // Exibe o prompt gerado
    appendPromptResult(data.prompt, formData);

    // Salva no histórico da sessão
    state.history.push({ formData, prompt: data.prompt, timestamp: new Date() });

    // Limpa o campo de mensagem após sucesso
    elements.userMessage().value = '';
    updateCharCounter();
    autoResizeTextarea();

  } catch (err) {
    removeLoadingMessage(loadingId);
    appendErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
    console.error('Erro na requisição:', err);
  } finally {
    setLoadingState(false);
  }
}

/* ─── Handler: Limpar ─────────────────────────────────────────── */
function handleClear() {
  // Limpa o campo de mensagem
  elements.userMessage().value = '';
  updateCharCounter();
  autoResizeTextarea();

  // Limpa o chat
  const chatMessages = elements.chatMessages();
  chatMessages.innerHTML = '';

  // Recria a tela de boas-vindas
  const welcome = createWelcomeScreen();
  chatMessages.appendChild(welcome);

  // Reseta estado
  state.lastFormData = null;
  state.history = [];

  showToast('✨ Tudo limpo!', 'default', 2000);
  elements.userMessage().focus();
}

/* ─── Handler: Gerar Novamente ────────────────────────────────── */
async function handleRegenerate(formData) {
  if (state.isLoading) return;

  // Mostra loading diretamente
  const loadingId = appendLoadingMessage();
  setLoadingState(true);

  try {
    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    removeLoadingMessage(loadingId);

    if (!response.ok || !data.success) {
      appendErrorMessage(data.message || 'Não foi possível gerar o prompt. Tente novamente.');
      return;
    }

    appendPromptResult(data.prompt, formData);
    state.history.push({ formData, prompt: data.prompt, timestamp: new Date() });

  } catch (err) {
    removeLoadingMessage(loadingId);
    appendErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    setLoadingState(false);
  }
}

/* ─── Estado de loading ───────────────────────────────────────── */
function setLoadingState(loading) {
  state.isLoading = loading;
  const btn = elements.btnGenerate();
  btn.disabled = loading;
  btn.querySelector('.btn-text').textContent = loading ? 'Gerando...' : 'Gerar Prompt';
  btn.querySelector('.btn-icon-right').textContent = loading ? '⏳' : '⚡';
}

/* ─── Adiciona mensagem do usuário ────────────────────────────── */
function appendUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'message-user';
  el.innerHTML = `<div class="message-bubble-user">${escapeHtml(text)}</div>`;
  elements.chatMessages().appendChild(el);
  scrollToBottom();
}

/* ─── Adiciona loading ao chat ────────────────────────────────── */
function appendLoadingMessage() {
  const id = 'loading-' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'loading-message';
  el.innerHTML = `
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
  elements.chatMessages().appendChild(el);
  scrollToBottom();
  return id;
}

/* ─── Remove loading ──────────────────────────────────────────── */
function removeLoadingMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/* ─── Adiciona resultado do prompt ao chat ────────────────────── */
function appendPromptResult(promptText, formData) {
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;
  const charCount = promptText.length;
  const promptId = 'prompt-' + Date.now();
  const contentId = 'content-' + Date.now();

  const el = document.createElement('div');
  el.className = 'message-system';
  el.innerHTML = `
    <div class="message-system-header">
      <div class="system-avatar" aria-hidden="true">⚡</div>
      <div>
        <span class="system-label">Prompt Gerado</span>
        <span class="system-meta"> · ${timestamp}</span>
      </div>
    </div>
    <div class="prompt-card" id="${promptId}">
      <div class="prompt-card-header">
        <div class="prompt-card-tags">
          <span class="prompt-tag tag-model">${escapeHtml(formData.modeloSelecionado)}</span>
          <span class="prompt-tag">${escapeHtml(formData.tipoSaida)}</span>
          <span class="prompt-tag">${escapeHtml(formData.nivelDetalhamento)}</span>
          <span class="prompt-tag">${escapeHtml(formData.idioma)}</span>
        </div>
        <div class="prompt-card-actions">
          <button class="btn-secondary" onclick="copyPrompt('${contentId}', this)" title="Copiar prompt" aria-label="Copiar prompt para a área de transferência">
            📋 Copiar
          </button>
          <button class="btn-icon" onclick="downloadPrompt('${contentId}', '${promptId}')" title="Baixar como .txt" aria-label="Baixar prompt como arquivo de texto">
            ⬇️
          </button>
          <button class="btn-icon" onclick="toggleExpand('${contentId}', this)" title="Expandir/Recolher" aria-label="Expandir ou recolher o prompt">
            ⬆️
          </button>
        </div>
      </div>
      <div class="prompt-content" id="${contentId}">${escapeHtml(promptText)}</div>
      <div class="prompt-card-footer">
        <div class="prompt-actions-row">
          <button class="btn-secondary" onclick="handleRegenerate(${JSON.stringify(formData).replace(/"/g, '&quot;')})" aria-label="Gerar novamente com os mesmos parâmetros">
            🔄 Gerar Novamente
          </button>
        </div>
        <span class="prompt-word-count">${wordCount} palavras · ${charCount} caracteres</span>
      </div>
    </div>`;

  elements.chatMessages().appendChild(el);
  scrollToBottom();
}

/* ─── Adiciona mensagem de erro ao chat ───────────────────────── */
function appendErrorMessage(message) {
  const el = document.createElement('div');
  el.className = 'error-message';
  el.innerHTML = `
    <span class="error-icon" aria-hidden="true">⚠️</span>
    <p class="error-text">${escapeHtml(message)}</p>`;
  elements.chatMessages().appendChild(el);
  scrollToBottom();
}

/* ─── Copia o prompt ──────────────────────────────────────────── */
function copyPrompt(contentId, btn) {
  const el = document.getElementById(contentId);
  if (!el) return;

  const text = el.textContent || '';

  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copiado!';
    btn.classList.add('copied');
    showToast('✅ Prompt copiado com sucesso!', 'success');

    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copied');
    }, 2500);
  }).catch(() => {
    // Fallback para navegadores sem suporte
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showToast('✅ Prompt copiado!', 'success');
  });
}

/* ─── Baixa o prompt como .txt ────────────────────────────────── */
function downloadPrompt(contentId) {
  const el = document.getElementById(contentId);
  if (!el) return;

  const text = el.textContent || '';
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

/* ─── Expandir / Recolher o prompt ───────────────────────────── */
function toggleExpand(contentId, btn) {
  const el = document.getElementById(contentId);
  if (!el) return;

  const isExpanded = el.classList.toggle('expanded');
  btn.textContent = isExpanded ? '⬇️' : '⬆️';
  btn.title = isExpanded ? 'Recolher' : 'Expandir';
  btn.setAttribute('aria-label', isExpanded ? 'Recolher o prompt' : 'Expandir o prompt');
}

/* ─── Cria tela de boas-vindas ────────────────────────────────── */
function createWelcomeScreen() {
  const el = document.createElement('div');
  el.className = 'welcome-screen';
  el.id = 'welcome-screen';
  el.innerHTML = `
    <div class="welcome-icon" aria-hidden="true">⚡</div>
    <h1 class="welcome-title">Gerador de Prompt</h1>
    <p class="welcome-subtitle">Transforme suas ideias em prompts profissionais para qualquer modelo de IA</p>
    <div class="welcome-features" role="list">
      <div class="feature-chip" role="listitem"><span aria-hidden="true">🎯</span> Engenharia de Prompt</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">🤖</span> 14+ Modelos de IA</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">⚡</span> Resposta Instantânea</div>
      <div class="feature-chip" role="listitem"><span aria-hidden="true">🌐</span> 3 Idiomas</div>
    </div>
    <p class="welcome-hint">Configure os parâmetros ao lado e descreva o que você precisa abaixo.</p>`;
  return el;
}

/* ─── Scroll para o final ─────────────────────────────────────── */
function scrollToBottom() {
  const chat = elements.chatMessages();
  // Para mobile onde chat-messages não tem scroll proprio
  if (chat.scrollHeight > chat.clientHeight) {
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

/* ─── Utilitário: escape HTML ─────────────────────────────────── */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/* ─── Inicia a aplicação ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
