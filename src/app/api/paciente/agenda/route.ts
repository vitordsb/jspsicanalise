/**
 * Agenda vista pelo paciente.
 *
 * GET  lista as vagas livres.
 * POST marca uma consulta.
 *
 * Regra de ouro do POST: a vaga enviada e sempre revalidada contra as janelas
 * do perfil. Nunca confiar que o cliente mandou um horario que a tela ofereceu,
 * porque a requisicao pode ser forjada.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarAvisoDeConsulta } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { exigirPaciente } from "@/lib/paciente-session";
import { lerJanelas, gerarVagas, vagaEhValida } from "@/lib/agenda";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DIAS_A_FRENTE = 21;
const ANTECEDENCIA_HORAS = 2;

/** Duracao da sessao: vem do contrato do paciente, com 50 minutos por padrao. */
async function duracaoDaSessao(patientId: string): Promise<number> {
  const c = await prisma.contract.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    select: { durationMinutes: true },
  });
  return c?.durationMinutes && c.durationMinutes > 0 ? c.durationMinutes : 50;
}

export async function GET() {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);
  const duracao = await duracaoDaSessao(patientId);

  const agora = new Date();
  // Todos os agendamentos ativos ocupam vaga, de qualquer paciente.
  const ocupados = await prisma.agendamento.findMany({
    where: { status: "agendado", inicioEm: { gte: agora } },
    select: { inicioEm: true },
  });

  const vagas = gerarVagas({
    janelas,
    duracaoMinutos: duracao,
    diasAFrente: DIAS_A_FRENTE,
    antecedenciaHoras: ANTECEDENCIA_HORAS,
    ocupados: ocupados.map((o) => o.inicioEm.toISOString()),
    agora,
  });

  // Todas as consultas do paciente, nao so a proxima. A Joane pode marcar
  // varias pela agenda dela, e antes a tela mostrava apenas a primeira da
  // lista, que podia ate ser uma consulta ja passada.
  const todas = await prisma.agendamento.findMany({
    where: { patientId },
    orderBy: { inicioEm: "asc" },
    select: {
      id: true,
      inicioEm: true,
      duracaoMinutos: true,
      status: true,
      observacao: true,
      remarcacaoPedidaEm: true,
      remarcacaoMotivo: true,
      remarcacaoRecusadaEm: true,
      remarcacaoRecusaMotivo: true,
    },
  });

  const limite = agora.getTime();
  const proximas = todas.filter(
    (a) => a.status === "agendado" && a.inicioEm.getTime() > limite
  );
  // Historico: o que ja passou e o que foi cancelado, do mais recente para o
  // mais antigo, que e a ordem em que se procura por uma consulta anterior.
  const historico = todas
    .filter((a) => !proximas.includes(a))
    .sort((a, b) => b.inicioEm.getTime() - a.inicioEm.getTime());

  return NextResponse.json({
    vagas,
    proximas,
    historico,
    // Mantido por compatibilidade com quem ainda le o campo antigo.
    meusAgendamentos: proximas,
    duracaoMinutos: duracao,
    semJanelas: janelas.length === 0,
  });
}

export async function POST(req: NextRequest) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const ip = getClientIp(req);
  if (!checkRateLimit(`agendar:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas seguidas. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados enviados." }, { status: 400 });
  }

  const { inicioIso } = (body ?? {}) as { inicioIso?: string };
  if (!inicioIso) {
    return NextResponse.json({ error: "Escolha um horário." }, { status: 400 });
  }

  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);
  const duracao = await duracaoDaSessao(patientId);

  // Revalidacao no servidor: a tela pode ter sido burlada.
  if (!vagaEhValida(inicioIso, janelas, duracao)) {
    return NextResponse.json(
      { error: "Este horário não está disponível para atendimento." },
      { status: 422 }
    );
  }

  const inicio = new Date(inicioIso);
  if (inicio.getTime() < Date.now() + ANTECEDENCIA_HORAS * 3600_000) {
    return NextResponse.json(
      { error: "Escolha um horário com pelo menos 2 horas de antecedência." },
      { status: 422 }
    );
  }

  // Uma consulta ativa por vez: a marcacao aqui e da primeira sessao.
  const jaTem = await prisma.agendamento.findFirst({
    where: { patientId, status: "agendado", inicioEm: { gte: new Date() } },
  });
  if (jaTem) {
    return NextResponse.json(
      { error: "Você já tem uma consulta marcada. Cancele a atual para escolher outro horário." },
      { status: 409 }
    );
  }

  const ultimaAnamnese = await prisma.anamnesisSubmission.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  try {
    const criado = await prisma.agendamento.create({
      data: {
        patientId,
        submissionId: ultimaAnamnese?.id ?? null,
        inicioEm: inicio,
        duracaoMinutos: duracao,
        status: "agendado",
      },
      include: { patient: { select: { fullName: true, email: true } } },
    });

    // Confirmacao com data e horario. Vale como comprovante do que a pessoa
    // escolheu, e como lembrete depois que a tela fechou.
    avisarEmSegundoPlano("consulta marcada pelo paciente", () =>
      enviarAvisoDeConsulta({
        para: criado.patient.email,
        nome: criado.patient.fullName,
        tipo: "marcada",
        inicioEm: criado.inicioEm,
        duracaoMinutos: criado.duracaoMinutos,
      })
    );

    return NextResponse.json({ success: true, agendamento: criado });
  } catch (e: unknown) {
    // P2002: a restricao unica do banco pegou uma corrida entre duas pessoas
    // escolhendo a mesma vaga no mesmo instante.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Alguém acabou de reservar este horário. Escolha outro, por favor." },
        { status: 409 }
      );
    }
    console.error("Erro ao agendar:", e);
    return NextResponse.json({ error: "Não foi possível marcar sua consulta." }, { status: 500 });
  }
}
