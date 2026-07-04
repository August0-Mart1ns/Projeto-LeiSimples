import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Topbar({ tipo = 'publico' }) {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const goHome = () => {
    if (!usuario) return navigate('/')
    if (usuario.tipo === 'cidadao') return navigate('/painel')
    if (usuario.tipo === 'advogado') return navigate('/advogado/painel')
    return navigate('/admin/painel')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-navy sticky top-0 z-50 px-6 lg:px-[60px] py-3.5 flex items-center justify-between gap-4">
      <button className="font-fraunces text-2xl font-semibold text-white" onClick={goHome}>
        Lei<span className="text-teal-light">Simples</span>
      </button>

      <nav className="flex items-center gap-3 lg:gap-6">
        {tipo === 'publico' && (
          <>
            <button onClick={() => navigate('/artigos')} className="hidden md:inline text-white/60 text-sm hover:text-white">
              Artigos
            </button>
            <button onClick={() => navigate('/aviso-ia')} className="hidden md:inline text-white/60 text-sm hover:text-white">
              IA
            </button>
            <button onClick={() => navigate('/advogado/login')} className="hidden md:inline text-white/60 text-sm hover:text-white">
              Para advogados
            </button>
            <button onClick={() => navigate('/login')} className="bg-teal-light text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90">
              Entrar
            </button>
          </>
        )}

        {tipo === 'cidadao' && (
          <>
            <button onClick={() => navigate('/painel')} className="text-white/60 text-sm hover:text-white">Meus casos</button>
            <button onClick={() => navigate('/advogados')} className="text-white/60 text-sm hover:text-white">Advogados</button>
            <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-white/80 text-sm">
              <span className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                <User size={16} className="text-white" />
              </span>
              <span className="hidden md:inline">{usuario?.nome?.split(' ')[0]}</span>
            </button>
          </>
        )}

        {tipo === 'advogado' && (
          <>
            <button onClick={() => navigate('/advogado/painel')} className="text-white/60 text-sm hover:text-white">Painel</button>
            <button onClick={() => navigate('/perfil')} className="text-white/60 text-sm hover:text-white">Perfil</button>
            <button onClick={handleLogout} className="text-white/60 text-sm hover:text-white flex items-center gap-1.5">
              <LogOut size={14} /> Sair
            </button>
          </>
        )}

        {tipo === 'admin' && (
          <>
            <button onClick={() => navigate('/admin/painel')} className="text-white/60 text-sm hover:text-white">Admin</button>
            <button onClick={() => navigate('/perfil')} className="text-white/60 text-sm hover:text-white">Perfil</button>
            <button onClick={handleLogout} className="text-white/60 text-sm hover:text-white flex items-center gap-1.5">
              <LogOut size={14} /> Sair
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
