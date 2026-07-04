const { Router } = require('express')
const controller = require('./avaliacoes.controller')
const schemas = require('./avaliacoes.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.get('/advogado/:id', validate({ params: schemas.idParam }), asyncHandler(controller.listByAdvogado))
router.post('/', authenticate, authorize('cidadao'), validate({ body: schemas.createBody }), asyncHandler(controller.create))

module.exports = router
