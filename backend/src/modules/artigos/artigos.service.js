const { query } = require('../../config/db')
const ApiError = require('../../utils/ApiError')

function mapArtigo(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    resumo: row.resumo,
    conteudo: row.conteudo,
    area: row.area_direito,
    publicado: row.publicado,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    autor: row.autor_nome
  }
}

async function list({ area } = {}) {
  const { rows } = await query(
    `SELECT a.*, u.nome AS autor_nome
     FROM artigos a
     LEFT JOIN usuarios u ON u.id = a.autor_id
     WHERE a.publicado = TRUE
       AND ($1::text IS NULL OR a.area_direito = $1)
     ORDER BY a.criado_em DESC`,
    [area || null]
  )

  return rows.map(mapArtigo)
}

async function getBySlug(slug) {
  const { rows } = await query(
    `SELECT a.*, u.nome AS autor_nome
     FROM artigos a
     LEFT JOIN usuarios u ON u.id = a.autor_id
     WHERE a.slug = $1 AND a.publicado = TRUE`,
    [slug]
  )

  if (!rows[0]) throw new ApiError(404, 'Artigo não encontrado.')
  return mapArtigo(rows[0])
}

async function create(adminId, payload) {
  try {
    const { rows } = await query(
      `INSERT INTO artigos (autor_id, titulo, slug, resumo, conteudo, area_direito, publicado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        adminId,
        payload.titulo,
        payload.slug,
        payload.resumo || null,
        payload.conteudo,
        payload.area || null,
        Boolean(payload.publicado)
      ]
    )

    return mapArtigo(rows[0])
  } catch (error) {
    if (error.code === '23505') throw new ApiError(409, 'Slug ja cadastrado.')
    throw error
  }
}

async function update(id, payload) {
  const { rows } = await query(
    `UPDATE artigos
     SET titulo = COALESCE($1, titulo),
         slug = COALESCE($2, slug),
         resumo = COALESCE($3, resumo),
         conteudo = COALESCE($4, conteudo),
         area_direito = COALESCE($5, area_direito),
         publicado = COALESCE($6, publicado),
         atualizado_em = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      payload.titulo ?? null,
      payload.slug ?? null,
      payload.resumo ?? null,
      payload.conteudo ?? null,
      payload.area ?? null,
      payload.publicado ?? null,
      id
    ]
  )

  if (!rows[0]) throw new ApiError(404, 'Artigo não encontrado.')
  return mapArtigo(rows[0])
}

module.exports = {
  list,
  getBySlug,
  create,
  update
}
