import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { styles } from './common'

export default function CadastroScreen() {
  const { registrar } = useAuth()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'cidadao' })
  const [erro, setErro] = useState('')

  async function submit() {
    setErro('')
    try {
      await registrar(form)
    } catch {
      setErro('Não foi possível criar a conta.')
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Criar conta</Text>
      <TextInput style={styles.input} placeholder="Nome completo" value={form.nome} onChangeText={(nome) => setForm({ ...form, nome })} />
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" value={form.senha} onChangeText={(senha) => setForm({ ...form, senha })} secureTextEntry />
      {!!erro && <Text style={styles.error}>{erro}</Text>}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  )
}
