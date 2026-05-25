/**
 * promptBuilder.js
 * Motor de construção de prompts para a API da OpenAI.
 * Usa a base de conhecimento local (models-knowledge.json) para gerar
 * instruções altamente precisas e adaptadas a cada modelo de IA.
 */

const path = require('path');

// ─── Carrega a base de conhecimento ──────────────────────────────────────────
let knowledge;
try {
  knowledge = require(path.join(__dirname, 'models-knowledge.json'));
} catch (err) {
  console.error('❌ Erro ao carregar models-knowledge.json:', err.message);
  knowledge = { modelos: {}, tipos_saida: {}, niveis_detalhamento: {} };
}

// ─── Busca dados do modelo na knowledge base ──────────────────────────────────
function getModelData(modeloSelecionado) {
  const modelos = knowledge.modelos || {};

  // Busca exata primeiro
  if (modelos[modeloSelecionado]) {
    return modelos[modeloSelecionado];
  }

  // Busca fuzzy (case-insensitive, parcial)
  const modeloLower = modeloSelecionado.toLowerCase();
  for (const key of Object.keys(modelos)) {
    if (
      key.toLowerCase() === modeloLower ||
      modeloLower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(modeloLower)
    ) {
      return modelos[key];
    }
  }

  // Fallback para "Outro"
  return modelos['Outro'] || null;
}

// ─── Busca dados do tipo de saída na knowledge base ───────────────────────────
function getOutputData(tipoSaida) {
  const tipos = knowledge.tipos_saida || {};

  if (tipos[tipoSaida]) return tipos[tipoSaida];

  const tipoLower = tipoSaida.toLowerCase();
  for (const key of Object.keys(tipos)) {
    if (key.toLowerCase() === tipoLower || tipoLower.includes(key.toLowerCase())) {
      return tipos[key];
    }
  }

  return null;
}

// ─── Busca dados do nível de detalhamento ─────────────────────────────────────
function getLevelData(nivelDetalhamento) {
  const niveis = knowledge.niveis_detalhamento || {};
  return niveis[nivelDetalhamento] || niveis['Avançado'] || { instrucao: 'Crie um prompt bem estruturado.', tamanho_alvo: '400-700 palavras' };
}

