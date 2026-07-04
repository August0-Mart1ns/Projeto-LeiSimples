import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { casosService, iaService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

export default function Resultado() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [analise, setAnalise] = useState(state?.analise || null)
  const [caso, setCaso] = useState(state?.caso || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function carregarAnalise() {
      const casoId = caso?.id || localStorage.getItem('ls_ultimo_caso_id')
      if (analise || !casoId) return

      setLoading(true)
      try {
        const [analiseResponse, casoResponse] = await Promise.allSettled([
          iaService.buscarAnalise(casoId),
          casosService.buscar(casoId),
        ])

        if (analiseResponse.status === 'fulfilled') {
          setAnalise(analiseResponse.value.data.analise)
        }
        if (casoResponse.status === 'fulfilled') {
          setCaso(casoResponse.value.data.caso)
        }
      } catch {
        setAnalise(null)
      } finally {
        setLoading(false)
      }
    }
    carregarAnalise()
  }, [analise, caso?.id])

  if (loading && !analise) {
    return (
      <div className="min-h-screen bg-cream">
        <Topbar tipo="cidadao" />
        <div className="px-8 lg:px-[60px] py-12">
          <div className="card text-center">
            <h1 className="font-fraunces text-[26px] text-navy mb-2">Carregando análise</h1>
            <p className="text-sm text-gray-400">Recuperando o altimo resultado salvo.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analise && !caso) {
    return (
      <div className="min-h-screen bg-cream">
        <Topbar tipo="cidadao" />
        <div className="px-8 lg:px-[60px] py-12">
          <div className="card text-center">
            <h1 className="font-fraunces text-[26px] text-navy mb-2">Nenhuma análise encontrada</h1>
            <button onClick={() => navigate('/analisar')} className="btn-primary mt-4">
              Analisar problema
            </button>
          </div>
        </div>
      </div>
    )
  }

  const score = Number(analise?.score_abusividade || 0)
  const scoreColor = score > 66 ? '#C0392B' : score > 33 ? '#C8962A' : '#1A8A72'

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="cidadao" />

      <section className="px-8 lg:px-[60px] py-9 flex items-center justify-between bg-navy">
        <div>
          <h1 className="font-fraunces text-[26px] font-normal text-white mb-1">Análise concluída</h1>
          <p className="text-sm text-white/45">Veja seus direitos e os próximos passos recomendados</p>
        </div>
        <span className="bg-teal-light/15 border border-teal-light/30 text-teal-light text-sm font-medium px-5 py-2.5 rounded-full">
          IA LeiSimples
        </span>
      </section>

      <main className="px-8 lg:px-[60px] py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section>
          <div className="card mb-5">
            {caso?.descricao && (
              <div className="bg-cream-dark border-l-4 border-teal rounded-xl px-4 py-3 mb-6">
                <div className="text-xs font-semibold text-teal uppercase tracking-wider mb-1">Problema descrito</div>
                <div className="text-sm text-gray-500 italic leading-relaxed">{caso.descricao}</div>
              </div>
            )}

            <div className="flex items-center gap-4 bg-teal-pale rounded-xl p-4 mb-6">
              <div>
                <div className="text-xs text-gray-400 mb-1">Área jurídica identificada</div>
                <div className="text-[15px] font-semibold text-teal">
                  {analise?.area_descricao || analise?.area_direito || caso?.area_direito || 'Em avaliação'}
                </div>
              </div>
            </div>

            {analise && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500">Navel de irregularidade</span>
                    <span className="text-lg font-semibold" style={{ color: scoreColor }}>{score} / 100</span>
                  </div>
                  <div className="h-2 bg-cream-darker rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
                  </div>
                </div>

                <div className="section-label">Seus direitos nessa situação</div>
                <ul className="mb-6">
                  {(analise.direitos || []).map((direito) => (
                    <li key={direito} className="py-3 border-b border-cream-dark last:border-0 text-sm text-gray-500">
                      {direito}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="card">
            <div className="section-label">Praximos passos</div>
            {(analise?.proximos_passos || []).map((passo, index) => (
              <div key={passo} className="flex gap-3 mb-4 last:mb-0 text-sm text-gray-500">
                <span className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                {passo}
              </div>
            ))}
          </div>
        </section>

        <aside className="card h-fit">
          <h2 className="font-fraunces text-[18px] font-normal text-navy mb-2">O que fazer agora</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-5">
            {analise?.mensagem_acolhimento || 'Organize seus documentos e procure atendimento especializado.'}
          </p>
          <button onClick={() => navigate('/advogados')} className="btn-primary w-full mb-3 text-sm">
            Ver advogados
          </button>
          <button onClick={() => navigate('/painel')} className="btn-navy w-full mb-3 text-sm">
            Ver meus casos
          </button>
          <button onClick={() => navigate('/analisar')} className="btn-outline w-full text-sm">
            Analisar outro problema
          </button>
        </aside>
      </main>
    </div>
  )
}
