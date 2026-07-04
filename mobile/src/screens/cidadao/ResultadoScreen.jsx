import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { styles } from '../common'

export default function ResultadoScreen({ route, navigation }) {
  const analise = route.params?.analise || {}
  const caso = route.params?.caso

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Análise concluída</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Area identificada</Text>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>{analise.area_descricao || analise.area_direito}</Text>
      </View>
      <View style={styles.card}>
        <Text>{analise.resumo}</Text>
      </View>
      {(analise.proximos_passos || []).map((passo, index) => (
        <View key={passo} style={styles.card}>
          <Text>{index + 1}. {passo}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Advogados', { caso })}>
        <Text style={styles.buttonText}>Ver advogados</Text>
      </TouchableOpacity>
    </View>
  )
}
