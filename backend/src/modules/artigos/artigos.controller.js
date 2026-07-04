const service = require('./artigos.service')

async function list(req, res) {
  const artigos = await service.list({})
  res.json({ artigos })
}

async function detail(req, res) {
  const artigo = await service.getBySlug(req.validated.params.slug)
  res.json({ artigo })
}

async function byCategory(req, res) {
  const artigos = await service.list({ area: req.validated.params.area })
  res.json({ artigos })
}

async function create(req, res) {
  const artigo = await service.create(req.user.id, req.validated.body)
  res.status(201).json({ artigo })
}

async function update(req, res) {
  const artigo = await service.update(req.validated.params.id, req.validated.body)
  res.json({ artigo })
}

module.exports = {
  list,
  detail,
  byCategory,
  create,
  update
}
