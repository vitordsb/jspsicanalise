/**
 * Agendamento pelo link publico, sem login e sem anamnese previa.
 *
 * GET  lista as vagas livres (so horarios, nenhum dado de ninguem).
 * POST registra um PEDIDO e manda o link de confirmacao por e-mail.
 *
 * O POST nao cria paciente nem consulta. Quem faz isso e a confirmacao
 * (/api/agendar/confirmar), depois que a pessoa prova que le aquele e-mail.
 * Esta rota e aberta a qualquer um da internet, entao tudo que ela aceita
 * precisa ser barato de descartar: validacao, isca contra robo, limite por IP e
 * por CPF, e pedido que vence sozinho.
 *
 * A resposta de sucesso e sempre a mesma, exista ou nao cadastro com aquele
 * CPF. Dizer "esse CPF ja e paciente" confirmaria para qualquer curioso quem
 * se trata em uma clinica de psicanalise.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { enviarLinkDeConfirmacao } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  lerJanelas, vagaEhValida, seSobrepoe,
  ANTECEDENCIA_HORAS, DURACAO_PADRAO_MINUTOS,
} from "@/lib/agenda";
import {
  pedidoAgendamentoSchema, gerarTokenPedido, hashTokenPedido,
  expiracaoDoPedido, VALIDADE_PEDIDO_MIN,
} from "@/lib/pedido-agendamento";
import { intervalosOcupados, vagasPublicas, limparPedidosVencidos } from "@/lib/agendamento-publico";
import { urlDoApp } from "@/lib/url-app";

/** Sinaliza, de dentro da transacao, que o horario foi tomado por outra pessoa. */
class HorarioIndisponivelError extends Error {}

export async function GET() {
  const { vagas, semJanelas } = await vagasPublicas();
  return NextResponse.json({ vagas, duracaoMinutos: DURACAO_PADRAO_MINUTOS, semJanelas });
}

export async function POST(req: NextRequest) {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 8_000) {
    return NextResponse.json({ error: "Dados enviados excedem o tamanho permitido." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados enviados." }, { status: 400 });
  }

  const parsed = pedidoAgendamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Confira os dados preenchidos e tente novamente." },
      { status: 400 }
    );
  }
  const dados = parsed.data;

  // Isca preenchida: robo. Responde como se tivesse dado certo, para ele nao
  // aprender o que o derrubou, e nao grava nada.
  if (dados.website && dados.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  // Limites depois da validacao, como na anamnese: corrigir um CPF digitado
  // errado nao pode gastar a cota de quem esta de fato martelando a rota.
  const ip = getClientIp(req);
  if (
    !checkRateLimit(`agendar-ip:${ip}`, 6, 60 * 60 * 1000) ||
    !checkRateLimit(`agendar-cpf:${dados.cpf}`, 4, 60 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente." },
      { status: 429 }
    );
  }

  const perfil = await prisma.user.findFirst({ select: { horariosAtendimento: true } });
  const janelas = lerJanelas(perfil?.horariosAtendimento);
  const duracao = DURACAO_PADRAO_MINUTOS;

  // Revalidacao no servidor: a tela pode ter sido burlada.
  if (!vagaEhValida(dados.inicioIso, janelas, duracao)) {
    return NextResponse.json(
      { error: "Este horário não está disponível para atendimento." },
      { status: 422 }
    );
  }

  const inicio = new Date(dados.inicioIso);
  const agora = new Date();
  if (inicio.getTime() < agora.getTime() + ANTECEDENCIA_HORAS * 3600_000) {
    return NextResponse.json(
      { error: `Escolha um horário com pelo menos ${ANTECEDENCIA_HORAS} horas de antecedência.` },
      { status: 422 }
    );
  }

  const token = gerarTokenPedido();

  try {
    await prisma.$transaction(async (tx) => {
      // Uma trava so para a reserva de horario. A checagem de sobreposicao e
      // leitura-antes-da-escrita: sem serializar, dois pedidos para a mesma
      // vaga passariam juntos. O volume desta clinica e pequeno, entao uma
      // trava global custa nada e dispensa um indice unico parcial.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('pedido-agendamento')::bigint)`;

      await limparPedidosVencidos(tx, agora);
      // Quem tenta de novo troca o pedido anterior em vez de acumular reservas.
      await tx.pedidoAgendamento.deleteMany({ where: { cpf: dados.cpf } });

      const ocupados = await intervalosOcupados(tx, agora);
      if (ocupados.some((o) => seSobrepoe(inicio, duracao, o.inicioIso, o.duracaoMinutos))) {
        throw new HorarioIndisponivelError();
      }

      await tx.pedidoAgendamento.create({
        data: {
          tokenHash: hashTokenPedido(token),
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          cpf: dados.cpf,
          inicioEm: inicio,
          duracaoMinutos: duracao,
          expiraEm: expiracaoDoPedido(agora),
        },
      });
    });
  } catch (e) {
    if (e instanceof HorarioIndisponivelError) {
      return NextResponse.json(
        { error: "Alguém acabou de reservar este horário. Escolha outro, por favor." },
        { status: 409 }
      );
    }
    console.error("Erro ao registrar pedido de agendamento:", e);
    return NextResponse.json({ error: "Não foi possível registrar seu pedido." }, { status: 500 });
  }

  // CPF que ja e de paciente: o link vai para o e-mail que ja esta na ficha, nao
  // para o digitado agora. Quem conhece so o CPF de alguem nao consegue
  // confirmar nada em nome dessa pessoa.
  const existente = await prisma.patient.findUnique({
    where: { cpf: dados.cpf },
    select: { email: true },
  });
  const destino = existente?.email?.trim() || dados.email;

  avisarEmSegundoPlano("link de confirmacao do agendamento", () =>
    enviarLinkDeConfirmacao({
      para: destino,
      nome: dados.nome,
      inicioEm: inicio,
      link: `${urlDoApp()}/agendar/confirmar?t=${token}`,
      validadeMinutos: VALIDADE_PEDIDO_MIN,
    })
  );

  return NextResponse.json({ success: true, validadeMinutos: VALIDADE_PEDIDO_MIN });
}
