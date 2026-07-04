const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

const listQuery = z.object({
  area: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional()
})

const updateBody = z.object({
  bio: z.string().max(1000).optional().nullable(),
  telefone: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().length(2).optional().nullable(),
  areas_atuacao: z.array(z.string()).optional()
})

module.exports = {
  idParam,
  listQuery,
  updateBody
}
