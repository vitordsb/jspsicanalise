-- Agendamento pelo link publico /agendar, sem anamnese previa.
--
-- O pedido fica numa tabela propria ate a pessoa confirmar pelo e-mail. So
-- depois da confirmacao nasce o Patient (se o CPF for novo) e o Agendamento.
-- Assim digitacao errada e robo nao poluem a lista de pacientes nem seguram a
-- agenda da Joane para sempre: o pedido vence sozinho.
CREATE TABLE IF NOT EXISTS "PedidoAgendamento" (
  "id"             TEXT NOT NULL,
  "tokenHash"      TEXT NOT NULL,
  "nome"           TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "telefone"       TEXT NOT NULL,
  "cpf"            TEXT NOT NULL,
  "inicioEm"       TIMESTAMP(3) NOT NULL,
  "duracaoMinutos" INTEGER NOT NULL DEFAULT 50,
  "expiraEm"       TIMESTAMP(3) NOT NULL,
  "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PedidoAgendamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PedidoAgendamento_tokenHash_key" ON "PedidoAgendamento"("tokenHash");
CREATE INDEX IF NOT EXISTS "PedidoAgendamento_cpf_idx" ON "PedidoAgendamento"("cpf");
CREATE INDEX IF NOT EXISTS "PedidoAgendamento_expiraEm_idx" ON "PedidoAgendamento"("expiraEm");
CREATE INDEX IF NOT EXISTS "PedidoAgendamento_inicioEm_idx" ON "PedidoAgendamento"("inicioEm");

-- Quando a Joane pediu a anamnese por e-mail para quem marcou sem preencher.
ALTER TABLE "Agendamento" ADD COLUMN IF NOT EXISTS "anamneseSolicitadaEm" TIMESTAMP(3);
