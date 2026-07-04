import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { artigosService } from '@/services/api'

export default function ArtigoDetalhe() {
  const { slug } = useParams()
  const [artigo, setArtigo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    artigosService.buscar(slug)
      .then(({ data }) => setArtigo(data.artigo))
      .catch((err) => setErro(err.response?.data?.erro || 'Artigo não encontrado.'))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />
      <main className="px-8 lg:px-[60px] py-10 max-w-4xl">
        <Link to="/artigos" className="inline-flex items-center gap-2 text-sm font-medium text-teal mb-8">
          <ArrowLeft size={16} /> Voltar para artigos
        </Link>

        {loading ? (
          <div className="card text-gray-400">Carregando artigo...</div>
        ) : erro ? (
          <div className="card text-red-500">{erro}</div>
        ) : (
          <article>
            <span className="badge-teal">{artigo.area || 'guia'}</span>
            <h1 className="font-fraunces text-[38px] md:text-[48px] leading-tight font-normal text-navy mt-5 mb-4">
              {artigo.titulo}
            </h1>
            {artigo.resumo && (
              <p className="text-lg text-gray-500 leading-relaxed mb-8">{artigo.resumo}</p>
            )}
            <div className="card bg-white/90">
              <div className="whitespace-pre-line text-[15px] leading-8 text-gray-600">
                {artigo.conteudo}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  )
}
