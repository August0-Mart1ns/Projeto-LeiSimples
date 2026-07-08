import React, { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { advogadosService, solicitacoesService } from '../../services/api'
import { colors } from '../../theme'
import { styles } from '../common'

const statusLabels = {
  pendente: 'Pendente',
  aceita: 'Aceita',
  recusada: 'Recusada',
  cancelada: 'Cancelada'
}

function listPreview(items = [], limit = 2) {
  return items.filter(Boolean).slice(0, limit)
}

function mergeSolicitacaoAtualizada(original, atualizada) {
  return Object.entries(atualizada || {}).reduce((merged, [key, value]) => {
    if (value !== undefined) merged[key] = value
    return merged
  }, { ...original })
}

function isSolicitacaoVisivelNaBoard(solicitacao) {
  return !['recusada', 'cancelada'].includes(solicitacao.status)
}

export default function PainelAdvogadoScreen() {
  const { usuario, logout } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState([])
  const [erro, setErro] = useState('')

  async function carregarSolicitacoes() {
    try {
      const { data } = await advogadosService.solicitacoes()
      setSolicitacoes(data.solicitacoes || [])
    } catch {
      setSolicitacoes([])
      setErro('Não foi possível carregar as solicitações.')
    }
  }

  useEffect(() => {
    carregarSolicitacoes()
  }, [])

  async function alterarStatus(id, acao) {
    try {
      const request = acao === 'aceita'
        ? solicitacoesService.aceitar(id)
        : solicitacoesService.recusar(id)
      const { data } = await request
      setSolicitacoes((prev) =>
        acao === 'recusada'
          ? prev.filter((item) => item.id !== id)
          : prev.map((item) => item.id === id ? mergeSolicitacaoAtualizada(item, data.solicitacao) : item)
      )
    } catch {
      setErro('Não foi possível atualizar a solicitação.')
    }
  }

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.title}>Painel do advogado</Text>
      <Text style={styles.text}>{usuario?.nome}</Text>
      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      {solicitacoes.filter(isSolicitacaoVisivelNaBoard).map((solicitacao) => {
        const analise = solicitacao.analise
        const pontos = listPreview(analise?.direitos)
        const passos = listPreview(analise?.proximos_passos)

        return (
          <View key={solicitacao.id} style={styles.card}>
            <Text style={{ color: colors.navy, fontWeight: '700', fontSize: 16 }}>
              {solicitacao.cidadao || 'Cidadão'}
            </Text>
            <Text style={[styles.text, { marginTop: 4 }]}>
              Status: {statusLabels[solicitacao.status] || solicitacao.status}
            </Text>
            <Text style={{ color: colors.navy, fontWeight: '700', marginTop: 14 }}>
              Resumo do problema
            </Text>
            <Text style={styles.text}>{solicitacao.desc || solicitacao.caso?.descricao || 'Descrição não informada.'}</Text>

            {analise ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ color: colors.navy, fontWeight: '700' }}>Análise inicial</Text>
                <Text style={styles.text}>{analise.resumo || analise.orientacao || 'Análise vinculada ao caso.'}</Text>

                <Text style={{ color: colors.navy, fontWeight: '700', marginTop: 10 }}>Pontos de atenção</Text>
                {pontos.length === 0 ? (
                  <Text style={styles.text}>Sem pontos específicos registrados.</Text>
                ) : (
                  pontos.map((item) => <Text key={item} style={styles.text}>• {item}</Text>)
                )}

                <Text style={{ color: colors.navy, fontWeight: '700', marginTop: 10 }}>Próximos passos</Text>
                {passos.length === 0 ? (
                  <Text style={styles.text}>Orientar o cidadão a separar documentos e explicar a linha do tempo.</Text>
                ) : (
                  passos.map((item) => <Text key={item} style={styles.text}>• {item}</Text>)
                )}
              </View>
            ) : (
              <Text style={[styles.text, { marginTop: 12 }]}>
                Este caso ainda não possui análise de IA vinculada.
              </Text>
            )}

            {solicitacao.status === 'pendente' && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => alterarStatus(solicitacao.id, 'aceita')}>
                  <Text style={styles.buttonText}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buttonDark, { flex: 1, marginTop: 4 }]} onPress={() => alterarStatus(solicitacao.id, 'recusada')}>
                  <Text style={styles.buttonText}>Recusar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )
      })}

      <TouchableOpacity style={styles.buttonDark} onPress={logout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
