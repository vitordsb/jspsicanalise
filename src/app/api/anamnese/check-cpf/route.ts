import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf } = body;

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    // Busca paciente com o CPF limpo ou formatado
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { cpf: cleanCpf },
          { cpf: cpf },
        ],
      },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (patient && patient.submissions.length > 0) {
      const latestSubmission = patient.submissions[0];
      return NextResponse.json({
        exists: true,
        patientName: patient.fullName,
        submissionId: latestSubmission.id,
        status: latestSubmission.status,
        createdAt: latestSubmission.createdAt,
        message: "Identificamos que sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane Silva.",
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json({ error: "Erro interno ao consultar CPF" }, { status: 500 });
  }
}
