import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkCpfSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  // Rate limit: 20 consultas por minuto por IP (protege enumeracao de CPF)
  const ip = getClientIp(req);
  if (!checkRateLimit(`check-cpf:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas requisicoes. Aguarde um momento." },
      { status: 429 }
    );
  }

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
    parsed = checkCpfSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "CPF invalido." },
        { status: 400 }
      );
    }
    throw e;
  }

  // CPF ja normalizado (so digitos) pelo schema Zod
  const cleanCpf = parsed.cpf;

  try {
    const patient = await prisma.patient.findFirst({
      where: { cpf: cleanCpf },
      select: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, createdAt: true },
        },
      },
    });

    if (patient && patient.submissions.length > 0) {
      const latest = patient.submissions[0];
      return NextResponse.json({
        exists: true,
        submissionId: latest.id,
        status: latest.status,
        createdAt: latest.createdAt,
        // Nota: nao retornamos nome do paciente aqui (reduz exposicao de PII)
        message:
          "Identificamos que sua anamnese ja foi enviada anteriormente e esta em analise.",
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar CPF." },
      { status: 500 }
    );
  }
}
