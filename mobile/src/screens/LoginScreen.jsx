import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { styles } from './common'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function submit() {
    setErro('')
    try {
      await login(email, senha)
    } catch {
      setErro('Não foi possível entrar. Confira e-mail e senha.')
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Entrar</Text>
      <TextInput style={styles.input} placeholder="email@exemplo.com" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="senha" value={senha} onChangeText={setSenha} secureTextEntry />
      {!!erro && <Text style={styles.error}>{erro}</Text>}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  )
}
