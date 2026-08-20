-- Migration: corrige o default de User.notificationEmail
-- Troca o placeholder "joane@psicanalise.com.br" pelo email real de notificacao.
-- Registros existentes que ainda tiverem o placeholder antigo sao atualizados.

ALTER TABLE "User"
  ALTER COLUMN "notificationEmail"
  SET DEFAULT 'enaoj22@gmail.com';

-- Atualiza registros que ainda usam o placeholder antigo
UPDATE "User"
SET "notificationEmail" = 'enaoj22@gmail.com'
WHERE "notificationEmail" = 'joane@psicanalise.com.br';
