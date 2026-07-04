const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

const verifyAdvogadoBody = z.object({
  status: z.enum(['aprovado', 'rejeitado']),
  motivo: z.string().optional().nullable()
})

const removerCasoBody = z.object({
  motivo: z.string().max(1000).optional().nullable()
})

module.exports = {
  idParam,
  verifyAdvogadoBody,
  removerCasoBody
}
