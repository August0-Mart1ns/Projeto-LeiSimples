import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Handshake,
  MessageCircle,
  PhoneCall,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import Topbar from '@/components/layout/Topbar'

const exemplos = [
  'Cobrança indevida',
  'Problema com banco',
  'Demissão ou salário',
  'Aluguel e contrato',
  'Produto com defeito',
  'Direitos do idoso',
]

const passos = [
  {
    icon: MessageCircle,
    titulo: 'Conte com calma',
    desc: 'A pessoa escreve do jeito dela, sem precisar conhecer leis ou palavras difíceis.',
  },
  {
    icon: ClipboardList,
    titulo: 'Receba um resumo',
    desc: 'O sistema organiza a área provável, próximos passos e documentos importantes.',
  },
  {
    icon: Handshake,
    titulo: 'Procure ajuda',
    desc: 'Com o caso organizado, fica mais fácil pedir atendimento jurídico.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream">
      <Topbar tipo="publico" />

      <section className="relative overflow-hidden bg-navy px-6 lg:px-[60px] pt-12 pb-10 lg:pt-16 lg:pb-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(26, 138, 114, 0.22) 0%, transparent 70%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-light/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-teal-light bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm mb-7">
              <ShieldCheck size={16} />
              Orientação inicial, simples e segura
            </div>

            <h1 className="font-fraunces text-[42px] md:text-[58px] lg:text-[68px] leading-[1.02] font-light text-white max-w-[760px] mb-6">
              Entenda seu problema jurídico sem complicação.
            </h1>

            <p className="text-white/65 text-[18px] leading-relaxed max-w-[600px] mb-8">
              O LeiSimples ajuda você a organizar o que aconteceu, separar documentos e encontrar o próximo passo com mais clareza.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-light text-navy font-semibold text-[16px] px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-95"
              >
                Começar minha triagem <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/artigos')}
                className="border border-white/20 text-white font-semibold text-[16px] px-8 py-4 rounded-xl hover:bg-white/10"
              >
                Ver orientações
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-5 shadow-2xl">
            <div className="bg-cream rounded-[22px] p-5 border border-cream-darker">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-teal text-white flex items-center justify-center">
                  <Scale size={22} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Exemplo de triagem</p>
                  <h2 className="text-[17px] font-semibold text-navy">Cobrança que não reconheço</h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ['Área provável', 'Direito do consumidor ou bancário'],
                  ['Separar documentos', 'Extratos, contrato, prints e protocolos'],
                  ['Próximo passo', 'Organizar o caso antes do atendimento'],
                ].map(([titulo, texto]) => (
                  <div key={titulo} className="bg-white rounded-2xl border border-cream-darker p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-teal shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-navy">{titulo}</div>
                        <div className="text-sm text-gray-500 leading-relaxed mt-0.5">{texto}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-navy rounded-2xl p-4 flex gap-3 items-start">
                <PhoneCall size={20} className="text-teal-light shrink-0 mt-0.5" />
                <p className="text-white/70 text-sm leading-relaxed">
                  A triagem não substitui advogado. Ela ajuda você a chegar mais preparado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 lg:px-[60px] py-6 border-b border-cream-darker">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            'Feito para linguagem simples',
            'Casos e documentos organizados',
            'Advogados verificados na plataforma',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold text-navy">
              <BadgeCheck size={18} className="text-teal" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream px-6 lg:px-[60px] py-14">
        <div className="max-w-[1180px] mx-auto">
          <div className="max-w-[620px] mb-8">
            <div className="section-label">Como funciona</div>
            <h2 className="font-fraunces text-[34px] md:text-[42px] font-normal text-navy mb-3">
              Poucos passos, sem juridiquês
            </h2>
            <p className="text-[16px] text-gray-500 leading-relaxed">
              A experiência foi pensada para quem não sabe por onde começar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {passos.map((item, index) => (
              <div key={item.titulo} className="bg-white rounded-2xl border border-cream-darker p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-teal-pale text-teal flex items-center justify-center">
                    <item.icon size={23} />
                  </div>
                  <span className="text-sm font-semibold text-gold">{index + 1}</span>
                </div>
                <h3 className="text-[18px] font-semibold text-navy mb-2">{item.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 lg:px-[60px] py-14">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[390px_1fr] gap-9 items-start">
          <div>
            <div className="section-label">Quando usar</div>
            <h2 className="font-fraunces text-[34px] md:text-[42px] font-normal text-navy mb-3">
              Para dúvidas comuns do dia a dia
            </h2>
            <p className="text-[16px] text-gray-500 leading-relaxed">
              Se a pessoa está insegura, a plataforma ajuda a transformar a dúvida em um caso mais claro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exemplos.map((exemplo) => (
              <button
                key={exemplo}
                onClick={() => navigate('/login')}
                className="bg-cream rounded-2xl border border-cream-darker px-5 py-4 text-left hover:bg-teal-pale hover:border-teal/40 transition-colors"
              >
                <span className="text-[16px] font-semibold text-navy">{exemplo}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy px-6 lg:px-[60px] py-12">
        <div className="max-w-[1180px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-teal-light text-sm font-semibold mb-3">
              <FileText size={18} />
              Um primeiro passo mais claro
            </div>
            <h2 className="font-fraunces text-[32px] md:text-[44px] text-white font-light leading-tight max-w-[720px]">
              Organize seu problema antes de procurar atendimento.
            </h2>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-navy font-semibold text-[16px] px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-95"
          >
            Fazer triagem agora <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  )
}
