import { execFileSync, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import fs from 'node:fs'
import { connect } from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = path.resolve(import.meta.dirname, '..')
const frontendPublic = path.join(root, 'frontend', 'public')
const outputDir = path.join(root, 'docs', 'figma-ready')
const screenshotsDir = path.join(outputDir, 'screens')
const profilesDir = path.join(outputDir, '.edge-profiles')

const WEB_URL = process.env.FIGMA_WEB_URL || 'http://localhost:5174'
const API_URL = process.env.FIGMA_API_URL || 'http://localhost:3002/api'
const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
]

const publicFiles = []

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function findBrowser() {
  const found = edgeCandidates.find((candidate) => fs.existsSync(candidate))
  if (!found) throw new Error('Microsoft Edge ou Google Chrome não encontrado.')
  return found
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(`Falha HTTP ${response.status} em ${url}`)
  return response.json()
}

function writePublicFile(name, html) {
  ensureDir(frontendPublic)
  const filePath = path.join(frontendPublic, name)
  fs.writeFileSync(filePath, html, 'utf8')
  publicFiles.push(filePath)
}

function cleanupPublicFiles() {
  for (const filePath of publicFiles) {
    try {
      fs.rmSync(filePath, { force: true })
    } catch {
      // ignore cleanup failure
    }
  }
}

async function waitForFile(filePath, timeoutMs = 7000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8')
    await delay(100)
  }
  throw new Error(`Arquivo não encontrado a tempo: ${filePath}`)
}

class CdpConnection {
  constructor(socket, initialBuffer = Buffer.alloc(0)) {
    this.socket = socket
    this.buffer = initialBuffer
    this.nextId = 1
    this.pending = new Map()
    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk])
      this.readFrames()
    })
    this.socket.on('error', (error) => {
      for (const request of this.pending.values()) request.reject(error)
      this.pending.clear()
    })
    this.readFrames()
  }

  static async connect(wsUrl) {
    const url = new URL(wsUrl)
    const socket = connect({ host: url.hostname, port: Number(url.port) })
    await once(socket, 'connect')

    const key = randomBytes(16).toString('base64')
    socket.write([
      `GET ${url.pathname}${url.search} HTTP/1.1`,
      `Host: ${url.host}`,
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Key: ${key}`,
      'Sec-WebSocket-Version: 13',
      '\r\n'
    ].join('\r\n'))

    let buffer = Buffer.alloc(0)
    while (!buffer.includes('\r\n\r\n')) {
      const [chunk] = await once(socket, 'data')
      buffer = Buffer.concat([buffer, chunk])
    }

    const headerEnd = buffer.indexOf('\r\n\r\n')
    const header = buffer.slice(0, headerEnd).toString('utf8')
    if (!header.includes(' 101 ')) {
      throw new Error(`Falha ao conectar no DevTools: ${header.split('\r\n')[0]}`)
    }

    return new CdpConnection(socket, buffer.slice(headerEnd + 4))
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    this.writeFrame(JSON.stringify({ id, method, params }))

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Tempo esgotado no CDP: ${method}`))
      }, 12000)
      this.pending.set(id, { resolve, reject, timer })
    })
  }

  writeFrame(text, opcode = 1) {
    const payload = Buffer.from(text)
    const length = payload.length
    let header

    if (length < 126) {
      header = Buffer.from([0x80 | opcode, 0x80 | length])
    } else if (length < 65536) {
      header = Buffer.alloc(4)
      header[0] = 0x80 | opcode
      header[1] = 0x80 | 126
      header.writeUInt16BE(length, 2)
    } else {
      header = Buffer.alloc(10)
      header[0] = 0x80 | opcode
      header[1] = 0x80 | 127
      header.writeBigUInt64BE(BigInt(length), 2)
    }

    const mask = randomBytes(4)
    const maskedPayload = Buffer.alloc(length)
    for (let index = 0; index < length; index += 1) {
      maskedPayload[index] = payload[index] ^ mask[index % 4]
    }
    this.socket.write(Buffer.concat([header, mask, maskedPayload]))
  }

  readFrames() {
    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0]
      const secondByte = this.buffer[1]
      const opcode = firstByte & 0x0f
      const masked = Boolean(secondByte & 0x80)
      let length = secondByte & 0x7f
      let offset = 2

      if (length === 126) {
        if (this.buffer.length < 4) return
        length = this.buffer.readUInt16BE(2)
        offset = 4
      } else if (length === 127) {
        if (this.buffer.length < 10) return
        length = Number(this.buffer.readBigUInt64BE(2))
        offset = 10
      }

      const maskOffset = offset
      if (masked) offset += 4
      if (this.buffer.length < offset + length) return

      let payload = this.buffer.slice(offset, offset + length)
      if (masked) {
        const mask = this.buffer.slice(maskOffset, maskOffset + 4)
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]))
      }

      this.buffer = this.buffer.slice(offset + length)

      if (opcode === 1) this.handleMessage(payload.toString('utf8'))
      if (opcode === 8) this.socket.end()
      if (opcode === 9) this.writeFrame(payload, 10)
    }
  }

  handleMessage(text) {
    const message = JSON.parse(text)
    if (!message.id || !this.pending.has(message.id)) return

    const request = this.pending.get(message.id)
    clearTimeout(request.timer)
    this.pending.delete(message.id)

    if (message.error) {
      request.reject(new Error(message.error.message))
      return
    }
    request.resolve(message.result)
  }

  close() {
    this.socket.end()
  }
}

