import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tokenDev, setTokenDev] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setMensagem('')
    setTokenDev('')

    try {
      const { data } = await authService.esqueciSenha(email)
      setMensagem(data.mensagem || 'Se o e-mail existir, enviaremos instruções de recuperação.')
      if (data.resetToken) setTokenDev(data.resetToken)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível solicitar a recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />
      <main className="max-w-[520px] mx-auto px-8 py-14">
        <div className="card">
          <h1 className="font-fraunces text-[30px] font-normal text-navy mb-2">Recuperar senha</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Informe seu email para gerar um link de redefinição. Em desenvolvimento, o token aparece aqui na tela.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}
            {mensagem && <p className="text-teal text-xs mt-3">{mensagem}</p>}

            {tokenDev && (
              <div className="bg-cream rounded-xl border border-cream-darker p-4 mt-4">
                <div className="section-label">Token de desenvolvimento</div>
                <code className="text-xs text-navy break-all">{tokenDev}</code>
                <Link to={`/redefinir-senhaatoken=${tokenDev}`} className="btn-navy w-full mt-4 block text-center text-sm">
                  Redefinir senha
                </Link>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-5 disabled:opacity-60">
              {loading ? 'Enviando...' : 'Solicitar recuperação'}
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
