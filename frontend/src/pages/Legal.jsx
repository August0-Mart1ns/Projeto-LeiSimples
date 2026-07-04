import Topbar from '@/components/layout/Topbar'

const conteudos = {
  termos: {
    titulo: 'Termos de Uso',
    linhas: [
      'O LeiSimples oferece triagem jurídica inicial e ferramentas de organização de informações.',
      'A plataforma não garante resultado jurídico, não substitui consulta com advogado e não cria relação advogado-cliente automaticamente.',
      'Ao solicitar atendimento, o usuário autoriza o compartilhamento dos dados essenciais do caso com o profissional escolhido.',
      'Usuários devem fornecer informações verdadeiras e não devem usar a plataforma para fins ilícitos ou abusivos.',
    ],
  },
  privacidade: {
    titulo: 'Política de Privacidade',
    linhas: [
      'Coletamos dados necessários para cadastro, autenticação, análise do caso e solicitação de atendimento.',
      'Informações jurídicas podem ser sensíveis. Por isso, devem ser tratadas com finalidade clara, acesso restrito e segurança adequada.',
      'Dados podem ser compartilhados com advogados verificados quando o usuário solicitar atendimento.',
      'O usuário pode solicitar revisão, atualização ou exclusão de dados conforme a legislação aplicável.',
    ],
  },
  'aviso-ia': {
    titulo: 'Aviso Sobre Uso de IA',
    linhas: [
      'A análise por IA é uma triagem inicial e pode conter limitações, imprecisões ou depender de informações incompletas.',
      'A resposta não substitui orientação profissional, decisão judicial, atendimento da Defensoria Pública ou consulta com advogado.',
      'Evite inserir dados de terceiros que não sejam necessários para compreender o problema.',
      'Sempre revise a análise e reúna documentos antes de tomar decisões importantes.',
    ],
  },
}

export default function Legal({ tipo = 'termos' }) {
  const conteudo = conteudos[tipo] || conteudos.termos

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />
      <main className="max-w-[760px] mx-auto px-8 py-12">
        <article className="card">
          <h1 className="font-fraunces text-[32px] font-normal text-navy mb-3">{conteudo.titulo}</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Texto-base para desenvolvimento. Antes de produção, este conteúdo deve ser revisado por profissional jurídico.
          </p>
          <div className="space-y-4">
            {conteudo.linhas.map((linha) => (
              <p key={linha} className="text-sm text-gray-500 leading-relaxed">{linha}</p>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
