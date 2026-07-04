const service = require('./solicitacoes.service')

async function list(req, res) {
  const solicitacoes = await service.listForUser(req.user)
  res.json({ solicitacoes })
}

async function detail(req, res) {
  const solicitacao = await service.getDetail(req.validated.params.id, req.user)
  res.json({ solicitacao })
}

async function eventos(req, res) {
  const eventos = await service.listEvents(req.validated.params.id, req.user)
  res.json({ eventos })
}

async function aceitar(req, res) {
  const solicitacao = await service.updateStatus(req.validated.params.id, req.user.id, 'aceita')
  res.json({ solicitacao })
}

async function recusar(req, res) {
  const solicitacao = await service.updateStatus(req.validated.params.id, req.user.id, 'recusada')
  res.json({ solicitacao })
}

module.exports = {
  list,
  detail,
  eventos,
  aceitar,
  recusar
}
