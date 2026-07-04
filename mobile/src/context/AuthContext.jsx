import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function restore() {
      const rawUsuario = await SecureStore.getItemAsync('ls_usuario')
      if (rawUsuario) setUsuario(JSON.parse(rawUsuario))
      setCarregando(false)
    }
    restore()
  }, [])

  async function salvarSessao(data) {
    setUsuario(data.usuario)
    await SecureStore.setItemAsync('ls_token', data.token)
    await SecureStore.setItemAsync('ls_usuario', JSON.stringify(data.usuario))
  }

  async function login(email, senha) {
    const { data } = await authService.login(email, senha)
    await salvarSessao(data)
    return data.usuario
  }

  async function registrar(dados) {
    const { data } = await authService.registrar(dados)
    await salvarSessao(data)
    return data.usuario
  }

  async function logout() {
    setUsuario(null)
    await SecureStore.deleteItemAsync('ls_token')
    await SecureStore.deleteItemAsync('ls_usuario')
  }

  const value = useMemo(
    () => ({ usuario, carregando, login, registrar, logout }),
    [usuario, carregando]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
