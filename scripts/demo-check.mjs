const API_URL = process.env.DEMO_API_URL || process.env.VITE_API_URL || 'http://localhost:3001/api'
const AI_URL = process.env.DEMO_AI_URL || 'http://localhost:5001'
const WEB_URL = process.env.DEMO_WEB_URL || 'http://localhost:5174'
const REAL_AI = process.argv.includes('--real-ai')
const SKIP_WEB = process.argv.includes('--skip-web')

const accounts = {
  cidadao: { email: 'cidadao@leisimples.com', senha: '123456' },
  advogado: { email: 'advogado@leisimples.com', senha: '123456' },
  admin: { email: 'admin@leisimples.com', senha: '123456' }
}

const state = {
  failures: 0,
  warnings: 0,
  tokens: {}
}

function icon(status) {
  return status === 'ok' ? '[OK]' : status === 'warn' ? '[AVISO]' : '[ERRO]'
}

function log(status, label, detail = '') {
  console.log(`${icon(status)} ${label}${detail ? ` - ${detail}` : ''}`)
}

async function request(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 12000)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    })

    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }

    if (!response.ok) {
      const message = data?.erro || data?.message || response.statusText
      throw new Error(`${response.status} ${message}`)
    }

    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function check(label, fn, { warn = false } = {}) {
  try {
    const detail = await fn()
    log('ok', label, detail)
  } catch (error) {
    if (warn) {
      state.warnings += 1
      log('warn', label, error.message)
      return
    }
    state.failures += 1
    log('error', label, error.message)
  }
}

async function login(role) {
  const data = await request(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(accounts[role])
  })

  if (!data?.token) throw new Error(`login ${role} sem token`)
  state.tokens[role] = data.token
  return data.usuario?.nome || role
}

function authHeaders(role) {
  return { Authorization: `Bearer ${state.tokens[role]}` }
}

async function main() {
  console.log('LeiSimples - checagem de apresentação')
  console.log(`API: ${API_URL}`)
  console.log(`IA: ${AI_URL}`)
  console.log(`Web: ${WEB_URL}`)
  console.log('')

  if (!SKIP_WEB) {
    await check('Frontend web responde', async () => {
      await request(WEB_URL, { timeoutMs: 8000 })
      return 'landing acessivel'
    })
  }

  await check('Backend responde', async () => {
    const data = await request(`${API_URL}/health`)
    return data?.status || 'ok'
  })

  await check('Microsservico de IA responde', async () => {
    const data = await request(`${AI_URL}/health`)
    if (!data?.ai_configured) throw new Error('IA sem chave configurada')
    return `${data.ai_provider || 'provider'} / ${data.ai_model || 'modelo'}`
  })

  await check('Login cidadao', () => login('cidadao'))
  await check('Login advogado', () => login('advogado'))
  await check('Login admin', () => login('admin'))

  await check('Artigos públicos carregam', async () => {
    const data = await request(`${API_URL}/artigos`)
    const total = data?.artigos?.length || 0
    if (total < 3) throw new Error(`apenas ${total} artigo(s)`)
    return `${total} artigos`
  })

  await check('Casos do cidadao carregam', async () => {
    const data = await request(`${API_URL}/casos`, { headers: authHeaders('cidadao') })
    const total = data?.casos?.length || 0
    if (total < 3) throw new Error(`apenas ${total} caso(s); rode npm run demo:reset-db`)
    return `${total} casos`
  })

  await check('Advogados verificados carregam', async () => {
    const data = await request(`${API_URL}/advogados`, { headers: authHeaders('cidadao') })
    const total = data?.advogados?.length || 0
    if (total < 3) throw new Error(`apenas ${total} advogado(s); rode npm run demo:reset-db`)
    return `${total} advogados`
  })

  await check('Solicitacoes do advogado carregam', async () => {
    const data = await request(`${API_URL}/advogados/solicitacoes`, { headers: authHeaders('advogado') })
    const total = data?.solicitacoes?.length || 0
    if (total < 1) throw new Error('nenhuma solicitação para demonstrar')
    return `${total} solicitação(ões)`
  })

  await check('Metricas admin carregam', async () => {
    const data = await request(`${API_URL}/admin/metricas`, { headers: authHeaders('admin') })
    if (!data?.metricas) throw new Error('métricas ausentes')
    return `${data.metricas.usuarios || 0} usuarios`
  })

  if (REAL_AI) {
    await check('Análise real com IA via backend', async () => {
      const data = await request(`${API_URL}/ia/analisar`, {
        method: 'POST',
        headers: authHeaders('cidadao'),
        timeoutMs: 60000,
        body: JSON.stringify({
          descricao: 'O banco está cobrando uma tarifa que eu não reconheço no contrato e preciso saber meus direitos.',
          renda_aproximada: '1_a_3_salarios'
        })
      })
      const score = data?.analise?.score_abusividade
      if (typeof score !== 'number') throw new Error('análise sem score numérico')
      return `score ${score}, area ${data.analise.area_direito}`
    })
  } else {
    state.warnings += 1
    log('warn', 'Análise real com IA não executada', 'use npm run demo:check:ai para testar consumindo créditos')
  }

  console.log('')
  if (state.failures > 0) {
    console.log(`Resultado: ${state.failures} erro(s), ${state.warnings} aviso(s).`)
    process.exitCode = 1
    return
  }

  console.log(`Resultado: pronto para demo (${state.warnings} aviso(s)).`)
}

main().catch((error) => {
  console.error(`[ERRO] Checagem interrompida - ${error.message}`)
  process.exitCode = 1
})
