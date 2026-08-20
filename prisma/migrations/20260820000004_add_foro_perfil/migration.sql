-- Comarca do foro no perfil da profissional.
-- O foro de eleicao acompanha quem presta o servico, nao o domicilio do
-- paciente, entao o valor vive no perfil e os contratos herdam dele.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "foroCidade" TEXT NOT NULL DEFAULT 'Cotia';

-- Contratos ainda nao assinados passam a apontar para a comarca da
-- profissional. Contrato ja assinado nao e tocado: vale o que foi impresso.
UPDATE "Contract"
SET "foroCidade" = 'Cotia'
WHERE ("foroCidade" IS NULL OR "foroCidade" = '')
  AND "status" IN ('rascunho', 'gerado', 'aguardando_assinatura');
