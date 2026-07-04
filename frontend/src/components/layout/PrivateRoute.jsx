import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function PrivateRoute({ tipo }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cream-darker border-t-teal rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (tipo && usuario.tipo !== tipo) {
    const redirectMap = {
      cidadao: '/painel',
      advogado: '/advogado/painel',
      admin: '/admin/painel',
    }
    return <Navigate to={redirectMap[usuario.tipo] || '/'} replace />
  }

  return <Outlet />
}
