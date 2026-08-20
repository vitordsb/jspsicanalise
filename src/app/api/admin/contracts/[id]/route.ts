import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import {
  createContractSchema,
  isValidTransition,
  type ContractStatus,
} from "@/lib/validate";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";

// Schema de atualizacao: mesmos campos do de criacao, todos opcionais
const updateContractSchema = createContractSchema.omit({ patientId: true }).partial();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        patient: true,
        submission: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contrato nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contrato." },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    parsed = updateContractSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "Dados invalidos." },
        { status: 400 }
      );
    }
    throw e;
  }

  try {
    const { id } = await params;

    // Se o status esta sendo alterado, valida a transicao
    if (parsed.status !== undefined) {
      const current = await prisma.contract.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        return NextResponse.json(
          { error: "Contrato nao encontrado." },
          { status: 404 }
        );
      }

      const fromStatus = current.status as ContractStatus;
      const toStatus   = parsed.status as ContractStatus;

      if (fromStatus !== toStatus) {
        if (!isValidTransition(fromStatus, toStatus)) {
          return NextResponse.json(
            {
              error: `Transicao invalida: ${fromStatus} -> ${toStatus}.`,
            },
            { status: 422 }
          );
        }

        // Registra evento de transicao antes de atualizar
        await prisma.contractEvent.create({
          data: {
            id:         randomUUID(),
            contractId: id,
            fromStatus,
            toStatus,
            note:       "Alteracao manual via PUT.",
          },
        });
      }
    }

    // Monta objeto de update apenas com campos enviados (sem undefined)
    const data = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v !== undefined)
    );

    const updated = await prisma.contract.update({
      where: { id },
      data,
      include: {
        patient: true,
        submission: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar contrato." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir contrato:", error);
    return NextResponse.json(
      { error: "Erro ao excluir contrato." },
      { status: 500 }
    );
  }
}
