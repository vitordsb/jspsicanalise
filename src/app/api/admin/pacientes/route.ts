/**
 * Lista enxuta de pacientes, para escolher quem agendar.
 *
 * Traz todos os cadastrados, sinalizando quem ja tem contrato: a Joane pede
 * para marcar "clientes que ja tem contrato", mas bloquear os demais a
 * impediria de encaixar alguem cujo contrato ainda esta sendo preparado.
 * Quem tem contrato aparece primeiro.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { normalizeCpf } from "@/lib/cpf";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const busca = (searchParams.get("busca") ?? "").trim();

  const where = busca
    ? {
        OR: [
          { fullName: { contains: busca, mode: "insensitive" as const } },
          { cpf: { contains: normalizeCpf(busca) || busca } },
        ],
      }
    : {};

  const pacientes = await prisma.patient.findMany({
    where,
    orderBy: { fullName: "asc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      cpf: true,
      phone: true,
      _count: { select: { contracts: true, agendamentos: true } },
    },
  });

  const lista = pacientes.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    cpf: p.cpf,
    phone: p.phone,
    temContrato: p._count.contracts > 0,
    totalAgendamentos: p._count.agendamentos,
  }));

  // Quem ja tem contrato primeiro, mantendo a ordem alfabetica dentro de cada grupo.
  lista.sort((a, b) => Number(b.temContrato) - Number(a.temContrato));

  return NextResponse.json({ pacientes: lista });
}
