/**
 * POST /api/paciente/agenda/[id]/remarcar
 *
 * O paciente pede para remarcar; quem escolhe o novo horario e a Joane.
 *
 * Foi desenhado assim de proposito. Deixar o paciente remarcar sozinho seria
 * mais simples, mas o horario dele nao e so dele: cancelar e remarcar em
 * sequencia abre um buraco na agenda que outra pessoa pode ocupar no meio do
 * caminho, e a pessoa acabaria sem consulta nenhuma. Enquanto o pedido esta
 * aberto o horario original continua reservado.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";
import { enviarPedidoDeRemarcacao } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MOTIVO_MAX = 500;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const ip = getClientIp(req);
  if (!checkRateLimit(`remarcar:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitos pedidos seguidos. Aguarde um pouco antes de tentar de novo." },
      { status: 429 }
    );
  }

  const { id } = await params;

  let motivo = "";
  try {
    const body = (await req.json()) as { motivo?: string };
    motivo = String(body?.motivo ?? "").trim().slice(0, MOTIVO_MAX);
  } catch {
    // Motivo e opcional: pedido sem justificativa e legitimo.
  }

  // O filtro por patientId e o que impede pedir remarcacao da consulta de
  // outra pessoa passando um id qualquer.
  const consulta = await prisma.agendamento.findFirst({
    where: { id, patientId },
  });

  if (!consulta) {
    return NextResponse.json({ error: "Consulta não encontrada." }, { status: 404 });
  }

  if (consulta.status !== "agendado") {
    return NextResponse.json(
      { error: "Esta consulta não está mais ativa." },
      { status: 409 }
    );
  }

  if (consulta.inicioEm.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Esta consulta já passou. Fale com a Dra. Joane para marcar outra." },
      { status: 409 }
    );
  }

  if (consulta.remarcacaoPedidaEm) {
    return NextResponse.json(
      { error: "Você já pediu para remarcar esta consulta. Aguarde o retorno da Dra. Joane." },
      { status: 409 }
    );
  }

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      remarcacaoPedidaEm: new Date(),
      remarcacaoMotivo: motivo,
      // Pedido novo limpa recusa antiga: o que vale e o pedido em aberto.
      remarcacaoRecusadaEm: null,
      remarcacaoRecusaMotivo: "",
    },
  });

  const perfil = await prisma.user.findFirst({ select: { notificationEmail: true } });
  avisarEmSegundoPlano("pedido de remarcacao", () =>
    enviarPedidoDeRemarcacao({
      recipientEmail: perfil?.notificationEmail || undefined,
    })
  );

  return NextResponse.json({ success: true, agendamento: atualizado });
}

/** Desiste do pedido. O horario original nunca deixou de valer. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const { id } = await params;
  const consulta = await prisma.agendamento.findFirst({ where: { id, patientId } });
  if (!consulta) {
    return NextResponse.json({ error: "Consulta não encontrada." }, { status: 404 });
  }

  await prisma.agendamento.update({
    where: { id },
    data: { remarcacaoPedidaEm: null, remarcacaoMotivo: "" },
  });

  return NextResponse.json({ success: true });
}
