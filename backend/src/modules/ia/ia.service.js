const env = require('../../config/env')
const { query, transaction } = require('../../config/db')
const ApiError = require('../../utils/ApiError')
const casosService = require('../casos/casos.service')

const areaLabels = {
  bancario: 'Bancário',
  consumidor: 'Consumidor',
  trabalhista: 'Trabalhista',
  inquilino: 'Inquilino',
  familia: 'Família',
  idoso: 'Idoso'
}

function formatArea(area) {
  return areaLabels[area] || area.charAt(0).toUpperCase() + area.slice(1)
}

function inferArea(descricao = '') {
  const text = descricao.toLowerCase()

  if (text.includes('banco') || text.includes('emprestimo') || text.includes('cartao') || text.includes('consignado')) {
    return 'bancario'
  }
  if (text.includes('demit') || text.includes('fgts') || text.includes('rescis') || text.includes('salario')) {
    return 'trabalhista'
  }
  if (text.includes('aluguel') || text.includes('inquil') || text.includes('caucao')) {
    return 'inquilino'
  }
  if (text.includes('pensao') || text.includes('guarda') || text.includes('divorcio')) {
    return 'familia'
  }
  if (text.includes('idoso') || text.includes('aposent')) {
    return 'idoso'
  }
  return 'consumidor'
}

function fallbackAnalysis(descricao, rendaAproximada, tipo = 'problema') {
  const area = inferArea(descricao)
  const indicarDefensoria = ['ate_1_salario', '1_a_3_salarios'].includes(rendaAproximada)

  return {
    area_direito: area,
    area_descricao: formatArea(area),
    resumo_problema: descricao.slice(0, 220),
    resumo: tipo === 'contrato'
      ? 'Foram encontrados pontos que merecem revisão jurídica no contrato.'
      : 'A situação pode envolver violação de direitos e merece orientação jurídica.',
    score_abusividade: area === 'bancario' ? 72 : 58,
    mensagem_acolhimento: 'A análise inicial não substitui consulta jurídica, mas ajuda a organizar os próximos passos.',
    direitos: [
      'Você pode pedir explicações claras e documentos relacionados ao problema.',
      'Você pode reunir provas e registrar uma reclamação formal antes de medidas judiciais.',
      'Você pode buscar orientação com advogado ou Defensoria Pública, conforme sua renda.'
    ],
    proximos_passos: [
      'Separe contratos, comprovantes, conversas e protocolos.',
      'Anote datas, valores e nomes das pessoas envolvidas.',
      'Procure atendimento jurídico com os documentos organizados.'
    ],
    documentos_necessarios: ['Documento pessoal', 'Comprovantes', 'Contratos ou prints relacionados'],
    indicar_defensoria: indicarDefensoria,
    confianca: 0.68
  }
}

async function callAiService(path, payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs)

  try {
    const response = await fetch(`${env.aiServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    if (!response.ok) throw new Error(`AI service respondeu ${response.status}`)
    return response.json()
  } catch (error) {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function ensureOwnedCase(casoId, cidadaoId) {
  if (!casoId) return null
  return casosService.getOwned(casoId, cidadaoId)
}

async function saveAnalysis({ casoId, cidadaoId, tipo, analysis }) {
  const direitos = analysis.direitos || []
  const proximosPassos = analysis.proximos_passos || []
  const documentos = analysis.documentos_necessarios || analysis.documentos || []

  const { rows } = await query(
    `INSERT INTO analises_ia
       (caso_id, cidadao_id, tipo, area_direito, resumo, orientacao, score_abusividade,
        direitos, proximos_passos, documentos, indicar_defensoria, confianca, resposta_bruta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      casoId,
      cidadaoId,
      tipo,
      analysis.area_direito || null,
      analysis.resumo || null,
      analysis.mensagem_acolhimento || analysis.orientacao || null,
      analysis.score_abusividade || null,
      direitos,
      proximosPassos,
      documentos,
      Boolean(analysis.indicar_defensoria),
      analysis.confianca || null,
      analysis
    ]
  )

  return rows[0]
}

