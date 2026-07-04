const casosService = require('./casos.service')
const solicitacoesService = require('../solicitacoes/solicitacoes.service')

async function create(req, res) {
  const caso = await casosService.create(req.user.id, req.validated.body)
  res.status(201).json({ caso })
}

async function list(req, res) {
  const casos = await casosService.listByCidadao(req.user.id)
  res.json({ casos })
}

async function detail(req, res) {
  const caso = await casosService.getOwned(req.validated.params.id, req.user.id)
  res.json({ caso })
}

async function updateStatus(req, res) {
  const caso = await casosService.updateStatus(
    req.validated.params.id,
    req.user.id,
    req.validated.body.status
  )
  res.json({ caso })
}

async function close(req, res) {
  const caso = await casosService.close(req.validated.params.id, req.user.id)
  res.json({ caso })
}

async function solicitarAtendimento(req, res) {
  const solicitacao = await solicitacoesService.create(
    req.validated.params.id,
    req.user.id,
    req.validated.body
  )
  res.status(201).json({ solicitacao })
}

async function listDocumentos(req, res) {
  const documentos = await casosService.listDocumentos(req.validated.params.id, req.user.id)
  res.json({ documentos })
}

async function createDocumento(req, res) {
  const documento = await casosService.createDocumento(
    req.validated.params.id,
    req.user.id,
    req.validated.body
  )
  res.status(201).json({ documento })
}

async function getDocumento(req, res) {
  const documento = await casosService.getDocumento(
    req.validated.params.id,
    req.validated.params.documentoId,
    req.user.id
  )
  res.json({ documento })
}

async function deleteDocumento(req, res) {
  const documento = await casosService.deleteDocumento(
    req.validated.params.id,
    req.validated.params.documentoId,
    req.user.id
  )
  res.json({ documento })
}

module.exports = {
  create,
  list,
  detail,
  updateStatus,
  close,
  solicitarAtendimento,
  listDocumentos,
  createDocumento,
  getDocumento,
  deleteDocumento
}
