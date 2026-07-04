const request = require('supertest')
const createApp = require('../src/app')

describe('health', () => {
  it('responde status ok', async () => {
    const app = createApp()
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
