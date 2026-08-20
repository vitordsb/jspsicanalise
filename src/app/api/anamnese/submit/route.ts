import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAnamnesisNotificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personalInfo, answers, templateId } = body;

    if (!personalInfo || !answers || !templateId) {
      return NextResponse.json(
        { error: "Dados incompletos para envio da anamnese." },
        { status: 400 }
      );
    }

    const { fullName, email, phone, birthDate, cpf, gender, occupation, maritalStatus } = personalInfo;

    if (!fullName || !email || !phone || !cpf) {
      return NextResponse.json(
        { error: "Nome, e-mail, telefone e CPF são campos obrigatórios." },
        { status: 400 }
      );
    }

    const cleanCpf = cpf.trim();

    // 1. Verifica se paciente com esse CPF já tem uma submissão
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { cpf: cleanCpf },
          { cpf: cleanCpf.replace(/\D/g, "") },
        ],
      },
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
          error: "Sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane Silva.",
          alreadySubmitted: true,
          submissionId: existingPatient.submissions[0].id,
          patientName: existingPatient.fullName,
        },
        { status: 409 }
      );
    }

    // 2. Busca o template da anamnese para salvar o snapshot fiel
    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modelo de anamnese não encontrado." },
        { status: 404 }
      );
    }

    // 3. Cria ou atualiza o paciente
    let patient = existingPatient;
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName,
          email,
          phone,
          birthDate: birthDate || "",
          cpf: cleanCpf,
          gender: gender || "",
          occupation: occupation || "",
          maritalStatus: maritalStatus || "",
        },
        include: { submissions: true },
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName,
          email,
          phone,
          birthDate: birthDate || patient.birthDate,
          gender: gender || patient.gender,
          occupation: occupation || patient.occupation,
          maritalStatus: maritalStatus || patient.maritalStatus,
        },
        include: { submissions: true },
      });
    }

    // 4. Cria a submissão de anamnese com snapshot
    const submission = await prisma.anamnesisSubmission.create({
      data: {
        patientId: patient.id,
        templateId: template.id,
        templateVersion: template.version,
        templateSnapshot: template.sections,
        answers: JSON.stringify(answers),
        status: "pending",
      },
    });

    // 5. Busca configuração do admin para pegar o email de notificação
    const adminUser = await prisma.user.findFirst();
    const recipientEmail = adminUser?.notificationEmail || "joane@psicanalise.com.br";

    // Extrai a queixa principal para destacar no email
    const chiefComplaint =
      answers["q_motivo"] ||
      answers["motivo"] ||
      answers["queixa"] ||
      Object.values(answers)[0] ||
      "";

    // 6. Envia email assíncrono para Joane
    sendAnamnesisNotificationEmail({
      patientName: fullName,
      patientEmail: email,
      patientPhone: phone,
      patientCpf: cleanCpf,
      templateTitle: template.title,
      submissionId: submission.id,
      chiefComplaint: typeof chiefComplaint === "string" ? chiefComplaint.slice(0, 300) : "",
      recipientEmail,
    }).catch((err) => {
      console.error("Falha silenciosa no envio de email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Anamnese enviada com sucesso!",
      submissionId: submission.id,
      patientId: patient.id,
      patientName: patient.fullName,
    });
  } catch (error) {
    console.error("Erro ao processar envio de anamnese:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao salvar sua anamnese. Por favor, tente novamente." },
      { status: 500 }
    );
  }
}
