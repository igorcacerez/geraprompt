/**
 * promptBuilder.js
 * Responsável por montar a instrução enviada para a OpenAI
 * com base nas configurações e solicitação do usuário.
 */

/**
 * Retorna instruções específicas por modelo de IA
 */
function getModelInstructions(modeloSelecionado) {
  const modelo = modeloSelecionado.toLowerCase();

  if (modelo.includes('gpt')) {
    return `Para o modelo GPT, crie prompts claros e estruturados com:
- Definição explícita de papel/persona
- Contexto detalhado
- Tarefa bem definida
- Formato de saída esperado
- Critérios de qualidade
- Ideal para texto, código, análise, documentos e raciocínio complexo.`;
  }

  if (modelo.includes('gemini')) {
    return `Para o modelo Gemini, valorize:
- Contexto amplo e multimodal
- Análise de imagens, vídeos e documentos
- Integração com serviços Google
- Prompts diretos, ricos em contexto e bem divididos por seções.`;
  }

  if (modelo.includes('claude')) {
    return `Para o modelo Claude, crie prompts longos e bem estruturados com:
- Contexto extenso e detalhado
- Regras claras e explícitas
- Seções bem definidas: Contexto, Objetivo, Regras, Tarefa, Formato da Resposta, Critérios
- Foco em qualidade textual, análise profunda e desenvolvimento.`;
  }

  if (modelo.includes('codex')) {
    return `Para o modelo Codex, crie prompts técnicos com:
- Stack tecnológica completa
- Funcionalidades detalhadas
- Arquitetura do sistema
- Banco de dados e modelagem
- Rotas e endpoints
- Telas e fluxos de usuário
- Regras de negócio
- Segurança e boas práticas
- Instruções de deploy e README.`;
  }

  if (modelo.includes('nano') || modelo.includes('banana')) {
    return `Para o modelo Nano Banana (geração de imagem), crie prompts visuais extremamente detalhados com:
- Descrição do personagem ou objeto principal com máximo detalhe
- Estilo visual (3D realista, cartoon, anime, fotorrealista, etc.)
- Iluminação (natural, dramática, neon, suave, etc.)
- Composição e enquadramento (close-up, plano americano, vista aérea, etc.)
- Câmera e lente (grande angular, teleobjetiva, etc.)
- Cenário e ambiente detalhado
- Texturas e materiais
- Paleta de cores
- Proporção e resolução
- Qualidade técnica
- Elementos negativos (o que NÃO deve aparecer).`;
  }

  if (modelo.includes('dall-e') || modelo.includes('dalle')) {
    return `Para o modelo DALL-E, crie prompts visuais objetivos e ricos com:
- Estilo artístico claro
- Descrição do personagem/objeto principal
- Cenário e contexto
- Iluminação e atmosfera
- Enquadramento e composição
- Proporção e qualidade
- Tom e humor da imagem.`;
  }

  if (modelo.includes('midjourney')) {
    return `Para o modelo Midjourney, crie prompts no estilo característico da plataforma com:
- Descrição visual poética e evocativa
- Estilo artístico específico (fotorrealista, ilustração, pintura a óleo, etc.)
- Artistas de referência quando relevante
- Parâmetros técnicos (--ar para proporção, --v para versão, --style, --q)
- Iluminação cinematográfica
- Detalhes de textura e atmosfera.`;
  }

  if (modelo.includes('stable') || modelo.includes('diffusion')) {
    return `Para Stable Diffusion, crie prompts técnicos com:
- Tags descritivas separadas por vírgula
- Qualidade: masterpiece, best quality, ultra-detailed, 8k
- Estilo visual detalhado
- Descrição do sujeito principal
- Cenário e iluminação
- Negative prompt com elementos indesejados
- Parâmetros técnicos relevantes.`;
  }

  if (modelo.includes('runway') || modelo.includes('sora') || modelo.includes('veo') || modelo.includes('kling')) {
    return `Para modelos de geração de vídeo, crie prompts divididos por cenas com:
- Duração de cada cena
- Movimento de câmera (pan, zoom, travelling, etc.)
- Narração e diálogos
- Estilo visual consistente
- Ritmo e transições
- Trilha sonora e efeitos de áudio
- Ambiente e iluminação
- Detalhamento frame por frame quando necessário.`;
  }

  if (modelo.includes('leonardo')) {
    return `Para o modelo Leonardo AI, crie prompts visuais detalhados com:
- Descrição artística rica
- Estilo e técnica visual
- Personagem ou objeto principal com detalhes
- Ambiente e composição
- Iluminação e sombras
- Paleta de cores
- Qualidade e resolução
- Elementos de estilo únicos.`;
  }

  // Modelo genérico / Outro
  return `Para este modelo de IA, crie um prompt claro e estruturado com:
- Definição de papel e contexto
- Objetivo claro e mensurável
- Tarefa detalhada
- Restrições e regras
- Formato de saída esperado
- Critérios de qualidade.`;
}

/**
 * Retorna instruções específicas por tipo de saída
 */
