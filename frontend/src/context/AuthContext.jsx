import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    const tokenSalvo = localStorage.getItem('ls_token')
    const usuarioSalvo = localStorage.getItem('ls_usuario')

    if (!tokenSalvo) {
      setCarregando(false)
      return () => {
        ativo = false
      }
    }

    setToken(tokenSalvo)

    if (tokenSalvo && usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch {
        localStorage.removeItem('ls_usuario')
      }
    }

    authService.perfil()
      .then(({ data }) => {
        if (!ativo) return
        setUsuario(data.usuario)
        localStorage.setItem('ls_usuario', JSON.stringify(data.usuario))
      })
      .catch(() => {
        if (!ativo) return
        setUsuario(null)
        setToken(null)
        localStorage.removeItem('ls_token')
        localStorage.removeItem('ls_usuario')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const login = (dadosUsuario, dadosToken) => {
    setUsuario(dadosUsuario)
    setToken(dadosToken)
    localStorage.setItem('ls_token', dadosToken)
    localStorage.setItem('ls_usuario', JSON.stringify(dadosUsuario))
  }

  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('ls_token')
    localStorage.removeItem('ls_usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
