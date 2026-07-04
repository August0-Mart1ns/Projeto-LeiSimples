import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, LayoutDashboard, LogOut, Star, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { advogadosService, solicitacoesService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const menuItems = [
  { icon: LayoutDashboard, label: 'Visao geral', id: 'visao' },
  { icon: Inbox, label: 'Solicitacoes', id: 'solicitacoes' },
  { icon: Star, label: 'Avaliações', id: 'avaliacoes' },
  { icon: User, label: 'Meu perfil', id: 'perfil' },
]

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
        prev.map((item) => item.id === id ? data.solicitacao : item)
      )
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível atualizar a solicitação.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const pendentes = solicitacoes.filter((item) => item.status === 'pendente')

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Topbar tipo="advogado" />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 52px)' }}>
        <aside className="w-[220px] bg-navy flex flex-col flex-shrink-0 p-4">
          <div className="flex flex-col items-center py-5 pb-6 border-b border-white/10 mb-5">
            <div className="w-14 h-14 bg-teal rounded-2xl flex items-center justify-center text-2xl mb-2.5">⚖️</div>
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
                {solicitacoes.filter((item) => item.status === 'aceita').length}
              </div>
            </div>
            <div className="card">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total</div>
              <div className="font-fraunces text-[30px] font-semibold text-navy">{solicitacoes.length}</div>
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

          <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
              <span className="text-sm font-semibold text-navy">Solicitações de atendimento</span>
            </div>

            {solicitacoes.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">Nenhuma solicitação recebida ainda.</div>
            ) : (
              solicitacoes.map((solicitacao) => (
                <div key={solicitacao.id} className="flex gap-4 items-start px-6 py-5 border-b border-cream-dark last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-navy mb-0.5">
                      {solicitacao.cidadao || 'Cidadão'} {solicitacao.cidade ? `- ${solicitacao.cidade}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed mb-2">
                      {solicitacao.desc || solicitacao.caso?.descricao}
                    </div>
                    <span className="badge-gold">{solicitacao.status}</span>
                  </div>

                  {solicitacao.status === 'pendente' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => alterarStatus(solicitacao.id, 'aceita')} className="btn-teal text-xs px-4 py-2">
                        Aceitar
                      </button>
                      <button onClick={() => alterarStatus(solicitacao.id, 'recusada')} className="btn-outline text-xs px-4 py-2">
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
