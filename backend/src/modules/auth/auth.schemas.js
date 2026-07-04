const { z } = require('zod')

const registerBody = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  tipo: z.enum(['cidadao', 'advogado']),
  telefone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  numero_oab: z.string().optional().nullable(),
  estado_oab: z.string().length(2).optional().nullable(),
  areas_atuacao: z.array(z.string()).optional()
})

const loginBody = z.object({
  email: z.string().email(),
  senha: z.string().min(1)
})

const forgotPasswordBody = z.object({
  email: z.string().email()
})

const resetPasswordBody = z.object({
  token: z.string().min(10),
  senha: z.string().min(6)
})

const updateProfileBody = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  renda_aproximada: z.string().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  areas_atuacao: z.array(z.string()).optional(),
  uf: z.string().length(2).optional().nullable()
})

module.exports = {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody,
  updateProfileBody
}
