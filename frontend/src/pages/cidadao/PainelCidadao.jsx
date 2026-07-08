import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Download, FileText, Paperclip, Star, Trash2, Upload } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { artigosService, avaliacoesService, casosService, solicitacoesService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const statusConfig = {
  aberto: { label: 'Aberto', className: 'badge-teal' },
  em_analise: { label: 'Em análise', className: 'badge-gold' },
  aguardando_advogado: { label: 'Aguardando advogado', className: 'badge-gold' },
  em_atendimento: { label: 'Em atendimento', className: 'badge-teal' },
  resolvido: { label: 'Resolvido', className: 'badge-teal' },
  encerrado: { label: 'Encerrado', className: 'badge-danger' },
}

const tamanhoMaximoDocumento = 5 * 1024 * 1024
const tiposDocumentosAceitos = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx'

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(arquivo)
  })
}

function formatarTamanho(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PainelCidadao() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [casos, setCasos] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [artigos, setArtigos] = useState([])
  const [documentoCasoId, setDocumentoCasoId] = useState('')
  const [documentos, setDocumentos] = useState([])
  const [arquivoDocumento, setArquivoDocumento] = useState(null)
  const [arquivoInputKey, setArquivoInputKey] = useState(0)
  const [observacaoDocumento, setObservacaoDocumento] = useState('')
  const [documentosLoading, setDocumentosLoading] = useState(false)
  const [documentosMensagem, setDocumentosMensagem] = useState('')
  const [timelineAberta, setTimelineAberta] = useState(null)
  const [eventosSolicitacao, setEventosSolicitacao] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [avaliando, setAvaliando] = useState(null)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const [casosResponse, artigosResponse, solicitacoesResponse] = await Promise.allSettled([
        casosService.listar(),
        artigosService.listar(),
        solicitacoesService.listar(),
      ])

      if (casosResponse.status === 'fulfilled') {
        setCasos(casosResponse.value.data.casos || [])
      }
      if (artigosResponse.status === 'fulfilled') {
        setArtigos(artigosResponse.value.data.artigos || [])
      }
      if (solicitacoesResponse.status === 'fulfilled') {
        setSolicitacoes(solicitacoesResponse.value.data.solicitacoes || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function carregarDocumentos(casoId) {
    setDocumentosLoading(true)
    setDocumentosMensagem('')
    try {
      const response = await casosService.documentos(casoId)
      setDocumentos(response.data.documentos || [])
    } catch (err) {
      setDocumentos([])
      setDocumentosMensagem(err.response?.data?.erro || 'Não foi possível carregar os documentos.')
    } finally {
      setDocumentosLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!documentoCasoId && casos.length > 0) setDocumentoCasoId(casos[0].id)
  }, [casos, documentoCasoId])

  useEffect(() => {
    if (documentoCasoId) {
      carregarDocumentos(documentoCasoId)
    } else {
      setDocumentos([])
    }
  }, [documentoCasoId])

  const iniciarAvaliacao = (solicitacao) => {
    setMensagem('')
    setAvaliando(solicitacao)
    setNota(5)
    setComentario('')
  }

  const enviarDocumento = async () => {
    if (!documentoCasoId || !arquivoDocumento) {
      setDocumentosMensagem('Selecione um caso e um documento.')
      return
    }

    if (arquivoDocumento.size > tamanhoMaximoDocumento) {
      setDocumentosMensagem('O documento precisa ter no maximo 5 MB.')
      return
    }

    if (!arquivoDocumento.type) {
      setDocumentosMensagem('Tipo de documento não identificado.')
      return
    }

    setDocumentosLoading(true)
    setDocumentosMensagem('')
    try {
      const conteudoBase64 = await arquivoParaBase64(arquivoDocumento)
      await casosService.enviarDocumento(documentoCasoId, {
        nome: arquivoDocumento.name,
        tipo_mime: arquivoDocumento.type,
        tamanho_bytes: arquivoDocumento.size,
        conteudo_base64: conteudoBase64,
        observacao: observacaoDocumento,
      })
      setArquivoDocumento(null)
      setArquivoInputKey((key) => key + 1)
      setObservacaoDocumento('')
      setDocumentosMensagem('Documento anexado ao caso.')
      await carregarDocumentos(documentoCasoId)
    } catch (err) {
      setDocumentosMensagem(err.response?.data?.erro || 'Não foi possível anexar o documento.')
    } finally {
      setDocumentosLoading(false)
    }
  }

  const baixarDocumento = async (documento) => {
    try {
      const response = await casosService.baixarDocumento(documentoCasoId, documento.id)
      const arquivo = response.data.documento
      if (!arquivo.conteudo_base64) {
        setDocumentosMensagem('Este documento possui apenas os metadados salvos.')
        return
      }

      const link = document.createElement('a')
      link.href = `data:${arquivo.tipo_mime};base64,${arquivo.conteudo_base64}`
      link.download = arquivo.nome
      link.click()
    } catch (err) {
      setDocumentosMensagem(err.response?.data?.erro || 'Não foi possível baixar o documento.')
    }
  }

  const excluirDocumento = async (documentoId) => {
    setDocumentosLoading(true)
    setDocumentosMensagem('')
    try {
      await casosService.excluirDocumento(documentoCasoId, documentoId)
      setDocumentosMensagem('Documento removido.')
      await carregarDocumentos(documentoCasoId)
    } catch (err) {
      setDocumentosMensagem(err.response?.data?.erro || 'Não foi possível remover o documento.')
    } finally {
      setDocumentosLoading(false)
    }
  }

  const abrirTimeline = async (solicitacao) => {
    if (timelineAberta === solicitacao.id) {
      setTimelineAberta(null)
      setEventosSolicitacao([])
      return
    }

    setTimelineAberta(solicitacao.id)
    setTimelineLoading(true)
    try {
      const response = await solicitacoesService.eventos(solicitacao.id)
      setEventosSolicitacao(response.data.eventos || [])
    } catch (err) {
      setEventosSolicitacao([{
        id: 'erro',
        descricao: err.response?.data?.erro || 'Não foi possível carregar o andamento.',
        criado_em: new Date().toISOString(),
      }])
    } finally {
      setTimelineLoading(false)
    }
  }

  const enviarAvaliacao = async () => {
    if (!avaliando) return

    setMensagem('')
    try {
      await avaliacoesService.criar({
        solicitacao_id: avaliando.id,
        advogado_id: avaliando.advogado_id,
        nota,
        comentario,
      })
      setMensagem('Avaliação enviada com sucesso.')
      setAvaliando(null)
      await carregar()
    } catch (err) {
      setMensagem(err.response?.data?.erro || 'Não foi possível enviar a avaliação.')
    }
  }

  const abertos = casos.filter((caso) => ['aberto', 'em_analise', 'aguardando_advogado'].includes(caso.status)).length
  const andamento = casos.filter((caso) => caso.status === 'em_atendimento').length
  const resolvidos = casos.filter((caso) => caso.status === 'resolvido').length

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="cidadao" />

      <section className="px-8 lg:px-[60px] py-4 flex items-center justify-between bg-navy">
        <div>
          <p className="text-white/45 text-sm mb-1">Bem-vindo de volta</p>
          <h1 className="font-fraunces text-[28px] font-normal text-white">{usuario?.nome}</h1>
        </div>
        <button onClick={() => navigate('/analisar')} className="btn-primary text-sm">
          Novo problema
        </button>
      </section>

      <main className="px-8 lg:px-[60px] py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[['Casos abertos', abertos], ['Em atendimento', andamento], ['Resolvidos', resolvidos]].map(([label, value]) => (
            <div key={label} className="card text-center">
              <div className="font-fraunces text-[24px] font-semibold text-navy">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <section className="card">
              <div className="section-label">Meus casos recentes</div>
              {loading ? (
                <p className="text-sm text-gray-400">Carregando...</p>
              ) : casos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">Você ainda não tem casos.</p>
                  <button onClick={() => navigate('/analisar')} className="btn-primary text-sm">
                    Descrever primeiro problema
                  </button>
                </div>
              ) : (
                casos.map((caso) => {
                  const status = statusConfig[caso.status] || statusConfig.aberto
                  return (
                    <button
                      key={caso.id}
                      onClick={() => navigate('/resultado', { state: { caso } })}
                      className="w-full flex gap-4 items-center py-4 border-b border-cream-dark last:border-0 text-left hover:bg-cream rounded-lg px-2 -mx-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy mb-0.5">
                          {(caso.descricao_problema || caso.descricao || 'Caso').slice(0, 80)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {caso.area_direito || 'area pendente'} - {new Date(caso.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </button>
                  )
                })
              )}
            </section>

            <section className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="section-label">Documentos dos casos</div>
                <Paperclip size={17} className="text-teal" />
              </div>

              {casos.length === 0 ? (
                <p className="text-sm text-gray-400">Crie um caso para anexar documentos.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select className="input" value={documentoCasoId} onChange={(event) => setDocumentoCasoId(event.target.value)}>
                      {casos.map((caso) => (
                        <option key={caso.id} value={caso.id}>
                          {(caso.titulo || caso.area_direito || caso.descricao_problema || 'Caso').slice(0, 70)}
                        </option>
                      ))}
                    </select>
                    <input
                      key={arquivoInputKey}
                      className="input"
                      type="file"
                      accept={tiposDocumentosAceitos}
                      onChange={(event) => setArquivoDocumento(event.target.files?.[0] || null)}
                    />
                  </div>

                  <textarea
                    className="input min-h-[78px] mt-3"
                    value={observacaoDocumento}
                    onChange={(event) => setObservacaoDocumento(event.target.value)}
                    placeholder="Observação opcional para este documento."
                  />

                  <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3">
                    <button
                      onClick={enviarDocumento}
                      disabled={documentosLoading || !arquivoDocumento}
                      className="btn-primary text-xs px-4 py-2 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Upload size={14} /> Enviar documento
                    </button>
                    {arquivoDocumento && (
                      <span className="text-xs text-gray-400">
                        {arquivoDocumento.name} - {formatarTamanho(arquivoDocumento.size)}
                      </span>
                    )}
                  </div>

                  {documentosMensagem && <p className="text-sm text-teal mt-3">{documentosMensagem}</p>}

                  <div className="mt-4">
                    {documentosLoading && documentos.length === 0 ? (
                      <p className="text-sm text-gray-400">Carregando documentos...</p>
                    ) : documentos.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum documento anexado neste caso.</p>
                    ) : (
                      documentos.map((documento) => (
                        <div key={documento.id} className="flex items-center gap-3 py-3 border-b border-cream-dark last:border-0">
                          <FileText size={18} className="text-teal shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-navy truncate">{documento.nome}</div>
                            <div className="text-xs text-gray-400">
                              {formatarTamanho(documento.tamanho_bytes)} - {new Date(documento.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => baixarDocumento(documento)}
                            className="btn-outline text-xs p-2"
                            title="Baixar documento"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirDocumento(documento.id)}
                            className="btn-outline text-xs p-2"
                            title="Remover documento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>

            <section className="card">
              <div className="section-label">Atendimentos</div>
              {mensagem && <p className="text-sm text-teal mb-3">{mensagem}</p>}
              {loading ? (
                <p className="text-sm text-gray-400">Carregando...</p>
              ) : solicitacoes.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma solicitação enviada ainda.</p>
              ) : (
                solicitacoes.slice(0, 5).map((solicitacao) => (
                  <div key={solicitacao.id} className="py-4 border-b border-cream-dark last:border-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy">
                          {solicitacao.advogado?.nome || 'Advogado parceiro'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {(solicitacao.caso?.descricao || 'Caso').slice(0, 90)}
                        </div>
                        {solicitacao.avaliacao && (
                          <div className="text-xs text-teal mt-1">Avaliado com nota {solicitacao.avaliacao.nota}</div>
                        )}
                      </div>
                      <span className={solicitacao.status === 'aceita' ? 'badge-teal' : solicitacao.status === 'recusada' ? 'badge-danger' : 'badge-gold'}>
                        {solicitacao.status}
                      </span>
                      <button onClick={() => abrirTimeline(solicitacao)} className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-2">
                        <Clock size={14} /> Andamento
                      </button>
                      {solicitacao.status === 'aceita' && !solicitacao.avaliacao && (
                        <button onClick={() => iniciarAvaliacao(solicitacao)} className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-2">
                          <Star size={14} /> Avaliar
                        </button>
                      )}
                    </div>

                    {avaliando?.id === solicitacao.id && (
                      <div className="mt-4 bg-cream rounded-xl border border-cream-darker p-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Nota</label>
                        <select className="input mb-3" value={nota} onChange={(event) => setNota(Number(event.target.value))}>
                          {[5, 4, 3, 2, 1].map((valor) => (
                            <option key={valor} value={valor}>{valor}</option>
                          ))}
                        </select>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Comentario</label>
                        <textarea
                          className="input min-h-[90px] mb-3"
                          value={comentario}
                          onChange={(event) => setComentario(event.target.value)}
                          placeholder="Conte como foi o atendimento."
                        />
                        <div className="flex gap-2">
                          <button onClick={enviarAvaliacao} className="btn-primary text-xs px-4 py-2">Enviar avaliação</button>
                          <button onClick={() => setAvaliando(null)} className="btn-outline text-xs px-4 py-2">Cancelar</button>
                        </div>
                      </div>
                    )}

                    {timelineAberta === solicitacao.id && (
                      <div className="mt-4 bg-cream rounded-xl border border-cream-darker p-4">
                        {timelineLoading ? (
                          <p className="text-sm text-gray-400">Carregando andamento...</p>
                        ) : eventosSolicitacao.length === 0 ? (
                          <p className="text-sm text-gray-400">Nenhum evento registrado.</p>
                        ) : (
                          <div className="space-y-3">
                            {eventosSolicitacao.map((evento) => (
                              <div key={evento.id} className="flex gap-3">
                                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-teal shrink-0" />
                                <div>
                                  <div className="text-sm text-navy">{evento.descricao}</div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(evento.criado_em).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {evento.ator?.nome ? ` - ${evento.ator.nome}` : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>

          <aside>
            <div className="bg-navy rounded-xl p-6 mb-4">
              <h2 className="font-fraunces text-[17px] font-normal text-white mb-2">Defensoria Pública</h2>
              <p className="text-xs text-white/45 leading-relaxed">
                Quando a renda permitir, a análise pode indicar atendimento jurídico gratuito.
              </p>
            </div>

            <div className="card">
              <div className="section-label">Artigos</div>
              {artigos.slice(0, 4).map((artigo) => (
                <div key={artigo.id} className="py-2.5 border-b border-cream-dark last:border-0">
                  <span className="badge-teal mr-2">{artigo.area || 'Guia'}</span>
                  <span className="text-xs text-gray-500">{artigo.titulo}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
