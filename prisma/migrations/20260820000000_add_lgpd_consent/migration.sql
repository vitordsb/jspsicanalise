-- Migration: adiciona consentimento LGPD e normaliza CPF

-- 1. Adiciona campos de consentimento LGPD em AnamnesisSubmission
ALTER TABLE "AnamnesisSubmission" ADD COLUMN "lgpdConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AnamnesisSubmission" ADD COLUMN "lgpdConsentAt" TIMESTAMP(3);

-- 2. Normaliza CPFs existentes: remove toda formatacao, deixa so digitos.
--    ATENCAO: execute isso com cuidado em producao. Verifique duplicatas antes:
--      SELECT REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS cpf_limpo, COUNT(*)
--      FROM "Patient" GROUP BY cpf_limpo HAVING COUNT(*) > 1;
UPDATE "Patient"
SET cpf = REGEXP_REPLACE(cpf, '[^0-9]', '', 'g')
WHERE cpf ~ '[^0-9]';
