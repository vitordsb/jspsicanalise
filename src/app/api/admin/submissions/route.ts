import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { patient: { fullName: { contains: search } } },
        { patient: { cpf: { contains: search } } },
        { patient: { phone: { contains: search } } },
        { patient: { email: { contains: search } } },
      ];
    }

    const submissions = await prisma.anamnesisSubmission.findMany({
      where: whereClause,
      include: {
        patient: true,
        template: {
          select: { id: true, title: true, version: true },
        },
        contracts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = submissions.map((sub) => {
      let answersObj: any = {};
      let snapshotObj: any = [];

      try {
        answersObj = JSON.parse(sub.answers);
      } catch {
        answersObj = {};
      }

      try {
        snapshotObj = JSON.parse(sub.templateSnapshot);
      } catch {
        snapshotObj = [];
      }

      // Procura resumo da queixa principal para mostrar no card do WhatsApp
      const chiefComplaint =
        answersObj["q_motivo"] ||
        answersObj["motivo"] ||
        answersObj["queixa"] ||
        "Sem queixa detalhada";

      return {
        id: sub.id,
        patientId: sub.patientId,
        patient: sub.patient,
        templateId: sub.templateId,
        templateTitle: sub.template.title,
        templateVersion: sub.templateVersion,
        templateSnapshot: snapshotObj,
        answers: answersObj,
        chiefComplaint: typeof chiefComplaint === "string" ? chiefComplaint : JSON.stringify(chiefComplaint),
        status: sub.status,
        clinicalNotes: sub.clinicalNotes || "",
        reviewedAt: sub.reviewedAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        contracts: sub.contracts,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erro ao listar submissões:", error);
    return NextResponse.json({ error: "Erro ao buscar submissões" }, { status: 500 });
  }
}
