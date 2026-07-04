import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import { artigosService } from '@/services/api'

export default function Artigos() {
  const [artigos, setArtigos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    artigosService.listar()
      .then(({ data }) => setArtigos(data.artigos || []))
      .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível carregar artigos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />
      <main className="px-8 lg:px-[60px] py-10">
        <h1 className="font-fraunces text-[32px] font-normal text-navy mb-2">Artigos</h1>
        <p className="text-sm text-gray-400 mb-8">Conteúdos simples para entender direitos e organizar próximos passos.</p>

        {loading ? (
          <div className="card text-gray-400">Carregando artigos...</div>
        ) : erro ? (
          <div className="card text-red-500">{erro}</div>
        ) : artigos.length === 0 ? (
          <div className="card text-gray-400">Nenhum artigo publicado ainda.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artigos.map((artigo) => (
              <article key={artigo.id} className="card">
                <span className="badge-teal">{artigo.area || 'guia'}</span>
                <h2 className="font-fraunces text-[22px] text-navy mt-4 mb-2">{artigo.titulo}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{artigo.resumo || artigo.conteudo}</p>
                <Link to={`/artigos/${artigo.slug}`} className="inline-flex mt-5 text-sm font-semibold text-teal hover:underline">
                  Ler artigo
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
