import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenInicial = useMemo(() => params.get('token') || '', [params])
  const [token, setToken] = useState(tokenInicial)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      await authService.redefinirSenha(token, senha)
      navigate('/login', { replace: true })
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />
      <main className="max-w-[520px] mx-auto px-8 py-14">
        <div className="card">
          <h1 className="font-fraunces text-[30px] font-normal text-navy mb-2">Redefinir senha</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Cole o token recebido e escolha uma nova senha com pelo menos 6 caracteres.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Token</label>
            <input className="input mb-4" value={token} onChange={(e) => setToken(e.target.value)} required />

            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Nova senha</label>
            <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />

            {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-5 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>

          <Link to="/login" className="block text-center text-sm text-teal mt-5 hover:underline">
            Voltar para login
          </Link>
        </div>
      </main>
    </div>
  )
}
