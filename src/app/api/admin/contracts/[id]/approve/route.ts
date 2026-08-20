/**
 * POST /api/admin/contracts/[id]/approve
 *
 * Aprova o contrato assinado recebido.
 * Status requerido: assinado_recebido
 * Transicao: assinado_recebido -> aprovado
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { isValidTransition, type ContractStatus } from "@/lib/validate";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contrato nao encontrado." },
      { status: 404 }
    );
  }

  const fromStatus = contract.status as ContractStatus;
  const toStatus: ContractStatus = "aprovado";

  if (!isValidTransition(fromStatus, toStatus)) {
    return NextResponse.json(
      {
        error: `Nao e possivel aprovar um contrato com status "${fromStatus}". Requerido: assinado_recebido.`,
      },
      { status: 422 }
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.contractEvent.create({
        data: {
          id:         randomUUID(),
          contractId: id,
          fromStatus,
          toStatus,
          note:       "Contrato aprovado pela Dra. Joane.",
        },
      });

      return tx.contract.update({
        where: { id },
        data: {
          status:     toStatus,
          decisionAt: now,
          // Garante que nao sobra motivo de recusa anterior
          refusalReason: null,
        },
        include: {
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Erro ao aprovar contrato:", err);
    return NextResponse.json(
      { error: "Erro interno ao aprovar o contrato." },
      { status: 500 }
    );
  }
}
