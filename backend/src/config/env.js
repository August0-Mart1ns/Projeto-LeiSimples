const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000)

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001',
  aiTimeoutMs: Number.isFinite(aiTimeoutMs) && aiTimeoutMs > 0 ? aiTimeoutMs : 15000,
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  emailFrom: process.env.EMAIL_FROM || 'LeiSimples <noreply@leisimples.com>',
  resendApiKey: process.env.RESEND_API_KEY || ''
}

module.exports = env
