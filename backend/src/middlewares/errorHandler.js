const ApiError = require('../utils/ApiError')

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  const statusCode = error instanceof ApiError ? error.statusCode : 500
  const payload = {
    erro: statusCode === 500 ? 'Erro interno do servidor.' : error.message
  }

  if (error.details) payload.detalhes = error.details
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    payload.stack = error.stack
  }

  return res.status(statusCode).json(payload)
}

module.exports = errorHandler
