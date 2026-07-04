import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { styles } from '../common'

export default function PainelAdminScreen() {
  const { logout } = useAuth()

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Painel admin</Text>
      <Text style={styles.text}>Metricas e verificacoes ficam disponiveis pela API administrativa.</Text>
      <TouchableOpacity style={styles.buttonDark} onPress={logout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  )
}
