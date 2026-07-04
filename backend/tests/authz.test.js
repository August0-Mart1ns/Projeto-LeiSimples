const request = require('supertest')
const createApp = require('../src/app')

describe('rotas protegidas', () => {
  test('bloqueia listagem de casos sem token', async () => {
    const response = await request(createApp()).get('/api/casos')

    expect(response.status).toBe(401)
    expect(response.body.erro).toBe('Token de autenticação ausente.')
  })

  test('bloqueia documentos de caso sem token', async () => {
    const casoId = '00000000-0000-4000-8000-000000000001'
    const response = await request(createApp()).get(`/api/casos/${casoId}/documentos`)

    expect(response.status).toBe(401)
    expect(response.body.erro).toBe('Token de autenticação ausente.')
  })
})
