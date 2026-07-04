const { Router } = require('express')
const controller = require('./ia.controller')
const schemas = require('./ia.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.use(authenticate)
router.use(authorize('cidadao'))

router.post('/analisar', validate({ body: schemas.analisarBody }), asyncHandler(controller.analisar))
router.post('/analisar-contrato', validate({ body: schemas.analisarContratoBody }), asyncHandler(controller.analisarContrato))
router.get('/casos/:id/analise', validate({ params: schemas.idParam }), asyncHandler(controller.buscarAnalise))

module.exports = router
