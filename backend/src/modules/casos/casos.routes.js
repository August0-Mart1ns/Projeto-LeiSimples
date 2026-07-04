const { Router } = require('express')
const controller = require('./casos.controller')
const schemas = require('./casos.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.use(authenticate)
router.use(authorize('cidadao'))

router.post('/', validate({ body: schemas.createBody }), asyncHandler(controller.create))
router.get('/', asyncHandler(controller.list))
router.get('/:id/documentos', validate({ params: schemas.idParam }), asyncHandler(controller.listDocumentos))
router.post('/:id/documentos', validate({ params: schemas.idParam, body: schemas.createDocumentoBody }), asyncHandler(controller.createDocumento))
router.get('/:id/documentos/:documentoId', validate({ params: schemas.documentoParam }), asyncHandler(controller.getDocumento))
router.delete('/:id/documentos/:documentoId', validate({ params: schemas.documentoParam }), asyncHandler(controller.deleteDocumento))
router.get('/:id', validate({ params: schemas.idParam }), asyncHandler(controller.detail))
router.patch('/:id/status', validate({ params: schemas.idParam, body: schemas.updateStatusBody }), asyncHandler(controller.updateStatus))
router.delete('/:id', validate({ params: schemas.idParam }), asyncHandler(controller.close))
router.post('/:id/solicitar-atendimento', validate({ params: schemas.idParam, body: schemas.solicitarAtendimentoBody }), asyncHandler(controller.solicitarAtendimento))

module.exports = router
