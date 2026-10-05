/**
 * Cancelamento de consulta pelo proprio paciente.
 * So cancela agendamento que pertence a sessao ativa.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";
import { avisarJoaneSobreConsulta } from "@/lib/mail";
import { avisarEmSegundoPlano, consultaAindaVale } from "@/lib/avisos";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const { id } = await params;

  const ag = await prisma.agendamento.findFirst({
    where: { id, patientId, status: "agendado" },
    include: { patient: { select: { fullName: true } } },
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

  // Horario que vagou na agenda dela. Consulta que ja passou nao abre vaga,
  // entao nao vira aviso.
  if (consultaAindaVale(ag.inicioEm, ag.status)) {
    avisarEmSegundoPlano("consulta cancelada pelo paciente", async () => {
      const perfil = await prisma.user.findFirst({ select: { notificationEmail: true } });
      return avisarJoaneSobreConsulta({
        recipientEmail: perfil?.notificationEmail || undefined,
        tipo: "cancelada",
        nomePaciente: ag.patient.fullName,
        inicioEm: ag.inicioEm,
      });
    });
  }

  return NextResponse.json({ success: true });
}
