-- Migration: adiciona campos de pagamento PIX ao User e snapshot de PIX ao Contract.
-- Os campos nascem vazios. Nenhum UPDATE preenche valores.
-- A Dra. Joane preenche pelo painel de configuracoes.

-- =============================================================================
-- 1. User: campos de pagamento PIX
-- =============================================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pixKey"        TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pixKeyType"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pixHolderName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankName"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankAgency"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankAccount"   TEXT NOT NULL DEFAULT '';

-- =============================================================================
-- 2. Contract: snapshot de PIX no momento da emissao
-- =============================================================================

ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentPixKey"        TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentPixKeyType"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentBankName"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentBankAgency"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentBankAccount"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentPixHolderName" TEXT NOT NULL DEFAULT '';
