const { query } = require('../../config/db')
const ApiError = require('../../utils/ApiError')
const { MAX_DOCUMENT_SIZE_BYTES, allowedDocumentTypes } = require('./casos.schemas')

const allowedDocumentTypesSet = new Set(allowedDocumentTypes)

function mapCaso(row) {
  return {
    id: row.id,
    cidadao_id: row.cidadao_id,
    titulo: row.titulo,
    descricao: row.descricao_problema,
    descricao_problema: row.descricao_problema,
    renda_aproximada: row.renda_aproximada,
    area_direito: row.area_direito,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  }
}

function mapDocumento(row, includeContent = false) {
  const documento = {
    id: row.id,
    caso_id: row.caso_id,
    cidadao_id: row.cidadao_id,
    nome: row.nome_original,
    tipo_mime: row.tipo_mime,
    tamanho_bytes: row.tamanho_bytes,
    observacao: row.observacao,
    criado_em: row.criado_em
  }

  if (includeContent) documento.conteudo_base64 = row.conteudo_base64
  return documento
}

function normalizeBase64(conteudoBase64 = '') {
  const value = conteudoBase64.trim()
  const dataUrlMatch = value.match(/^data:([^;]+);base64,(.+)$/)
  const raw = dataUrlMatch ? dataUrlMatch[2] : value
  const normalized = raw.replace(/\s/g, '')

  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new ApiError(400, 'Arquivo em base64 invalido.')
  }

  const buffer = Buffer.from(normalized, 'base64')
  if (buffer.length === 0) throw new ApiError(400, 'Arquivo vazio.')
  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new ApiError(400, 'Documento excede o limite de 5 MB.')
  }

  return {
    conteudo_base64: normalized,
    tamanho_bytes: buffer.length
  }
}

async function create(cidadaoId, payload) {
  const { rows } = await query(
    `INSERT INTO casos (cidadao_id, titulo, descricao_problema, renda_aproximada, area_direito)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      cidadaoId,
      payload.titulo || null,
      payload.descricao,
      payload.renda_aproximada || null,
      payload.area_direito || null
    ]
  )

  return mapCaso(rows[0])
}

async function listByCidadao(cidadaoId) {
  const { rows } = await query(
    `SELECT *
     FROM casos
     WHERE cidadao_id = $1
     ORDER BY criado_em DESC`,
    [cidadaoId]
  )

  return rows.map(mapCaso)
}

async function getOwned(casoId, cidadaoId) {
  const { rows } = await query(
    'SELECT * FROM casos WHERE id = $1 AND cidadao_id = $2',
    [casoId, cidadaoId]
  )

  if (!rows[0]) throw new ApiError(404, 'Caso não encontrado.')
  return mapCaso(rows[0])
}

async function updateStatus(casoId, cidadaoId, status) {
  const { rows } = await query(
    `UPDATE casos
     SET status = $1, atualizado_em = NOW()
     WHERE id = $2 AND cidadao_id = $3
     RETURNING *`,
    [status, casoId, cidadaoId]
  )

  if (!rows[0]) throw new ApiError(404, 'Caso não encontrado.')
  return mapCaso(rows[0])
}

async function close(casoId, cidadaoId) {
  return updateStatus(casoId, cidadaoId, 'encerrado')
}

async function listDocumentos(casoId, cidadaoId) {
  await getOwned(casoId, cidadaoId)

  const { rows } = await query(
    `SELECT *
     FROM documentos_casos
     WHERE caso_id = $1 AND cidadao_id = $2
     ORDER BY criado_em DESC`,
    [casoId, cidadaoId]
  )

  return rows.map((row) => mapDocumento(row))
}

async function createDocumento(casoId, cidadaoId, payload) {
  await getOwned(casoId, cidadaoId)

  if (!allowedDocumentTypesSet.has(payload.tipo_mime)) {
    throw new ApiError(400, 'Tipo de documento não suportado.')
  }

  const arquivo = payload.conteudo_base64
    ? normalizeBase64(payload.conteudo_base64)
    : {
        conteudo_base64: null,
        tamanho_bytes: payload.tamanho_bytes
      }

  const { rows } = await query(
    `INSERT INTO documentos_casos
       (caso_id, cidadao_id, nome_original, tipo_mime, tamanho_bytes, conteudo_base64, observacao)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      casoId,
      cidadaoId,
      payload.nome,
      payload.tipo_mime,
      arquivo.tamanho_bytes,
      arquivo.conteudo_base64,
      payload.observacao || null
    ]
  )

  return mapDocumento(rows[0])
}

async function getDocumento(casoId, documentoId, cidadaoId) {
  const { rows } = await query(
    `SELECT d.*
     FROM documentos_casos d
     INNER JOIN casos c ON c.id = d.caso_id
     WHERE d.id = $1
       AND d.caso_id = $2
       AND c.cidadao_id = $3`,
    [documentoId, casoId, cidadaoId]
  )

  if (!rows[0]) throw new ApiError(404, 'Documento não encontrado.')
  return mapDocumento(rows[0], true)
}

async function deleteDocumento(casoId, documentoId, cidadaoId) {
  const { rows } = await query(
    `DELETE FROM documentos_casos d
     USING casos c
     WHERE d.id = $1
       AND d.caso_id = $2
       AND c.id = d.caso_id
       AND c.cidadao_id = $3
     RETURNING d.*`,
    [documentoId, casoId, cidadaoId]
  )

  if (!rows[0]) throw new ApiError(404, 'Documento não encontrado.')
  return mapDocumento(rows[0])
}

module.exports = {
  create,
  listByCidadao,
  getOwned,
  updateStatus,
  close,
  listDocumentos,
  createDocumento,
  getDocumento,
  deleteDocumento,
  mapCaso
}
