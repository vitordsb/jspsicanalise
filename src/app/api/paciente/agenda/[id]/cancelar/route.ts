/**
 * Cancelamento de consulta pelo proprio paciente.
 * So cancela agendamento que pertence a sessao ativa.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const { id } = await params;

  const ag = await prisma.agendamento.findFirst({
    where: { id, patientId, status: "agendado" },
  });

  if (!ag) {
    return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
  }

  await prisma.agendamento.update({
    where: { id },
    data: {
      status: "cancelado",
      canceladoEm: new Date(),
      motivoCancelamento: "Cancelado pelo paciente",
    },
  });

  return NextResponse.json({ success: true });
}
