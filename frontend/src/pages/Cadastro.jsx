import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/api'
import Topbar from '@/components/layout/Topbar'

const areas = [
  { value: 'bancario', label: 'Bancário' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'familia', label: 'Família' },
  { value: 'inquilino', label: 'Inquilino' },
  { value: 'idoso', label: 'Idoso' },
]

export default function Cadastro() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [tipo, setTipo] = useState('cidadao')
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    cidade: '',
    numero_oab: '',
    estado_oab: '',
    areas_atuacao: ['consumidor'],
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleArea = (area) => {
    const atuais = form.areas_atuacao
    setForm({
      ...form,
      areas_atuacao: atuais.includes(area)
        ? atuais.filter((item) => item !== area)
        : [...atuais, area],
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        tipo,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        cpf: tipo === 'cidadao' ? form.cpf || null : null,
        numero_oab: tipo === 'advogado' ? form.numero_oab : null,
        estado_oab: tipo === 'advogado' ? form.estado_oab : null,
        areas_atuacao: tipo === 'advogado' ? form.areas_atuacao : undefined,
      }

      const { data } = await authService.registrar(payload)
      login(data.usuario, data.token)
      navigate(tipo === 'cidadao' ? '/painel' : '/advogado/painel')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta. Tente novamente.')
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
            Acesso à justiça para todos
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-md">
            Crie sua conta para receber triagens, acompanhar casos e solicitar atendimento com segurança.
          </p>
          {[
            { icon: Sparkles, title: 'Triagem por IA', desc: 'Organize seu caso em linguagem simples.' },
            { icon: Scale, title: 'Advogados verificados', desc: 'Profissionais aprovados pelo painel administrativo.' },
            { icon: ShieldCheck, title: 'Dados protegidos', desc: 'A experiência foi pensada para privacidade e clareza.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 items-start mb-5">
              <div className="w-8 h-8 rounded-lg bg-teal-light/15 border border-teal-light/20 flex items-center justify-center text-teal-light">
                <item.icon size={16} />
              </div>
              <div>
                <div className="text-xs font-medium text-white/80 mb-0.5">{item.title}</div>
                <div className="text-xs text-white/45 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="px-8 lg:px-16 py-12 flex flex-col justify-center">
          <h2 className="font-fraunces text-[28px] font-normal text-navy mb-1.5">Criar conta gratuita</h2>
          <p className="text-sm text-gray-400 mb-6">
            Já tem conta? <Link to="/login" className="text-teal font-medium hover:underline">Fazer login</Link>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'cidadao', label: 'Cidadão', desc: 'Quero conhecer meus direitos' },
              { value: 'advogado', label: 'Advogado', desc: 'Quero receber casos' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTipo(item.value)}
                className={`border-2 rounded-xl p-5 text-center transition-all ${
                  tipo === item.value ? 'border-teal bg-teal-pale' : 'border-cream-darker bg-white hover:border-teal/40'
                }`}
              >
                <div className="text-sm font-semibold text-navy mb-1">{item.label}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Nome completo</span>
                <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Email</span>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Senha</span>
                <input className="input" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Telefone</span>
                <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Cidade</span>
                <input className="input" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </label>
            </div>

            {tipo === 'cidadao' ? (
              <label className="block mt-3">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">CPF opcional</span>
                <input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </label>
            ) : (
              <div className="mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Número OAB</span>
                    <input className="input" value={form.numero_oab} onChange={(e) => setForm({ ...form, numero_oab: e.target.value })} required />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Estado OAB</span>
                    <input className="input" maxLength={2} value={form.estado_oab} onChange={(e) => setForm({ ...form, estado_oab: e.target.value.toUpperCase() })} required />
                  </label>
                </div>
                <div className="section-label">Áreas de atuação</div>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => toggleArea(area.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        form.areas_atuacao.includes(area.value)
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-gray-500 border-cream-darker'
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {erro && <p className="text-red-500 text-xs mt-4">{erro}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-5 disabled:opacity-60">
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Ao se cadastrar você concorda com os{' '}
            <Link to="/termos" className="text-teal hover:underline">Termos de Uso</Link>
            {' '}e a{' '}
            <Link to="/privacidade" className="text-teal hover:underline">Política de Privacidade</Link>.
          </p>
        </section>
      </main>
    </div>
  )
}
