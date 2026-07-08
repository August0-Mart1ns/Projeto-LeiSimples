import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
   },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ls_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ls_token')
      localStorage.removeItem('ls_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email, senha) =>
    api.post('/auth/login', { email, senha }),
  registrar: (dados) =>
    api.post('/auth/register', dados),
  perfil: () =>
    api.get('/auth/me'),
  atualizarPerfil: (dados) =>
    api.patch('/auth/me', dados),
  esqueciSenha: (email) =>
    api.post('/auth/forgot-password', { email }),
  redefinirSenha: (token, senha) =>
    api.patch('/auth/reset-password', { token, senha }),
}

export const casosService = {
  listar: () =>
    api.get('/casos'),
  criar: (dados) =>
    api.post('/casos', dados),
  buscar: (id) =>
    api.get(`/casos/${id}`),
  atualizar: (id, status) =>
    api.patch(`/casos/${id}/status`, { status }),
  encerrar: (id) =>
    api.delete(`/casos/${id}`),
  documentos: (id) =>
    api.get(`/casos/${id}/documentos`),
  enviarDocumento: (id, dados) =>
    api.post(`/casos/${id}/documentos`, dados),
  baixarDocumento: (id, documentoId) =>
    api.get(`/casos/${id}/documentos/${documentoId}`),
  excluirDocumento: (id, documentoId) =>
    api.delete(`/casos/${id}/documentos/${documentoId}`),
}

export const iaService = {
  analisar: (descricao, renda_aproximada, caso_id) =>
    api.post('/ia/analisar', { descricao, renda_aproximada, caso_id }),
  analisarContrato: (descricao, caso_id) =>
    api.post('/ia/analisar-contrato', { descricao, caso_id }),
  buscarAnalise: (caso_id) =>
    api.get(`/ia/casos/${caso_id}/analise`),
}

export const advogadosService = {
  listar: (filtros) =>
    api.get('/advogados', { params: filtros }),
  buscar: (id) =>
    api.get(`/advogados/${id}`),
  atualizarPerfil: (id, dados) =>
    api.patch(`/advogados/${id}`, dados),
  solicitacoes: () =>
    api.get('/advogados/solicitacoes'),
  avaliacoes: (id) =>
    api.get(`/advogados/${id}/avaliacoes`),
}

export const solicitacoesService = {
  listar: () =>
    api.get('/solicitacoes'),
  criar: (caso_id, advogado_id, mensagem) =>
    api.post(`/casos/${caso_id}/solicitar-atendimento`, { advogado_id, mensagem }),
  buscar: (id) =>
    api.get(`/solicitacoes/${id}`),
  eventos: (id) =>
    api.get(`/solicitacoes/${id}/eventos`),
  aceitar: (id) =>
    api.patch(`/solicitacoes/${id}/aceitar`),
  recusar: (id) =>
    api.patch(`/solicitacoes/${id}/recusar`),
}

export const avaliacoesService = {
  criar: (dados) =>
    api.post('/avaliacoes', dados),
  porAdvogado: (id) =>
    api.get(`/avaliacoes/advogado/${id}`),
}

export const artigosService = {
  listar: () =>
    api.get('/artigos'),
  buscar: (slug) =>
    api.get(`/artigos/${slug}`),
  porCategoria: (area) =>
    api.get(`/artigos/categoria/${area}`),
  criar: (dados) =>
    api.post('/artigos', dados),
  atualizar: (id, dados) =>
    api.patch(`/artigos/${id}`, dados),
}

export const adminService = {
  usuarios: () =>
    api.get('/admin/usuarios'),
  casos: () =>
    api.get('/admin/casos'),
  verificarAdvogado: (id, status, motivo) =>
    api.patch(`/admin/advogados/${id}/verificar`, { status, motivo }),
  metricas: () =>
    api.get('/admin/metricas'),
  removerCaso: (id, motivo) =>
    api.delete(`/admin/casos/${id}`, { data: { motivo } }),
}

export default api
