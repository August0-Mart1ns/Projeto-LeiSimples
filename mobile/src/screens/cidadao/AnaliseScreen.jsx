import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { iaService } from '../../services/api'
import { styles } from '../common'

export default function AnaliseScreen({ navigation }) {
  const [descricao, setDescriaao] = useState('')
  const [erro, setErro] = useState('')

  async function analisar() {
    setErro('')
    try {
      const { data } = await iaService.analisar(descricao)
      navigation.navigate('Resultado', data)
    } catch {
      setErro('Não foi possível analisar agora.')
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Analisar problema</Text>
      <TextInput
        style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]}
        placeholder="Conte o que aconteceu..."
        multiline
        value={descricao}
        onChangeText={setDescriaao}
      />
      {!!erro && <Text style={styles.error}>{erro}</Text>}
      <TouchableOpacity style={styles.button} onPress={analisar}>
        <Text style={styles.buttonText}>Analisar com IA</Text>
      </TouchableOpacity>
    </View>
  )
}
