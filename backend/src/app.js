const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const env = require('./config/env')
const authRoutes = require('./modules/auth/auth.routes')
const casosRoutes = require('./modules/casos/casos.routes')
const iaRoutes = require('./modules/ia/ia.routes')
const advogadosRoutes = require('./modules/advogados/advogados.routes')
const solicitacoesRoutes = require('./modules/solicitacoes/solicitacoes.routes')
const avaliacoesRoutes = require('./modules/avaliacoes/avaliacoes.routes')
const artigosRoutes = require('./modules/artigos/artigos.routes')
const adminRoutes = require('./modules/admin/admin.routes')
const notFound = require('./middlewares/notFound')
const errorHandler = require('./middlewares/errorHandler')

function parseCorsOrigin() {
  if (env.corsOrigin === '*') return true
  return env.corsOrigin.split(',').map((origin) => origin.trim())
}

function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: parseCorsOrigin(), credentials: true }))
  app.use(express.json({ limit: '8mb' }))
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }))

  app.get('/api', (req, res) => {
    res.json({
      nome: 'LeiSimples API',
      status: 'online',
      versao: '1.0.0'
    })
  })

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/casos', casosRoutes)
  app.use('/api/ia', iaRoutes)
  app.use('/api/advogados', advogadosRoutes)
  app.use('/api/solicitacoes', solicitacoesRoutes)
  app.use('/api/avaliacoes', avaliacoesRoutes)
  app.use('/api/artigos', artigosRoutes)
  app.use('/api/admin', adminRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
