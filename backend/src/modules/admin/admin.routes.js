const { Router } = require('express')
const controller = require('./admin.controller')
const schemas = require('./admin.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.use(authenticate)
router.use(authorize('admin'))

router.get('/usuarios', asyncHandler(controller.usuarios))
router.get('/casos', asyncHandler(controller.casos))
router.patch('/advogados/:id/verificar', validate({ params: schemas.idParam, body: schemas.verifyAdvogadoBody }), asyncHandler(controller.verificarAdvogado))
router.get('/metricas', asyncHandler(controller.metricas))
router.delete('/casos/:id', validate({ params: schemas.idParam, body: schemas.removerCasoBody }), asyncHandler(controller.removerCaso))

module.exports = router
