/**
 * Agenda vista pela Joane: consultas marcadas pelos pacientes.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const agora = new Date();

  const proximos = await prisma.agendamento.findMany({
    where: { status: "agendado", inicioEm: { gte: agora } },
    orderBy: { inicioEm: "asc" },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, cpf: true } },
    },
  });

  const passados = await prisma.agendamento.findMany({
    where: { inicioEm: { lt: agora } },
    orderBy: { inicioEm: "desc" },
    take: 20,
    include: {
      patient: { select: { id: true, fullName: true, phone: true, cpf: true } },
    },
  });

  return NextResponse.json({ proximos, passados });
}
