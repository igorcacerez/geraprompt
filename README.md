# ⚡ Gerador de Prompt

> Plataforma web para criação de prompts altamente profissionais usando engenharia de prompt avançada e a API da OpenAI.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📖 Descrição

O **Gerador de Prompt** é uma plataforma web que permite a qualquer usuário criar prompts altamente profissionais para diferentes modelos de IA, sem necessidade de cadastro ou pagamento.

O usuário informa o modelo de IA desejado, o tipo de saída esperada, o nível de detalhamento, o idioma e descreve sua necessidade em linguagem natural. O sistema utiliza a API da OpenAI para gerar um prompt otimizado, claro, estruturado e pronto para uso.

---

## ✨ Funcionalidades

- 🤖 **14+ modelos de IA suportados**: GPT, Gemini, Claude, Codex, Nano Banana, DALL-E, Midjourney, Stable Diffusion, Leonardo AI, Runway, Sora, Veo, Kling e mais
- 🎯 **Tipos de saída**: Texto, Imagem, Vídeo, Código, Documento, Planilha, Apresentação, E-mail, Post para Redes Sociais, Áudio, Aula, Atividade Escolar, Análise de Dados, Prompt para Agente de IA, Automação
- 📊 **5 níveis de detalhamento**: Simples, Médio, Avançado, Profissional, Ultra detalhado
- 🌐 **3 idiomas**: Português do Brasil, Inglês, Espanhol
- 📋 **Copiar prompt** com um clique
- ⬇️ **Baixar prompt** como arquivo `.txt`
- 🔄 **Gerar novamente** com os mesmos parâmetros
- 📈 **Contador de caracteres** em tempo real
- 🕐 **Histórico da sessão** sem banco de dados ou login
- ⚡ **Loading animado** durante a geração
- 📱 **Totalmente responsivo** para desktop e mobile
- 🔒 **Seguro**: API key nunca exposta no frontend

---

## 🛠️ Tecnologias

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | Node.js + Express                 |
| API de IA  | OpenAI SDK (oficial)              |
| Segurança  | dotenv, express-rate-limit, cors  |
| Frontend   | HTML, CSS, JavaScript puro        |
| Deploy     | Nixpacks (Easypanel)              |

---

## 📁 Estrutura de Pastas

```
gerador-de-prompt/
├── public/
│   ├── index.html        # Interface principal
│   ├── style.css         # Estilos (tema escuro moderno)
│   └── script.js         # Lógica do frontend
├── src/
│   ├── server.js         # Servidor Express principal
│   └── promptBuilder.js  # Montagem do prompt para a OpenAI
├── .env.example          # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Como Instalar

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- Uma chave da API da OpenAI ([obter aqui](https://platform.openai.com/api-keys))

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/gerador-de-prompt.git
cd gerador-de-prompt
```

### 2. Instale as dependências

```bash
npm install
```

---

## ⚙️ Como Configurar

### 1. Copie o arquivo de exemplo

```bash
cp .env.example .env
```

### 2. Edite o arquivo `.env`

```env
OPENAI_API_KEY=sk-proj-sua_chave_aqui
PORT=3000
OPENAI_MODEL=gpt-4.1-mini
```

| Variável          | Descrição                                           | Padrão        |
|-------------------|-----------------------------------------------------|---------------|
| `OPENAI_API_KEY`  | Sua chave secreta da API da OpenAI (obrigatória)    | —             |
| `PORT`            | Porta onde o servidor irá rodar                     | `3000`        |
| `OPENAI_MODEL`    | Modelo da OpenAI usado para gerar os prompts        | `gpt-4.1-mini` |

> **Importante**: O arquivo `.env` nunca deve ser enviado ao repositório. Ele já está no `.gitignore`.

---

## ▶️ Como Rodar Localmente

### Modo produção

```bash
npm start
```

### Modo desenvolvimento (com hot-reload)

```bash
npm run dev
```

Acesse em: **http://localhost:3000**

---

## 💡 Exemplos de Uso