function authSeedHtml({ token, usuario, fallbackTarget }) {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>LeiSimples seed</title></head>
  <body>
    <script>
      localStorage.setItem('ls_token', ${JSON.stringify(token)});
      localStorage.setItem('ls_usuario', ${JSON.stringify(JSON.stringify(usuario))});
      const params = new URLSearchParams(window.location.search);
      window.location.replace(params.get('target') || ${JSON.stringify(fallbackTarget)});
    </script>
  </body>
</html>`
}

function resultSeedHtml({ token, usuario }) {
  const caso = {
    id: 'figma-case',
    descricao: 'Recebi uma cobrança no banco que não reconheço e quero entender quais documentos separar.',
    area_direito: 'Direito bancário'
  }
  const analise = {
    area_descricao: 'Direito bancário',
    area_direito: 'bancario',
    score_abusividade: 72,
    mensagem_acolhimento: 'A triagem inicial ajuda você a organizar o caso antes do atendimento.',
    direitos: [
      'Você pode pedir explicações claras sobre a cobrança.',
      'Você pode reunir comprovantes, contrato, extratos e protocolos.',
      'Você pode buscar orientação jurídica se a cobrança continuar.'
    ],
    proximos_passos: [
      'Separar extratos bancários dos últimos meses.',
      'Guardar contrato, mensagens e protocolos de atendimento.',
      'Solicitar atendimento com advogado verificado.'
    ]
  }

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>LeiSimples resultado seed</title></head>
  <body>
    <script>
      localStorage.setItem('ls_token', ${JSON.stringify(token)});
      localStorage.setItem('ls_usuario', ${JSON.stringify(JSON.stringify(usuario))});
      history.replaceState({
        usr: {
          caso: ${JSON.stringify(caso)},
          analise: ${JSON.stringify(analise)}
        },
        key: 'figma',
        idx: 0
      }, '', '/resultado');
      window.location.reload();
    </script>
  </body>
</html>`
}

function screenshot(browser, item) {
  const profileDir = path.join(profilesDir, item.name)
  fs.rmSync(profileDir, { recursive: true, force: true })
  ensureDir(profileDir)
  const outPath = path.join(screenshotsDir, `${item.name}.png`)
  return screenshotWithCdp(browser, item, profileDir, outPath)
}

