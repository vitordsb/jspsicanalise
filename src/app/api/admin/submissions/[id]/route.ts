import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { updateSubmissionSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;

    const submission = await prisma.anamnesisSubmission.findUnique({
      where: { id },
      include: {
        patient: true,
        template: true,
        contracts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submissao nao encontrada." },
        { status: 404 }
      );
    }

    let answersObj: Record<string, unknown> = {};
    let snapshotObj: unknown[] = [];

    try {
      answersObj = JSON.parse(submission.answers);
    } catch {}

    try {
      snapshotObj = JSON.parse(submission.templateSnapshot);
    } catch {}

    return NextResponse.json({
      id: submission.id,
      patientId: submission.patientId,
      patient: submission.patient,
      templateId: submission.templateId,
      templateTitle: submission.template.title,
      templateVersion: submission.templateVersion,
      templateSnapshot: snapshotObj,
      answers: answersObj,
      status: submission.status,
      clinicalNotes: submission.clinicalNotes,
      lgpdConsent: submission.lgpdConsent,
      lgpdConsentAt: submission.lgpdConsentAt,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      contracts: submission.contracts,
    });
  } catch (error) {
    console.error("Erro ao buscar submissao:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissao." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    parsed = updateSubmissionSchema.parse(body);
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
    const dataToUpdate: Record<string, unknown> = {};

    if (parsed.status !== undefined) {
      dataToUpdate.status = parsed.status;
      if (parsed.status === "in_review" || parsed.status === "approved") {
        dataToUpdate.reviewedAt = new Date();
      }
    }
    if (parsed.clinicalNotes !== undefined) {
      dataToUpdate.clinicalNotes = parsed.clinicalNotes;
    }

    const updated = await prisma.anamnesisSubmission.update({
      where: { id },
      data: dataToUpdate,
      include: {
        patient: true,
        contracts: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar submissao:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar submissao." },
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
    await prisma.anamnesisSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar submissao:", error);
    return NextResponse.json(
      { error: "Erro ao deletar submissao." },
      { status: 500 }
    );
  }
}
