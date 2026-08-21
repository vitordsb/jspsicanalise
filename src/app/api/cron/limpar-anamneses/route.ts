/**
 * Rotina das 24 horas.
 *
 * Anamnese enviada e sem consulta marcada em 24 horas e removida, e a pessoa
 * precisa preencher de novo.
 *
 * EXCECAO QUE NAO PODE SER REMOVIDA SEM CONVERSAR COM A JOANE:
 * ficha com sinalizacao de risco (ideacao suicida ou autolesao recente) nunca
 * e apagada. Quem esta em crise e justamente quem tem menos condicao de
 * agendar dentro do prazo, e apagar esse registro faria o sistema descartar a
 * informacao mais importante que ele coleta. Essas fichas ficam e sao
 * sinalizadas no painel para a Joane procurar a pessoa.
 *
 * Protegida por CRON_SECRET: sem isso, qualquer um dispararia a limpeza.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Mesma regra usada na sidebar do painel. */
function temSinalDeRisco(respostas: Record<string, unknown>): boolean {
  const ideacao = respostas["q_ideacao"] as string | undefined;
  const autolesao = respostas["q_autolesao"] as string | undefined;
  const riscoIdeacao =
    !!ideacao && ideacao !== "Não" && ideacao !== "Prefiro não responder aqui";
  return riscoIdeacao || autolesao === "Sim, recentemente";
}

export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = req.headers.get("authorization");

  // A Vercel envia "Bearer <CRON_SECRET>" nas chamadas de cron.
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const limite = new Date(Date.now() - 24 * 3600_000);

  const candidatas = await prisma.anamnesisSubmission.findMany({
    where: {
      createdAt: { lt: limite },
      // So mexe em ficha que a Joane ainda nao comecou a tratar.
      status: "pending",
    },
    select: { id: true, patientId: true, answers: true },
  });

  const removidas: string[] = [];
  const mantidasPorRisco: string[] = [];

  for (const s of candidatas) {
    // Consulta marcada salva a ficha, independente de quando foi criada.
    const temAgendamento = await prisma.agendamento.count({
      where: { patientId: s.patientId, status: "agendado" },
    });
    if (temAgendamento > 0) continue;

    let respostas: Record<string, unknown> = {};
    try { respostas = JSON.parse(s.answers); } catch {}

    if (temSinalDeRisco(respostas)) {
      mantidasPorRisco.push(s.id);
      continue;
    }

    await prisma.anamnesisSubmission.delete({ where: { id: s.id } });
    removidas.push(s.id);

    // Paciente que ficou sem nenhuma ficha e sem contrato sai junto: manter o
    // cadastro solto seria guardar dado pessoal sem finalidade.
    const restantes = await prisma.anamnesisSubmission.count({ where: { patientId: s.patientId } });
    const contratos = await prisma.contract.count({ where: { patientId: s.patientId } });
    if (restantes === 0 && contratos === 0) {
      await prisma.patient.delete({ where: { id: s.patientId } }).catch(() => {});
    }
  }

  console.log(
    `[cron] anamneses removidas: ${removidas.length}, mantidas por risco: ${mantidasPorRisco.length}`
  );

  return NextResponse.json({
    removidas: removidas.length,
    mantidasPorRisco: mantidasPorRisco.length,
  });
}
