const { query } = require('../../config/db')
const ApiError = require('../../utils/ApiError')

function mapAvaliacao(row) {
  return {
    id: row.id,
    solicitacao_id: row.solicitacao_id,
    cidadao_id: row.cidadao_id,
    advogado_id: row.advogado_id,
    nota: row.nota,
    comentario: row.comentario,
    criado_em: row.criado_em,
    autor: row.autor_nome
  }
}

async function create(cidadaoId, payload) {
  const solicitation = await query(
    `SELECT id
     FROM solicitacoes_atendimento
     WHERE id = $1 AND cidadao_id = $2 AND advogado_id = $3 AND status = 'aceita'`,
    [payload.solicitacao_id, cidadaoId, payload.advogado_id]
  )

  if (!solicitation.rows[0]) {
    throw new ApiError(400, 'Solicitação aceita não encontrada para avaliação.')
  }

  const existing = await query(
    'SELECT id FROM avaliacoes WHERE solicitacao_id = $1',
    [payload.solicitacao_id]
  )

  if (existing.rows[0]) {
    throw new ApiError(409, 'Solicitação já avaliada.')
  }

  const { rows } = await query(
    `INSERT INTO avaliacoes (solicitacao_id, cidadao_id, advogado_id, nota, comentario)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      payload.solicitacao_id,
      cidadaoId,
      payload.advogado_id,
      payload.nota,
      payload.comentario || null
    ]
  )

  return mapAvaliacao(rows[0])
}

async function listByAdvogado(advogadoId) {
  const { rows } = await query(
    `SELECT av.*, u.nome AS autor_nome
     FROM avaliacoes av
     INNER JOIN usuarios u ON u.id = av.cidadao_id
     WHERE av.advogado_id = $1
     ORDER BY av.criado_em DESC`,
    [advogadoId]
  )

  return rows.map(mapAvaliacao)
}

module.exports = {
  create,
  listByAdvogado
}
