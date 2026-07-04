import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

export default function LoginAdvogado() {
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
      if (data.usuario.tipo !== 'advogado') {
        setErro('Esta conta não é de advogado.')
        return
      }

      login(data.usuario, data.token)
      navigate('/advogado/painel')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível entrar.')
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
            Painel do advogado
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-md">
            Gerencie solicitações, acompanhe casos e mantenha seu perfil profissional atualizado.
          </p>
        </section>

        <section className="px-8 lg:px-16 py-16 flex flex-col justify-center">
          <h2 className="font-fraunces text-[28px] font-normal text-navy mb-2">Entrar como advogado</h2>
          <p className="text-sm text-gray-400 mb-8">
           Entre como cidadão{' '}
            <Link to="/login" className="text-teal font-medium hover:underline">
              Acesse aqui
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              className="input mb-4"
              type="email"
              placeholder="seu@escritorio.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <label className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">
              Senha
            </label>
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
              {loading ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
