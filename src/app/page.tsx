import Link from "next/link";
import Image from "next/image";
import {
  HeartHandshake,
  Sparkles,
  FileText,
  Heart,
  CalendarCheck,
  Lock,
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
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

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
  { icone: Lock, rotulo: "Sigilo total" },
  { icone: Brain, rotulo: "Escuta psicanalítica" },
  { icone: CalendarCheck, rotulo: "Online e presencial" },
] as const;

/** Selos de abordagem exibidos junto ao retrato, na secao "Sobre". */
const SELOS_DE_ABORDAGEM = [
  { icone: HeartHandshake, rotulo: "Atendimento acolhedor" },
  { icone: Lock, rotulo: "Sigilo e respeito" },
  { icone: Sparkles, rotulo: "Cuidado só seu" },
] as const;

/**
 * Temas comuns trazidos ao consultorio. Framing deliberadamente aberto
 * ("um espaco para...") em vez de "eu trato X": nao ha especializacao
 * certificada a anunciar, e a pratica clinica tem restricao etica quanto a
 * promessa de resultado ou a linguagem que soe diagnostico comercial.
 */
const AREAS_DE_ESCUTA = [
  {
    icone: Waves,
    titulo: "Ansiedade e angústias",
    texto:
      "Um espaço para colocar em palavras o que pesa no corpo e na cabeça, e entender de onde vem essa inquietação.",
  },
  {
    icone: Compass,
    titulo: "Autoconhecimento",
    texto:
      "Olhar para dentro para perceber seus padrões, seus desejos e as escolhas que nem sempre ficam claras.",
  },
  {
    icone: Users,
    titulo: "Relacionamentos e vínculos",
    texto:
      "Um espaço para pensar nas pessoas que fazem parte da sua vida, na família, no amor ou no trabalho, e sair do automático.",
  },
  {
    icone: HeartCrack,
    titulo: "Perdas e transições",
    texto:
      "Um lugar de acolhimento para quando vem um luto, uma mudança ou um fim, e a vida pede que você se reorganize por dentro.",
  },
] as const;

const PERGUNTAS_FREQUENTES = [
  {
    pergunta: "Como funciona a primeira consulta?",
    resposta:
      "Você escolhe um horário na agenda e confirma pelo e-mail. Antes do encontro, a Dra. Joane convida você a preencher uma ficha com algumas informações e com o que te trouxe até aqui. Ela lê tudo com cuidado para receber você da melhor forma.",
  },
  {
    pergunta: "O atendimento é sigiloso?",
    resposta:
      "Sim. Tudo o que é dito nas sessões fica entre você e a Dra. Joane. Seus dados são guardados com cuidado, como manda a lei de proteção de dados (LGPD), e só servem para o seu acompanhamento.",
  },
  {
    pergunta: "É atendimento online ou presencial?",
    resposta:
      "Os dois jeitos existem. Vocês combinam, na conversa inicial, o que fica mais confortável para a sua rotina.",
  },
  {
    pergunta: "Como eu agendo minha consulta?",
    resposta:
      "Pelo botão \"Agendar consulta\": você escolhe um horário livre, deixa seus dados e confirma pelo link que chega no seu e-mail. Não precisa preencher a ficha antes de marcar.",
  },
] as const;


