import React, { useEffect, useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { casosService, solicitacoesService } from '../../services/api'
import { styles } from '../common'

const TAMANHO_MAX_DOCUMENTO = 5 * 1024 * 1024

function formatarTamanho(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function inferirMimeType(arquivo) {
  const nome = (arquivo?.name || '').toLowerCase()
  if (arquivo?.mimeType) return arquivo.mimeType
  if (nome.endsWith('.pdf')) return 'application/pdf'
  if (nome.endsWith('.png')) return 'image/png'
  if (nome.endsWith('.jpg') || nome.endsWith('.jpeg')) return 'image/jpeg'
  if (nome.endsWith('.webp')) return 'image/webp'
  if (nome.endsWith('.txt')) return 'text/plain'
  if (nome.endsWith('.doc')) return 'application/msword'
  if (nome.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/octet-stream'
}

export default function PainelScreen({ navigation }) {
  const { usuario, logout } = useAuth()
  const [casos, setCasos] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [documentoCasoId, setDocumentoCasoId] = useState('')
  const [documentos, setDocumentos] = useState([])
  const [arquivo, setArquivo] = useState(null)
  const [documentosMensagem, setDocumentosMensagem] = useState('')
  const [timelineId, setTimelineId] = useState(null)
  const [eventos, setEventos] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(false)

  useEffect(() => {
    async function carregar() {
      const [casosResponse, solicitacoesResponse] = await Promise.allSettled([
        casosService.listar(),
        solicitacoesService.listar()
      ])

      if (casosResponse.status === 'fulfilled') setCasos(casosResponse.value.data.casos || [])
      if (solicitacoesResponse.status === 'fulfilled') {
        setSolicitacoes(solicitacoesResponse.value.data.solicitacoes || [])
      }
    }

    carregar()
  }, [])

  useEffect(() => {
    if (!documentoCasoId && casos.length > 0) {
      setDocumentoCasoId(casos[0].id)
    }
  }, [casos, documentoCasoId])

  useEffect(() => {
    async function carregarDocumentos() {
      if (!documentoCasoId) {
        setDocumentos([])
        return
      }

      setCarregandoDocumentos(true)
      setDocumentosMensagem('')
      try {
        const { data } = await casosService.documentos(documentoCasoId)
        setDocumentos(data.documentos || [])
      } catch {
        setDocumentos([])
        setDocumentosMensagem('Não foi possível carregar os documentos.')
      } finally {
        setCarregandoDocumentos(false)
      }
    }

    carregarDocumentos()
  }, [documentoCasoId])

  async function selecionarDocumento() {
    setDocumentosMensagem('')
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false
      })

      if (resultado.canceled) return

      const arquivoSelecionado = resultado.assets?.[0]
      if (!arquivoSelecionado) return

      if ((arquivoSelecionado.size || 0) > TAMANHO_MAX_DOCUMENTO) {
        setDocumentosMensagem('O documento precisa ter no maximo 5 MB.')
        return
      }

      setArquivo(arquivoSelecionado)
    } catch {
      setDocumentosMensagem('Não foi possível selecionar o documento.')
    }
  }

  async function enviarDocumento() {
    if (!documentoCasoId || !arquivo) {
      setDocumentosMensagem('Selecione um caso e um documento.')
      return
    }

    const tipoMime = inferirMimeType(arquivo)
    if (tipoMime === 'application/octet-stream') {
      setDocumentosMensagem('Tipo de arquivo não suportado.')
      return
    }

    setCarregandoDocumentos(true)
    setDocumentosMensagem('')
    try {
      const conteudoBase64 = await FileSystem.readAsStringAsync(arquivo.uri, {
        encoding: FileSystem.EncodingType.Base64
      })

      await casosService.enviarDocumento(documentoCasoId, {
        nome: arquivo.name || 'documento',
        tipo_mime: tipoMime,
        tamanho_bytes: arquivo.size || 1,
        conteudo_base64: conteudoBase64,
        observacao: 'Enviado pelo app mobile'
      })

      setArquivo(null)
      setDocumentosMensagem('Documento anexado ao caso.')
      const { data } = await casosService.documentos(documentoCasoId)
      setDocumentos(data.documentos || [])
    } catch {
      setDocumentosMensagem('Não foi possível anexar o documento.')
    } finally {
      setCarregandoDocumentos(false)
    }
  }

  async function excluirDocumento(documentoId) {
    setCarregandoDocumentos(true)
    setDocumentosMensagem('')
    try {
      await casosService.excluirDocumento(documentoCasoId, documentoId)
      const { data } = await casosService.documentos(documentoCasoId)
      setDocumentos(data.documentos || [])
      setDocumentosMensagem('Documento removido.')
    } catch {
      setDocumentosMensagem('Não foi possível remover o documento.')
    } finally {
      setCarregandoDocumentos(false)
    }
  }

  async function abrirTimeline(solicitacao) {
    if (timelineId === solicitacao.id) {
      setTimelineId(null)
      setEventos([])
      return
    }

    setTimelineId(solicitacao.id)
    setMensagem('')
    try {
      const { data } = await solicitacoesService.eventos(solicitacao.id)
      setEventos(data.eventos || [])
    } catch {
      setEventos([])
      setMensagem('Não foi possível carregar o andamento.')
    }
  }

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.title}>Olá, {usuario?.nome}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Analise')}>
        <Text style={styles.buttonText}>Descrever novo problema</Text>
      </TouchableOpacity>
      <Text style={[styles.text, { marginVertical: 16 }]}>Casos recentes</Text>
      {casos.length === 0 ? (
        <Text style={styles.text}>Nenhum caso encontrado.</Text>
      ) : (
        casos.map((caso) => (
          <View key={caso.id} style={styles.card}>
            <Text>{caso.descricao_problema || caso.descricao}</Text>
            <Text style={styles.text}>{caso.status}</Text>
          </View>
        ))
      )}

      <Text style={[styles.text, { marginVertical: 16 }]}>Documentos</Text>
      {!!documentosMensagem && <Text style={styles.error}>{documentosMensagem}</Text>}
      {casos.length === 0 ? (
        <Text style={styles.text}>Crie um caso para anexar documentos.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Caso selecionado</Text>
          <View style={{ marginBottom: 12 }}>
            {casos.map((caso) => (
              <TouchableOpacity
                key={caso.id}
                style={[
                  styles.buttonDark,
                  {
                    backgroundColor: documentoCasoId === caso.id ? '#24334B' : '#E8F2F1',
                    marginBottom: 8
                  }
                ]}
                onPress={() => setDocumentoCasoId(caso.id)}
              >
                <Text style={[styles.buttonText, { color: documentoCasoId === caso.id ? '#FFF' : '#24334B' }]}>
                  {(caso.titulo || caso.descricao_problema || caso.descricao || 'Caso').slice(0, 60)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={selecionarDocumento}>
            <Text style={styles.buttonText}>{arquivo ? 'Trocar documento' : 'Selecionar documento'}</Text>
          </TouchableOpacity>

          {!!arquivo && (
            <Text style={[styles.text, { marginTop: 10 }]}>
              {arquivo.name || 'Documento selecionado'} - {formatarTamanho(arquivo.size || 0)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.buttonDark, { marginTop: 12, opacity: carregandoDocumentos ? 0.75 : 1 }]}
            onPress={enviarDocumento}
            disabled={carregandoDocumentos}
          >
            <Text style={styles.buttonText}>Anexar documento</Text>
          </TouchableOpacity>

          {documentos.length > 0 && (
            <View style={{ marginTop: 14 }}>
              {documentos.map((documento) => (
                <View key={documento.id} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: '700' }}>{documento.nome}</Text>
                  <Text style={styles.text}>{formatarTamanho(documento.tamanho_bytes)}</Text>
                  <TouchableOpacity
                    style={[styles.buttonDark, { marginTop: 8, backgroundColor: '#B23A48' }]}
                    onPress={() => excluirDocumento(documento.id)}
                  >
                    <Text style={styles.buttonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {carregandoDocumentos && <Text style={[styles.text, { marginTop: 12 }]}>Carregando...</Text>}
          {documentos.length === 0 && !carregandoDocumentos && (
            <Text style={[styles.text, { marginTop: 12 }]}>Nenhum documento anexado neste caso.</Text>
          )}
        </View>
      )}

      <Text style={[styles.text, { marginVertical: 16 }]}>Atendimentos</Text>
      {!!mensagem && <Text style={styles.error}>{mensagem}</Text>}
      {solicitacoes.length === 0 ? (
        <Text style={styles.text}>Nenhuma solicitação enviada ainda.</Text>
      ) : (
        solicitacoes.map((solicitacao) => (
          <View key={solicitacao.id} style={styles.card}>
            <Text style={{ fontWeight: '700' }}>
              {solicitacao.advogado?.nome || 'Advogado parceiro'}
            </Text>
            <Text style={styles.text}>{solicitacao.status}</Text>
            <Text style={styles.text}>{(solicitacao.caso?.descricao || 'Caso').slice(0, 90)}</Text>
            <TouchableOpacity style={[styles.buttonDark, { marginTop: 12 }]} onPress={() => abrirTimeline(solicitacao)}>
              <Text style={styles.buttonText}>Ver andamento</Text>
            </TouchableOpacity>
            {timelineId === solicitacao.id && eventos.map((evento) => (
              <View key={evento.id} style={{ marginTop: 10 }}>
                <Text>{evento.descricao}</Text>
                <Text style={styles.text}>{new Date(evento.criado_em).toLocaleString('pt-BR')}</Text>
              </View>
            ))}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.buttonDark} onPress={logout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
