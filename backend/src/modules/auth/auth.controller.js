const authService = require('./auth.service')

async function register(req, res) {
  const result = await authService.register(req.validated.body)
  res.status(201).json(result)
}

async function login(req, res) {
  const { email, senha } = req.validated.body
  const result = await authService.login(email, senha)
  res.json(result)
}

async function me(req, res) {
  const usuario = await authService.getUsuarioById(req.user.id)
  res.json({ usuario })
}

async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.validated.body.email)
  res.json(result)
}

async function resetPassword(req, res) {
  const { token, senha } = req.validated.body
  const result = await authService.resetPassword(token, senha)
  res.json(result)
}

async function updateMe(req, res) {
  const usuario = await authService.updateProfile(req.user, req.validated.body)
  res.json({ usuario })
}

module.exports = {
  register,
  login,
  me,
  updateMe,
  forgotPassword,
  resetPassword
}
