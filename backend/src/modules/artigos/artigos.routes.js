const { Router } = require('express')
const controller = require('./artigos.controller')
const schemas = require('./artigos.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate, authorize } = require('../../middlewares/auth')

const router = Router()

router.get('/', asyncHandler(controller.list))
router.get('/categoria/:area', validate({ params: schemas.areaParam }), asyncHandler(controller.byCategory))
router.get('/:slug', validate({ params: schemas.slugParam }), asyncHandler(controller.detail))
router.post('/', authenticate, authorize('admin'), validate({ body: schemas.createBody }), asyncHandler(controller.create))
router.patch('/:id', authenticate, authorize('admin'), validate({ params: schemas.idParam, body: schemas.updateBody }), asyncHandler(controller.update))

module.exports = router
