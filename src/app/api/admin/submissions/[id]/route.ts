import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: "Submissão não encontrada" }, { status: 404 });
    }

    let answersObj = {};
    let snapshotObj = [];

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
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      contracts: submission.contracts,
    });
  } catch (error) {
    console.error("Erro ao buscar submissão:", error);
    return NextResponse.json({ error: "Erro ao buscar submissão" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, clinicalNotes } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === "in_review" || status === "approved") {
        dataToUpdate.reviewedAt = new Date();
      }
    }
    if (clinicalNotes !== undefined) {
      dataToUpdate.clinicalNotes = clinicalNotes;
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
    console.error("Erro ao atualizar submissão:", error);
    return NextResponse.json({ error: "Erro ao atualizar submissão" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.anamnesisSubmission.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar submissão:", error);
    return NextResponse.json({ error: "Erro ao deletar submissão" }, { status: 500 });
  }
}
