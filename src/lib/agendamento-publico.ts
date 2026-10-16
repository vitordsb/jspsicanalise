/**
 * Acesso a banco do agendamento publico (/agendar).
 *
 * As duas rotas publicas (listar vagas e criar o pedido) precisam enxergar a
 * agenda do mesmo jeito, entao a consulta de "o que esta ocupado" vive aqui.
 */

import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import {
  gerarVagas, lerJanelas,
  DIAS_A_FRENTE, ANTECEDENCIA_HORAS, DURACAO_PADRAO_MINUTOS,
  type IntervaloOcupado, type Vaga,
} from "./agenda";

/** Cliente do Prisma ou o de dentro de uma transacao: os dois servem. */
type Banco = Pick<PrismaClient, "agendamento" | "pedidoAgendamento">;

/**
 * Tudo o que segura um horario: consultas marcadas e pedidos que ainda esperam
 * confirmacao. Sem contar os pedidos, duas pessoas escolheriam a mesma vaga ao
 * mesmo tempo e uma delas descobriria so no e-mail que perdeu.
 */
export async function intervalosOcupados(
  banco: Banco = prisma,
  agora: Date = new Date()
): Promise<IntervaloOcupado[]> {
  const [consultas, pedidos] = await Promise.all([
    banco.agendamento.findMany({
      where: { status: "agendado", inicioEm: { gte: agora } },
      select: { inicioEm: true, duracaoMinutos: true },
    }),
    banco.pedidoAgendamento.findMany({
      where: { expiraEm: { gt: agora }, inicioEm: { gte: agora } },
      select: { inicioEm: true, duracaoMinutos: true },
    }),
  ]);

  return [...consultas, ...pedidos].map((o) => ({
    inicioIso: o.inicioEm.toISOString(),
    duracaoMinutos: o.duracaoMinutos,
  }));
}

/** Vagas livres hoje para quem chega pelo link publico (sessao padrao de 50 min). */
export async function vagasPublicas(agora: Date = new Date()): Promise<{
  vagas: Vaga[];
  semJanelas: boolean;
}> {
  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);
  const ocupados = await intervalosOcupados(prisma, agora);

  return {
    vagas: gerarVagas({
      janelas,
      duracaoMinutos: DURACAO_PADRAO_MINUTOS,
      diasAFrente: DIAS_A_FRENTE,
      antecedenciaHoras: ANTECEDENCIA_HORAS,
      ocupados,
      agora,
    }),
    semJanelas: janelas.length === 0,
  };
}

/** Apaga pedidos vencidos. Dado pessoal de quem nao confirmou nao tem por que ficar. */
export async function limparPedidosVencidos(
  banco: Banco = prisma,
  agora: Date = new Date()
): Promise<number> {
  const r = await banco.pedidoAgendamento.deleteMany({ where: { expiraEm: { lt: agora } } });
  return r.count;
}

/** Duracao da sessao: vem do contrato mais recente do paciente, com 50 minutos por padrao. */
export async function duracaoDaSessao(
  patientId: string,
  banco: Pick<PrismaClient, "contract"> = prisma
): Promise<number> {
  const c = await banco.contract.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    select: { durationMinutes: true },
  });
  return c?.durationMinutes && c.durationMinutes > 0 ? c.durationMinutes : DURACAO_PADRAO_MINUTOS;
}
