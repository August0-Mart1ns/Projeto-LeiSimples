const ApiError = require('../utils/ApiError')

function notFound(req, res, next) {
  next(new ApiError(404, 'Rota não encontrada.'))
}

module.exports = notFound
