import { useLocation, useNavigate } from 'react-router-dom'
import { Check, FileText, Mail, Scale } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'

const passos = [
  { label: 'Solicitação enviada', desc: 'O advogado receberá o resumo do caso, a análise inicial e os pontos de atenção.' },
  { label: 'Análise do caso', desc: 'Com essas informações, o profissional avalia se consegue assumir o atendimento.' },
  { label: 'Primeiro contato', desc: 'Após aceitar, o advogado entra em contato pelos dados cadastrados.' },
  { label: 'Atendimento e avaliação', desc: 'Depois do atendimento você pode avaliar a experiência.' },
]

export default function Confirmacao() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const advogado = state?.advogado || {
    nome: 'Advogado parceiro',
    areas_atuacao: ['consumidor'],
    estado_oab: 'RS',
    numero_oab: '000000',
    avaliacao: 0,
  }

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="cidadao" />
      <main className="flex justify-center px-8 lg:px-[60px] py-12">
        <div className="max-w-[660px] w-full">
          <section className="card text-center mb-5">
            <div className="w-20 h-20 rounded-full bg-teal-pale border-4 border-teal/20 flex items-center justify-center mx-auto mb-6 text-teal">
              <Check size={34} />
            </div>
            <h1 className="font-fraunces text-[32px] font-normal text-navy mb-2">Solicitação enviada</h1>
            <p className="text-[15px] text-gray-400 leading-relaxed max-w-[420px] mx-auto mb-8">
              O advogado receberá o resumo do seu caso antes de decidir se aceita ou recusa o atendimento pela plataforma.
            </p>

            <div className="bg-cream rounded-xl p-5 flex gap-4 items-center mb-8 border border-cream-darker text-left">
              <div className="w-14 h-14 rounded-xl bg-teal-pale text-teal flex items-center justify-center flex-shrink-0">
                <Scale size={24} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-navy mb-0.5">{advogado.nome}</div>
                <div className="text-xs text-teal font-medium mb-0.5">
                  {Array.isArray(advogado.areas_atuacao) ? advogado.areas_atuacao.join(' · ') : advogado.areas_atuacao}
                </div>
                <div className="text-xs text-gray-400">OAB/{advogado.estado_oab} {advogado.numero_oab}</div>
              </div>
              <span className="badge-teal">Verificado</span>
            </div>

            <div className="text-left mb-8">
              <div className="section-label text-center">O que acontece agora</div>
              {passos.map((passo, index) => (
                <div key={passo.label} className="flex gap-4 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-teal-pale border-2 border-teal text-teal' : 'bg-cream-dark border-2 border-cream-darker text-gray-400'
                  }`}>
                    {index === 0 ? <Check size={14} /> : index + 1}
                  </div>
                  <div className="pb-5">
                    <div className="text-sm font-medium text-navy mb-0.5">{passo.label}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{passo.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/painel')} className="btn-primary flex-1 text-sm inline-flex items-center justify-center gap-2">
                <FileText size={16} /> Ver meus casos
              </button>
              <button onClick={() => navigate('/advogados')} className="btn-outline flex-1 text-sm inline-flex items-center justify-center gap-2">
                <Scale size={16} /> Ver advogados
              </button>
            </div>
          </section>

          <section className="card">
            <div className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
              <Mail size={16} className="text-teal" /> Enquanto aguarda
            </div>
            {[
              'Reúna contratos, extratos, mensagens e comprovantes relacionados ao caso.',
              'Confira se seus dados de telefone e cidade estão atualizados no perfil.',
              'Se houver urgência ou risco imediato, procure atendimento presencial adequado.',
            ].map((texto) => (
              <div key={texto} className="py-3 border-b border-cream-dark last:border-0 text-sm text-gray-500 leading-relaxed">
                {texto}
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
