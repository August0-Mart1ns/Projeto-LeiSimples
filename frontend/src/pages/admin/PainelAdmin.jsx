import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Scale, Trash2, Users } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { adminService, artigosService } from '@/services/api'

const menuItems = [
  { icon: LayoutDashboard, label: 'Visao geral', id: 'visao' },
  { icon: Scale, label: 'Verificar advogados', id: 'advogados' },
  { icon: Trash2, label: 'Casos', id: 'casos' },
  { icon: FileText, label: 'Artigos', id: 'artigos' },
  { icon: Users, label: 'Usuários', id: 'usuarios' },
]

const artigoInicial = {
  titulo: '',
  slug: '',
  resumo: '',
  conteudo: '',
  area: 'consumidor',
  publicado: true,
}

function StatusBadge({ status }) {
  const className = status === 'aprovado'
    ? 'badge-teal'
    : status === 'rejeitado'
      ? 'badge-danger'
      : 'badge-gold'

  return <span className={className}>{status || 'pendente'}</span>
}

export default function PainelAdmin() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [menuAtivo, setMenuAtivo] = useState('visao')
  const [usuarios, setUsuarios] = useState([])
  const [casosAdmin, setCasosAdmin] = useState([])
  const [artigos, setArtigos] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [erro, setErro] = useState('')
  const [artigoMensagem, setArtigoMensagem] = useState('')
  const [artigoEditando, setArtigoEditando] = useState(null)
  const [artigoForm, setArtigoForm] = useState(artigoInicial)
  const [casoModeracao, setCasoModeracao] = useState(null)
  const [motivoModeracao, setMotivoModeracao] = useState('')
  const [removendoCaso, setRemovendoCaso] = useState(false)
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    setErro('')
    setLoading(true)
    try {
      const [usuariosResponse, metricasResponse, artigosResponse, casosResponse] = await Promise.all([
        adminService.usuarios(),
        adminService.metricas(),
        artigosService.listar(),
        adminService.casos(),
      ])
      setUsuarios(usuariosResponse.data.usuarios || [])
      setMetricas(metricasResponse.data.metricas)
      setArtigos(artigosResponse.data.artigos || [])
      setCasosAdmin(casosResponse.data.casos || [])
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível carregar o painel admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const advogadosPendentes = useMemo(
    () => usuarios.filter((usuario) => usuario.tipo === 'advogado' && usuario.status_verificacao === 'pendente'),
    [usuarios]
  )

  const totais = {
    usuarios: metricas?.usuarios || usuarios.length,
    advogadosPendentes: advogadosPendentes.length,
    casos: (metricas?.casos || []).reduce((total, item) => total + item.total, 0),
    avaliacoes: metricas?.avaliacoes?.total || 0,
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const verificar = async (id, status) => {
    setErro('')
    try {
      await adminService.verificarAdvogado(id, status)
      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === id
            ? { ...usuario, status_verificacao: status, verificado: status === 'aprovado' }
            : usuario
        )
      )
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível verificar o advogado.')
    }
  }

  const abrirModeracao = (caso) => {
    setErro('')
    setCasoModeracao(caso)
    setMotivoModeracao('')
  }

  const confirmarRemocaoCaso = async (event) => {
    event.preventDefault()
    if (!casoModeracao) return

    setErro('')
    setRemovendoCaso(true)
    try {
      await adminService.removerCaso(casoModeracao.id, motivoModeracao.trim() || null)
      setCasoModeracao(null)
      setMotivoModeracao('')
      await carregar()
      setMenuAtivo('casos')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível remover o caso.')
    } finally {
      setRemovendoCaso(false)
    }
  }

  const limparArtigoForm = () => {
    setArtigoEditando(null)
    setArtigoForm(artigoInicial)
  }

  const editarArtigo = (artigo) => {
    setArtigoMensagem('')
    setArtigoEditando(artigo.id)
    setArtigoForm({
      titulo: artigo.titulo || '',
      slug: artigo.slug || '',
      resumo: artigo.resumo || '',
      conteudo: artigo.conteudo || '',
      area: artigo.area || 'consumidor',
      publicado: Boolean(artigo.publicado),
    })
    setMenuAtivo('artigos')
  }

  const salvarArtigo = async (event) => {
    event.preventDefault()
    setErro('')
    setArtigoMensagem('')

    try {
      if (artigoEditando) {
        await artigosService.atualizar(artigoEditando, artigoForm)
        setArtigoMensagem('Artigo atualizado com sucesso.')
      } else {
        await artigosService.criar(artigoForm)
        setArtigoMensagem('Artigo criado com sucesso.')
      }

      limparArtigoForm()
      await carregar()
      setMenuAtivo('artigos')
    } catch (err) {
      setArtigoMensagem(err.response?.data?.erro || 'Não foi possível salvar o artigo.')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Topbar tipo="admin" />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 52px)' }}>
        <aside className="w-[220px] flex flex-col flex-shrink-0 p-4 bg-navy">
          <div className="flex flex-col items-center py-5 pb-6 border-b border-white/10 mb-5">
            <div className="text-sm font-semibold text-white text-center mb-0.5">Painel Admin</div>
            <div className="text-xs text-white/35 text-center">LeiSimples</div>
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
                {item.id === 'advogados' && advogadosPendentes.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {advogadosPendentes.length}
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
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-fraunces text-[28px] font-normal text-navy mb-1">Painel Administrativo</h1>
              <p className="text-sm text-gray-400">Controle usuários, artigos, métricas e verificações da plataforma.</p>
            </div>
            <button onClick={carregar} className="btn-outline text-sm px-4 py-2">Atualizar</button>
          </div>

          {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
          {loading && <p className="text-gray-400 text-sm mb-4">Carregando dados...</p>}

          {menuAtivo === 'visao' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
                {[
                  ['Usuários', totais.usuarios],
                  ['Advogados pendentes', totais.advogadosPendentes],
                  ['Casos', totais.casos],
                  ['Avaliações', totais.avaliacoes],
                ].map(([label, value]) => (
                  <div key={label} className="card">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</div>
                    <div className="font-fraunces text-[30px] font-semibold text-navy">{value}</div>
                  </div>
                ))}
              </div>

              <section className="card">
                <div className="section-label">Distribuição de casos</div>
                {(metricas?.casos || []).length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum caso registrado ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {metricas.casos.map((item) => (
                      <div key={item.status} className="bg-cream rounded-xl border border-cream-darker p-4">
                        <div className="text-xs text-gray-400 mb-1">{item.status}</div>
                        <div className="font-fraunces text-[24px] text-navy">{item.total}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {menuAtivo === 'advogados' && (
            <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-navy">
                <span className="text-sm font-semibold text-white">Advogados aguardando verificação</span>
                <span className="badge-gold">{advogadosPendentes.length} pendentes</span>
              </div>

              {advogadosPendentes.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">Nenhum advogado aguardando verificação.</div>
              ) : (
                advogadosPendentes.map((advogado) => (
                  <div key={advogado.id} className="flex items-center gap-4 px-6 py-4 border-b border-cream-dark last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-navy mb-0.5">{advogado.nome}</div>
                      <div className="text-xs text-gray-400">OAB/{advogado.estado_oab} {advogado.numero_oab}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => verificar(advogado.id, 'aprovado')} className="btn-teal text-xs px-4 py-2">Aprovar</button>
                      <button onClick={() => verificar(advogado.id, 'rejeitado')} className="btn-outline text-xs px-4 py-2">Rejeitar</button>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {menuAtivo === 'artigos' && (
            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
              <section className="card">
                <div className="section-label">{artigoEditando ? 'Editar artigo' : 'Novo artigo'}</div>
                {artigoMensagem && <p className="text-sm text-teal mb-4">{artigoMensagem}</p>}
                <form onSubmit={salvarArtigo} className="space-y-3">
                  <input
                    className="input"
                    placeholder="Título"
                    value={artigoForm.titulo}
                    onChange={(event) => setArtigoForm({ ...artigoForm, titulo: event.target.value })}
                    required
                  />
                  <input
                    className="input"
                    placeholder="slug-do-artigo"
                    value={artigoForm.slug}
                    onChange={(event) => setArtigoForm({ ...artigoForm, slug: event.target.value })}
                    required
                  />
                  <input
                    className="input"
                    placeholder="area do direito"
                    value={artigoForm.area}
                    onChange={(event) => setArtigoForm({ ...artigoForm, area: event.target.value })}
                  />
                  <textarea
                    className="input min-h-[90px]"
                    placeholder="Resumo"
                    value={artigoForm.resumo}
                    onChange={(event) => setArtigoForm({ ...artigoForm, resumo: event.target.value })}
                  />
                  <textarea
                    className="input min-h-[180px]"
                    placeholder="Conteúdo do artigo"
                    value={artigoForm.conteudo}
                    onChange={(event) => setArtigoForm({ ...artigoForm, conteudo: event.target.value })}
                    required
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={artigoForm.publicado}
                      onChange={(event) => setArtigoForm({ ...artigoForm, publicado: event.target.checked })}
                    />
                    Publicado
                  </label>
                  <div className="flex gap-2">
                    <button className="btn-primary text-sm px-4 py-2" type="submit">
                      {artigoEditando ? 'Salvar alterações' : 'Criar artigo'}
                    </button>
                    {artigoEditando && (
                      <button className="btn-outline text-sm px-4 py-2" type="button" onClick={limparArtigoForm}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
                <div className="px-6 py-4 bg-navy text-sm font-semibold text-white">Artigos publicados</div>
                {artigos.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">Nenhum artigo publicado ainda.</div>
                ) : (
                  artigos.map((artigo) => (
                    <div key={artigo.id} className="flex items-center gap-4 px-6 py-4 border-b border-cream-dark last:border-0">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-navy mb-0.5">{artigo.titulo}</div>
                        <div className="text-xs text-gray-400">{artigo.slug}</div>
                      </div>
                      <span className="badge-teal">{artigo.area || 'guia'}</span>
                      <button onClick={() => editarArtigo(artigo)} className="btn-outline text-xs px-4 py-2">
                        Editar
                      </button>
                    </div>
                  ))
                )}
              </section>
            </div>
          )}

          {menuAtivo === 'casos' && (
            <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
              <div className="px-6 py-4 bg-navy text-sm font-semibold text-white">Casos recentes</div>
              {casosAdmin.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">Nenhum caso registrado.</div>
              ) : (
                casosAdmin.map((caso) => (
                  <div key={caso.id} className="flex items-center gap-4 px-6 py-4 border-b border-cream-dark last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy mb-0.5">
                        {(caso.titulo || caso.descricao_problema || 'Caso').slice(0, 90)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {caso.cidadao_nome} - {caso.area_direito || 'area pendente'}
                      </div>
                    </div>
                    <span className="badge-gold">{caso.status}</span>
                    <button onClick={() => abrirModeracao(caso)} className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-2">
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                ))
              )}
            </section>
          )}

          {menuAtivo === 'usuarios' && (
            <section className="bg-white rounded-xl border border-cream-darker overflow-hidden">
              <div className="px-6 py-4 bg-navy text-sm font-semibold text-white">Usuários cadastrados</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-3">Nome</th>
                      <th className="text-left px-6 py-3">Email</th>
                      <th className="text-left px-6 py-3">Tipo</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-t border-cream-dark">
                        <td className="px-6 py-3 text-navy font-medium">{usuario.nome}</td>
                        <td className="px-6 py-3 text-gray-500">{usuario.email}</td>
                        <td className="px-6 py-3 text-gray-500">{usuario.tipo}</td>
                        <td className="px-6 py-3">
                          {usuario.tipo === 'advogado' ? <StatusBadge status={usuario.status_verificacao} /> : <span className="badge-gray">ativo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {casoModeracao && (
        <div className="fixed inset-0 z-40 bg-navy/50 flex items-center justify-center p-4">
          <form onSubmit={confirmarRemocaoCaso} className="bg-white rounded-xl border border-cream-darker p-6 w-full max-w-lg shadow-xl">
            <div className="section-label">Remover caso</div>
            <h2 className="font-fraunces text-[22px] text-navy font-normal mb-2">
              {(casoModeracao.titulo || casoModeracao.descricao_problema || 'Caso').slice(0, 90)}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {casoModeracao.cidadao_nome} - {casoModeracao.area_direito || 'area pendente'}
            </p>
            <textarea
              className="input min-h-[110px]"
              value={motivoModeracao}
              onChange={(event) => setMotivoModeracao(event.target.value)}
              placeholder="Motivo da remoção para auditoria."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCasoModeracao(null)}
                className="btn-outline text-sm px-4 py-2"
                disabled={removendoCaso}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary text-sm px-4 py-2 disabled:opacity-60" disabled={removendoCaso}>
                Remover caso
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
