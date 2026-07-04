const env = require('../config/env')

async function sendResendEmail({ to, subject, html }) {
  if (!env.resendApiKey) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to,
      subject,
      html,
    }),
  })

  return response.ok
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.appUrl}/redefinir-senhaatoken=${encodeURIComponent(token)}`
  const subject = 'Redefinicao de senha LeiSimples'
  const html = `
    <p>Recebemos uma solicitação para redefinir sua senha no LeiSimples.</p>
    <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a>.</p>
    <p>Este link expira em 30 minutos.</p>
    <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
  `

  try {
    const sent = await sendResendEmail({ to: email, subject, html })
    if (!sent && env.nodeEnv !== 'production') {
      console.log(`Link de reset para ${email}: ${resetUrl}`)
    }
    return sent
  } catch (error) {
    if (env.nodeEnv !== 'production') {
      console.log(`Falha ao enviar email de reset para ${email}: ${error.message}`)
      console.log(`Link de reset para ${email}: ${resetUrl}`)
    }
    return false
  }
}

async function sendSolicitationStatusEmail({ to, status, advogadoNome }) {
  const painelUrl = `${env.appUrl}/painel`
  const statusLabel = status === 'aceita' ? 'aceitou' : 'recusou'
  const subject = `Atualização da sua solicitação LeiSimples`
  const html = `
    <p>O advogado ${advogadoNome || 'selecionado'} ${statusLabel} sua solicitação de atendimento.</p>
    <p>Acesse seu painel para acompanhar o caso:</p>
    <p><a href="${painelUrl}">Abrir painel LeiSimples</a></p>
  `

  try {
    const sent = await sendResendEmail({ to, subject, html })
    if (!sent && env.nodeEnv !== 'production') {
      console.log(`Notificação de solicitação para ${to}: ${status}`)
    }
    return sent
  } catch (error) {
    if (env.nodeEnv !== 'production') {
      console.log(`Falha ao enviar notificação de solicitação para ${to}: ${error.message}`)
    }
    return false
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendSolicitationStatusEmail,
}
