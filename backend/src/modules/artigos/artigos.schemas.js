const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

const slugParam = z.object({
  slug: z.string().min(2)
})

const areaParam = z.object({
  area: z.string().min(2)
})

const createBody = z.object({
  titulo: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  resumo: z.string().optional().nullable(),
  conteudo: z.string().min(10),
  area: z.string().optional().nullable(),
  publicado: z.boolean().optional()
})

const updateBody = createBody.partial()

module.exports = {
  idParam,
  slugParam,
  areaParam,
  createBody,
  updateBody
}
