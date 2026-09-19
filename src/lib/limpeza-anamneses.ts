/**
 * Regra das 24 horas: anamnese sem consulta marcada e removida.
 *
 * EXCECAO QUE NAO PODE SER REMOVIDA SEM CONVERSAR COM A JOANE:
 * ficha com sinalizacao de ideacao suicida ou autolesao recente nunca e
 * apagada. Quem esta em crise e justamente quem tem menos condicao de agendar
 * dentro do prazo, e descartar esse registro faria o sistema jogar fora a
 * informacao mais importante que ele coleta.
 *
 * Roda por dois caminhos: o cron diario da Vercel (limite do plano Hobby) e
 * uma varredura oportunista quando a Joane abre o painel, no maximo uma vez
 * por hora. Sem a segunda, uma ficha viveria ate 48 horas em vez de 24.
 */

import { prisma } from "./prisma";
import { temSinalDeRisco } from "./risco-clinico";

let ultimaVarredura = 0;
const INTERVALO_OPORTUNISTA_MS = 60 * 60 * 1000;

// Reexportado por compatibilidade: quem ja importava temSinalDeRisco daqui
// (testes, este proprio arquivo) continua funcionando. A implementacao real
// vive em src/lib/risco-clinico.ts, sem dependencia de Prisma, porque
// tambem e usada em componente "use client" (destaque no painel e banner de
// acolhimento pro paciente).
export { temSinalDeRisco } from "./risco-clinico";

export async function limparAnamnesesExpiradas(): Promise<{
  removidas: number;
  mantidasPorRisco: number;
}> {
  const limite = new Date(Date.now() - 24 * 3600_000);

  const candidatas = await prisma.anamnesisSubmission.findMany({
    where: { createdAt: { lt: limite }, status: "pending" },
    select: { id: true, patientId: true, answers: true },
  });

  let removidas = 0;
  let mantidasPorRisco = 0;

  for (const s of candidatas) {
    const temAgendamento = await prisma.agendamento.count({
      where: { patientId: s.patientId, status: "agendado" },
    });
    if (temAgendamento > 0) continue;

    let respostas: Record<string, unknown> = {};
    try { respostas = JSON.parse(s.answers); } catch {}

    if (temSinalDeRisco(respostas)) {
      mantidasPorRisco++;
      continue;
    }

    await prisma.anamnesisSubmission.delete({ where: { id: s.id } });
    removidas++;

    // Cadastro sem nenhuma ficha e sem contrato sai junto: manter seria
    // guardar dado pessoal sem finalidade.
    const restantes = await prisma.anamnesisSubmission.count({ where: { patientId: s.patientId } });
    const contratos = await prisma.contract.count({ where: { patientId: s.patientId } });
    if (restantes === 0 && contratos === 0) {
      await prisma.patient.delete({ where: { id: s.patientId } }).catch(() => {});
    }
  }

  return { removidas, mantidasPorRisco };
}

/**
 * Varredura oportunista, chamada quando a Joane abre o painel.
 * Nao bloqueia a resposta e falha em silencio: e complemento do cron, nao
 * pode derrubar a listagem de pacientes se algo der errado.
 */
export function varreduraOportunista(): void {
  const agora = Date.now();
  if (agora - ultimaVarredura < INTERVALO_OPORTUNISTA_MS) return;
  ultimaVarredura = agora;

  limparAnamnesesExpiradas()
    .then((r) => {
      if (r.removidas > 0 || r.mantidasPorRisco > 0) {
        console.log(
          `[limpeza] removidas: ${r.removidas}, mantidas por risco: ${r.mantidasPorRisco}`
        );
      }
    })
    .catch((e) => console.error("[limpeza] falhou:", e));
}
