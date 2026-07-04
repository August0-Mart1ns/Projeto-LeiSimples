const ApiError = require('../utils/ApiError')

function validate(schemas) {
  return (req, res, next) => {
    const validated = {}

    for (const key of ['body', 'params', 'query']) {
      if (!schemas[key]) continue

      const result = schemas[key].safeParse(req[key])
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensagem: issue.message
        }))
        return next(new ApiError(400, 'Dados invalidos.', details))
      }

      validated[key] = result.data
    }

    req.validated = validated
    return next()
  }
}

module.exports = validate