function getOutputInstructions(tipoSaida) {
  const tipo = tipoSaida.toLowerCase();

  if (tipo.includes('imagem')) {
    return `Como é uma saída de IMAGEM, o prompt deve obrigatoriamente incluir:
- Personagem ou objeto principal com descrição detalhada
- Estilo visual (fotorrealista, 3D, cartoon, anime, pintura, etc.)
- Cenário e ambiente
- Iluminação (natural, estúdio, dramática, neon, golden hour, etc.)
- Composição e enquadramento
- Câmera e perspectiva
- Texturas e materiais
- Paleta de cores dominante
- Proporção e formato (16:9, 1:1, 9:16, etc.)
- Qualidade técnica (4K, 8K, ultra-detailed, etc.)
- Elementos negativos (o que NÃO incluir)`;
  }

  if (tipo.includes('vídeo') || tipo.includes('video')) {
    return `Como é uma saída de VÍDEO, o prompt deve incluir:
- Duração total e por cena
- Descrição de cada cena sequencialmente
- Movimento de câmera por cena (pan, tilt, zoom, travelling, steady)
- Narração ou diálogos
- Estilo visual consistente (cinematográfico, documental, animação, etc.)
- Ritmo e cadência das cenas
- Transições entre cenas
- Trilha sonora e efeitos de áudio
- Iluminação e atmosfera de cada cena
- Elementos visuais específicos`;
  }

  if (tipo.includes('código') || tipo.includes('codigo')) {
    return `Como é uma saída de CÓDIGO, o prompt deve incluir:
- Papel da IA (desenvolvedor sênior, arquiteto, etc.)
- Stack tecnológica completa
- Funcionalidades a implementar
- Arquitetura do projeto
- Banco de dados e modelagem de dados
- APIs e endpoints
- Telas e componentes de interface
- Regras de negócio
- Segurança e validações
- Padrões de código
- Deploy e configuração
- README e documentação`;
  }

  if (tipo.includes('documento')) {
    return `Como é um DOCUMENTO, o prompt deve incluir:
- Estrutura completa de seções
- Tom e voz do documento
- Público-alvo
- Objetivo do documento
- Formatação esperada
- Tamanho aproximado
- Referências quando necessário`;
  }

  if (tipo.includes('planilha')) {
    return `Como é uma PLANILHA, o prompt deve incluir:
- Nome e propósito das colunas
- Fórmulas e cálculos necessários
- Organização e hierarquia dos dados
- Tipos de dados por coluna
- Abas e estrutura de navegação
- Regras de preenchimento e validação
- Formatação condicional quando necessário`;
  }

  if (tipo.includes('apresentação')) {
    return `Como é uma APRESENTAÇÃO, o prompt deve incluir:
- Número de slides
- Estrutura e ordem dos slides
- Mensagem principal de cada slide
- Design visual e identidade
- Dados e gráficos necessários
- Tom da apresentação
- Público e contexto`;
  }

  if (tipo.includes('post') || tipo.includes('redes sociais')) {
    return `Como é um POST PARA REDES SOCIAIS, o prompt deve incluir:
- Plataforma específica (Instagram, TikTok, LinkedIn, Twitter/X, etc.)
- Tom e voz da marca
- Objetivo do post (engajamento, vendas, educação, etc.)
- Hashtags relevantes
- Call-to-action
- Tamanho e formato do texto
- Emojis e elementos visuais`;
  }

  if (tipo.includes('e-mail') || tipo.includes('email')) {
    return `Como é um E-MAIL, o prompt deve incluir:
- Tipo de e-mail (comercial, pessoal, marketing, transacional, etc.)
- Tom e formalidade
- Assunto impactante
- Estrutura do corpo
- Call-to-action
- Assinatura
- Público-alvo`;
  }

  if (tipo.includes('aula')) {
    return `Como é uma AULA, o prompt deve incluir:
- Nível do público (básico, intermediário, avançado)
- Objetivos de aprendizagem
- Estrutura da aula (introdução, desenvolvimento, conclusão)
- Exemplos práticos e exercícios
- Materiais de apoio
- Tempo estimado
- Metodologia pedagógica`;
  }

  if (tipo.includes('atividade') || tipo.includes('escolar')) {
    return `Como é uma ATIVIDADE ESCOLAR, o prompt deve incluir:
- Nível de ensino e faixa etária
- Disciplina ou área do conhecimento
- Objetivos pedagógicos
- Tipo de atividade (exercício, projeto, avaliação, etc.)
- Instruções claras para o aluno
- Critérios de avaliação
- Tempo de execução`;
  }

  if (tipo.includes('análise') || tipo.includes('analise') || tipo.includes('dados')) {
    return `Como é uma ANÁLISE DE DADOS, o prompt deve incluir:
- Tipo de dados a analisar
- Métricas e KPIs relevantes
- Metodologia de análise
- Visualizações esperadas (gráficos, tabelas, etc.)
- Insights desejados
- Formato do relatório final
- Contexto e objetivo da análise`;
  }

  if (tipo.includes('agente') || tipo.includes('automação') || tipo.includes('automacao')) {
    return `Como é um PROMPT PARA AGENTE DE IA ou AUTOMAÇÃO, o prompt deve incluir:
- Objetivo e escopo do agente
- Ferramentas e capacidades disponíveis
- Regras de comportamento e ética
- Fluxo de decisão
- Tratamento de exceções e erros
- Formato de saída das ações
- Limites e restrições claras`;
  }

  if (tipo.includes('áudio') || tipo.includes('audio')) {
    return `Como é um ÁUDIO, o prompt deve incluir:
- Tipo de áudio (podcast, narração, música, efeito sonoro, etc.)
- Tom e emoção
- Duração estimada
- Público-alvo
- Roteiro ou estrutura
- Estilo de voz
- Ambiente sonoro`;
  }

  return `O prompt deve incluir contexto claro, objetivo mensurável, formato esperado e critérios de qualidade.`;
}

