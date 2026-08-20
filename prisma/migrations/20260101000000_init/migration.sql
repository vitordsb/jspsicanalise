-- Migration baseline: estado inicial do schema (aplicado via db push)
-- Esta migration documenta o estado pre-existente do banco.
-- Para marcar como aplicada sem re-executar: prisma migrate resolve --applied 20260101000000_init

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "title" TEXT NOT NULL DEFAULT 'Psicanalista Clinica',
    "crp" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "notificationEmail" TEXT NOT NULL DEFAULT 'joane@psicanalise.com.br',
    "clinicName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnamnesisTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sections" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnamnesisTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "gender" TEXT DEFAULT '',
    "occupation" TEXT DEFAULT '',
    "maritalStatus" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnamnesisSubmission" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "templateSnapshot" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "clinicalNotes" TEXT DEFAULT '',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnamnesisSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "submissionId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Contrato de Prestacao de Servicos Psicanaliticos',
    "therapistName" TEXT NOT NULL DEFAULT 'Dra. Joane Souza Oliveira de Andrade',
    "therapistDoc" TEXT NOT NULL DEFAULT '',
    "therapistAddress" TEXT NOT NULL DEFAULT 'Atendimento Online e Consultorio',
    "sessionPrice" DOUBLE PRECISION NOT NULL DEFAULT 180.0,
    "frequency" TEXT NOT NULL DEFAULT 'Semanal (1x por semana)',
    "durationMinutes" INTEGER NOT NULL DEFAULT 50,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PIX ou Transferencia Bancaria ate o dia 05 de cada mes',
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'Desmarcacoes ou reagendamentos devem ser comunicados com no minimo 24 horas de antecedencia. Faltas sem aviso previo serao cobradas normalmente.',
    "customClauses" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");

-- AddForeignKey
ALTER TABLE "AnamnesisSubmission" ADD CONSTRAINT "AnamnesisSubmission_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisSubmission" ADD CONSTRAINT "AnamnesisSubmission_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "AnamnesisTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "AnamnesisSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