const PASSOS = [
  {
    titulo: "Escolha do horário",
    texto: "Você vê os horários livres da Dra. Joane e escolhe o que combina com a sua rotina. Não precisa de cadastro.",
  },
  {
    titulo: "Confirmação e ficha",
    texto: "Você confirma a consulta pelo link que chega no e-mail e preenche uma ficha, para a Dra. Joane se preparar para te receber.",
  },
  {
    titulo: "Início das sessões",
    texto: "No dia combinado, online ou presencial, a gente começa o seu processo.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* BARRA SUPERIOR */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
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
              <span className="font-serif text-sm sm:text-base font-bold text-primary block truncate">
                Joane Souza Oliveira de Andrade
              </span>
              <span className="hidden sm:block text-xs text-on-surface-variant">
                Psicanálise clínica
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {LINKS_DE_NAVEGACAO.map((l) => (
              <Button key={l.href} href={l.href} variante="text">
                {l.rotulo}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <Button
                href="/area-do-paciente/entrar"
                variante="outlined"
                icone={<LogIn className="w-4 h-4" />}
              >
                Área do paciente
              </Button>
            </div>
            <Button href="/agendar" icone={<CalendarCheck className="w-4 h-4" />}>
              <span className="sm:hidden">Agendar</span>
              <span className="hidden sm:inline">Agendar consulta</span>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ABERTURA */}
        <section className="relative overflow-hidden py-10 sm:py-20">
          <div
            className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full bg-primary-container/60 blur-3xl -translate-y-1/3 translate-x-1/4 -z-10 pointer-events-none"
            aria-hidden="true"
          />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-[1.15fr_1fr] gap-8 md:gap-14 items-center">
            {/* No celular a foto vem antes do texto: e ela que cria a proximidade. */}
            <div className="order-first md:order-last mx-auto w-full max-w-[168px] sm:max-w-xs md:max-w-sm">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-primary/15">
                <Image
                  src="/joane-retrato.jpg"
                  alt="Dra. Joane Souza Oliveira de Andrade, psicanalista"
                  fill
                  sizes="(min-width: 768px) 384px, 168px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary mb-4">
                <Sparkles className="w-4 h-4" />
                Psicanálise clínica
              </p>

              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary tracking-tight leading-[1.15] mb-5">
                Precisa de um espaço para ser{" "}
                <span className="italic font-normal text-secondary">escutado de verdade?</span>
              </h1>

              <p className="max-w-lg mx-auto md:mx-0 text-base sm:text-lg text-on-surface-variant leading-relaxed mb-6">
                Sou Joane Souza Oliveira de Andrade, psicanalista clínica. Ofereço um espaço de
                escuta sem julgamentos, para você entender o que sente e encontrar novos caminhos.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-8">
                {SELOS_DO_HERO.map(({ icone: Icone, rotulo }) => (
                  <Chip key={rotulo} icone={<Icone className="w-4 h-4 text-secondary" />}>
                    {rotulo}
                  </Chip>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                <Button
                  href="/agendar"
                  tamanho="lg"
                  icone={<CalendarCheck className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Agendar consulta
                </Button>
                <Button
                  href="/area-do-paciente/entrar"
                  variante="tonal"
                  tamanho="lg"
                  icone={<LogIn className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Já sou paciente
                </Button>
              </div>
              <Button
                href="/preencher-anamnese"
                variante="text"
                icone={<FileText className="w-4 h-4" />}
                className="mt-3"
              >
                Prefere começar pela ficha de anamnese?
              </Button>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-24 py-16 sm:py-20 bg-surface-low">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                Como funciona o início das sessões?
              </h2>
              <p className="text-base text-on-surface-variant mt-3">
                Três passos simples para a gente começar.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div
                className="hidden md:block absolute top-6 left-[16.7%] right-[16.7%] h-px bg-outline-variant"
                aria-hidden="true"
              />
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="relative text-center">
                  <span className="relative z-10 mx-auto mb-4 w-12 h-12 rounded-full bg-primary text-on-primary font-bold text-lg flex items-center justify-center ring-8 ring-surface-low">
                    {i + 1}
                  </span>
                  <h3 className="font-serif font-bold text-primary text-xl mb-2">{p.titulo}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                    {p.texto}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-12 text-center">
              <Button
                href="/agendar"
                variante="tonal"
                icone={<CalendarCheck className="w-4 h-4" />}
              >
                Agendar a minha consulta
              </Button>
            </div>
          </div>
        </section>

        {/* PARA QUEM E ESSE ESPACO */}
        <section id="areas" className="scroll-mt-24 py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">
              Para quem é esse espaço?
            </h2>
            <p className="text-base text-on-surface-variant mt-3">
              Um convite para quem sente que precisa de um lugar seguro para se ouvir, e ser ouvido.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AREAS_DE_ESCUTA.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="flex items-start gap-4 p-6 rounded-3xl bg-surface-container">
                <span className="shrink-0 w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                  <Icone className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-primary text-lg mb-1">{titulo}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SOBRE */}
        <section id="sobre" className="scroll-mt-24 pb-16 sm:pb-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary-container-low border border-outline-variant p-8 sm:p-12 text-center">
            <Quote
              className="absolute top-6 left-6 w-14 h-14 text-primary/10 rotate-180"
              aria-hidden="true"
            />
            <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-secondary mb-3">
              Psicanálise clínica
            </p>
            <h2 className="relative font-serif text-3xl sm:text-4xl font-bold text-primary italic mb-5">
              Dra. Joane Souza Oliveira de Andrade
            </h2>
            <p className="relative max-w-2xl mx-auto text-base sm:text-lg text-on-surface-variant leading-relaxed">
              Trabalho com psicanálise, escutando com carinho o que você sente e nem sempre consegue
              explicar. Aqui você tem um lugar seguro para falar o que vier, sem julgamentos, dar um
              novo sentido às suas dores, encontrar o que te move e ganhar mais liberdade para viver.
            </p>
            <div className="relative flex flex-wrap justify-center gap-2 mt-7">
              {SELOS_DE_ABORDAGEM.map(({ icone: Icone, rotulo }) => (
                <Chip key={rotulo} icone={<Icone className="w-4 h-4 text-secondary" />}>
                  {rotulo}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* DUVIDAS */}
        <section id="duvidas" className="scroll-mt-24 py-16 sm:py-20 bg-surface-low">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                Perguntas frequentes
              </h2>
            </div>
            <AcordeaoFAQ itens={PERGUNTAS_FREQUENTES.map((p) => ({ pergunta: p.pergunta, resposta: p.resposta }))} />
          </div>
        </section>

        {/* CHAMADO FINAL */}
        <section id="contato" className="scroll-mt-24 relative overflow-hidden py-20 bg-primary">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-secondary/30 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <Heart className="w-8 h-8 text-primary-container mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Estou aqui para te escutar. O primeiro passo pode ser hoje.
            </h2>
            <p className="text-base text-white/80 mt-3 mb-9">
              Escolha um horário na agenda, ou fale antes pelo WhatsApp, se preferir.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                href="/agendar"
                variante="onDark"
                tamanho="lg"
                icone={<CalendarCheck className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                Agendar consulta
              </Button>
              <Button
                href={WHATSAPP_HREF}
                variante="onDarkOutlined"
                tamanho="lg"
                icone={<MessageCircle className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                Conversar no WhatsApp
              </Button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-sm text-white/70 mt-8">
              <CheckCircle2 className="w-4 h-4" />
              Seu sigilo e seus dados protegidos em todo o processo.
            </p>
          </div>
        </section>
      </main>

      {/* RODAPE */}
      <footer className="py-8 pb-28 sm:pb-8 border-t border-outline-variant">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-on-surface-subtle">
            © {new Date().getFullYear()} Joane Souza Oliveira de Andrade. Todos os direitos reservados.
          </p>
          <nav className="flex items-center gap-1" aria-label="Atalhos do rodapé">
            <Button href="/area-do-paciente/entrar" variante="text">Área do paciente</Button>
            <Button href="/agendar" variante="text">Agendar</Button>
          </nav>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar no WhatsApp"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-2xl bg-whatsapp hover:bg-whatsapp-hover text-white flex items-center justify-center shadow-lg shadow-black/20 transition-colors"
      >
        <MessageCircle className="w-7 h-7" strokeWidth={2.25} />
      </a>
    </div>
  );
}
