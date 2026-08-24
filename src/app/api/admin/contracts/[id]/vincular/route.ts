/**
 * Vinculo entre contrato avulso e anamnese.
 *
 * Existe porque a ordem real nem sempre e a do sistema: as vezes o contrato
 * sai antes de a pessoa preencher a ficha.
 *
 * GET  lista as anamneses que podem ser vinculadas.
 * POST faz o vinculo.
 * DELETE desfaz.
 *
 * TRAVA CENTRAL: so anamnese do MESMO paciente. Sem isso, um clique errado
 * grudaria a ficha clinica de uma pessoa no contrato de outra, e o contrato
 * passaria a exibir dados de quem nao assinou.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const contrato = await prisma.contract.findUnique({
    where: { id },
    select: { id: true, patientId: true, submissionId: true },
  });
  if (!contrato) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  // Anamneses do mesmo paciente que ainda nao tem contrato atrelado.
  const candidatas = await prisma.anamnesisSubmission.findMany({
    where: {
      patientId: contrato.patientId,
      contracts: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      answers: true,
      template: { select: { title: true } },
    },
  });

  return NextResponse.json({
    jaVinculado: contrato.submissionId,
    anamneses: candidatas.map((a) => {
      // Um trecho da queixa ajuda a Joane a reconhecer qual ficha e qual
      // quando o paciente preencheu mais de uma.
      let resumo = "";
      try {
        const r = JSON.parse(a.answers) as Record<string, unknown>;
        const q = r["q_motivo"] ?? r["motivo"] ?? r["queixa"];
        if (typeof q === "string") resumo = q.slice(0, 120);
      } catch {}
      return {
        id: a.id,
        titulo: a.template?.title ?? "Anamnese",
        status: a.status,
        enviadaEm: a.createdAt,
        resumo,
      };
    }),
  });
}

export async function POST(
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

  const { submissionId } = (body ?? {}) as { submissionId?: string };
  if (!submissionId) {
    return NextResponse.json({ error: "Escolha a anamnese." }, { status: 400 });
  }

  const contrato = await prisma.contract.findUnique({
    where: { id },
    select: { id: true, patientId: true },
  });
  if (!contrato) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  const anamnese = await prisma.anamnesisSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, patientId: true },
  });
  if (!anamnese) {
    return NextResponse.json({ error: "Anamnese não encontrada." }, { status: 404 });
  }

  // A trava vale mesmo com a requisicao forjada: a tela filtra, o servidor
  // confere.
  if (anamnese.patientId !== contrato.patientId) {
    return NextResponse.json(
      { error: "Esta anamnese é de outro paciente e não pode ser vinculada a este contrato." },
      { status: 409 }
    );
  }

  const atualizado = await prisma.contract.update({
    where: { id },
    data: { submissionId },
  });

  return NextResponse.json({ success: true, contrato: atualizado });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.contract.update({ where: { id }, data: { submissionId: null } });
  return NextResponse.json({ success: true });
}