// ─── Formata as boas práticas do modelo ───────────────────────────────────────
function formatModelBestPractices(modelData) {
  if (!modelData) return '';

  const lines = [];

  if (modelData.descricao) {
    lines.push(`Descrição do modelo: ${modelData.descricao}`);
  }

  if (modelData.pontos_fortes && modelData.pontos_fortes.length > 0) {
    lines.push(`\nPontos fortes deste modelo:\n${modelData.pontos_fortes.map(p => `• ${p}`).join('\n')}`);
  }

  if (modelData.estrutura_prompt_ideal) {
    const estrutura = modelData.estrutura_prompt_ideal;

    if (estrutura.ordem_recomendada) {
      lines.push(`\nOrdem recomendada das seções: ${estrutura.ordem_recomendada.join(' → ')}`);
    }

    if (estrutura.filosofia_central) {
      lines.push(`\n⚠️ FILOSOFIA CENTRAL: ${estrutura.filosofia_central}`);
    }

    if (estrutura.diferencial_chave) {
      lines.push(`\n⚠️ DIFERENCIAL CHAVE: ${estrutura.diferencial_chave}`);
    }

    if (estrutura.comprimento_ideal) {
      lines.push(`\nComprimento ideal: ${estrutura.comprimento_ideal}`);
    }

    if (estrutura.diferencial_veo3) {
      lines.push(`\n⚠️ DIFERENCIAL VEO3: ${estrutura.diferencial_veo3}`);
    }

    // Elementos específicos do modelo
    const elementosChaves = [
      'elementos_obrigatorios',
      'elementos_visuais_obrigatorios',
      'elementos',
      'formula_core',
      'secoes',
      'template_shot',
      'formula_cinematografica',
    ];

    for (const chave of elementosChaves) {
      if (estrutura[chave]) {
        const elementos = estrutura[chave];
        if (typeof elementos === 'object' && !Array.isArray(elementos)) {
          lines.push(`\nElementos essenciais do prompt:`);
          for (const [nome, descricao] of Object.entries(elementos)) {
            lines.push(`• ${nome}: ${descricao}`);
          }
        } else if (Array.isArray(elementos)) {
          lines.push(`\nElementos essenciais:\n${elementos.map(e => `• ${e}`).join('\n')}`);
        }
        break; // usa apenas o primeiro encontrado
      }
    }

    // Parâmetros técnicos (Midjourney, SDXL, etc.)
    if (estrutura.parametros_essenciais || estrutura.parametros_tecnicos) {
      const params = estrutura.parametros_essenciais || estrutura.parametros_tecnicos;
      if (typeof params === 'object') {
        lines.push(`\nParâmetros técnicos:`);
        for (const [param, desc] of Object.entries(params)) {
          lines.push(`• ${param}: ${desc}`);
        }
      }
    }

    // Terminologia de câmera (para modelos de vídeo)
    if (estrutura.terminologia_camera || estrutura.terminologia_camera_veo) {
      const terminos = estrutura.terminologia_camera || estrutura.terminologia_camera_veo;
      if (typeof terminos === 'object') {
        lines.push(`\nTerminologia cinematográfica disponível:`);
        for (const [tipo, lista] of Object.entries(terminos)) {
          lines.push(`• ${tipo}: ${typeof lista === 'object' ? JSON.stringify(lista) : lista}`);
        }
      }
    }

    // Técnicas avançadas
    const tecnicasChaves = ['tecnicas_avancadas', 'tecnicas_especificas'];
    for (const chave of tecnicasChaves) {
      if (estrutura[chave] && Array.isArray(estrutura[chave])) {
        lines.push(`\nTécnicas avançadas para este modelo:\n${estrutura[chave].map(t => `• ${t}`).join('\n')}`);
        break;
      }
    }
  }

  if (modelData.boas_praticas && modelData.boas_praticas.length > 0) {
    lines.push(`\n🎯 BOAS PRÁTICAS OBRIGATÓRIAS para ${modelData.nome_completo || 'este modelo'}:\n${modelData.boas_praticas.map(p => `• ${p}`).join('\n')}`);
  }

  if (modelData.exemplo_estrutura) {
    lines.push(`\n📐 ESTRUTURA DE REFERÊNCIA (adapte ao conteúdo do usuário):\n${modelData.exemplo_estrutura}`);
  }

  return lines.join('\n');
}

// ─── Formata instruções do tipo de saída ──────────────────────────────────────
function formatOutputInstructions(outputData, tipoSaida) {
  if (!outputData) return `Para saída do tipo ${tipoSaida}, inclua contexto claro, objetivo e formato de saída.`;

  const lines = [];

  if (outputData.dica) {
    lines.push(`💡 ${outputData.dica}`);
  }

  if (outputData.elementos_obrigatorios && outputData.elementos_obrigatorios.length > 0) {
    lines.push(`\nElementos OBRIGATÓRIOS para ${tipoSaida}:\n${outputData.elementos_obrigatorios.map(e => `• ${e}`).join('\n')}`);
  }

  return lines.join('\n');
}

