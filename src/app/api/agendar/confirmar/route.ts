/**
 * Confirmacao do agendamento feito pelo link publico.
 *
 * GET  mostra o resumo do pedido, sem alterar nada.
 * POST confirma: cria o paciente (se o CPF for novo) e a consulta.
 *
 * Sao dois passos de proposito. Programas de seguranca de e-mail abrem todo
 * link antes de o destinatario ver a mensagem; se abrir o link confirmasse, o
 * pedido de um robo ou de um engano viraria consulta marcada sem ninguem
 * ter clicado.
 *
 * Paciente que ja existe NAO tem os dados atualizados aqui: quem chegou por um
 * formulario aberto nao pode reescrever nome, e-mail ou telefone de um
 * cadastro. E nao ganha login por esta porta: o cadastro pode ter contrato e
 * endereco, e quem esta aqui provou so que le o e-mail da ficha.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { enviarConsultaConfirmada, avisarJoaneSobreConsulta } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { gerarTokenAcesso, hashToken, cookieSessaoPaciente } from "@/lib/paciente-auth";
import { lerJanelas, vagaEhValida, seSobrepoe, formatarDataHora } from "@/lib/agenda";
import { hashTokenPedido, tokenPedidoPlausivel } from "@/lib/pedido-agendamento";
import { duracaoDaSessao } from "@/lib/agendamento-publico";

const MENSAGEM_VENCIDO =
  "Este link venceu ou já foi usado. Se ainda quiser a consulta, escolha o horário de novo.";

class PedidoUsadoError extends Error {}
class HorarioIndisponivelError extends Error {}
class ConsultaAtivaExistenteError extends Error {}

function primeiroNome(nome: string): string {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`agendar-confirmar-ver:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get("t");
  if (!tokenPedidoPlausivel(token)) {
    return NextResponse.json({ error: MENSAGEM_VENCIDO }, { status: 410 });
  }

  const pedido = await prisma.pedidoAgendamento.findUnique({
    where: { tokenHash: hashTokenPedido(token) },
    select: { nome: true, inicioEm: true, duracaoMinutos: true, expiraEm: true },
  });
  if (!pedido || pedido.expiraEm.getTime() <= Date.now()) {
    return NextResponse.json({ error: MENSAGEM_VENCIDO }, { status: 410 });
  }

  return NextResponse.json({
    nome: primeiroNome(pedido.nome),
    quando: formatarDataHora(pedido.inicioEm),
    duracaoMinutos: pedido.duracaoMinutos,
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`agendar-confirmar:${ip}`, 15, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados enviados." }, { status: 400 });
  }

  const token = (body as { t?: unknown } | null)?.t;
  if (!tokenPedidoPlausivel(token)) {
    return NextResponse.json({ error: MENSAGEM_VENCIDO }, { status: 410 });
  }

  const agora = new Date();
  const pedido = await prisma.pedidoAgendamento.findUnique({
    where: { tokenHash: hashTokenPedido(token) },
  });
  if (!pedido || pedido.expiraEm.getTime() <= agora.getTime()) {
    return NextResponse.json({ error: MENSAGEM_VENCIDO }, { status: 410 });
  }
  if (pedido.inicioEm.getTime() <= agora.getTime()) {
    return NextResponse.json(
      { error: "Este horário já passou. Escolha um novo horário." },
      { status: 410 }
    );
  }

  const perfil = await prisma.user.findFirst({
    select: { horariosAtendimento: true, notificationEmail: true },
  });
  const janelas = lerJanelas(perfil?.horariosAtendimento);

  // Calculado fora da transacao: scrypt e caro e nao deve segurar a conexao.
  // So vira o codigo de verdade se o CPF for novo.
  const codigoNovo = gerarTokenAcesso();
  const hashDoCodigoNovo = hashToken(codigoNovo);

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // O pedido e consumido aqui dentro: duas confirmacoes simultaneas (duplo
      // clique, duas abas) disputam a mesma linha e so uma leva.
      const consumido = await tx.pedidoAgendamento.deleteMany({ where: { id: pedido.id } });
      if (consumido.count === 0) throw new PedidoUsadoError();

      let paciente = await tx.patient.findUnique({
        where: { cpf: pedido.cpf },
        select: { id: true, fullName: true, email: true },
      });
      const novo = !paciente;

      // Paciente que ja existe pode ter contrato com duracao propria.
      const duracao = paciente ? await duracaoDaSessao(paciente.id, tx) : pedido.duracaoMinutos;

      if (!vagaEhValida(pedido.inicioEm.toISOString(), janelas, duracao)) {
        throw new HorarioIndisponivelError();
      }

      // A Joane pode ter marcado alguem nesse horario enquanto o link esperava.
      const ativos = await tx.agendamento.findMany({
        where: { status: "agendado", inicioEm: { gte: agora } },
        select: { inicioEm: true, duracaoMinutos: true },
      });
      if (ativos.some((a) => seSobrepoe(pedido.inicioEm, duracao, a.inicioEm, a.duracaoMinutos))) {
        throw new HorarioIndisponivelError();
      }

      let anamneseId: string | null = null;
      if (paciente) {
        // Mesma regra da area do paciente: uma consulta ativa por vez.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${paciente.id})::bigint)`;
        const jaTem = await tx.agendamento.findFirst({
          where: { patientId: paciente.id, status: "agendado", inicioEm: { gte: agora } },
          select: { id: true },
        });
        if (jaTem) throw new ConsultaAtivaExistenteError();

        const ultima = await tx.anamnesisSubmission.findFirst({
          where: { patientId: paciente.id },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        anamneseId = ultima?.id ?? null;
      } else {
        paciente = await tx.patient.create({
          data: {
            fullName: pedido.nome,
            email: pedido.email,
            phone: pedido.telefone,
            birthDate: "",
            cpf: pedido.cpf,
            accessTokenHash: hashDoCodigoNovo,
            accessTokenAt: new Date(),
          },
          select: { id: true, fullName: true, email: true },
        });
      }

      const consulta = await tx.agendamento.create({
        data: {
          patientId: paciente.id,
          submissionId: anamneseId,
          inicioEm: pedido.inicioEm,
          duracaoMinutos: duracao,
          status: "agendado",
        },
        select: { inicioEm: true, duracaoMinutos: true },
      });

      return { paciente, consulta, novo, temAnamnese: anamneseId !== null };
    });

    const { paciente, consulta, novo, temAnamnese } = resultado;

    avisarEmSegundoPlano("consulta confirmada pelo link publico", () =>
      enviarConsultaConfirmada({
        para: paciente.email,
        nome: paciente.fullName,
        inicioEm: consulta.inicioEm,
        duracaoMinutos: consulta.duracaoMinutos,
        codigo: novo ? codigoNovo : undefined,
        pedirAnamnese: !temAnamnese,
      })
    );

    avisarEmSegundoPlano("consulta marcada pelo link publico (Joane)", () =>
      avisarJoaneSobreConsulta({
        recipientEmail: perfil?.notificationEmail || undefined,
        tipo: "marcada",
        nomePaciente: paciente.fullName,
        inicioEm: consulta.inicioEm,
        duracaoMinutos: consulta.duracaoMinutos,
        semAnamnese: !temAnamnese,
      })
    );

    const resposta = NextResponse.json({
      success: true,
      quando: formatarDataHora(consulta.inicioEm),
      duracaoMinutos: consulta.duracaoMinutos,
      novo,
      precisaAnamnese: !temAnamnese,
      // Unico instante em que o codigo aparece em claro na tela. O e-mail tem o mesmo.
      tokenAcesso: novo ? codigoNovo : "",
      autenticado: novo,
    });

    // Cadastro criado agora, com dado que a propria pessoa acabou de digitar e
    // e-mail que ela acabou de provar que le: nao ha nada anterior de ninguem
    // para alcancar. E o mesmo raciocinio do login automatico da anamnese.
    if (novo) {
      const cookie = cookieSessaoPaciente(paciente.id);
      resposta.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return resposta;
  } catch (e: unknown) {
    if (e instanceof PedidoUsadoError) {
      return NextResponse.json({ error: MENSAGEM_VENCIDO }, { status: 410 });
    }
    if (e instanceof HorarioIndisponivelError) {
      return NextResponse.json(
        { error: "Este horário não está mais disponível. Escolha outro, por favor." },
        { status: 409 }
      );
    }
    if (e instanceof ConsultaAtivaExistenteError) {
      return NextResponse.json(
        {
          error:
            "Você já tem uma consulta marcada. Para mudar o horário, entre na sua área ou fale com a Dra. Joane.",
        },
        { status: 409 }
      );
    }
    // P2002: o indice unico do banco pegou uma corrida pelo mesmo horario.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Alguém acabou de reservar este horário. Escolha outro, por favor." },
        { status: 409 }
      );
    }
    console.error("Erro ao confirmar agendamento:", e);
    return NextResponse.json({ error: "Não foi possível confirmar sua consulta." }, { status: 500 });
  }
}
