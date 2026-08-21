-- Janelas semanais de atendimento, editaveis nas Configuracoes.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "horariosAtendimento" TEXT NOT NULL DEFAULT '[]';

-- Agenda de consultas marcadas pelo proprio paciente.
CREATE TABLE IF NOT EXISTS "Agendamento" (
  "id"                 TEXT NOT NULL,
  "patientId"          TEXT NOT NULL,
  "submissionId"       TEXT,
  "inicioEm"           TIMESTAMP(3) NOT NULL,
  "duracaoMinutos"     INTEGER NOT NULL DEFAULT 50,
  "status"             TEXT NOT NULL DEFAULT 'agendado',
  "observacao"         TEXT DEFAULT '',
  "canceladoEm"        TIMESTAMP(3),
  "motivoCancelamento" TEXT DEFAULT '',
  "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- Um horario so pode ser ocupado por uma pessoa. Checagem em codigo tem
-- corrida entre ler e gravar; a restricao no banco e o que de fato garante.
CREATE UNIQUE INDEX IF NOT EXISTS "Agendamento_inicioEm_key" ON "Agendamento"("inicioEm");
CREATE INDEX IF NOT EXISTS "Agendamento_patientId_idx" ON "Agendamento"("patientId");

ALTER TABLE "Agendamento" DROP CONSTRAINT IF EXISTS "Agendamento_patientId_fkey";
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Horarios informados pelo Vitor como ponto de partida.
UPDATE "User" SET "horariosAtendimento" = '[
  {"dia":1,"inicio":"08:00","fim":"11:00"},
  {"dia":2,"inicio":"08:00","fim":"11:00"},
  {"dia":3,"inicio":"09:00","fim":"10:00"},
  {"dia":4,"inicio":"09:00","fim":"10:00"},
  {"dia":5,"inicio":"16:00","fim":"19:00"}
]' WHERE "horariosAtendimento" = '[]' OR "horariosAtendimento" IS NULL;
