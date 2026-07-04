const { Router } = require('express')
const controller = require('./solicitacoes.controller')
const schemas = require('./solicitacoes.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(controller.list))
router.get('/:id/eventos', validate({ params: schemas.idParam }), asyncHandler(controller.eventos))
router.get('/:id', validate({ params: schemas.idParam }), asyncHandler(controller.detail))
router.patch('/:id/aceitar', authorize('advogado'), validate({ params: schemas.idParam }), asyncHandler(controller.aceitar))
router.patch('/:id/recusar', authorize('advogado'), validate({ params: schemas.idParam }), asyncHandler(controller.recusar))

module.exports = router
