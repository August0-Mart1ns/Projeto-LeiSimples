const { Router } = require('express')
const controller = require('./advogados.controller')
const schemas = require('./advogados.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.get('/:id/avaliacoes', validate({ params: schemas.idParam }), asyncHandler(controller.avaliacoes))

router.use(authenticate)

router.get('/', authorize('cidadao'), validate({ query: schemas.listQuery }), asyncHandler(controller.list))
router.get('/solicitacoes', authorize('advogado'), asyncHandler(controller.solicitacoes))
router.get('/:id', authorize('cidadao'), validate({ params: schemas.idParam }), asyncHandler(controller.detail))
router.patch('/:id', authorize('advogado'), validate({ params: schemas.idParam, body: schemas.updateBody }), asyncHandler(controller.updateOwnProfile))

module.exports = router
