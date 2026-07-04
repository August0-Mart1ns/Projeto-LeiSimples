const service = require('./avaliacoes.service')

async function create(req, res) {
  const avaliacao = await service.create(req.user.id, req.validated.body)
  res.status(201).json({ avaliacao })
}

async function listByAdvogado(req, res) {
  const avaliacoes = await service.listByAdvogado(req.validated.params.id)
  res.json({ avaliacoes })
}

module.exports = {
  create,
  listByAdvogado
}
