const { fallbackAnalysis } = require('../src/modules/ia/ia.service')

describe('fallbackAnalysis', () => {
  test('classifica problema bancario e indica defensoria por renda', () => {
    const result = fallbackAnalysis(
      'Meu banco fez desconto indevido no emprastimo consignado.',
      '1_a_3_salarios'
    )

    expect(result.area_direito).toBe('bancario')
    expect(result.indicar_defensoria).toBe(true)
    expect(result.proximos_passos.length).toBeGreaterThan(0)
  })

  test('usa consumidor como area padrao', () => {
    const result = fallbackAnalysis('Comprei um produto com defeito e a loja nao resolveu.')

    expect(result.area_direito).toBe('consumidor')
    expect(result.indicar_defensoria).toBe(false)
  })
})
