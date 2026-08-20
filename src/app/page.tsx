import Link from "next/link";
import {
  HeartHandshake,
  Sparkles,
  FileText,
  CheckCircle2,
  CalendarCheck,
  Lock,
  ArrowRight,
  Brain,
  MessageCircleHeart,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      {/* BRAND TOP BAR (SEM BOTÃO DE PAINEL) */}
      <div className="pt-8 sm:pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-3.5 px-5 py-2 rounded-full bg-white/70 border border-[#f3e4e0] shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shadow-sm shadow-[#5d0c1d]/20">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5d0c1d] block">
              Psicóloga & Psicanalista
            </span>
            <span className="font-serif text-lg sm:text-xl font-bold text-[#5d0c1d] block leading-none">
              Joane Silva
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
          {/* Subtle background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-[#f8dad2]/70 via-[#fdece8]/50 to-[#edf8fe]/40 rounded-full blur-3xl opacity-70 -z-10 pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* TAG PILL */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#f8dad2] text-[#5d0c1d] text-xs font-semibold uppercase tracking-[1px] mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#5d0c1d]" />
              <span>Psicologia & Psicanálise Clínica</span>
            </div>

            {/* MAIN TITLE */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#5d0c1d] tracking-tight leading-[1.18] mb-6">
              Pronto para Cuidar da Sua{" "}
              <span className="italic font-normal underline decoration-[#ccb38d] decoration-wavy decoration-1 underline-offset-8">
                Saúde Emocional?
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#6f5f62] leading-relaxed mb-10">
              Um espaço de acolhimento ético, escuta cuidadosa e investigação psicanalítica para você compreender seus sentimentos, ressignificar conflitos e construir novos caminhos.
            </p>

            {/* CTA PRINCIPAL (SEM O BOTÃO DO PAINEL) */}
            <div className="flex items-center justify-center">
              <Link
                href="/preencher-anamnese"
                className="inline-flex items-center justify-center gap-3 px-10 py-4.5 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-base sm:text-lg font-semibold shadow-xl shadow-[#5d0c1d]/25 transition transform active:scale-98"
              >
                <FileText className="w-5 h-5" />
                <span>Preencher Ficha de Anamnese</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* TRUST BADGES */}
            <div className="mt-16 pt-8 border-t border-[#f0ded8] grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3.5 p-5 rounded-3xl bg-white/80 border border-[#f3e4e0] shadow-xs">
                <div className="p-3 rounded-full bg-[#f8dad2] text-[#5d0c1d]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#5d0c1d]">100% Confidencial</h4>
                  <p className="text-xs text-[#6f5f62] mt-0.5">Total sigilo ético e proteção de dados (LGPD).</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-5 rounded-3xl bg-white/80 border border-[#f3e4e0] shadow-xs">
                <div className="p-3 rounded-full bg-[#f8dad2] text-[#5d0c1d]">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#5d0c1d]">Escuta Analítica</h4>
                  <p className="text-xs text-[#6f5f62] mt-0.5">Olhar atento à sua história e singularidade.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-5 rounded-3xl bg-white/80 border border-[#f3e4e0] shadow-xs">
                <div className="p-3 rounded-full bg-[#f8dad2] text-[#5d0c1d]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#5d0c1d]">Online & Presencial</h4>
                  <p className="text-xs text-[#6f5f62] mt-0.5">Flexibilidade e conforto para a sua rotina.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 bg-[#fbf3ef] border-y border-[#f0ded8]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="bg-white text-[#5d0c1d] font-semibold uppercase rounded-full text-center py-1.5 px-4 mb-3 tracking-[1px] text-xs inline-block border border-[#f8dad2]">
                Processo de Acolhimento
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
                Como funciona o início das sessões?
              </h2>
              <p className="text-sm text-[#6f5f62] mt-2">
                Três etapas simples e seguras para iniciarmos seu acompanhamento terapêutico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-7 rounded-3xl border border-[#f0ded8] shadow-xs relative hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-[#5d0c1d] text-white font-bold flex items-center justify-center text-sm mb-4">
                  1
                </div>
                <h3 className="font-serif font-bold text-[#5d0c1d] text-lg mb-2">Preenchimento da Anamnese</h3>
                <p className="text-xs sm:text-sm text-[#6f5f62] leading-relaxed">
                  Você preenche a ficha virtual com seus dados, queixa principal, sintomas emocionais e histórico.
                </p>
              </div>

              <div className="bg-white p-7 rounded-3xl border border-[#f0ded8] shadow-xs relative hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-[#aa2d47] text-white font-bold flex items-center justify-center text-sm mb-4">
                  2
                </div>
                <h3 className="font-serif font-bold text-[#5d0c1d] text-lg mb-2">Análise Clínica Cuidadosa</h3>
                <p className="text-xs sm:text-sm text-[#6f5f62] leading-relaxed">
                  A Dra. Joane analisa suas respostas com atenção ética e planeja o enquadre mais indicado para o seu momento.
                </p>
              </div>

              <div className="bg-white p-7 rounded-3xl border border-[#f0ded8] shadow-xs relative hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-[#ccb38d] text-[#5d0c1d] font-bold flex items-center justify-center text-sm mb-4">
                  3
                </div>
                <h3 className="font-serif font-bold text-[#5d0c1d] text-lg mb-2">Contato & Início das Sessões</h3>
                <p className="text-xs sm:text-sm text-[#6f5f62] leading-relaxed">
                  Alinhamos o melhor horário na agenda (online ou presencial) e damos início ao seu processo.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/preencher-anamnese"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#5d0c1d] hover:text-[#aa2d47] transition underline underline-offset-4"
              >
                <span>Clique aqui para preencher a sua ficha agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ABOUT JOANE */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[linear-gradient(125.86deg,#edf8fe_0%,#faeae4_80%)] rounded-3xl border border-[#f0ded8] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 shadow-xs">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#5d0c1d]/20">
              <MessageCircleHeart className="w-16 h-16 opacity-95" />
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div className="inline-block px-4 py-1 rounded-full bg-white text-[#5d0c1d] text-xs font-semibold uppercase tracking-[1px] border border-[#f8dad2]">
                Sobre a Terapeuta
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#5d0c1d] italic">
                Dra. Joane Silva
              </h3>
              <p className="text-sm sm:text-base text-[#6f5f62] leading-relaxed">
                Praticante da psicanálise com dedicação à escuta do inconsciente e suas manifestações subjetivas. 
                O trabalho analítico propõe um espaço seguro onde, através da fala livre e sem julgamentos, o sujeito pode 
                ressignificar suas dores, encontrar novos caminhos para o desejo e construir autonomia emocional.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-[#5d0c1d] font-semibold">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#5d0c1d]" /> Atendimento Humanizado</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#5d0c1d]" /> Ética e Sigilo</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#5d0c1d]" /> Acolhimento Personalizado</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
