const { z } = require('zod')

const idParam = z.object({
  id: z.string().uuid()
})

module.exports = {
  idParam
}
