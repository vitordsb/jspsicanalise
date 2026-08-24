/**
 * Cron diario da limpeza das anamneses expiradas.
 *
 * O plano Hobby da Vercel so permite cron uma vez por dia, entao este e o
 * backstop. O prazo real de 24 horas e mantido pela varredura oportunista
 * disparada quando a Joane abre o painel (ver src/lib/limpeza-anamneses.ts).
 *
 * Protegido por CRON_SECRET: sem isso qualquer um dispararia a limpeza.
 */

import { NextRequest, NextResponse } from "next/server";
import { limparAnamnesesExpiradas } from "@/lib/limpeza-anamneses";

export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = req.headers.get("authorization");

  // A Vercel envia "Bearer <CRON_SECRET>" nas chamadas de cron.
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const r = await limparAnamnesesExpiradas();
  console.log(`[cron] removidas: ${r.removidas}, mantidas por risco: ${r.mantidasPorRisco}`);
  return NextResponse.json(r);
}
