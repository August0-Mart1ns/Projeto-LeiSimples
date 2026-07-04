const { Router } = require('express')
const controller = require('./auth.controller')
const schemas = require('./auth.schemas')
const validate = require('../../middlewares/validate')
const asyncHandler = require('../../utils/asyncHandler')
const { authenticate } = require('../../middlewares/auth')

const router = Router()

router.post('/register', validate({ body: schemas.registerBody }), asyncHandler(controller.register))
router.post('/login', validate({ body: schemas.loginBody }), asyncHandler(controller.login))
router.get('/me', authenticate, asyncHandler(controller.me))
router.patch('/me', authenticate, validate({ body: schemas.updateProfileBody }), asyncHandler(controller.updateMe))
router.post('/forgot-password', validate({ body: schemas.forgotPasswordBody }), asyncHandler(controller.forgotPassword))
router.patch('/reset-password', validate({ body: schemas.resetPasswordBody }), asyncHandler(controller.resetPassword))

module.exports = router
