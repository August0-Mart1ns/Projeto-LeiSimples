const { z } = require('zod')

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024
const MAX_DOCUMENT_BASE64_LENGTH = Math.ceil(MAX_DOCUMENT_SIZE_BYTES * 1.4) + 100
const allowedDocumentTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const idParam = z.object({
  id: z.string().uuid()
})

const documentoParam = z.object({
  id: z.string().uuid(),
  documentoId: z.string().uuid()
})

const createBody = z.object({
  titulo: z.string().optional().nullable(),
  descricao: z.string().min(10),
  renda_aproximada: z.string().optional().nullable(),
  area_direito: z.string().optional().nullable()
})

const updateStatusBody = z.object({
  status: z.enum(['aberto', 'em_analise', 'aguardando_advogado', 'em_atendimento', 'resolvido', 'encerrado'])
})

const solicitarAtendimentoBody = z.object({
  advogado_id: z.string().uuid(),
  mensagem: z.string().optional().nullable()
})

const createDocumentoBody = z.object({
  nome: z.string().trim().min(1).max(180),
  tipo_mime: z.enum(allowedDocumentTypes),
  tamanho_bytes: z.number().int().min(1).max(MAX_DOCUMENT_SIZE_BYTES).optional(),
  conteudo_base64: z.string().trim().min(1).max(MAX_DOCUMENT_BASE64_LENGTH).optional().nullable(),
  observacao: z.string().trim().max(500).optional().nullable()
}).refine(
  (payload) => Boolean(payload.tamanho_bytes || payload.conteudo_base64),
  { path: ['conteudo_base64'], message: 'Informe o arquivo ou o tamanho do documento.' }
)

module.exports = {
  MAX_DOCUMENT_SIZE_BYTES,
  allowedDocumentTypes,
  idParam,
  documentoParam,
  createBody,
  updateStatusBody,
  solicitarAtendimentoBody,
  createDocumentoBody
}
