import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { advogadosService } from '../../services/api'
import { styles } from '../common'

export default function PainelAdvogadoScreen() {
  const { usuario, logout } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState([])

  useEffect(() => {
    advogadosService.solicitacoes()
      .then(({ data }) => setSolicitacoes(data.solicitacoes || []))
      .catch(() => setSolicitacoes([]))
  }, [])

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Painel do advogado</Text>
      <Text style={styles.text}>{usuario?.nome}</Text>
      {solicitacoes.map((solicitacao) => (
        <View key={solicitacao.id} style={styles.card}>
          <Text>{solicitacao.desc}</Text>
          <Text style={styles.text}>{solicitacao.status}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.buttonDark} onPress={logout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  )
}
