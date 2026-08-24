-- Consulta cancelada nao pode mais segurar o horario.
--
-- O indice unico anterior valia para qualquer linha, entao um agendamento
-- cancelado continuava bloqueando aquele instante para todo mundo. Na pratica
-- a Joane cancelava as 10:00 e nao conseguia remarcar ninguem para as 10:00,
-- sem nenhuma mensagem que explicasse o motivo.
--
-- O indice parcial mantem a garantia que interessa (duas pessoas nunca ocupam
-- o mesmo instante) e libera o horario assim que a consulta e cancelada.
DROP INDEX IF EXISTS "Agendamento_inicioEm_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Agendamento_inicioEm_ativo_key"
  ON "Agendamento"("inicioEm")
  WHERE "status" <> 'cancelado';

-- Pedido de remarcacao feito pelo paciente.
ALTER TABLE "Agendamento"
  ADD COLUMN IF NOT EXISTS "remarcacaoPedidaEm"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "remarcacaoMotivo"       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "remarcacaoRecusadaEm"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "remarcacaoRecusaMotivo" TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS "Agendamento_remarcacaoPedidaEm_idx"
  ON "Agendamento"("remarcacaoPedidaEm");