### Exemplo 1 — Imagem com Nano Banana

| Campo              | Valor                              |
|--------------------|------------------------------------|
| Modelo             | Nano Banana                        |
| Tipo de saída      | Imagem                             |
| Nível              | Ultra detalhado                    |
| Idioma             | Português do Brasil                |
| Mensagem           | Quero uma calopsita programadora chamada Devsita em estilo 3D realista |

### Exemplo 2 — Sistema com GPT/Codex

| Campo              | Valor                              |
|--------------------|------------------------------------|
| Modelo             | Codex                              |
| Tipo de saída      | Código                             |
| Nível              | Profissional                       |
| Idioma             | Inglês                             |
| Mensagem           | Create a SaaS task management system with authentication, teams and notifications |

### Exemplo 3 — Roteiro de vídeo com Sora

| Campo              | Valor                              |
|--------------------|------------------------------------|
| Modelo             | Sora                               |
| Tipo de saída      | Vídeo                              |
| Nível              | Avançado                           |
| Idioma             | Português do Brasil                |
| Mensagem           | Vídeo de 30 segundos de um pôr do sol nas montanhas com névoa |

---

## 🌐 Deploy no Easypanel com Nixpacks

### Passo a Passo

**1. Crie um novo projeto no Easypanel**
- Acesse o painel do Easypanel
- Clique em **"Create Service"**
- Selecione **"App"**

**2. Conecte o repositório**
- Escolha **GitHub** (ou outro provedor Git)
- Autorize o acesso e selecione o repositório `gerador-de-prompt`

**3. Configure o build**
- Build Pack: **Nixpacks** (detectado automaticamente pelo `package.json`)
- Start Command: `npm start`

**4. Configure as variáveis de ambiente**

No painel de "Environment Variables", adicione:

| Variável          | Valor                    |
|-------------------|--------------------------|
| `OPENAI_API_KEY`  | `sk-proj-sua_chave_aqui` |
| `PORT`            | `3000`                   |
| `OPENAI_MODEL`    | `gpt-4.1-mini`            |

**5. Configure o domínio**
- Vá em **"Domains"**
- Adicione seu domínio ou use o subdomínio fornecido pelo Easypanel

**6. Ative o HTTPS**
- O Easypanel ativa SSL automaticamente via Let's Encrypt
- Certifique-se de que está habilitado nas configurações do serviço

**7. Deploy**
- Clique em **"Deploy"**
- Acompanhe os logs até o servidor iniciar com sucesso:
  ```
  ✅ Gerador de Prompt rodando em http://localhost:3000
  ```

**8. Teste a aplicação**
- Acesse seu domínio no navegador
- Faça um teste completo gerando um prompt

---

## 🔒 Segurança

- A chave `OPENAI_API_KEY` fica **somente no servidor** e nunca é enviada ao frontend
- Rate limit de **10 requisições por IP por minuto** para evitar abuso
- Body parsing limitado a **10KB** por requisição
- Validação de tamanho da mensagem (máximo 2000 caracteres)
- Todos os erros retornam mensagens genéricas — detalhes internos nunca são expostos
- O arquivo `.env` está no `.gitignore` — nunca faça commit das suas chaves

---

## 🔌 API

### POST `/api/generate-prompt`

Gera um prompt profissional com base nos parâmetros fornecidos.

**Request Body:**
```json
{
  "modeloSelecionado": "GPT",
  "tipoSaida": "Imagem",
  "nivelDetalhamento": "Ultra detalhado",
  "idioma": "Português do Brasil",
  "mensagemUsuario": "Quero criar uma imagem de uma calopsita programadora realista para redes sociais."
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "prompt": "Prompt gerado aqui..."
}
```

**Resposta de erro:**
```json
{
  "success": false,
  "message": "Não foi possível gerar o prompt agora. Verifique a configuração da API ou tente novamente."
}
```

### GET `/api/health`

Verificação de status do servidor.

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ⚡ e engenharia de prompt.**
