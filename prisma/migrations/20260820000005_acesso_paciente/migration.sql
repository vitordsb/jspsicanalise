-- Acesso do paciente a propria area.
-- Apenas o hash do token e armazenado. Pacientes cadastrados antes desta
-- migracao ficam sem token ate a Joane emitir um pelo painel.
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "accessTokenHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "accessTokenAt" TIMESTAMP(3);
