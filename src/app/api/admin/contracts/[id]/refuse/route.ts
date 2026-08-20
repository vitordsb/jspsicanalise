/**
 * POST /api/admin/contracts/[id]/refuse
 *
 * Recusa o contrato assinado recebido, exigindo um motivo nao-vazio.
 * O arquivo NAO e excluido (fica arquivado para rastreabilidade).
 * O paciente pode reenviar um novo arquivo apos a recusa.
 *
 * Status requerido: assinado_recebido
 * Transicao: assinado_recebido -> recusado
 *
 * Body: { "reason": "Motivo da recusa (min 5 chars)" }
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import {
  refuseContractSchema,
  isValidTransition,
  type ContractStatus,
} from "@/lib/validate";
import { ZodError } from "zod";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisicao invalido." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = refuseContractSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "Motivo da recusa invalido." },
        { status: 400 }
      );
    }
    throw e;
  }

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
  const toStatus: ContractStatus = "recusado";

  if (!isValidTransition(fromStatus, toStatus)) {
    return NextResponse.json(
      {
        error: `Nao e possivel recusar um contrato com status "${fromStatus}". Requerido: assinado_recebido.`,
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
          note:       `Recusado pela Dra. Joane. Motivo: ${parsed.reason}`,
        },
      });

      return tx.contract.update({
        where: { id },
        data: {
          status:        toStatus,
          decisionAt:    now,
          refusalReason: parsed.reason,
        },
        include: {
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Erro ao recusar contrato:", err);
    return NextResponse.json(
      { error: "Erro interno ao recusar o contrato." },
      { status: 500 }
    );
  }
}
