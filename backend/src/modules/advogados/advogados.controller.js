const service = require('./advogados.service')
const avaliacoesService = require('../avaliacoes/avaliacoes.service')

async function list(req, res) {
  const advogados = await service.list(req.validated.query)
  res.json({ advogados })
}

async function detail(req, res) {
  const advogado = await service.getPublicProfile(req.validated.params.id)
  res.json({ advogado })
}

async function updateOwnProfile(req, res) {
  const perfil = await service.updateOwnProfile(
    req.validated.params.id,
    req.user.id,
    req.validated.body
  )
  res.json({ perfil })
}

async function solicitacoes(req, res) {
  const solicitacoes = await service.listSolicitacoes(req.user.id)
  res.json({ solicitacoes })
}

async function avaliacoes(req, res) {
  const avaliacoes = await avaliacoesService.listByAdvogado(req.validated.params.id)
  res.json({ avaliacoes })
}

module.exports = {
  list,
  detail,
  updateOwnProfile,
  solicitacoes,
  avaliacoes
}
