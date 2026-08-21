/**
 * Agenda da Joane.
 *
 * Devolve os agendamentos de uma semana mais as janelas de atendimento, para
 * o calendario desenhar a grade e saber quais celulas sao horario de trabalho.
 *
 * A semana vem por parametro (?semana=YYYY-MM-DD, qualquer dia dentro dela).
 * Sem parametro, usa a semana corrente.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { lerJanelas, inicioDaSemana, diasDaSemana, vagaEhValida } from "@/lib/agenda";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const semanaParam = searchParams.get("semana");

  const agora = new Date();
  const referencia = semanaParam ? new Date(`${semanaParam}T12:00:00.000Z`) : agora;
  const base = isNaN(referencia.getTime()) ? agora : referencia;

  const segunda = inicioDaSemana(base);
  const domingoFim = new Date(segunda.getTime() + 7 * 24 * 3600_000);

  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);

  const daSemana = await prisma.agendamento.findMany({
    where: { inicioEm: { gte: segunda, lt: domingoFim } },
    orderBy: { inicioEm: "asc" },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, cpf: true } },
    },
  });

  // Fila do que vem pela frente, da consulta mais proxima ate a mais distante.
  // Independe da semana exibida: e a lista que a Joane usa para saber quem ela
  // atende em seguida, mesmo navegando para tras no calendario.
  const proximas = await prisma.agendamento.findMany({
    where: { status: "agendado", inicioEm: { gte: agora } },
    orderBy: { inicioEm: "asc" },
    take: 30,
    include: {
      patient: { select: { id: true, fullName: true, phone: true, cpf: true } },
    },
  });

  return NextResponse.json({
    semanaInicio: segunda.toISOString(),
    dias: diasDaSemana(segunda, agora),
    janelas,
    agendamentos: daSemana,
    proximas,
  });
}

/**
 * Agendamento criado pela propria Joane, para paciente que ja e cliente dela.
 *
 * Diferente da rota do paciente, aqui nao ha limite de uma consulta ativa por
 * pessoa nem exigencia de estar dentro das janelas: ela marca retorno,
 * encaixe e sessao extra. A resposta sinaliza quando o horario esta fora do
 * expediente, para a tela avisar em vez de barrar.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nao foi possivel ler os dados." }, { status: 400 });
  }

  const { patientId, inicioIso, duracaoMinutos, observacao } = (body ?? {}) as {
    patientId?: string;
    inicioIso?: string;
    duracaoMinutos?: number;
    observacao?: string;
  };

  if (!patientId || !inicioIso) {
    return NextResponse.json({ error: "Escolha o paciente e o horario." }, { status: 400 });
  }

  const inicio = new Date(inicioIso);
  if (isNaN(inicio.getTime())) {
    return NextResponse.json({ error: "Data invalida." }, { status: 400 });
  }

  const paciente = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!paciente) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  // Duracao vem do contrato mais recente, com 50 minutos como padrao.
  let duracao = duracaoMinutos;
  if (!duracao || duracao <= 0) {
    const c = await prisma.contract.findFirst({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      select: { durationMinutes: true },
    });
    duracao = c?.durationMinutes && c.durationMinutes > 0 ? c.durationMinutes : 50;
  }

  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);
  const foraDaJanela = !vagaEhValida(inicioIso, janelas, duracao);

  try {
    const criado = await prisma.agendamento.create({
      data: {
        patientId,
        inicioEm: inicio,
        duracaoMinutos: duracao,
        status: "agendado",
        observacao: observacao ? String(observacao).slice(0, 500) : "",
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true, cpf: true } },
      },
    });
    return NextResponse.json({ success: true, agendamento: criado, foraDaJanela });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Ja existe uma consulta marcada nesse horario." },
        { status: 409 }
      );
    }
    console.error("Erro ao agendar pelo painel:", e);
    return NextResponse.json({ error: "Nao foi possivel agendar." }, { status: 500 });
  }
}
