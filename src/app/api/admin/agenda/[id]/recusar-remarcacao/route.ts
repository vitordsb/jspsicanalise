/**
 * POST /api/admin/agenda/[id]/recusar-remarcacao
 *
 * A Joane recusa um pedido de remarcacao. A consulta continua no horario
 * original: recusar nunca desmarca ninguem.
 *
 * O motivo e opcional mas vai por e-mail quando existe. Sem ele o paciente
 * so ve que o pedido nao foi aceito, o que costuma render uma mensagem no
 * WhatsApp perguntando o porque.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { enviarRemarcacaoRecusada } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  let motivo = "";
  try {
    const body = (await req.json()) as { motivo?: string };
    motivo = String(body?.motivo ?? "").trim().slice(0, 500);
  } catch {
    // Motivo opcional.
  }

  const consulta = await prisma.agendamento.findUnique({
    where: { id },
    include: { patient: { select: { fullName: true, email: true } } },
  });

  if (!consulta) {
    return NextResponse.json({ error: "Consulta não encontrada." }, { status: 404 });
  }
  if (!consulta.remarcacaoPedidaEm) {
    return NextResponse.json(
      { error: "Não há pedido de remarcação aberto nesta consulta." },
      { status: 409 }
    );
  }

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      remarcacaoPedidaEm: null,
      remarcacaoRecusadaEm: new Date(),
      remarcacaoRecusaMotivo: motivo,
    },
  });

  avisarEmSegundoPlano("remarcacao recusada", () =>
    enviarRemarcacaoRecusada({
      para: consulta.patient.email,
      nome: consulta.patient.fullName,
      inicioEm: consulta.inicioEm,
      motivo,
    })
  );

  return NextResponse.json({ success: true, agendamento: atualizado });
}
