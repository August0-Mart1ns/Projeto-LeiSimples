const { query, transaction } = require('../../config/db')
const { sendSolicitationStatusEmail } = require('../../services/email.service')
const ApiError = require('../../utils/ApiError')
const iaService = require('../ia/ia.service')

function mapSolicitacao(row) {
  return {
    id: row.id,
    caso_id: row.caso_id,
    cidadao_id: row.cidadao_id,
    advogado_id: row.advogado_id,
    status: row.status,
    mensagem: row.mensagem,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    cidadao: row.cidadao_nome,
    cidade: row.cidadao_cidade,
    desc: row.caso_descricao,
    area: row.area_direito,
    analise: row.analise_id
      ? {
          id: row.analise_id,
          tipo: row.analise_tipo,
          area_direito: row.analise_area_direito,
          resumo: row.analise_resumo,
          orientacao: row.analise_orientacao,
          score_abusividade: row.analise_score_abusividade,
          direitos: row.analise_direitos || [],
          proximos_passos: row.analise_proximos_passos || [],
          documentos: row.analise_documentos || [],
          indicar_defensoria: row.analise_indicar_defensoria,
          confianca: row.analise_confianca === null || row.analise_confianca === undefined
            ? null
            : Number(row.analise_confianca),
          criado_em: row.analise_criado_em
        }
      : undefined,
    advogado: row.advogado_nome
      ? {
          id: row.advogado_id,
          nome: row.advogado_nome,
          numero_oab: row.numero_oab,
          estado_oab: row.estado_oab
        }
      : undefined,
    avaliacao: row.avaliacao_id
      ? {
          id: row.avaliacao_id,
          nota: row.avaliacao_nota
        }
      : undefined,
    caso: row.caso_id
      ? {
          id: row.caso_id,
          descricao: row.caso_descricao,
          area_direito: row.area_direito,
          status: row.caso_status
        }
      : undefined
  }
}

function mapEvento(row) {
  return {
    id: row.id,
    solicitacao_id: row.solicitacao_id,
    ator_id: row.ator_id,
    tipo: row.tipo,
    descricao: row.descricao,
    metadata: row.metadata || {},
    criado_em: row.criado_em,
    ator: row.ator_nome
      ? {
          id: row.ator_id,
          nome: row.ator_nome,
          tipo: row.ator_tipo
        }
      : null
  }
}

