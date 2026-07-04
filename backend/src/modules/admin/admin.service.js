const { query, transaction } = require('../../config/db')
const ApiError = require('../../utils/ApiError')

async function listUsuarios() {
  const { rows } = await query(
    `SELECT u.id, u.nome, u.email, u.tipo, u.telefone, u.cidade, u.criado_em,
            a.numero_oab, a.estado_oab, a.verificado, a.status_verificacao
     FROM usuarios u
     LEFT JOIN advogados a ON a.id = u.id
     ORDER BY u.criado_em DESC`
  )

  return rows
}

async function verificarAdvogado(id, payload) {
  const verificado = payload.status === 'aprovado'
  const { rows } = await query(
    `UPDATE advogados
     SET status_verificacao = $1, verificado = $2
     WHERE id = $3
     RETURNING *`,
    [payload.status, verificado, id]
  )

  if (!rows[0]) throw new ApiError(404, 'Advogado não encontrado.')
  return rows[0]
}

async function listCasos() {
  const { rows } = await query(
    `SELECT c.id, c.titulo, c.descricao_problema, c.area_direito, c.status,
            c.criado_em, u.nome AS cidadao_nome, u.email AS cidadao_email
     FROM casos c
     INNER JOIN usuarios u ON u.id = c.cidadao_id
     ORDER BY c.criado_em DESC
     LIMIT 100`
  )

  return rows
}

async function metricas() {
  const [
    usuarios,
    casos,
    advogados,
    solicitacoes,
    avaliacoes
  ] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM usuarios'),
    query(`SELECT status, COUNT(*)::int AS total FROM casos GROUP BY status`),
    query(`SELECT status_verificacao, COUNT(*)::int AS total FROM advogados GROUP BY status_verificacao`),
    query(`SELECT status, COUNT(*)::int AS total FROM solicitacoes_atendimento GROUP BY status`),
    query(`SELECT COALESCE(AVG(nota), 0)::numeric(4,2) AS media, COUNT(*)::int AS total FROM avaliacoes`)
  ])

  return {
    usuarios: usuarios.rows[0].total,
    casos: casos.rows,
    advogados: advogados.rows,
    solicitacoes: solicitacoes.rows,
    avaliacoes: avaliacoes.rows[0]
  }
}

async function removerCaso(id, adminId, motivo) {
  const removed = await transaction(async (client) => {
    const caso = await client.query(
      'SELECT * FROM casos WHERE id = $1',
      [id]
    )

    if (!caso.rows[0]) throw new ApiError(404, 'Caso não encontrado.')

    await client.query(
      `INSERT INTO moderacoes_casos (caso_id, admin_id, motivo, caso_snapshot)
       VALUES ($1, $2, $3, $4)`,
      [id, adminId, motivo || null, caso.rows[0]]
    )

    await client.query('DELETE FROM casos WHERE id = $1', [id])
    return caso.rows[0]
  })

  return { id: removed.id, motivo: motivo || null }
}

module.exports = {
  listUsuarios,
  listCasos,
  verificarAdvogado,
  metricas,
  removerCaso
}
