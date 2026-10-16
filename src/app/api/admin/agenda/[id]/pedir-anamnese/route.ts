/**
 * Pedido da Joane, feito pela agenda, para quem marcou a consulta pelo link
 * publico e ainda nao preencheu a anamnese.
 *
 * A anamnese nao e condicao para marcar. Esta rota existe para o caso em que
 * chega perto da consulta e a ficha continua em branco: um clique manda ao
 * paciente o link para preencher. Nao e automatico de proposito, porque quem
 * decide se vale insistir e a Joane.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { enviarPedidoDeAnamnese } from "@/lib/mail";

/** Evita o mesmo pedido sair duas vezes por clique repetido. */
const INTERVALO_MINIMO_MS = 10 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const consulta = await prisma.agendamento.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      inicioEm: true,
      anamneseSolicitadaEm: true,
      patient: {
        select: {
          fullName: true,
          email: true,
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  if (!consulta) {
    return NextResponse.json({ error: "Consulta não encontrada." }, { status: 404 });
  }
  if (consulta.status !== "agendado" || consulta.inicioEm.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Só dá para pedir a anamnese de uma consulta que ainda vai acontecer." },
      { status: 409 }
    );
  }
  if (consulta.patient._count.submissions > 0) {
    return NextResponse.json({ error: "Esta pessoa já preencheu a anamnese." }, { status: 409 });
  }
  if (!consulta.patient.email?.trim()) {
    return NextResponse.json(
      { error: "Este paciente não tem e-mail cadastrado. Peça pelo WhatsApp." },
      { status: 422 }
    );
  }
  if (
    consulta.anamneseSolicitadaEm &&
    Date.now() - consulta.anamneseSolicitadaEm.getTime() < INTERVALO_MINIMO_MS
  ) {
    return NextResponse.json(
      { error: "O pedido acabou de ser enviado. Aguarde alguns minutos antes de enviar de novo." },
      { status: 429 }
    );
  }

  // Aqui o envio e esperado, nao vai para segundo plano: a Joane clicou para
  // saber se foi, e "enviado" sem ter enviado seria pior que um erro.
  const envio = await enviarPedidoDeAnamnese({
    para: consulta.patient.email,
    nome: consulta.patient.fullName,
    inicioEm: consulta.inicioEm,
  });
  if (!envio.success) {
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente de novo ou peça pelo WhatsApp." },
      { status: 502 }
    );
  }

  const solicitadaEm = new Date();
  await prisma.agendamento.update({
    where: { id },
    data: { anamneseSolicitadaEm: solicitadaEm },
  });

  return NextResponse.json({
    success: true,
    solicitadaEm,
    // Sem SMTP configurado nada sai de fato (ambiente de desenvolvimento).
    simulado: Boolean(envio.simulated),
  });
}
