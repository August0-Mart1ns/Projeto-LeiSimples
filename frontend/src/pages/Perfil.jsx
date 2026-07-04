import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario, login, logout, token } = useAuth()
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    cpf: '',
    renda_aproximada: '',
    bio: '',
    uf: '',
    areas_atuacao: [],
  })
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!usuario) return
    setForm({
      nome: usuario.nome || '',
      telefone: usuario.telefone || '',
      cidade: usuario.cidade || '',
      cpf: usuario.cpf || '',
      renda_aproximada: usuario.renda_aproximada || '',
      bio: usuario.advogado?.bio || '',
      uf: usuario.advogado?.uf || usuario.advogado?.estado_oab || '',
      areas_atuacao: usuario.advogado?.areas_atuacao || [],
    })
  }, [usuario])

  const toggleArea = (area) => {
    setForm((prev) => ({
      ...prev,
      areas_atuacao: prev.areas_atuacao.includes(area)
        ? prev.areas_atuacao.filter((item) => item !== area)
        : [...prev.areas_atuacao, area],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensagem('')
    setErro('')
    setLoading(true)

    try {
      const payload = {
        nome: form.nome,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        cpf: usuario.tipo === 'cidadao' ? form.cpf || null : undefined,
        renda_aproximada: usuario.tipo === 'cidadao' ? form.renda_aproximada || null : undefined,
        bio: usuario.tipo === 'advogado' ? form.bio || null : undefined,
        uf: usuario.tipo === 'advogado' ? form.uf || null : undefined,
        areas_atuacao: usuario.tipo === 'advogado' ? form.areas_atuacao : undefined,
      }

      const { data } = await authService.atualizarPerfil(payload)
      login(data.usuario, token)
      setMensagem('Perfil atualizado com sucesso.')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível atualizar o perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo={usuario?.tipo || 'cidadao'} />
      <main className="max-w-[760px] mx-auto px-8 py-10">
        <div className="card">
          <h1 className="font-fraunces text-[30px] font-normal text-navy mb-2">Meu perfil</h1>
          <p className="text-sm text-gray-400 mb-8">Mantenha seus dados atualizados para fácilitar o atendimento.</p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Nome</span>
                <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </label>
              <label>
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Telefone</span>
                <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Cidade</span>
                <input className="input" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </label>
            </div>

            {usuario?.tipo === 'cidadao' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label>
                  <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">CPF</span>
                  <input className="input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </label>
                <label>
                  <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Renda aproximada</span>
                  <select className="input" value={form.renda_aproximada} onChange={(e) => setForm({ ...form, renda_aproximada: e.target.value })}>
                    <option value="">Não informar</option>
                    <option value="ate_1_salario">Até 1 salário mínimo</option>
                    <option value="1_a_3_salarios">1 a 3 salários mínimos</option>
                    <option value="3_a_6_salarios">3 a 6 salários mínimos</option>
                    <option value="acima_6_salarios">Acima de 6 salários mínimos</option>
                  </select>
                </label>
              </div>
            )}

            {usuario?.tipo === 'advogado' && (
              <div className="mt-4">
                <label>
                  <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">Bio profissional</span>
                  <textarea className="input min-h-[120px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </label>
                <label className="block mt-4">
                  <span className="text-xs font-semibold text-navy uppercase tracking-wider block mb-1.5">UF</span>
                  <input className="input max-w-[140px]" maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
                </label>
                <div className="section-label mt-4">Áreas de atuação</div>
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

            {mensagem && <p className="text-teal text-sm mt-4">{mensagem}</p>}
            {erro && <p className="text-red-500 text-sm mt-4">{erro}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-6 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cream-darker">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
