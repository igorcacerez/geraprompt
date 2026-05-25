/**
 * server.js
 * Servidor principal da aplicação Gerador de Prompt
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const { buildSystemPrompt } = require('./promptBuilder');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Validação da chave da API ────────────────────────────────────────────────
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERRO: Variável de ambiente OPENAI_API_KEY não configurada.');
  console.error('   Crie um arquivo .env baseado no .env.example e configure sua chave.');
  process.exit(1);
}

// ─── Cliente OpenAI ───────────────────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limita o body a 10kb por segurança

// ─── Headers de segurança e SEO ──────────────────────────────────
app.use((req, res, next) => {
  // Segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Cache para assets estáticos
  if (req.path.match(/\.(png|svg|ico|jpg|webp|woff2?|css|js)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// ─── Rotas explícitas para SEO ───────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'public', 'robots.txt'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'public', 'manifest.json'));
});

// ─── Rate Limit ───────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,             // máximo 10 requisições por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas solicitações. Por favor, aguarde um momento e tente novamente.',
  },
});

// ─── Validação dos dados de entrada ──────────────────────────────────────────
function validateRequestBody(body) {
  const { modeloSelecionado, tipoSaida, nivelDetalhamento, idioma, mensagemUsuario } = body;

  if (!modeloSelecionado || typeof modeloSelecionado !== 'string') {
    return 'Modelo de IA não informado.';
  }
  if (!tipoSaida || typeof tipoSaida !== 'string') {
    return 'Tipo de saída não informado.';
  }
  if (!nivelDetalhamento || typeof nivelDetalhamento !== 'string') {
    return 'Nível de detalhamento não informado.';
  }
  if (!idioma || typeof idioma !== 'string') {
    return 'Idioma não informado.';
  }
  if (!mensagemUsuario || typeof mensagemUsuario !== 'string') {
    return 'Mensagem do usuário não informada.';
  }
  if (mensagemUsuario.trim().length < 10) {
    return 'Por favor, descreva sua solicitação com mais detalhes (mínimo 10 caracteres).';
  }
  if (mensagemUsuario.length > 2000) {
    return 'A mensagem é muito longa. Por favor, limite a 2000 caracteres.';
  }

  return null; // sem erros
}

// ─── Rota principal da API ────────────────────────────────────────────────────
app.post('/api/generate-prompt', apiLimiter, async (req, res) => {
  try {
    // Validação
    const validationError = validateRequestBody(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { modeloSelecionado, tipoSaida, nivelDetalhamento, idioma, mensagemUsuario } = req.body;

    // Monta os prompts
    const { systemPrompt, userMessage } = buildSystemPrompt({
      modeloSelecionado: modeloSelecionado.trim(),
      tipoSaida: tipoSaida.trim(),
      nivelDetalhamento: nivelDetalhamento.trim(),
      idioma: idioma.trim(),
      mensagemUsuario: mensagemUsuario.trim(),
    });

    // Chama a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const promptGerado = completion.choices[0]?.message?.content;

    if (!promptGerado) {
      throw new Error('Resposta vazia da API.');
    }

    return res.json({ success: true, prompt: promptGerado.trim() });

  } catch (error) {
    console.error('Erro ao gerar prompt:', error?.message || error);

    // Erros específicos da OpenAI
    if (error?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API inválida. Verifique a configuração no servidor.',
      });
    }
    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Limite de uso da API atingido. Aguarde alguns instantes.',
      });
    }
    if (error?.status === 500 || error?.status === 503) {
      return res.status(503).json({
        success: false,
        message: 'O serviço da OpenAI está temporariamente indisponível. Tente novamente.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Não foi possível gerar o prompt agora. Verifique a configuração da API ou tente novamente.',
    });
  }
});

// ─── Rota de health check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Fallback para SPA ────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Inicia o servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Gerador de Prompt rodando em http://localhost:${PORT}`);
  console.log(`   Modelo OpenAI: ${process.env.OPENAI_MODEL || 'gpt-4.1-mini'}`);
});
