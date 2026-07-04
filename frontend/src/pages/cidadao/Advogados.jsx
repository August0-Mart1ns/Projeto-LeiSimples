import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { advogadosService, solicitacoesService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const filtros = [
  { label: 'Todos', value: '' },
  { label: 'Bancário', value: 'bancario' },
  { label: 'Trabalhista', value: 'trabalhista' },
  { label: 'Consumidor', value: 'consumidor' },
  { label: 'Inquilino', value: 'inquilino' },
  { label: 'Idoso', value: 'idoso' },
  { label: 'Família', value: 'familia' },
]

const areaLabels = {
  bancario: 'Bancário',
  consumidor: 'Consumidor',
  trabalhista: 'Trabalhista',
  inquilino: 'Inquilino',
  idoso: 'Idoso',
  familia: 'Família',
}

function formatarArea(area) {
  return areaLabels[area] || area
}

export default function Advogados() {
  const navigate = useNavigate()
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [advogados, setAdvogados] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setLoading(true)
    setErro('')
    advogadosService.listar(filtroAtivo ? { area: filtroAtivo } : {})
      .then(({ data }) => setAdvogados(data.advogados || []))
      .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível carregar advogados.'))
      .finally(() => setLoading(false))
  }, [filtroAtivo])

  const solicitar = async (advogado) => {
    const casoId = localStorage.getItem('ls_ultimo_caso_id')
    if (!casoId) {
      setErro('Analise um problema antes de solicitar atendimento.')
      return
    }

    try {
      await solicitacoesService.criar(casoId, advogado.id)
      navigate('/confirmacao', { state: { advogado } })
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível solicitar atendimento.')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="cidadao" />

      <main className="px-8 lg:px-[60px] py-9">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h1 className="font-fraunces text-[30px] font-normal text-navy mb-1">Advogados parceiros</h1>
            <p className="text-sm text-gray-400">Profissionais verificados, filtrados pela área do caso</p>
          </div>
        </div>

        <div className="flex gap-2 mb-7 flex-wrap">
          {filtros.map((filtro) => (
            <button
              key={filtro.value}
              onClick={() => setFiltroAtivo(filtro.value)}
              className={`px-5 py-2 rounded-full border text-sm font-medium ${
                filtroAtivo === filtro.value
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-gray-500 border-cream-darker hover:bg-cream-dark'
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : advogados.length === 0 ? (
          <div className="card text-center text-gray-400">Nenhum advogado verificado encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {advogados.map((advogado) => (
              <div key={advogado.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-teal-pale">
                    {advogado.avatar || '⚖️'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-navy mb-0.5">{advogado.nome}</div>
                    <div className="text-xs text-teal font-medium mb-0.5">
                      {(advogado.areas_atuacao || []).map(formatarArea).join(' - ') || 'Área não informada'}
                    </div>
                    <div className="text-xs text-gray-400">OAB/{advogado.estado_oab} {advogado.numero_oab}</div>
                  </div>
                  <span className="bg-teal-pale text-teal text-xs font-bold px-2.5 py-1 rounded-full">
                    Verificado
                  </span>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {advogado.bio || 'Profissional disponível para avaliar solicitações da plataforma.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-cream-dark">
                  <span className="text-xs text-gray-400">
                    {advogado.total_avaliacoes || 0} avaliações
                  </span>
                  <button onClick={() => solicitar(advogado)} className="btn-teal text-xs px-4 py-2">
                    Solicitar atendimento
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
