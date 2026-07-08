import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Inbox, LayoutDashboard, LogOut, Star, User, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { advogadosService, solicitacoesService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const menuItems = [
  { icon: LayoutDashboard, label: 'Visão geral', id: 'visao' },
  { icon: Inbox, label: 'Solicitações', id: 'solicitacoes' },
  { icon: Star, label: 'Avaliações', id: 'avaliacoes' },
  { icon: User, label: 'Meu perfil', id: 'perfil' },
]

const areaLabels = {
  bancario: 'Bancário',
  consumidor: 'Consumidor',
  trabalhista: 'Trabalhista',
  inquilino: 'Inquilino',
  familia: 'Família',
  idoso: 'Idoso',
  contrato: 'Contrato',
}

const statusLabels = {
  pendente: 'Pendente',
  aceita: 'Aceita',
  recusada: 'Recusada',
  cancelada: 'Cancelada',
}

function formatArea(area) {
  if (!area) return 'Área não informada'
  return areaLabels[area] || area.charAt(0).toUpperCase() + area.slice(1)
}

function formatStatus(status) {
  return statusLabels[status] || status
}

function listPreview(items = [], limit = 2) {
  return items.filter(Boolean).slice(0, limit)
}

function mergeSolicitacaoAtualizada(original, atualizada) {
  return Object.entries(atualizada || {}).reduce((merged, [key, value]) => {
    if (value !== undefined) merged[key] = value
    return merged
  }, { ...original })
}

function isSolicitacaoVisivelNaBoard(solicitacao) {
  return !['recusada', 'cancelada'].includes(solicitacao.status)
}

export default function PainelAdvogado() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [menuAtivo, setMenuAtivo] = useState('visao')
  const [solicitacoes, setSolicitacoes] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    advogadosService.solicitacoes()
      .then(({ data }) => setSolicitacoes(data.solicitacoes || []))
      .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível carregar solicitações.'))
  }, [])

  const alterarStatus = async (id, acao) => {
    try {
      const serviceCall = acao === 'aceita'
        ? solicitacoesService.aceitar(id)
        : solicitacoesService.recusar(id)
      const { data } = await serviceCall
      setSolicitacoes((prev) =>
        acao === 'recusada'
          ? prev.filter((item) => item.id !== id)
          : prev.map((item) => item.id === id ? mergeSolicitacaoAtualizada(item, data.solicitacao) : item)
      )
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível atualizar a solicitação.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const solicitacoesVisiveis = solicitacoes.filter(isSolicitacaoVisivelNaBoard)
  const pendentes = solicitacoesVisiveis.filter((item) => item.status === 'pendente')

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Topbar tipo="advogado" />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 52px)' }}>
        <aside className="w-[220px] bg-navy flex flex-col flex-shrink-0 p-4">
          <div className="flex flex-col items-center py-5 pb-6 border-b border-white/10 mb-5">
            <div className="w-14 h-14 bg-teal rounded-2xl flex items-center justify-center text-sm font-bold text-white mb-2.5">LS</div>
            <div className="text-sm font-semibold text-white text-center leading-tight mb-0.5">
              {usuario?.nome}
            </div>
            <div className="text-xs text-white/35 text-center">
              {usuario?.advogado?.estado_oab ? `OAB/${usuario.advogado.estado_oab} ${usuario.advogado.numero_oab}` : 'Advogado'}
            </div>
          </div>

          <nav className="flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setMenuAtivo(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm mb-1 text-left ${
                  menuAtivo === item.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/10'
                }`}
              >
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.id === 'solicitacoes' && pendentes.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendentes.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/45">
            <LogOut size={16} /> Sair
          </button>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Solicitações pendentes</div>
              <div className="font-fraunces text-[30px] font-semibold text-navy">{pendentes.length}</div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Aceitas</div>
              <div className="font-fraunces text-[30px] font-semibold text-navy">
                {solicitacoesVisiveis.filter((item) => item.status === 'aceita').length}
              </div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total</div>
              <div className="font-fraunces text-[30px] font-semibold text-navy">{solicitacoesVisiveis.length}</div>
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

          <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <span className="text-sm font-semibold text-navy">Solicitações de atendimento</span>
            </div>

            {solicitacoesVisiveis.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">Nenhuma solicitação recebida ainda.</div>
            ) : (
              solicitacoesVisiveis.map((solicitacao) => {
                const analise = solicitacao.analise
                const pontos = listPreview(analise?.direitos)
                const passos = listPreview(analise?.proximos_passos)
                const documentos = analise?.documentos || []

                return (
                  <div key={solicitacao.id} className="flex gap-5 items-start px-6 py-6 border-b border-cream-dark last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-navy">
                          {solicitacao.cidadao || 'Cidadão'} {solicitacao.cidade ? `- ${solicitacao.cidade}` : ''}
                        </span>
                        <span className="badge-gold">{formatStatus(solicitacao.status)}</span>
                        <span className="rounded-full bg-teal/10 px-3 py-1 text-[11px] font-semibold text-teal">
                          {formatArea(analise?.area_direito || solicitacao.area || solicitacao.caso?.area_direito)}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-cream-dark bg-cream/40 p-4 mb-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          <FileText size={14} />
                          Resumo do problema
                        </div>
                        <p className="text-sm leading-relaxed text-navy">
                          {solicitacao.desc || solicitacao.caso?.descricao || 'Descrição não informada.'}
                        </p>
                        {solicitacao.mensagem && (
                          <p className="mt-3 text-xs leading-relaxed text-gray-500">
                            <span className="font-semibold text-navy">Mensagem do cidadão:</span> {solicitacao.mensagem}
                          </p>
                        )}
                      </div>

                      {analise ? (
                        <div className="grid gap-3 xl:grid-cols-3">
                          <div className="rounded-2xl border border-cream-dark p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Análise inicial</div>
                            <p className="text-sm text-navy leading-relaxed">
                              {analise.resumo || analise.orientacao || 'A análise foi registrada para este caso.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {analise.score_abusividade !== null && analise.score_abusividade !== undefined && (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
                                  Atenção: {analise.score_abusividade}%
                                </span>
                              )}
                              {analise.indicar_defensoria && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                                  Pode envolver Defensoria
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-cream-dark p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Pontos de atenção</div>
                            <ul className="space-y-2 text-sm leading-relaxed text-navy">
                              {pontos.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                              {pontos.length === 0 && (
                                <li>Sem pontos específicos registrados pela análise.</li>
                              )}
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-cream-dark p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Próximos passos</div>
                            <ul className="space-y-2 text-sm leading-relaxed text-navy">
                              {passos.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                              {passos.length === 0 && (
                                <li>Orientar o cidadão a separar documentos e explicar a linha do tempo.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-cream-darker bg-white/60 p-4 text-sm text-gray-500">
                          Este caso ainda não possui análise de IA vinculada. Use a descrição do cidadão para decidir se deseja aceitar o atendimento.
                        </div>
                      )}

                      {documentos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 py-1">Documentos úteis:</span>
                          {documentos.slice(0, 4).map((documento) => (
                            <span key={documento} className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-navy">
                              {documento}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {solicitacao.status === 'pendente' && (
                      <div className="flex w-[132px] flex-col gap-2 flex-shrink-0">
                        <button onClick={() => alterarStatus(solicitacao.id, 'aceita')} className="btn-teal flex items-center justify-center gap-1.5 text-xs px-4 py-2">
                          <CheckCircle2 size={14} />
                          Aceitar
                        </button>
                        <button onClick={() => alterarStatus(solicitacao.id, 'recusada')} className="btn-outline flex items-center justify-center gap-1.5 text-xs px-4 py-2">
                          <XCircle size={14} />
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