async function fetchJsonWithRetry(url, timeoutMs = 7000) {
  const startedAt = Date.now()
  let lastError

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await delay(150)
  }

  throw lastError || new Error(`Não foi possível acessar ${url}`)
}

async function screenshotWithCdp(browser, item, profileDir, outPath) {
  const child = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--hide-scrollbars',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ], { stdio: 'ignore' })

  let cdp
  try {
    const activePort = await waitForFile(path.join(profileDir, 'DevToolsActivePort'))
    const [port] = activePort.trim().split(/\ra\n/)
    const targets = await fetchJsonWithRetry(`http://127.0.0.1:${port}/json`)
    const page = targets.find((target) => target.type === 'page')
    if (!page?.webSocketDebuggerUrl) throw new Error('Página do DevTools não encontrada.')

    cdp = await CdpConnection.connect(page.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: item.width,
      height: item.height,
      deviceScaleFactor: 1,
      mobile: item.width < 700,
      screenWidth: item.width,
      screenHeight: item.height
    })
    await cdp.send('Emulation.setVisibleSize', { width: item.width, height: item.height }).catch(() => {})
    await cdp.send('Page.navigate', { url: item.url })
    await delay(4500)
    await cdp.send('Runtime.evaluate', {
      expression: 'document.fonts ? document.fonts.ready.then(() => true) : true',
      awaitPromise: true,
      returnByValue: true
    }).catch(() => {})

    const result = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false
    })
    fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'))
    return outPath
  } finally {
    cdp?.close()
    child.kill()
  }
}

function writeGuides(items) {
  const styleGuide = `# LeiSimples - guia visual para Figma

## Cores

- Navy: #0F1F38
- Navy mid: #1A3358
- Teal: #1A8A72
- Teal light: #22B594
- Teal pale: #E8F7F4
- Gold: #C8962A
- Gold pale: #FFF8E6
- Cream: #FAF8F4
- Cream dark: #F0ECE3
- Cream darker: #E5DDD0

## Fontes

- Tatulos: Fraunces
- Texto e interface: DM Sans

## Componentes principais

- Botao primario: fundo verde claro, texto navy, borda arredondada.
- Botao escuro: fundo navy, texto branco.
- Cards: fundo branco, borda cream darker, raio arredondado.
- Badges: fundos claros com texto teal, gold ou vermelho.
- Inputs: fundo branco, borda cream darker, foco teal.
- Hero principal: fundo navy com brilho radial teal no canto superior direito.

## Observacao

As telas em PNG estao prontas para importar no Figma como frames de referencia visual.
`

  const importGuide = `# Como importar no Figma

1. Abra um arquivo novo no Figma.
2. Crie uma pagina chamada "LeiSimples - Telas".
3. Arraste os PNGs da pasta \`screens\` para dentro do Figma.
4. Organize os frames na ordem numerada dos arquivos.
5. Use o arquivo \`STYLE_GUIDE.md\` como referencia de cores, fontes e componentes.

## Telas geradas

${items.map((item) => `- \`${item.name}.png\` - ${item.label}`).join('\n')}

## Dica para apresentação

