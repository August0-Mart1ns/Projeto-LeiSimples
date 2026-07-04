import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('ls_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authService = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  registrar: (dados) => api.post('/auth/register', dados),
  perfil: () => api.get('/auth/me')
}

export const casosService = {
  listar: () => api.get('/casos'),
  criar: (dados) => api.post('/casos', dados),
  buscar: (id) => api.get(`/casos/${id}`),
  atualizar: (id, status) => api.patch(`/casos/${id}/status`, { status }),
  documentos: (id) => api.get(`/casos/${id}/documentos`),
  enviarDocumento: (id, dados) => api.post(`/casos/${id}/documentos`, dados),
  excluirDocumento: (id, documentoId) => api.delete(`/casos/${id}/documentos/${documentoId}`)
}

export const iaService = {
  analisar: (descricao, renda_aproximada) =>
    api.post('/ia/analisar', { descricao, renda_aproximada }),
  analisarContrato: (descricao) =>
    api.post('/ia/analisar-contrato', { descricao })
}

export const advogadosService = {
  listar: (filtros) => api.get('/advogados', { params: filtros }),
  solicitacoes: () => api.get('/advogados/solicitacoes')
}

export const solicitacoesService = {
  listar: () => api.get('/solicitacoes'),
  criar: (casoId, advogadoId, mensagem) =>
    api.post(`/casos/${casoId}/solicitar-atendimento`, { advogado_id: advogadoId, mensagem }),
  eventos: (id) => api.get(`/solicitacoes/${id}/eventos`),
  aceitar: (id) => api.patch(`/solicitacoes/${id}/aceitar`),
  recusar: (id) => api.patch(`/solicitacoes/${id}/recusar`)
}

export default api
