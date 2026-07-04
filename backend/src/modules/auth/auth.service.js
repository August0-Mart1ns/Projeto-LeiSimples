const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
const jwt = require('jsonwebtoken')

const env = require('../../config/env')
const { query, transaction } = require('../../config/db')
const { sendPasswordResetEmail } = require('../../services/email.service')
const ApiError = require('../../utils/ApiError')

function mapUsuario(row) {
  if (!row) return null
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    tipo: row.tipo,
    telefone: row.telefone,
    cpf: row.cpf,
    renda_aproximada: row.renda_aproximada,
    cidade: row.cidade,
    criado_em: row.criado_em,
    advogado: row.numero_oab
      ? {
          id: row.id,
          numero_oab: row.numero_oab,
          estado_oab: row.estado_oab,
          areas_atuacao: row.areas_atuacao || [],
          bio: row.bio,
          verificado: row.verificado,
          status_verificacao: row.status_verificacao
        }
      : undefined
  }
}

function createToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, tipo: usuario.tipo },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  )
}

async function getUsuarioById(id) {
  const { rows } = await query(
    `SELECT u.id, u.nome, u.email, u.tipo, u.telefone, u.cidade, u.criado_em,
            c.cpf, c.renda_aproximada,
            a.numero_oab, a.estado_oab, a.areas_atuacao,
            a.bio, a.verificado, a.status_verificacao
     FROM usuarios u
     LEFT JOIN cidadaos c ON c.id = u.id
     LEFT JOIN advogados a ON a.id = u.id
     WHERE u.id = $1`,
    [id]
  )

  return mapUsuario(rows[0])
}

async function register(payload) {
  const email = payload.email.toLowerCase().trim()

  if (payload.tipo === 'advogado' && (!payload.numero_oab || !payload.estado_oab)) {
    throw new ApiError(400, 'OAB e estado da OAB sao obrigatorios para advogados.')
  }

  const existing = await query('SELECT id FROM usuarios WHERE email = $1', [email])
  if (existing.rowCount > 0) throw new ApiError(409, 'Email ja cadastrado.')

  const senhaHash = await bcrypt.hash(payload.senha, 10)

  const usuario = await transaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cidade)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, tipo, telefone, cidade, criado_em`,
      [
        payload.nome,
        email,
        senhaHash,
        payload.tipo,
        payload.telefone || null,
        payload.cidade || null
      ]
    )

    const row = inserted.rows[0]

    if (payload.tipo === 'advogado') {
      await client.query(
        `INSERT INTO advogados
           (id, numero_oab, estado_oab, areas_atuacao, telefone, cidade)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          row.id,
          payload.numero_oab,
          payload.estado_oab.toUpperCase(),
          payload.areas_atuacao || [],
          payload.telefone || null,
          payload.cidade || null
        ]
      )
    } else {
      await client.query(
        `INSERT INTO cidadaos (id, cpf, renda_aproximada)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, payload.cpf || null, null]
      )
    }

    return row
  })

  const usuarioCompleto = await getUsuarioById(usuario.id)
  return {
    usuario: usuarioCompleto,
    token: createToken(usuarioCompleto)
  }
}

async function login(emailInput, senha) {
  const email = emailInput.toLowerCase().trim()
  const { rows } = await query(
    'SELECT id, senha_hash FROM usuarios WHERE email = $1',
    [email]
  )

  const row = rows[0]
  if (!row) throw new ApiError(401, 'Email ou senha invalidos.')

  const passwordOk = await bcrypt.compare(senha, row.senha_hash)
  if (!passwordOk) throw new ApiError(401, 'Email ou senha invalidos.')

  const usuario = await getUsuarioById(row.id)
  return {
    usuario,
    token: createToken(usuario)
  }
}

async function forgotPassword(emailInput) {
  const email = emailInput.toLowerCase().trim()
  const resetToken = randomUUID()

  const result = await query(
    `UPDATE usuarios
     SET reset_token = $1,
         reset_token_expira_em = NOW() + INTERVAL '30 minutes',
         atualizado_em = NOW()
     WHERE email = $2`,
    [resetToken, email]
  )

  if (result.rowCount > 0) {
    await sendPasswordResetEmail(email, resetToken)
  }

  return {
    mensagem: 'Se o e-mail existir, enviaremos instruções de recuperação.',
    resetToken: env.nodeEnv === 'production' ? undefined : resetToken
  }
}

async function resetPassword(token, senha) {
  const senhaHash = await bcrypt.hash(senha, 10)
  const { rows } = await query(
    `UPDATE usuarios
     SET senha_hash = $1, reset_token = NULL, reset_token_expira_em = NULL, atualizado_em = NOW()
     WHERE reset_token = $2 AND reset_token_expira_em > NOW()
     RETURNING id`,
    [senhaHash, token]
  )

  if (!rows[0]) throw new ApiError(400, 'Token invalido ou expirado.')

  return { mensagem: 'Senha redefinida com sucesso.' }
}

async function updateProfile(user, payload) {
  await transaction(async (client) => {
    if (payload.nome !== undefined || payload.telefone !== undefined || payload.cidade !== undefined) {
      await client.query(
        `UPDATE usuarios
         SET nome = COALESCE($1, nome),
             telefone = COALESCE($2, telefone),
             cidade = COALESCE($3, cidade),
             atualizado_em = NOW()
         WHERE id = $4`,
        [
          payload.nome ?? null,
          payload.telefone ?? null,
          payload.cidade ?? null,
          user.id
        ]
      )
    }

    if (user.tipo === 'cidadao') {
      await client.query(
        `INSERT INTO cidadaos (id, cpf, renda_aproximada)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE
           SET cpf = COALESCE(EXCLUDED.cpf, cidadaos.cpf),
               renda_aproximada = COALESCE(EXCLUDED.renda_aproximada, cidadaos.renda_aproximada)`,
        [
          user.id,
          payload.cpf ?? null,
          payload.renda_aproximada ?? null
        ]
      )
    }

    if (user.tipo === 'advogado') {
      await client.query(
        `UPDATE advogados
         SET bio = COALESCE($1, bio),
             telefone = COALESCE($2, telefone),
             cidade = COALESCE($3, cidade),
             uf = COALESCE(UPPER($4), uf),
             areas_atuacao = COALESCE($5, areas_atuacao)
         WHERE id = $6`,
        [
          payload.bio ?? null,
          payload.telefone ?? null,
          payload.cidade ?? null,
          payload.uf ?? null,
          payload.areas_atuacao || null,
          user.id
        ]
      )
    }
  })

  return getUsuarioById(user.id)
}

module.exports = {
  register,
  login,
  getUsuarioById,
  forgotPassword,
  resetPassword,
  updateProfile
}
