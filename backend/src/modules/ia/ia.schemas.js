const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

const analisarBody = z.object({
  descricao: z.string().min(10),
  renda_aproximada: z.string().optional().nullable(),
  caso_id: z.string().uuid().optional().nullable()
})

const analisarContratoBody = z.object({
  descricao: z.string().min(10),
  caso_id: z.string().uuid().optional().nullable()
})

module.exports = {
  idParam,
  analisarBody,
  analisarContratoBody
}
