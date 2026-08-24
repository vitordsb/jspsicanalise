-- Assinatura eletronica do contrato pelo paciente.
--
-- signedText guarda o documento inteiro como texto, congelado no instante da
-- assinatura, e signedTextHash o SHA-256 dele. Esse par e o que da valor
-- probatorio: o contrato e montado de dezenas de campos do banco, entao sem
-- congelar, editar qualquer campo depois mudaria em silencio o documento que
-- a pessoa assinou, e a assinatura deixaria de provar o que quer que seja.
ALTER TABLE "Contract"
  ADD COLUMN IF NOT EXISTS "signatureMethod"  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "issuedAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "issuedByName"     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "signedAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "signerName"       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "signerCpf"        TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "signerIp"         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "signerUserAgent"  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "signedText"       TEXT,
  ADD COLUMN IF NOT EXISTS "signedTextHash"   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "verificationCode" TEXT DEFAULT '';

-- Busca pelo codigo impresso numa folha, para conferir autenticidade.
CREATE INDEX IF NOT EXISTS "Contract_verificationCode_idx"
  ON "Contract"("verificationCode");