async function createEvent(client, solicitacaoId, atorId, tipo, descricao, metadata = {}) {
  await client.query(
    `INSERT INTO eventos_solicitacoes (solicitacao_id, ator_id, tipo, descricao, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [solicitacaoId, atorId, tipo, descricao, metadata]
  )
}

async function create(casoId, cidadaoId, payload) {
  const casoResult = await query(
    `SELECT id, status, descricao_problema, renda_aproximada
     FROM casos
     WHERE id = $1 AND cidadao_id = $2`,
    [casoId, cidadaoId]
  )
  const caso = casoResult.rows[0]
  if (!caso) throw new ApiError(404, 'Caso não encontrado.')

  const advogadoResult = await query(
    `SELECT u.id
     FROM usuarios u
     INNER JOIN advogados a ON a.id = u.id
     WHERE u.id = $1 AND u.tipo = 'advogado' AND a.verificado = TRUE`,
    [payload.advogado_id]
  )
  if (!advogadoResult.rows[0]) throw new ApiError(404, 'Advogado verificado não encontrado.')

  const analise = await iaService.ensureCaseAnalysis({
    casoId: caso.id,
    cidadaoId,
    descricao: caso.descricao_problema,
    rendaAproximada: caso.renda_aproximada
  })

  try {
    const solicitacao = await transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO solicitacoes_atendimento
           (caso_id, cidadao_id, advogado_id, mensagem)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [casoId, cidadaoId, payload.advogado_id, payload.mensagem || null]
      )

      await client.query(
        `UPDATE casos
         SET status = 'aguardando_advogado', atualizado_em = NOW()
         WHERE id = $1`,
        [casoId]
      )

      await createEvent(
        client,
        rows[0].id,
        cidadaoId,
        'solicitacao_criada',
        'Solicitação enviada. O advogado receberá o resumo do caso antes de responder.',
        { advogado_id: payload.advogado_id }
      )

      return mapSolicitacao(rows[0])
    })

    if (analise) {
      solicitacao.analise = {
        ...analise,
        documentos: analise.documentos || analise.documentos_necessarios || []
      }
    }

    return solicitacao
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Solicitação já enviada para este advogado.')
    }
    throw error
  }
}

async function findForAccess(id, user) {
  const { rows } = await query(
    `SELECT s.*, c.descricao_problema AS caso_descricao, c.area_direito, c.status AS caso_status,
            cid.nome AS cidadao_nome, cid.cidade AS cidadao_cidade,
            adv.nome AS advogado_nome, a.numero_oab, a.estado_oab,
            ai.id AS analise_id, ai.tipo AS analise_tipo, ai.area_direito AS analise_area_direito,
            ai.resumo AS analise_resumo, ai.orientacao AS analise_orientacao,
            ai.score_abusividade AS analise_score_abusividade, ai.direitos AS analise_direitos,
            ai.proximos_passos AS analise_proximos_passos, ai.documentos AS analise_documentos,
            ai.indicar_defensoria AS analise_indicar_defensoria, ai.confianca AS analise_confianca,
            ai.criado_em AS analise_criado_em
     FROM solicitacoes_atendimento s
     INNER JOIN casos c ON c.id = s.caso_id
     INNER JOIN usuarios cid ON cid.id = s.cidadao_id
     INNER JOIN usuarios adv ON adv.id = s.advogado_id
     INNER JOIN advogados a ON a.id = s.advogado_id
     LEFT JOIN LATERAL (
       SELECT *
       FROM analises_ia ai
       WHERE ai.caso_id = s.caso_id
       ORDER BY ai.criado_em DESC
       LIMIT 1
     ) ai ON TRUE
     WHERE s.id = $1`,
    [id]
  )

  const row = rows[0]
  if (!row) throw new ApiError(404, 'Solicitação não encontrada.')

  const canView = user.tipo === 'admin' || row.cidadao_id === user.id || row.advogado_id === user.id
  if (!canView) throw new ApiError(403, 'Você não pode acessar esta solicitação.')

  return row
}

async function listEventsBySolicitacao(id) {
  const { rows } = await query(
    `SELECT e.*, u.nome AS ator_nome, u.tipo AS ator_tipo
     FROM eventos_solicitacoes e
     LEFT JOIN usuarios u ON u.id = e.ator_id
     WHERE e.solicitacao_id = $1
     ORDER BY e.criado_em ASC`,
    [id]
  )

  return rows.map(mapEvento)
}

async function getDetail(id, user) {
  const row = await findForAccess(id, user)
  const solicitacao = mapSolicitacao(row)
  solicitacao.eventos = await listEventsBySolicitacao(id)
  return solicitacao
}

async function listEvents(id, user) {
  await findForAccess(id, user)
  return listEventsBySolicitacao(id)
}

async function listForUser(user) {
  const { rows } = await query(
    `SELECT s.*, c.descricao_problema AS caso_descricao, c.area_direito, c.status AS caso_status,
            cid.nome AS cidadao_nome, cid.cidade AS cidadao_cidade,
            adv.nome AS advogado_nome, a.numero_oab, a.estado_oab,
            av.id AS avaliacao_id, av.nota AS avaliacao_nota,
            ai.id AS analise_id, ai.tipo AS analise_tipo, ai.area_direito AS analise_area_direito,
            ai.resumo AS analise_resumo, ai.orientacao AS analise_orientacao,
            ai.score_abusividade AS analise_score_abusividade, ai.direitos AS analise_direitos,
            ai.proximos_passos AS analise_proximos_passos, ai.documentos AS analise_documentos,
            ai.indicar_defensoria AS analise_indicar_defensoria, ai.confianca AS analise_confianca,
            ai.criado_em AS analise_criado_em
     FROM solicitacoes_atendimento s
     INNER JOIN casos c ON c.id = s.caso_id
     INNER JOIN usuarios cid ON cid.id = s.cidadao_id
     INNER JOIN usuarios adv ON adv.id = s.advogado_id
     INNER JOIN advogados a ON a.id = s.advogado_id
     LEFT JOIN avaliacoes av ON av.solicitacao_id = s.id
     LEFT JOIN LATERAL (
       SELECT *
       FROM analises_ia ai
       WHERE ai.caso_id = s.caso_id
       ORDER BY ai.criado_em DESC
       LIMIT 1
     ) ai ON TRUE
     WHERE ($2 = 'admin')
        OR ($2 = 'cidadao' AND s.cidadao_id = $1)
        OR ($2 = 'advogado' AND s.advogado_id = $1)
     ORDER BY s.criado_em DESC`,
    [user.id, user.tipo]
  )

  return rows.map(mapSolicitacao)
}

async function listForAdvogado(advogadoId) {
  const { rows } = await query(
    `SELECT s.*, c.descricao_problema AS caso_descricao, c.area_direito, c.status AS caso_status,
            u.nome AS cidadao_nome, u.cidade AS cidadao_cidade,
            ai.id AS analise_id, ai.tipo AS analise_tipo, ai.area_direito AS analise_area_direito,
            ai.resumo AS analise_resumo, ai.orientacao AS analise_orientacao,
            ai.score_abusividade AS analise_score_abusividade, ai.direitos AS analise_direitos,
            ai.proximos_passos AS analise_proximos_passos, ai.documentos AS analise_documentos,
            ai.indicar_defensoria AS analise_indicar_defensoria, ai.confianca AS analise_confianca,
            ai.criado_em AS analise_criado_em
     FROM solicitacoes_atendimento s
     INNER JOIN casos c ON c.id = s.caso_id
     INNER JOIN usuarios u ON u.id = s.cidadao_id
     LEFT JOIN LATERAL (
       SELECT *
       FROM analises_ia ai
       WHERE ai.caso_id = s.caso_id
       ORDER BY ai.criado_em DESC
       LIMIT 1
     ) ai ON TRUE
     WHERE s.advogado_id = $1
       AND s.status NOT IN ('recusada', 'cancelada')
     ORDER BY s.criado_em DESC`,
    [advogadoId]
  )

  return rows.map(mapSolicitacao)
}

async function updateStatus(id, advogadoId, status) {
  const solicitacao = await transaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE solicitacoes_atendimento
       SET status = $1, atualizado_em = NOW()
       WHERE id = $2 AND advogado_id = $3 AND status = 'pendente'
       RETURNING *`,
      [status, id, advogadoId]
    )

    if (!rows[0]) throw new ApiError(404, 'Solicitação pendente não encontrada.')

    if (status === 'aceita') {
      await client.query(
        `UPDATE casos
         SET status = 'em_atendimento', atualizado_em = NOW()
         WHERE id = $1`,
        [rows[0].caso_id]
      )
    }

    await createEvent(
      client,
      rows[0].id,
      advogadoId,
      status === 'aceita' ? 'solicitacao_aceita' : 'solicitacao_recusada',
      status === 'aceita'
        ? 'Advogado aceitou a solicitação de atendimento.'
        : 'Advogado recusou a solicitação de atendimento.',
      { status }
    )

    return rows[0]
  })

  const notification = await query(
    `SELECT cid.email AS cidadao_email, adv.nome AS advogado_nome
     FROM solicitacoes_atendimento s
     INNER JOIN usuarios cid ON cid.id = s.cidadao_id
     INNER JOIN usuarios adv ON adv.id = s.advogado_id
     WHERE s.id = $1`,
    [id]
  )

  if (notification.rows[0]) {
    await sendSolicitationStatusEmail({
      to: notification.rows[0].cidadao_email,
      status,
      advogadoNome: notification.rows[0].advogado_nome
    })
  }

  return mapSolicitacao(solicitacao)
}

module.exports = {
  create,
  getDetail,
  listEvents,
  listForUser,
  listForAdvogado,
  updateStatus
}
