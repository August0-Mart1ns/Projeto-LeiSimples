const service = require('./admin.service')

async function usuarios(req, res) {
  const usuarios = await service.listUsuarios()
  res.json({ usuarios })
}

async function verificarAdvogado(req, res) {
  const advogado = await service.verificarAdvogado(req.validated.params.id, req.validated.body)
  res.json({ advogado })
}

async function casos(req, res) {
  const result = await service.listCasos()
  res.json({ casos: result })
}

async function metricas(req, res) {
  const result = await service.metricas()
  res.json({ metricas: result })
}

async function removerCaso(req, res) {
  const result = await service.removerCaso(
    req.validated.params.id,
    req.user.id,
    req.validated.body?.motivo
  )
  res.json({ caso: result })
}

module.exports = {
  usuarios,
  casos,
  verificarAdvogado,
  metricas,
  removerCaso
}
