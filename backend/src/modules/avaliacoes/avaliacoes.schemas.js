const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

const createBody = z.object({
  solicitacao_id: z.string().uuid(),
  advogado_id: z.string().uuid(),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional().nullable()
})

module.exports = {
  idParam,
  createBody
}
