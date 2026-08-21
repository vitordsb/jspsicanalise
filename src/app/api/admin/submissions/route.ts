import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { varreduraOportunista } from "@/lib/limpeza-anamneses";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  // Complementa o cron diario para o prazo de 24 horas valer de fato.
  varreduraOportunista();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10))
    );

    const whereClause: Record<string, unknown> = {};

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      // mode: "insensitive" e obrigatorio no Postgres para busca case-insensitive
      whereClause.OR = [
        {
          patient: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
        {
          patient: {
            cpf: { contains: search, mode: "insensitive" },
          },
        },
        {
          patient: {
            phone: { contains: search, mode: "insensitive" },
          },
        },
        {
          patient: {
            email: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [total, submissions] = await Promise.all([
      prisma.anamnesisSubmission.count({ where: whereClause }),
      prisma.anamnesisSubmission.findMany({
        where: whereClause,
        include: {
          patient: true,
          template: {
            select: { id: true, title: true, version: true },
          },
          contracts: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const formatted = submissions.map((sub) => {
      let answersObj: Record<string, unknown> = {};
      let snapshotObj: unknown[] = [];

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

      const chiefComplaint =
        (answersObj["q_motivo"] as string) ||
        (answersObj["motivo"] as string) ||
        (answersObj["queixa"] as string) ||
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
        chiefComplaint:
          typeof chiefComplaint === "string"
            ? chiefComplaint
            : JSON.stringify(chiefComplaint),
        status: sub.status,
        clinicalNotes: sub.clinicalNotes || "",
        lgpdConsent: sub.lgpdConsent,
        lgpdConsentAt: sub.lgpdConsentAt,
        reviewedAt: sub.reviewedAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        contracts: sub.contracts,
      };
    });

    return NextResponse.json({
      data: formatted,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Erro ao listar submissoes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissoes." },
      { status: 500 }
    );
  }
}
