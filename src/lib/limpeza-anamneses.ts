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

let ultimaVarredura = 0;
const INTERVALO_OPORTUNISTA_MS = 60 * 60 * 1000;

/**
 * Campos de triagem de risco, achados por padrao no nome e nao por chave
 * exata.
 *
 * O modelo de anamnese e editavel pela Joane. Com a busca por "q_ideacao"
 * cravada, bastava ela renomear o campo para a funcao devolver false para
 * todo mundo e as fichas de quem esta em crise passarem a ser apagadas em
 * silencio, sem erro em log nenhum. O padrao sobrevive a renomeacao.
 */
const CHAVE_IDEACAO = /ideacao|ideação|suicid/i;
const CHAVE_AUTOLESAO = /autolesao|autolesão/i;

/**
 * Respostas que significam "sem risco". Qualquer outra coisa conta como
 * risco, inclusive resposta que a Joane venha a escrever depois: na duvida
 * a ficha fica. Guardar por engano custa espaco em disco; apagar por engano
 * joga fora a informacao mais importante que este sistema coleta.
 */
const SEM_RISCO = new Set([
  "não", "nao", "nunca", "não se aplica", "nao se aplica",
  "prefiro não responder aqui", "prefiro nao responder aqui",
  "prefiro não responder", "prefiro nao responder", "",
]);

export function temSinalDeRisco(respostas: Record<string, unknown>): boolean {
  for (const [chave, valor] of Object.entries(respostas ?? {})) {
    const ehIdeacao = CHAVE_IDEACAO.test(chave);
    const ehAutolesao = CHAVE_AUTOLESAO.test(chave);
    if (!ehIdeacao && !ehAutolesao) continue;

    if (typeof valor !== "string") {
      // Marcacao booleana ou lista preenchida tambem sinaliza.
      if (valor === true || (Array.isArray(valor) && valor.length > 0)) return true;
      continue;
    }

    const v = valor.trim().toLowerCase();
    if (SEM_RISCO.has(v)) continue;

    // Autolesao antiga nao e crise em curso; a recente e.
    if (ehAutolesao && !ehIdeacao) {
      if (/recent/i.test(v)) return true;
      continue;
    }
    return true;
  }
  return false;
}

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