function normalizeAnalysis(row, raw = {}) {
  return {
    id: row.id,
    caso_id: row.caso_id,
    tipo: row.tipo,
    area_direito: row.area_direito,
    area_descricao: raw.area_descricao || row.area_direito,
    resumo_problema: raw.resumo_problema,
    resumo: row.resumo,
    score_abusividade: row.score_abusividade,
    mensagem_acolhimento: row.orientacao,
    direitos: row.direitos || [],
    proximos_passos: row.proximos_passos || [],
    documentos_necessarios: row.documentos || [],
    indicar_defensoria: row.indicar_defensoria,
    confianca: row.confianca === null || row.confianca === undefined ? null : Number(row.confianca),
    criado_em: row.criado_em
  }
}

async function analisar(cidadaoId, payload) {
  const existingCase = await ensureOwnedCase(payload.caso_id, cidadaoId)
  const aiResponse = await callAiService('/analyze', payload)
  const analysis = aiResponse || fallbackAnalysis(payload.descricao, payload.renda_aproximada, 'problema')

  const result = await transaction(async (client) => {
    let caso = existingCase

    if (!caso) {
      const inserted = await client.query(
        `INSERT INTO casos (cidadao_id, titulo, descricao_problema, renda_aproximada, area_direito, status)
         VALUES ($1, $2, $3, $4, $5, 'em_analise')
         RETURNING *`,
        [
          cidadaoId,
          analysis.area_descricao || 'Análise jurídica',
          payload.descricao,
          payload.renda_aproximada || null,
          analysis.area_direito || null
        ]
      )
      caso = casosService.mapCaso(inserted.rows[0])
    } else {
      await client.query(
        `UPDATE casos
         SET area_direito = COALESCE($1, area_direito), status = 'em_analise', atualizado_em = NOW()
         WHERE id = $2`,
        [analysis.area_direito || null, existingCase.id]
      )
    }

    return caso
  })

  const saved = await saveAnalysis({
    casoId: result.id,
    cidadaoId,
    tipo: 'problema',
    analysis
  })

  return {
    caso: result,
    analise: normalizeAnalysis(saved, analysis)
  }
}

async function analisarContrato(cidadaoId, payload) {
  let existingCase = await ensureOwnedCase(payload.caso_id, cidadaoId)
  const aiResponse = await callAiService('/analyze-contract', payload)
  const analysis = aiResponse || fallbackAnalysis(payload.descricao, null, 'contrato')

  if (!existingCase) {
    const { rows } = await query(
      `INSERT INTO casos (cidadao_id, titulo, descricao_problema, area_direito, status)
       VALUES ($1, 'Análise de contrato', $2, $3, 'em_analise')
       RETURNING *`,
      [cidadaoId, payload.descricao, analysis.area_direito || 'contrato']
    )
    existingCase = casosService.mapCaso(rows[0])
  }

  const saved = await saveAnalysis({
    casoId: existingCase.id,
    cidadaoId,
    tipo: 'contrato',
    analysis
  })

  return { analise: normalizeAnalysis(saved, analysis) }
}

async function buscarAnalise(casoId, cidadaoId) {
  await casosService.getOwned(casoId, cidadaoId)

  const { rows } = await query(
    `SELECT *
     FROM analises_ia
     WHERE caso_id = $1 AND cidadao_id = $2
     ORDER BY criado_em DESC
     LIMIT 1`,
    [casoId, cidadaoId]
  )

  if (!rows[0]) throw new ApiError(404, 'Análise não encontrada.')
  return normalizeAnalysis(rows[0], rows[0].resposta_bruta || {})
}

module.exports = {
  analisar,
  analisarContrato,
  buscarAnalise,
  fallbackAnalysis
}