/**
 * Retorna instruções de nível de detalhamento
 */
function getDetailLevel(nivelDetalhamento) {
  const nivel = nivelDetalhamento.toLowerCase();

  if (nivel.includes('simples')) {
    return 'Crie um prompt simples, direto e objetivo. Máximo de 200 palavras. Sem seções complexas.';
  }
  if (nivel.includes('médio') || nivel.includes('medio')) {
    return 'Crie um prompt de nível médio, com contexto, tarefa e formato de saída. Entre 200 e 400 palavras.';
  }
  if (nivel.includes('avançado') || nivel.includes('avancado')) {
    return 'Crie um prompt avançado com persona, contexto, tarefa, regras, formato e critérios. Entre 400 e 700 palavras.';
  }
  if (nivel.includes('profissional')) {
    return 'Crie um prompt profissional completo, com todas as seções bem estruturadas, exemplos quando necessário e critérios claros. Entre 600 e 1000 palavras.';
  }
  if (nivel.includes('ultra')) {
    return 'Crie o prompt mais detalhado possível. Sem limite de palavras. Use todas as seções pertinentes, inclua exemplos, contra-exemplos, variações e máximo de detalhes técnicos. Seja extremamente específico e completo.';
  }

  return 'Crie um prompt bem estruturado com nível de detalhamento adequado para a solicitação.';
}

/**
 * Monta o prompt interno que será enviado para a OpenAI
 */
function buildSystemPrompt(dados) {
  const { modeloSelecionado, tipoSaida, nivelDetalhamento, idioma, mensagemUsuario } = dados;

  const modelInstructions = getModelInstructions(modeloSelecionado);
  const outputInstructions = getOutputInstructions(tipoSaida);
  const detailInstructions = getDetailLevel(nivelDetalhamento);

  const systemPrompt = `Você é um especialista sênior em engenharia de prompt, IA generativa, UX, criação de conteúdo e automação. Com mais de 10 anos de experiência criando prompts profissionais para os mais diversos modelos de IA. Sua tarefa é transformar a solicitação simples do usuário em um prompt profissional, claro, estruturado e altamente eficiente.

CONFIGURAÇÕES DO USUÁRIO:
- Modelo de IA alvo: ${modeloSelecionado}
- Tipo de saída desejada: ${tipoSaida}
- Nível de detalhamento: ${nivelDetalhamento}
- Idioma do prompt gerado: ${idioma}

INSTRUÇÃO DE DETALHAMENTO:
${detailInstructions}

INSTRUÇÕES ESPECÍFICAS PARA O MODELO ${modeloSelecionado.toUpperCase()}:
${modelInstructions}

INSTRUÇÕES ESPECÍFICAS PARA O TIPO DE SAÍDA (${tipoSaida.toUpperCase()}):
${outputInstructions}

BOAS PRÁTICAS OBRIGATÓRIAS:
O prompt gerado deve conter, quando aplicável:
- Definição clara de papel/persona da IA
- Contextualização completa do objetivo
- Descrição precisa e inequívoca da tarefa
- Restrições e regras explícitas
- Formato de saída esperado
- Tom e estilo de comunicação
- Público-alvo
- Critérios de qualidade mensuráveis
- Exemplos concretos quando necessário
- Instruções negativas (o que NÃO fazer)
- Detalhamento técnico quando pertinente
- Organização em blocos/seções visuais
- Clareza e ausência total de ambiguidade

IDIOMA:
Gere o prompt final no idioma: ${idioma}

REGRAS CRÍTICAS:
- Entregue SOMENTE o prompt final, sem comentários, explicações ou observações suas
- Não diga "aqui está o prompt" ou qualquer frase introdutória
- Não adicione observações ao final
- O prompt deve ser pronto para copiar e colar diretamente no modelo de IA
- Adapte a estrutura ao modelo escolhido
- Seja específico, não genérico
- Use formatação com seções e marcações quando adequado ao modelo`;

  const userMessage = `Solicitação do usuário: "${mensagemUsuario}"

Crie agora o prompt profissional otimizado para ${modeloSelecionado} com foco em ${tipoSaida}, no nível ${nivelDetalhamento}, em ${idioma}.`;

  return { systemPrompt, userMessage };
}

module.exports = { buildSystemPrompt };