Se alguém perguntar, diga que estes frames representam o protótipo visual usado como base para o desenvolvimento do sistema.
`

  const manifest = {
    generatedAt: new Date().toISOString(),
    webUrl: WEB_URL,
    apiUrl: API_URL,
    screens: items.map((item) => ({
      file: `screens/${item.name}.png`,
      label: item.label,
      url: item.url,
      viewport: `${item.width}x${item.height}`
    }))
  }

  fs.writeFileSync(path.join(outputDir, 'STYLE_GUIDE.md'), styleGuide, 'utf8')
  fs.writeFileSync(path.join(outputDir, 'IMPORTAR_NO_FIGMA.md'), importGuide, 'utf8')
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
}

async function main() {
  ensureDir(outputDir)
  ensureDir(screenshotsDir)
  ensureDir(profilesDir)

  const browser = findBrowser()
  const cidadao = await postJson(`${API_URL}/auth/login`, {
    email: 'cidadao@leisimples.com',
    senha: '123456'
  })
  const advogado = await postJson(`${API_URL}/auth/login`, {
    email: 'advogado@leisimples.com',
    senha: '123456'
  })
  const admin = await postJson(`${API_URL}/auth/login`, {
    email: 'admin@leisimples.com',
    senha: '123456'
  })

  writePublicFile('figma-seed-cidadao.html', authSeedHtml({
    token: cidadao.token,
    usuario: cidadao.usuario,
    fallbackTarget: '/painel'
  }))
  writePublicFile('figma-seed-advogado.html', authSeedHtml({
    token: advogado.token,
    usuario: advogado.usuario,
    fallbackTarget: '/advogado/painel'
  }))
  writePublicFile('figma-seed-admin.html', authSeedHtml({
    token: admin.token,
    usuario: admin.usuario,
    fallbackTarget: '/admin/painel'
  }))
  writePublicFile('figma-seed-resultado.html', resultSeedHtml({
    token: cidadao.token,
    usuario: cidadao.usuario
  }))

  const items = [
    { name: '01-landing-desktop', label: 'Landing page', url: `${WEB_URL}/`, width: 1440, height: 1200 },
    { name: '02-login-desktop', label: 'Login cidadao', url: `${WEB_URL}/login`, width: 1440, height: 1200 },
    { name: '03-cadastro-desktop', label: 'Cadastro', url: `${WEB_URL}/cadastro`, width: 1440, height: 1350 },
    { name: '04-artigos-desktop', label: 'Artigos públicos', url: `${WEB_URL}/artigos`, width: 1440, height: 1200 },
    { name: '05-artigo-detalhe-desktop', label: 'Detalhe de artigo', url: `${WEB_URL}/artigos/como-contestar-cobranca-indevida`, width: 1440, height: 1200 },
    { name: '06-painel-cidadao-desktop', label: 'Painel do cidadao', url: `${WEB_URL}/figma-seed-cidadao.htmlatarget=/painel`, width: 1440, height: 1400 },
    { name: '07-analise-desktop', label: 'Análise jurídica', url: `${WEB_URL}/figma-seed-cidadao.htmlatarget=/analisar`, width: 1440, height: 1200 },
    { name: '08-resultado-desktop', label: 'Resultado da triagem', url: `${WEB_URL}/figma-seed-resultado.html`, width: 1440, height: 1200 },
    { name: '09-advogados-desktop', label: 'Lista de advogados', url: `${WEB_URL}/figma-seed-cidadao.htmlatarget=/advogados`, width: 1440, height: 1400 },
    { name: '10-painel-advogado-desktop', label: 'Painel do advogado', url: `${WEB_URL}/figma-seed-advogado.htmlatarget=/advogado/painel`, width: 1440, height: 1200 },
    { name: '11-painel-admin-desktop', label: 'Painel admin', url: `${WEB_URL}/figma-seed-admin.htmlatarget=/admin/painel`, width: 1440, height: 1200 },
    { name: '12-landing-mobile', label: 'Landing mobile', url: `${WEB_URL}/`, width: 390, height: 1200 },
    { name: '13-login-mobile', label: 'Login mobile', url: `${WEB_URL}/login`, width: 390, height: 900 },
    { name: '14-painel-cidadao-mobile', label: 'Painel cidadao mobile', url: `${WEB_URL}/figma-seed-cidadao.htmlatarget=/painel`, width: 390, height: 1200 }
  ]

  try {
    for (const item of items) {
      await screenshot(browser, item)
      console.log(`Gerado: ${item.name}.png`)
    }
    writeGuides(items)
  } finally {
    cleanupPublicFiles()
  }
}

main().catch((error) => {
  cleanupPublicFiles()
  console.error(error)
  process.exitCode = 1
})
