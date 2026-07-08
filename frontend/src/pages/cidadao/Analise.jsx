import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { iaService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const exemplos = [
  'Meu banco cobrou um seguro que não autorizei',
  'Fui demitido e acho que a rescisão está errada',
  'Meu senhorio não quer devolver a caução',
  'Me cobraram depois de cancelar o plano',
  'O plano de saúde negou minha cirurgia',
]

export default function Analise() {
  const navigate = useNavigate()
  const [descricao, setDescricao] = useState('')
  const [renda, setRenda] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleAnalisar = async () => {
    if (loading) return

    if (!descricao.trim() || descricao.trim().length < 10) {
      setErro('Descreva melhor o problema antes de analisar.')
      return
    }

    setErro('')
    setLoading(true)

    try {
      const { data } = await iaService.analisar(descricao, renda || null)
      if (data.caso?.id) localStorage.setItem('ls_ultimo_caso_id', data.caso.id)
      navigate('/resultado', { state: data })
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível analisar agora. Confira se a API e a IA estão rodando e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="cidadao" />

      <main className="px-8 lg:px-[60px] py-9">
        <h1 className="font-fraunces text-[30px] font-normal text-navy mb-1">
          Analisar meu problema
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Conte o que aconteceu com suas palavras. A IA cria uma triagem inicial e salva o caso.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <section className="card">
            <div className="section-label">Descrição</div>
            <textarea
              className="w-full border border-cream-darker rounded-xl px-4 py-3.5 font-sans text-sm text-navy bg-cream resize-none h-40 outline-none focus:border-teal transition-colors leading-relaxed"
              placeholder="Ex: Peguei um empréstimo consignado e percebi descontos maiores do que o combinado..."
              value={descricao}
              disabled={loading}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <select
              className="w-full border border-cream-darker rounded-xl px-4 py-3 font-sans text-sm text-navy bg-white outline-none mt-3"
              value={renda}
              disabled={loading}
              onChange={(e) => setRenda(e.target.value)}
            >
              <option value="">Faixa de renda opcional</option>
              <option value="ate_1_salario">Até 1 salário mínimo</option>
              <option value="1_a_3_salarios">1 a 3 salários mínimos</option>
              <option value="3_a_6_salarios">3 a 6 salários mínimos</option>
              <option value="acima_6_salarios">Acima de 6 salários mínimos</option>
            </select>

            {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}
            {loading && (
              <div className="mt-4 rounded-xl bg-teal-pale border border-teal/20 px-4 py-3">
                <p className="text-sm font-semibold text-teal">Analisando com IA</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  Isso pode levar alguns segundos. O sistema também possui resposta local de segurança se a IA externa falhar.
                </p>
              </div>
            )}

            <button
              onClick={handleAnalisar}
              disabled={loading}
              className="btn-navy w-full mt-5 disabled:opacity-60"
            >
              {loading ? 'Analisando com IA...' : 'Analisar com IA'}
            </button>
          </section>

          <aside className="card">
            <div className="section-label">Exemplos</div>
            {exemplos.map((exemplo) => (
              <button
                key={exemplo}
                disabled={loading}
                onClick={() => setDescricao(exemplo)}
                className="w-full text-left py-3 border-b border-cream-dark last:border-0 text-sm text-gray-500 hover:text-teal disabled:opacity-50"
              >
                {exemplo}
              </button>
            ))}
          </aside>
        </div>
      </main>
    </div>
  )
}
