const {
  MAX_DOCUMENT_SIZE_BYTES,
  createDocumentoBody
} = require('../src/modules/casos/casos.schemas')

describe('createDocumentoBody', () => {
  test('aceita documento permitido com conteudo em base64', () => {
    const result = createDocumentoBody.safeParse({
      nome: 'contrato-demo.txt',
      tipo_mime: 'text/plain',
      conteudo_base64: Buffer.from('Contrato de teste').toString('base64')
    })

    expect(result.success).toBe(true)
  })

  test('rejeita tipo de arquivo nao permitido', () => {
    const result = createDocumentoBody.safeParse({
      nome: 'arquivo.exe',
      tipo_mime: 'application/x-msdownload',
      tamanho_bytes: 100
    })

    expect(result.success).toBe(false)
  })

  test('rejeita documento acima do limite de tamanho', () => {
    const result = createDocumentoBody.safeParse({
      nome: 'contrato.pdf',
      tipo_mime: 'application/pdf',
      tamanho_bytes: MAX_DOCUMENT_SIZE_BYTES + 1
    })

    expect(result.success).toBe(false)
  })
})
