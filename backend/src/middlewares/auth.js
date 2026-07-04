const jwt = require('jsonwebtoken')
const env = require('../config/env')
const { query } = require('../config/db')
const ApiError = require('../utils/ApiError')

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [type, token] = header.split(' ')

    if (type !== 'Bearer' || !token) {
      throw new ApiError(401, 'Token de autenticação ausente.')
    }

    const payload = jwt.verify(token, env.jwtSecret)
    const { rows } = await query(
      `SELECT id, nome, email, tipo, telefone, cidade, criado_em
       FROM usuarios
       WHERE id = $1`,
      [payload.sub]
    )

    if (!rows[0]) throw new ApiError(401, 'Usuário não encontrado.')

    req.user = rows[0]
    return next()
  } catch (error) {
    if (error instanceof ApiError) return next(error)
    return next(new ApiError(401, 'Token invalido ou expirado.'))
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Autenticacao obrigatoria.'))
    if (!roles.includes(req.user.tipo)) {
      return next(new ApiError(403, 'Você não tem permissão para acessar este recurso.'))
    }
    return next()
  }
}

module.exports = {
  authenticate,
  authorize
}
