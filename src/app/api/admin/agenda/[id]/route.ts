/**
 * Remanejamento e mudanca de status de um agendamento, pela Joane.
 *
 * Diferenca importante em relacao a rota do paciente: aqui ela PODE marcar
 * fora das janelas de atendimento. As janelas existem para limitar o que o
 * paciente escolhe sozinho; a dona da agenda decide abrir excecao. A resposta
 * sinaliza quando isso acontece, para a tela avisar em vez de barrar.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { lerJanelas, vagaEhValida } from "@/lib/agenda";
import { enviarAvisoDeConsulta } from "@/lib/mail";
import { avisarEmSegundoPlano, consultaAindaVale } from "@/lib/avisos";

const STATUS_VALIDOS = ["agendado", "realizado", "cancelado", "falta"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados." }, { status: 400 });
  }

  const { inicioIso, status, observacao } = (body ?? {}) as {
    inicioIso?: string;
    status?: string;
    observacao?: string;
  };

  const atual = await prisma.agendamento.findUnique({ where: { id } });
  if (!atual) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const dados: Record<string, unknown> = {};
  let foraDaJanela = false;
  // O que avisar ao paciente so da para saber comparando com o estado
  // anterior: mudou a hora e remanejamento, virou cancelado e cancelamento.
  let horarioMudou = false;
  let virouCancelado = false;

  if (inicioIso !== undefined) {
    const novo = new Date(inicioIso);
    if (isNaN(novo.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    horarioMudou = novo.getTime() !== atual.inicioEm.getTime();

    // Remarcar responde ao pedido do paciente. Sem isto o pedido ficaria
    // aberto para sempre no painel, mesmo ja atendido.
    if (horarioMudou) {
      dados.remarcacaoPedidaEm = null;
      dados.remarcacaoMotivo = "";
      dados.remarcacaoRecusadaEm = null;
      dados.remarcacaoRecusaMotivo = "";
    }

    const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
    const janelas = lerJanelas(perfil?.horariosAtendimento);
    foraDaJanela = !vagaEhValida(inicioIso, janelas, atual.duracaoMinutos);

    dados.inicioEm = novo;
    // Remanejar reabre o agendamento: cancelado que volta para a agenda
    // precisa voltar a valer.
    if (status === undefined && atual.status !== "agendado") {
      dados.status = "agendado";
      dados.canceladoEm = null;
      dados.motivoCancelamento = "";
    }
  }

  if (status !== undefined) {
    if (!STATUS_VALIDOS.includes(status as (typeof STATUS_VALIDOS)[number])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    dados.status = status;
    virouCancelado = status === "cancelado" && atual.status !== "cancelado";
    if (status === "cancelado") {
      dados.canceladoEm = new Date();
      dados.motivoCancelamento = "Cancelado pela profissional";
    } else {
      dados.canceladoEm = null;
      dados.motivoCancelamento = "";
    }
  }

  if (observacao !== undefined) {
    dados.observacao = String(observacao).slice(0, 500);
  }

  if (Object.keys(dados).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  try {
    const atualizado = await prisma.agendamento.update({
      where: { id },
      data: dados,
      include: {
        patient: { select: { id: true, fullName: true, phone: true, cpf: true, email: true } },
      },
    });

    // O paciente nao esta olhando a tela quando a Joane remaneja. Sem este
    // aviso ele so descobre a mudanca aparecendo na hora errada.
    //
    // "realizado" e "falta" sao anotacao interna da Joane e nao viram e-mail.
    if (virouCancelado && atual.inicioEm.getTime() > Date.now()) {
      avisarEmSegundoPlano("consulta cancelada pela Joane", () =>
        enviarAvisoDeConsulta({
          para: atualizado.patient.email,
          nome: atualizado.patient.fullName,
          tipo: "cancelada",
          inicioEm: atual.inicioEm,
        })
      );
    } else if (horarioMudou && consultaAindaVale(atualizado.inicioEm, atualizado.status)) {
      avisarEmSegundoPlano("consulta remarcada", () =>
        enviarAvisoDeConsulta({
          para: atualizado.patient.email,
          nome: atualizado.patient.fullName,
          tipo: "remarcada",
          inicioEm: atualizado.inicioEm,
          duracaoMinutos: atualizado.duracaoMinutos,
          anteriorEm: atual.inicioEm,
          motivo: atualizado.observacao,
        })
      );
    }

    return NextResponse.json({ success: true, agendamento: atualizado, foraDaJanela });
  } catch (e: unknown) {
    // P2002: a restricao unica pegou outro agendamento no mesmo horario.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma consulta marcada nesse horário." },
        { status: 409 }
      );
    }
    console.error("Erro ao atualizar agendamento:", e);
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;

  // Le antes de apagar: depois do delete nao sobra para quem avisar.
  const alvo = await prisma.agendamento.findUnique({
    where: { id },
    include: { patient: { select: { fullName: true, email: true } } },
  });

  await prisma.agendamento.delete({ where: { id } }).catch(() => {});

  // So avisa consulta futura que ainda valia. Apagar registro antigo ou ja
  // cancelado e faxina de agenda, e o paciente nao precisa ouvir sobre isso.
  if (alvo && consultaAindaVale(alvo.inicioEm, alvo.status)) {
    avisarEmSegundoPlano("consulta removida pela Joane", () =>
      enviarAvisoDeConsulta({
        para: alvo.patient.email,
        nome: alvo.patient.fullName,
        tipo: "cancelada",
        inicioEm: alvo.inicioEm,
      })
    );
  }

  return NextResponse.json({ success: true });
}
