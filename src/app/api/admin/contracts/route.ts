import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { createContractSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const status    = searchParams.get("status");
    const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip      = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (patientId) whereClause.patientId = patientId;
    if (status)    whereClause.status    = status;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: whereClause,
        include: {
          patient: true,
          submission: {
            select: { id: true, createdAt: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: contracts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erro ao listar contratos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contratos." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    parsed = createContractSchema.parse(body);
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
    // Busca dados do admin para preencher campos da contratada se omitidos
    const admin = await prisma.user.findFirst();

    // Busca dados do paciente para pre-popular snapshot
    const patient = await prisma.patient.findUnique({
      where: { id: parsed.patientId },
    });
    if (!patient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    const contract = await prisma.contract.create({
      data: {
        patientId:    parsed.patientId,
        submissionId: parsed.submissionId ?? null,

        title:  parsed.title  ?? "Contrato de Prestacao de Servicos Psicanaliticos",
        status: parsed.status ?? "rascunho",

        // Contratada
        therapistName:         parsed.therapistName         ?? admin?.name    ?? "Dra. Joane Souza Oliveira de Andrade",
        therapistCpfCnpj:      parsed.therapistCpfCnpj      ?? admin?.cpfCnpj ?? "",
        therapistAddress:      parsed.therapistAddress      ?? admin?.address  ?? "",
        therapistPhone:        parsed.therapistPhone        ?? admin?.phone    ?? "",
        professionalDocType:   parsed.professionalDocType   ?? "nenhum",
        // Nao ha default inventado para numero de registro
        professionalDocNumber: parsed.professionalDocNumber ?? admin?.crp ?? "",

        // Contratante snapshot
        patientFullName:      parsed.patientFullName      ?? patient.fullName,
        patientNationality:   parsed.patientNationality   ?? patient.nationality ?? "brasileiro(a)",
        patientMaritalStatus: parsed.patientMaritalStatus ?? patient.maritalStatus ?? "",
        patientOccupation:    parsed.patientOccupation    ?? patient.occupation ?? "",
        patientRg:            parsed.patientRg            ?? patient.rg ?? "",
        patientCpf:           parsed.patientCpf           ?? patient.cpf,
        patientAddress:       parsed.patientAddress       ?? patient.address ?? "",

        // Objeto
        serviceType: parsed.serviceType ?? "psicanalise_clinica",
        modalidade:  parsed.modalidade  ?? "online",
        abordagem:   parsed.abordagem   ?? "",

        // Sessoes
        durationMinutes:      parsed.durationMinutes      ?? 50,
        frequency:            parsed.frequency            ?? "Semanal (1x por semana)",
        cancellationHours:    parsed.cancellationHours    ?? 24,
        initialSessionsCount: parsed.initialSessionsCount ?? 3,

        // Pagamento
        sessionPriceCents:    parsed.sessionPriceCents    ?? 18000,
        evaluationPriceCents: parsed.evaluationPriceCents ?? null,
        paymentDueDay:        parsed.paymentDueDay        ?? 5,
        lateFeePercent:       parsed.lateFeePercent       ?? 0,
        lateInterestPercent:  parsed.lateInterestPercent  ?? 0,
        paymentMethod:        parsed.paymentMethod        ?? "PIX",

        // Vigencia
        rescissionNoticeDays: parsed.rescissionNoticeDays ?? 30,

        // Foro
        foroCidade: parsed.foroCidade ?? "",

        // Testemunhas
        hasWitnesses: parsed.hasWitnesses ?? false,
        witness1Name: parsed.witness1Name ?? null,
        witness1Cpf:  parsed.witness1Cpf  ?? null,
        witness2Name: parsed.witness2Name ?? null,
        witness2Cpf:  parsed.witness2Cpf  ?? null,

        // Clausulas extras
        customClauses: parsed.customClauses ?? "",
      },
      include: {
        patient: true,
        submission: true,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json(
      { error: "Erro ao gerar contrato." },
      { status: 500 }
    );
  }
}
