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
import { lerJanelas, inicioDaSemana, diasDaSemana } from "@/lib/agenda";

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
