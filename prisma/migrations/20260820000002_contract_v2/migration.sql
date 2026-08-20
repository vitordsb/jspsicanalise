-- Migration: reestrutura Contract, expande Patient, adiciona lgpdConsentNote,
--            corrige dados legados de User e marca submissoes pre-LGPD.

-- =============================================================================
-- 1. User: adiciona cpfCnpj e corrige dados legados salvos no banco
-- =============================================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cpfCnpj" TEXT NOT NULL DEFAULT '';

-- Corrige nome antigo (pode estar salvo do seed anterior), CRP inventado
-- e nomes de clinica inventados pelo sistema.
UPDATE "User"
SET
  "name"      = 'Dra. Joane Souza Oliveira de Andrade',
  "crp"       = '',
  "clinicName" = '',
  "notificationEmail" = 'enaoj22@gmail.com'
WHERE
  "name"  = 'Dra. Joane Silva'
  OR "crp" LIKE '%12345%'
  OR "crp" LIKE 'Reg.%';

-- Limpa nomes de clinica inventados em qualquer registro, independente do nome do usuario
UPDATE "User"
SET "clinicName" = ''
WHERE "clinicName" LIKE 'JS Psica%'
   OR "clinicName" = 'Joane Andrade Psicanalise';

-- =============================================================================
-- 2. Patient: campos novos para qualificacao no contrato
-- =============================================================================

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'brasileiro(a)';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "rg"          TEXT DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "address"     TEXT DEFAULT '';

-- =============================================================================
-- 3. AnamnesisSubmission: nota de auditoria para pre-migracao LGPD
-- =============================================================================

ALTER TABLE "AnamnesisSubmission" ADD COLUMN IF NOT EXISTS "lgpdConsentNote" TEXT;

-- Marca registros antigos que ficaram com lgpdConsent = false por causa do
-- DEFAULT da migration anterior. NAO altera lgpdConsent (nao ha como fabricar
-- consentimento que nao foi coletado). O campo note deixa rastreavel a origem.
UPDATE "AnamnesisSubmission"
SET "lgpdConsentNote" = 'pre-migracao-lgpd-2026-08-20: consentimento nao foi coletado antes da implementacao do modulo LGPD. Obter consentimento retroativo do paciente se necessario.'
WHERE "lgpdConsent" = false AND "lgpdConsentNote" IS NULL;

-- =============================================================================
-- 4. Contract: adiciona novos campos, migra sessionPrice Float -> sessionPriceCents Int,
--              remove campos substituidos
-- =============================================================================

-- 4a. Novos campos - contratada
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "therapistCpfCnpj"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "therapistPhone"         TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "professionalDocType"    TEXT NOT NULL DEFAULT 'nenhum';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "professionalDocNumber"  TEXT NOT NULL DEFAULT '';

-- Migra therapistDoc -> professionalDocNumber (preserva valor existente se nao-vazio)
UPDATE "Contract"
SET "professionalDocNumber" = "therapistDoc"
WHERE "therapistDoc" IS NOT NULL AND "therapistDoc" != '';

-- Remove therapistDoc (substituido)
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "therapistDoc";

-- 4b. Novos campos - contratante snapshot
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientFullName"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientNationality"   TEXT NOT NULL DEFAULT 'brasileiro(a)';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientMaritalStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientOccupation"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientRg"            TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientCpf"           TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "patientAddress"       TEXT NOT NULL DEFAULT '';

-- Pre-popula snapshot dos contratos existentes a partir do paciente
UPDATE "Contract" c
SET
  "patientFullName"      = p."fullName",
  "patientNationality"   = COALESCE(p."nationality", 'brasileiro(a)'),
  "patientMaritalStatus" = COALESCE(p."maritalStatus", ''),
  "patientOccupation"    = COALESCE(p."occupation", ''),
  "patientCpf"           = p."cpf"
FROM "Patient" p
WHERE c."patientId" = p."id";

-- 4c. Novos campos - objeto
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "serviceType" TEXT NOT NULL DEFAULT 'psicanalise_clinica';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "modalidade"  TEXT NOT NULL DEFAULT 'online';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "abordagem"   TEXT NOT NULL DEFAULT '';

-- 4d. Novos campos - sessoes
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "cancellationHours"    INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "initialSessionsCount" INTEGER NOT NULL DEFAULT 3;

-- 4e. Pagamento: migra Float -> centavos (Int)
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "sessionPriceCents"    INTEGER NOT NULL DEFAULT 18000;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "evaluationPriceCents" INTEGER;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentDueDay"        INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "lateFeePercent"       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "lateInterestPercent"  INTEGER NOT NULL DEFAULT 0;

-- Converte sessionPrice Float existente -> centavos
UPDATE "Contract"
SET "sessionPriceCents" = ROUND("sessionPrice" * 100)::INTEGER
WHERE "sessionPrice" IS NOT NULL AND "sessionPrice" > 0;

-- Remove sessionPrice Float (substituido)
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "sessionPrice";

-- 4f. Vigencia e rescisao
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "rescissionNoticeDays" INTEGER NOT NULL DEFAULT 30;

-- 4g. Foro
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "foroCidade" TEXT NOT NULL DEFAULT '';

-- 4h. Testemunhas
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "hasWitnesses" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "witness1Name" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "witness1Cpf"  TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "witness2Name" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "witness2Cpf"  TEXT;

-- 4i. Clausulas extras
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "customClauses" TEXT DEFAULT '';

-- =============================================================================
-- 5. Contract: maquina de estados para assinatura manual
--    Status anterior: draft | generated | signed
--    Status novo:     rascunho | gerado | aguardando_assinatura |
--                     assinado_recebido | aprovado | recusado
-- =============================================================================

-- Migra status antigos para o novo vocabulario
UPDATE "Contract" SET "status" = 'rascunho'   WHERE "status" = 'draft';
UPDATE "Contract" SET "status" = 'gerado'      WHERE "status" = 'generated';
-- 'signed' era o estado final; mapeia para 'aprovado' (mais proximo semanticamente)
UPDATE "Contract" SET "status" = 'aprovado'    WHERE "status" = 'signed';

-- Campos para rastreamento do arquivo assinado fisicamente
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedFileKey"         TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedFileHash"        TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedFileSizeBytes"   INTEGER;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedFileUploadedAt"  TIMESTAMP(3);
-- Versao incrementada a cada novo upload (paciente pode reenviar apos recusa)
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedVersion"         INTEGER NOT NULL DEFAULT 0;

-- Campos de decisao
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "decisionAt"    TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "refusalReason" TEXT;

-- =============================================================================
-- 6. ContractEvent: historico imutavel de transicoes de status (audit trail)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ContractEvent" (
  "id"         TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus"   TEXT NOT NULL,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractEvent_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ContractEvent_contractId_idx" ON "ContractEvent"("contractId");