// ─── Função principal: monta o system prompt para a OpenAI ────────────────────
function buildSystemPrompt(dados) {
  const { modeloSelecionado, tipoSaida, nivelDetalhamento, idioma, mensagemUsuario } = dados;

  // Busca dados na base de conhecimento
  const modelData    = getModelData(modeloSelecionado);
  const outputData   = getOutputData(tipoSaida);
  const levelData    = getLevelData(nivelDetalhamento);
  const categoria    = modelData?.categoria || 'generico';

  // Formata seções específicas
  const modelInstructions  = formatModelBestPractices(modelData);
  const outputInstructions = formatOutputInstructions(outputData, tipoSaida);

  // ─── System Prompt ──────────────────────────────────────────────────────────
  const systemPrompt = `Você é um especialista sênior em engenharia de prompt com mais de 10 anos de experiência criando prompts profissionais para todos os modelos de IA existentes. Você tem conhecimento profundo de como cada modelo funciona, suas características únicas e como extrair o melhor resultado de cada um.

Sua missão é transformar a solicitação do usuário em um prompt PERFEITO, PRECISO e PRONTO PARA USO IMEDIATO.

═══════════════════════════════════════════════════════
CONFIGURAÇÕES DO USUÁRIO
═══════════════════════════════════════════════════════
• Modelo de IA alvo: ${modeloSelecionado}
• Tipo de saída desejada: ${tipoSaida}
• Nível de detalhamento: ${nivelDetalhamento}
• Idioma do prompt gerado: ${idioma}
• Categoria do modelo: ${categoria}

═══════════════════════════════════════════════════════
INSTRUÇÃO DE DETALHAMENTO
═══════════════════════════════════════════════════════
${levelData.instrucao}
Tamanho alvo do prompt gerado: ${levelData.tamanho_alvo}

═══════════════════════════════════════════════════════
CONHECIMENTO ESPECÍFICO DO MODELO: ${modeloSelecionado.toUpperCase()}
═══════════════════════════════════════════════════════
${modelInstructions}

═══════════════════════════════════════════════════════
REQUISITOS PARA O TIPO DE SAÍDA: ${tipoSaida.toUpperCase()}
═══════════════════════════════════════════════════════
${outputInstructions}

═══════════════════════════════════════════════════════
REGRAS ABSOLUTAS DE ENGENHARIA DE PROMPT
═══════════════════════════════════════════════════════
O prompt gerado DEVE conter, quando aplicável:
1. PERSONA/PAPEL: Definição clara e específica do papel da IA
2. CONTEXTO: Contextualização completa do objetivo e situação
3. TAREFA: Descrição precisa e inequívoca da tarefa
4. RESTRIÇÕES: O que NÃO deve ser feito (negative prompting)
5. FORMATO: Formato exato de saída esperado
6. TOM: Tom, estilo e voz adequados ao contexto
7. PÚBLICO-ALVO: Para quem é o output
8. QUALIDADE: Critérios mensuráveis de qualidade
9. EXEMPLOS: Quando relevante e dentro do escopo do nível
10. ESPECIFICIDADE: Zero ambiguidade — seja ridiculamente específico

═══════════════════════════════════════════════════════
IDIOMA E FORMATO DE ENTREGA
═══════════════════════════════════════════════════════
• Gere o prompt FINAL no idioma: ${idioma}
• ENTREGUE SOMENTE o prompt final — sem prefácio, sem comentários, sem "aqui está o prompt"
• NÃO explique o que foi feito
• NÃO adicione observações ou notas ao final
• O prompt deve ser 100% pronto para copiar e colar no modelo ${modeloSelecionado}
• Adapte a sintaxe, estrutura e vocabulário ao que o modelo ${modeloSelecionado} melhor entende
• Para modelos de imagem: use linguagem visual e descritiva
• Para modelos de vídeo: use terminologia cinematográfica profissional
• Para modelos de texto/código: use estrutura lógica e hierárquica`;

  // ─── User Message ───────────────────────────────────────────────────────────
  const userMessage = `Solicitação original do usuário:
"${mensagemUsuario}"

Com base no conhecimento especializado sobre o modelo ${modeloSelecionado} e nas melhores práticas de engenharia de prompt para output do tipo "${tipoSaida}", crie agora o prompt profissional otimizado.

Nível: ${nivelDetalhamento} (${levelData.tamanho_alvo})
Idioma: ${idioma}

Entregue APENAS o prompt final, pronto para ser usado no ${modeloSelecionado}.`;

  return { systemPrompt, userMessage };
}

// ─── Exporta ──────────────────────────────────────────────────────────────────
module.exports = { buildSystemPrompt, getModelData, getOutputData, getLevelData };
