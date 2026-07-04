const iaService = require('./ia.service')

async function analisar(req, res) {
  const result = await iaService.analisar(req.user.id, req.validated.body)
  res.status(201).json(result)
}

async function analisarContrato(req, res) {
  const result = await iaService.analisarContrato(req.user.id, req.validated.body)
  res.status(201).json(result)
}

async function buscarAnalise(req, res) {
  const analise = await iaService.buscarAnalise(req.validated.params.id, req.user.id)
  res.json({ analise })
}

module.exports = {
  analisar,
  analisarContrato,
  buscarAnalise
}
