import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAnamnesisNotificationEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { submitAnamnesisSchema } from "@/lib/validate";
import { ZodError } from "zod";

/** Nome tecnico do campo -> como o paciente o ve no formulario. */
const NOMES_DE_CAMPO: Record<string, string> = {
  fullName: "nome completo",
  email: "e-mail",
  phone: "telefone",
  cpf: "CPF",
  birthDate: "data de nascimento",
  lgpdConsent: "consentimento",
  templateId: "formulario",
};

export async function POST(req: NextRequest) {
  // Rate limit conservador: 3 envios por hora por IP
  const ip = getClientIp(req);
  if (!checkRateLimit(`submit-anamnese:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." },
      { status: 429 }
    );
  }

  // Limite de payload: 512KB
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 512_000) {
    return NextResponse.json(
      { error: "Dados enviados excedem o tamanho permitido." },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler os dados enviados." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = submitAnamnesisSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      const primeiro = e.issues[0];
      // Rede de seguranca: se escapar alguma mensagem interna do Zod (do tipo
      // "Invalid input: expected string, received undefined"), o paciente ve
      // um texto util em vez do jargao da biblioteca. Este formulario e
      // preenchido por quem esta buscando acolhimento, nao por um dev.
      const mensagemInterna =
        !primeiro?.message || /^invalid input|^expected |^required$/i.test(primeiro.message);
      const chave = primeiro?.path?.filter((p) => typeof p === "string").pop() as
        | string
        | undefined;
      const campo = chave ? NOMES_DE_CAMPO[chave] : undefined;
      const erro = mensagemInterna
        ? campo
          ? `Confira o campo ${campo} e tente novamente.`
          : "Confira os dados preenchidos e tente novamente."
        : primeiro.message;

      return NextResponse.json({ error: erro }, { status: 400 });
    }
    throw e;
  }

  const { personalInfo, answers, templateId, lgpdConsent } = parsed;
  // CPF ja normalizado (so digitos) pelo schema
  const cleanCpf = personalInfo.cpf;

  try {
    // Verifica paciente existente com CPF normalizado
    const existingPatient = await prisma.patient.findFirst({
      where: { cpf: cleanCpf },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existingPatient && existingPatient.submissions.length > 0) {
      return NextResponse.json(
        {
          error:
            "Sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane Souza Oliveira de Andrade.",
          alreadySubmitted: true,
          submissionId: existingPatient.submissions[0].id,
        },
        { status: 409 }
      );
    }

    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modelo de anamnese não encontrado." },
        { status: 404 }
      );
    }

    // Cria ou atualiza o paciente com CPF sempre normalizado (so digitos)
    let patient = existingPatient;
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate || "",
          cpf: cleanCpf,
          gender: personalInfo.gender || "",
          occupation: personalInfo.occupation || "",
          maritalStatus: personalInfo.maritalStatus || "",
        },
        include: { submissions: true },
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate || patient.birthDate,
          gender: personalInfo.gender || patient.gender,
          occupation: personalInfo.occupation || patient.occupation,
          maritalStatus: personalInfo.maritalStatus || patient.maritalStatus,
        },
        include: { submissions: true },
      });
    }

    const submission = await prisma.anamnesisSubmission.create({
      data: {
        patientId: patient.id,
        templateId: template.id,
        templateVersion: template.version,
        templateSnapshot: template.sections,
        answers: JSON.stringify(answers),
        status: "pending",
        lgpdConsent: lgpdConsent,
        lgpdConsentAt: lgpdConsent ? new Date() : null,
      },
    });

    // Email de notificacao assincrono
    const adminUser = await prisma.user.findFirst();
    const recipientEmail =
      adminUser?.notificationEmail || "enaoj22@gmail.com";

    const chiefComplaint =
      (answers["q_motivo"] as string) ||
      (answers["motivo"] as string) ||
      (answers["queixa"] as string) ||
      (Object.values(answers)[0] as string) ||
      "";

    sendAnamnesisNotificationEmail({
      patientName: personalInfo.fullName,
      patientEmail: personalInfo.email,
      patientPhone: personalInfo.phone,
      // CPF removido do email: dado sensivel nao deve trafegar por Gmail
      templateTitle: template.title,
      submissionId: submission.id,
      chiefComplaint:
        typeof chiefComplaint === "string"
          ? chiefComplaint.slice(0, 300)
          : "",
      recipientEmail,
    }).catch((err) => {
      console.error("Falha no envio de email de notificacao:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Anamnese enviada com sucesso.",
      submissionId: submission.id,
      patientId: patient.id,
    });
  } catch (error) {
    console.error("Erro ao processar envio de anamnese:", error);
    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao salvar sua anamnese. Por favor, tente novamente.",
      },
      { status: 500 }
    );
  }
}
