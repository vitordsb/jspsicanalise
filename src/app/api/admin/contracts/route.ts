import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    const whereClause: any = {};
    if (patientId) {
      whereClause.patientId = patientId;
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        patient: true,
        submission: {
          select: { id: true, createdAt: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Erro ao listar contratos:", error);
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      submissionId,
      title,
      therapistName,
      therapistDoc,
      therapistAddress,
      sessionPrice,
      frequency,
      durationMinutes,
      paymentMethod,
      cancellationPolicy,
      customClauses,
      status,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "ID do paciente é obrigatório" }, { status: 400 });
    }

    // Busca dados do terapeuta do usuário admin se não fornecidos
    const admin = await prisma.user.findFirst();

    const contract = await prisma.contract.create({
      data: {
        patientId,
        submissionId: submissionId || null,
        title: title || "Contrato de Prestação de Serviços Psicanalíticos",
        therapistName: therapistName || admin?.name || "Joane Silva",
        therapistDoc: therapistDoc || admin?.crp || "Reg. Psicanálise 12345/BR",
        therapistAddress: therapistAddress || admin?.address || "Atendimento Online e Consultório",
        sessionPrice: Number(sessionPrice) || 180.0,
        frequency: frequency || "Semanal (1x por semana)",
        durationMinutes: Number(durationMinutes) || 50,
        paymentMethod: paymentMethod || "PIX ou Transferência Bancária até o dia 05 de cada mês",
        cancellationPolicy: cancellationPolicy || "Desmarcações ou reagendamentos devem ser comunicados com no mínimo 24 horas de antecedência.",
        customClauses: customClauses || "",
        status: status || "draft",
      },
      include: {
        patient: true,
        submission: true,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json({ error: "Erro ao gerar contrato" }, { status: 500 });
  }
}
