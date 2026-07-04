import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const { data } = await authService.login(form.email, form.senha)
      login(data.usuario, data.token)

      const destinos = {
        cidadao: '/painel',
        advogado: '/advogado/painel',
        admin: '/admin/painel',
      }

      navigate(destinos[data.usuario.tipo] || '/')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível entrar. Confira e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Topbar tipo="publico" />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <section className="bg-navy px-8 lg:px-16 py-16 flex flex-col justify-center">
          <div className="font-fraunces text-2xl font-semibold text-white mb-10">
            Lei<span className="text-teal-light">Simples</span>
          </div>
          <h1 className="font-fraunces text-[38px] font-light text-white leading-tight mb-4">
            Bem-vindo de volta
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-md">
            Acesse sua conta para acompanhar casos, análises e solicitações de atendimento.
          </p>
        </section>

        <section className="px-8 lg:px-16 py-16 flex flex-col justify-center">
          <h2 className="font-fraunces text-[28px] font-normal text-navy mb-2">Entrar na conta</h2>
          <p className="text-sm text-gray-400 mb-8">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-teal font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              className="input mb-4"
              type="email"
              placeholder="maria@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-navy uppercase tracking-wider">
                Senha
              </label>
              <Link to="/esqueci-senha" className="text-xs text-teal font-medium hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <input
              className="input"
              type="password"
              placeholder="********"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              required
            />

            {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-5 disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            a advogadoa{' '}
            <Link to="/advogado/login" className="text-teal font-medium hover:underline">
              Acesse o painel de advogado
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
