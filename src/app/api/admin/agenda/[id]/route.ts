/**
 * Remanejamento e mudanca de status de um agendamento, pela Joane.
 *
 * Diferenca importante em relacao a rota do paciente: aqui ela PODE marcar
 * fora das janelas de atendimento. As janelas existem para limitar o que o
 * paciente escolhe sozinho; a dona da agenda decide abrir excecao. A resposta
 * sinaliza quando isso acontece, para a tela avisar em vez de barrar.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { lerJanelas, vagaEhValida } from "@/lib/agenda";

const STATUS_VALIDOS = ["agendado", "realizado", "cancelado", "falta"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados." }, { status: 400 });
  }

  const { inicioIso, status, observacao } = (body ?? {}) as {
    inicioIso?: string;
    status?: string;
    observacao?: string;
  };

  const atual = await prisma.agendamento.findUnique({ where: { id } });
  if (!atual) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const dados: Record<string, unknown> = {};
  let foraDaJanela = false;

  if (inicioIso !== undefined) {
    const novo = new Date(inicioIso);
    if (isNaN(novo.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }

    const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
    const janelas = lerJanelas(perfil?.horariosAtendimento);
    foraDaJanela = !vagaEhValida(inicioIso, janelas, atual.duracaoMinutos);

    dados.inicioEm = novo;
    // Remanejar reabre o agendamento: cancelado que volta para a agenda
    // precisa voltar a valer.
    if (status === undefined && atual.status !== "agendado") {
      dados.status = "agendado";
      dados.canceladoEm = null;
      dados.motivoCancelamento = "";
    }
  }

  if (status !== undefined) {
    if (!STATUS_VALIDOS.includes(status as (typeof STATUS_VALIDOS)[number])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    dados.status = status;
    if (status === "cancelado") {
      dados.canceladoEm = new Date();
      dados.motivoCancelamento = "Cancelado pela profissional";
    } else {
      dados.canceladoEm = null;
      dados.motivoCancelamento = "";
    }
  }

  if (observacao !== undefined) {
    dados.observacao = String(observacao).slice(0, 500);
  }

  if (Object.keys(dados).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  try {
    const atualizado = await prisma.agendamento.update({
      where: { id },
      data: dados,
      include: { patient: { select: { id: true, fullName: true, phone: true, cpf: true } } },
    });
    return NextResponse.json({ success: true, agendamento: atualizado, foraDaJanela });
  } catch (e: unknown) {
    // P2002: a restricao unica pegou outro agendamento no mesmo horario.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma consulta marcada nesse horário." },
        { status: 409 }
      );
    }
    console.error("Erro ao atualizar agendamento:", e);
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.agendamento.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ success: true });
}
