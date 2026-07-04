const { query } = require('../../config/db')
const ApiError = require('../../utils/ApiError')
const solicitacoesService = require('../solicitacoes/solicitacoes.service')

function mapAdvogado(row) {
  return {
    id: row.usuario_id || row.id,
    perfil_id: row.usuario_id || row.id,
    nome: row.nome,
    email: row.email,
    numero_oab: row.numero_oab,
    estado_oab: row.estado_oab,
    areas_atuacao: row.areas_atuacao || [],
    bio: row.bio,
    cidade: row.cidade,
    uf: row.uf,
    telefone: row.telefone,
    verificado: row.verificado,
    status_verificacao: row.status_verificacao,
    avaliacao: Number(row.avaliacao || 0),
    total_avaliacoes: Number(row.total_avaliacoes || 0),
    total_casos: Number(row.total_casos || 0),
    avatar: '⚖️',
    bg: '#E8F7F4',
    tags: row.areas_atuacao || []
  }
}

async function list(filters = {}) {
  const { rows } = await query(
    `SELECT u.id AS usuario_id, u.nome, u.email,
            a.numero_oab, a.estado_oab, a.areas_atuacao,
            a.bio, a.cidade, a.uf, a.telefone, a.verificado, a.status_verificacao,
            COALESCE(AVG(av.nota), 0) AS avaliacao,
            COUNT(av.id) AS total_avaliacoes,
            COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'aceita') AS total_casos
     FROM advogados a
     INNER JOIN usuarios u ON u.id = a.id
     LEFT JOIN avaliacoes av ON av.advogado_id = u.id
     LEFT JOIN solicitacoes_atendimento s ON s.advogado_id = u.id
     WHERE a.verificado = TRUE
       AND ($1::text IS NULL OR $1 = ANY(a.areas_atuacao))
       AND ($2::text IS NULL OR a.cidade ILIKE '%' || $2 || '%')
       AND ($3::text IS NULL OR a.uf = UPPER($3))
     GROUP BY u.id, a.id
     ORDER BY avaliacao DESC, total_avaliacoes DESC, u.nome ASC`,
    [filters.area || null, filters.cidade || null, filters.uf || null]
  )

  return rows.map(mapAdvogado)
}

async function getPublicProfile(id) {
  const { rows } = await query(
    `SELECT u.id AS usuario_id, u.nome, u.email,
            a.numero_oab, a.estado_oab, a.areas_atuacao,
            a.bio, a.cidade, a.uf, a.telefone, a.verificado, a.status_verificacao,
            COALESCE(AVG(av.nota), 0) AS avaliacao,
            COUNT(av.id) AS total_avaliacoes,
            COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'aceita') AS total_casos
     FROM advogados a
     INNER JOIN usuarios u ON u.id = a.id
     LEFT JOIN avaliacoes av ON av.advogado_id = u.id
     LEFT JOIN solicitacoes_atendimento s ON s.advogado_id = u.id
     WHERE u.id = $1 AND a.verificado = TRUE
     GROUP BY u.id, a.id`,
    [id]
  )

  if (!rows[0]) throw new ApiError(404, 'Advogado não encontrado.')
  return mapAdvogado(rows[0])
}

async function updateOwnProfile(id, userId, payload) {
  const { rows } = await query(
    `UPDATE advogados
     SET bio = COALESCE($1, bio),
         telefone = COALESCE($2, telefone),
         cidade = COALESCE($3, cidade),
         uf = COALESCE(UPPER($4), uf),
         areas_atuacao = COALESCE($5, areas_atuacao)
     WHERE id = $6 AND id = $7
     RETURNING *`,
    [
      payload.bio ?? null,
      payload.telefone ?? null,
      payload.cidade ?? null,
      payload.uf ?? null,
      payload.areas_atuacao || null,
      userId,
      id
    ]
  )

  if (!rows[0]) throw new ApiError(404, 'Perfil de advogado não encontrado.')
  return rows[0]
}

async function listSolicitacoes(userId) {
  return solicitacoesService.listForAdvogado(userId)
}

module.exports = {
  list,
  getPublicProfile,
  updateOwnProfile,
  listSolicitacoes,
  mapAdvogado
}
