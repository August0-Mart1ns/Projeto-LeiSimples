import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { advogadosService } from '../../services/api'
import { solicitacoesService } from '../../services/api'
import { styles } from '../common'

export default function AdvogadosScreen({ route }) {
  const caso = route.params?.caso
  const [advogados, setAdvogados] = useState([])
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    advogadosService.listar()
      .then(({ data }) => setAdvogados(data.advogados || []))
      .catch(() => setAdvogados([]))
  }, [])

  async function solicitar(advogadoId) {
    if (!caso?.id) {
      setMensagem('Abra esta tela a partir de uma análise para solicitar atendimento.')
      return
    }

    setMensagem('')
    try {
      await solicitacoesService.criar(caso.id, advogadoId)
      setMensagem('Solicitação enviada ao advogado.')
    } catch {
      setMensagem('Não foi possível enviar a solicitação.')
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Advogados parceiros</Text>
      {!!mensagem && <Text style={styles.text}>{mensagem}</Text>}
      {advogados.map((advogado) => (
        <View key={advogado.id} style={styles.card}>
          <Text style={{ fontWeight: '700' }}>{advogado.nome}</Text>
          <Text style={styles.text}>OAB/{advogado.estado_oab} {advogado.numero_oab}</Text>
          <Text style={styles.text}>{(advogado.areas_atuacao || []).join(', ')}</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={() => solicitar(advogado.id)}>
            <Text style={styles.buttonText}>Solicitar atendimento</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}
