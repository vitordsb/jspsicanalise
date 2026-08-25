import Link from "next/link";
import Image from "next/image";
import {
  HeartHandshake,
  Sparkles,
  FileText,
  CalendarCheck,
  Lock,
  ArrowRight,
  Brain,
  Quote,
  Waves,
  Compass,
  Users,
  HeartCrack,
  MessageCircle,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { AcordeaoFAQ } from "@/components/landing/AcordeaoFAQ";

/** Numero real da Joane. Unica fonte: o botao flutuante e a faixa final leem daqui. */
const WHATSAPP_NUMERO = "5511922875398";
const WHATSAPP_MENSAGEM =
  "Olá, Dra. Joane! Encontrei seu espaço de atendimento e gostaria de saber mais.";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM)}`;

const LINKS_DE_NAVEGACAO = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#areas", rotulo: "Áreas de escuta" },
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#duvidas", rotulo: "Dúvidas" },
] as const;

/** Pilulas de confianca logo abaixo do paragrafo de abertura do hero. */
const SELOS_DO_HERO = [
  { icone: Lock, rotulo: "Sigilo profissional" },
  { icone: Brain, rotulo: "Escuta psicanalítica" },
  { icone: CalendarCheck, rotulo: "Online e presencial" },
] as const;

/** Selos de abordagem exibidos junto ao retrato, na secao "Sobre". */
const SELOS_DE_ABORDAGEM = [
  { icone: HeartHandshake, rotulo: "Atendimento humanizado" },
  { icone: Lock, rotulo: "Ética e sigilo profissional" },
  { icone: Sparkles, rotulo: "Acolhimento personalizado" },
] as const;

/**
 * Temas comuns trazidos ao consultorio. Framing deliberadamente aberto
 * ("um espaco para...") em vez de "eu trato X": nao ha especializacao
 * certificada a anunciar, e a psicologia tem restricao etica quanto a
 * promessa de resultado ou a linguagem que soe diagnostico comercial.
 */
const AREAS_DE_ESCUTA = [
  {
    icone: Waves,
    titulo: "Ansiedade e angústias",
    texto:
      "Um espaço para colocar em palavras o que pesa no corpo e na mente, e compreender de onde vem essa inquietação.",
  },
  {
    icone: Compass,
    titulo: "Autoconhecimento",
    texto:
      "A investigação do inconsciente como caminho para reconhecer padrões, desejos e escolhas que nem sempre estão claros.",
  },
  {
    icone: Users,
    titulo: "Relacionamentos e vínculos",
    texto:
      "Espaço para pensar sobre os próprios vínculos, familiares, afetivos ou de trabalho, com mais consciência e menos repetição.",
  },
  {
    icone: HeartCrack,
    titulo: "Perdas e transições",
    texto:
      "Acolhimento para momentos de luto, mudança ou ruptura, quando a vida pede uma reorganização emocional.",
  },
] as const;

const PERGUNTAS_FREQUENTES = [
  {
    pergunta: "Como funciona a primeira consulta?",
    resposta:
      "Você preenche uma ficha de anamnese virtual com seus dados e sua queixa principal. A Dra. Joane analisa suas respostas com atenção ética, e o contato para alinhar o primeiro encontro acontece logo em seguida.",
  },
  {
    pergunta: "O atendimento é sigiloso?",
    resposta:
      "Sim. Todo o conteúdo das sessões é protegido por sigilo profissional, e seus dados são tratados com proteção conforme a LGPD, sem uso ou divulgação para qualquer finalidade fora do acompanhamento.",
  },
  {
    pergunta: "É atendimento online ou presencial?",
    resposta:
      "As duas modalidades estão disponíveis. Definimos juntas o formato mais confortável para a sua rotina ao longo da conversa inicial.",
  },
  {
    pergunta: "Como eu agendo minha consulta?",
    resposta:
      "Depois de enviar sua ficha de anamnese, você recebe um código de acesso à sua própria área, onde escolhe o horário disponível diretamente na agenda.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      {/* NAVEGACAO */}
      <header className="sticky top-0 z-40 bg-[#fff6f4]/90 backdrop-blur-md border-b border-[#f3e4e0]">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm shadow-[#5d0c1d]/20">
              <Image
                src="/joane-avatar.jpg"
                alt="Dra. Joane Souza Oliveira de Andrade"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div className="text-left leading-tight min-w-0">
              <span className="font-serif text-xs sm:text-base font-bold text-[#5d0c1d] block truncate">
                Joane Souza Oliveira de Andrade
              </span>
              <span className="hidden sm:block text-[11px] text-[#6f5f62]">
                Psicóloga & Psicanalista Clínica
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#5d0c1d] shrink-0">
            {LINKS_DE_NAVEGACAO.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#aa2d47] transition">
                {l.rotulo}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/area-do-paciente/entrar"
              title="Área do Paciente"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-[#e6d8d3] hover:bg-white text-[#5d0c1d] text-xs sm:text-sm font-semibold transition"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Área do Paciente</span>
            </Link>
            <Link
              href="/preencher-anamnese"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Preencher Ficha</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[650px] h-[380px] bg-gradient-to-tr from-[#f8dad2]/70 via-[#fdece8]/50 to-[#edf8fe]/40 rounded-full blur-3xl opacity-70 -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-10 items-center">
              {/* TEXTO */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#f8dad2] text-[#5d0c1d] text-xs font-semibold uppercase tracking-[1px] mb-6 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#5d0c1d]" />
                  <span>Psicologia & Psicanálise Clínica</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#5d0c1d] tracking-tight leading-[1.18] mb-6">
                  Precisa de um espaço para ser{" "}
                  <span className="italic font-normal text-[#aa2d47]">
                    escutado de verdade?
                  </span>
                </h1>

                <p className="max-w-lg mx-auto md:mx-0 text-base sm:text-lg text-[#6f5f62] leading-relaxed mb-6">
                  Sou Joane Souza Oliveira de Andrade, psicóloga e psicanalista. Ofereço um
                  espaço de escuta ética e sem julgamentos, para você compreender seus
                  sentimentos e construir novos caminhos.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-8">
                  {SELOS_DO_HERO.map(({ icone: Icone, rotulo }) => (
                    <span
                      key={rotulo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#f0ded8] text-xs font-semibold text-[#5d0c1d]"
                    >
                      <Icone className="w-3.5 h-3.5 text-[#aa2d47]" />
                      {rotulo}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col items-center md:items-start gap-4">
                  <Link
                    href="/preencher-anamnese"
                    className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-base font-semibold shadow-xl shadow-[#5d0c1d]/25 transition transform active:scale-98"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Preencher Ficha de Anamnese</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link
                    href="/area-do-paciente/entrar"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5d0c1d] hover:text-[#aa2d47] transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Já é paciente? Acesse sua área</span>
                  </Link>
                </div>
              </div>

              {/* RETRATO */}
              <div className="relative mx-auto md:mx-0 w-full max-w-sm">
                <div
                  className="absolute -inset-6 bg-gradient-to-br from-[#f8dad2]/80 via-[#fdece8]/60 to-[#edf8fe]/50 rounded-[3rem] blur-xl -z-10"
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl shadow-[#5d0c1d]/15">
                  <Image
                    src="/joane-retrato.jpg"
                    alt="Dra. Joane Souza Oliveira de Andrade, psicanalista"
                    fill
                    sizes="(min-width: 768px) 384px, 320px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="como-funciona" className="scroll-mt-24 py-16 bg-[#fbf3ef] border-y border-[#f0ded8]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
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

        {/* PARA QUEM E A TERAPIA */}
        <section id="areas" className="scroll-mt-24 py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
              Para quem é esse espaço?
            </h2>
            <p className="text-sm text-[#6f5f62] mt-2">
              Um convite para quem sente que precisa de um lugar seguro para se ouvir, e ser ouvido.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {AREAS_DE_ESCUTA.map(({ icone: Icone, titulo, texto }) => (
              <div
                key={titulo}
                className="flex items-start gap-4 bg-white p-6 rounded-3xl border border-[#f0ded8] shadow-xs hover:shadow-md transition"
              >
                <div className="p-3 rounded-full bg-[#f8dad2] text-[#5d0c1d] shrink-0">
                  <Icone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#5d0c1d] text-base mb-1.5">{titulo}</h3>
                  <p className="text-xs sm:text-sm text-[#6f5f62] leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT JOANE */}
        <section id="sobre" className="scroll-mt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative bg-[linear-gradient(125.86deg,#edf8fe_0%,#faeae4_80%)] rounded-[2rem] border border-[#f0ded8] p-8 sm:p-12 shadow-xs overflow-hidden">
            {/* Aspas decorativas ao fundo, atras do texto */}
            <Quote
              className="hidden md:block absolute top-10 right-10 w-28 h-28 text-[#5d0c1d]/[0.06] -scale-x-100 pointer-events-none"
              strokeWidth={1}
            />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-12">
              {/* RETRATO */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div
                  className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ccb38d] via-[#f0ded8] to-[#f8dad2] rotate-3 -z-10"
                  aria-hidden="true"
                />
                <div className="relative w-52 sm:w-60 md:w-64 aspect-[4/5] rounded-[1.75rem] overflow-hidden border-4 border-white shadow-xl shadow-[#5d0c1d]/15">
                  <Image
                    src="/joane-retrato.jpg"
                    alt="Dra. Joane Souza Oliveira de Andrade, psicanalista"
                    fill
                    sizes="(min-width: 768px) 256px, 240px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#5d0c1d] italic">
                  Dra. Joane Souza Oliveira de Andrade
                </h3>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[1px] text-[#aa2d47]">
                  Psicóloga & Psicanalista Clínica
                </p>
                <p className="text-sm sm:text-base text-[#6f5f62] leading-relaxed">
                  Praticante da psicanálise com dedicação à escuta do inconsciente e suas manifestações subjetivas.
                  O trabalho analítico propõe um espaço seguro onde, através da fala livre e sem julgamentos, o sujeito pode
                  ressignificar suas dores, encontrar novos caminhos para o desejo e construir autonomia emocional.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {SELOS_DE_ABORDAGEM.map(({ icone: Icone, rotulo }) => (
                    <div
                      key={rotulo}
                      className="flex items-center gap-2 bg-white/80 border border-[#f3e4e0] rounded-2xl px-3 py-2.5"
                    >
                      <span className="p-1.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] shrink-0">
                        <Icone className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-[#5d0c1d] text-left">
                        {rotulo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PERGUNTAS FREQUENTES */}
        <section id="duvidas" className="scroll-mt-24 py-20 bg-[#fbf3ef] border-y border-[#f0ded8]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
                Perguntas frequentes
              </h2>
            </div>

            <AcordeaoFAQ itens={PERGUNTAS_FREQUENTES.map((p) => ({ pergunta: p.pergunta, resposta: p.resposta }))} />
          </div>
        </section>

        {/* FAIXA FINAL DE CONTATO */}
        <section id="contato" className="scroll-mt-24 relative overflow-hidden py-20 bg-[#5d0c1d]">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#aa2d47]/30 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              Pronta para te escutar. O primeiro passo pode ser hoje.
            </h2>
            <p className="text-sm sm:text-base text-white/75 mt-3 mb-9">
              Preencha sua ficha de anamnese, ou fale antes pelo WhatsApp, se preferir.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/preencher-anamnese"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-[#fdece8] text-[#5d0c1d] text-sm sm:text-base font-bold shadow-lg transition"
              >
                <FileText className="w-4.5 h-4.5" />
                <span>Preencher Ficha de Anamnese</span>
              </Link>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border border-white/40 hover:bg-white/10 text-white text-sm sm:text-base font-semibold transition"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/60 mt-8">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sigilo profissional e proteção de dados (LGPD) em todo o processo.
            </p>

            <Link
              href="/area-do-paciente/entrar"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white transition mt-5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Já é paciente? Acesse sua área</span>
            </Link>
          </div>
        </section>
      </main>

      {/* RODAPE */}
      <footer className="py-7 border-t border-[#f0ded8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <p className="text-xs text-[#9c8b8e]">
            © {new Date().getFullYear()} Joane Souza Oliveira de Andrade. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[#9c8b8e]">Atendimento sob sigilo profissional e ético.</p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl shadow-black/20 transition transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="w-6.5 h-6.5" strokeWidth={2.25} />
      </a>
    </div>
  );
}
