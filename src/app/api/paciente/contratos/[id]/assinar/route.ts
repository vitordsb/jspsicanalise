/**
 * POST /api/paciente/contratos/[id]/assinar
 *
 * Assinatura eletronica simples, nos termos da Lei 14.063/2020 e da
 * MP 2.200-2/2001: vale entre as partes quando ambas aceitam o meio. O que
 * sustenta o valor probatorio nao e a tela bonita, e a trilha:
 *
 *  - QUEM: CPF e nome conferidos contra o cadastro, mais o codigo de acesso
 *    reconferido no ato. A pessoa ja esta logada; pedir de novo e a
 *    reautenticacao que transforma "estava na sessao" em "quis assinar".
 *  - QUANDO: data e hora do servidor, nunca do cliente.
 *  - DE ONDE: IP e user agent.
 *  - SOBRE O QUE: o texto do contrato congelado e o SHA-256 dele. Este e o
 *    ponto que costuma faltar. Sem congelar, editar qualquer campo depois
 *    mudaria o documento assinado sem deixar rastro.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";
import { verificarToken } from "@/lib/paciente-auth";
import { normalizeCpf } from "@/lib/cpf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  montarDocumento, textoCanonico, hashDoDocumento, codigoDeVerificacao,
  type DadosDoContrato,
} from "@/lib/contrato-texto";
import { enviarContratoAssinado, avisarJoaneContratoAssinado } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { randomUUID } from "node:crypto";

/** Compara nomes ignorando acento, caixa e espaco repetido. */
function mesmoNome(a: string, b: string): boolean {
  const n = (v: string) =>
    v.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  return n(a) === n(b) && n(a) !== "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  // Limite apertado: aqui o codigo de acesso e reconferido, entao a rota e
  // um ponto de tentativa de adivinhacao como qualquer tela de login.
  const ip = getClientIp(req);
  if (!checkRateLimit(`assinar:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429 }
    );
  }

  const { id } = await params;

  let corpo: { nome?: string; cpf?: string; codigo?: string; aceite?: boolean };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados." }, { status: 400 });
  }

  const nome = String(corpo?.nome ?? "").trim();
  const cpf = normalizeCpf(String(corpo?.cpf ?? ""));
  const codigo = String(corpo?.codigo ?? "").replace(/\D/g, "");

  if (!corpo?.aceite) {
    return NextResponse.json(
      { error: "É preciso marcar que você leu e concorda com o contrato." },
      { status: 400 }
    );
  }

  // O filtro por patientId e o que impede assinar contrato de outra pessoa.
  const contrato = await prisma.contract.findFirst({
    where: { id, patientId },
    include: { patient: true },
  });

  if (!contrato) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  if (contrato.signedAt) {
    return NextResponse.json(
      { error: "Este contrato já foi assinado." },
      { status: 409 }
    );
  }

  if (contrato.status !== "aguardando_assinatura") {
    return NextResponse.json(
      { error: "Este contrato ainda não está liberado para assinatura." },
      { status: 409 }
    );
  }

  // As tres conferencias sao respondidas com a MESMA mensagem de proposito.
  // Dizer qual delas falhou entregaria, a quem tem so o CPF, se aquele CPF e
  // de paciente e qual o nome cadastrado.
  const generico = {
    error: "Não foi possível confirmar sua identidade. Confira o nome completo, o CPF e o código de acesso.",
  };

  const nomeCadastrado = contrato.patient.fullName ?? "";
  if (!mesmoNome(nome, nomeCadastrado)) {
    return NextResponse.json(generico, { status: 422 });
  }
  if (!cpf || cpf !== contrato.patient.cpf) {
    return NextResponse.json(generico, { status: 422 });
  }
  if (!contrato.patient.accessTokenHash || !verificarToken(codigo, contrato.patient.accessTokenHash)) {
    return NextResponse.json(generico, { status: 422 });
  }

  // Congela o documento. A data de referencia e a da emissao, nao a de hoje:
  // o texto tem que ser o mesmo que a pessoa leu na tela antes de assinar.
  const referencia = contrato.issuedAt ?? contrato.createdAt;
  const documento = montarDocumento(contrato as unknown as DadosDoContrato, referencia);
  const texto = textoCanonico(documento);
  const hash = hashDoDocumento(texto);
  const verificacao = codigoDeVerificacao(hash);
  const agora = new Date();

  const atualizado = await prisma.contract.update({
    where: { id },
    data: {
      status: "assinado_recebido",
      signatureMethod: "eletronica",
      signedAt: agora,
      signerName: nome,
      signerCpf: cpf,
      signerIp: ip,
      signerUserAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
      signedText: texto,
      signedTextHash: hash,
      verificationCode: verificacao,
    },
    include: { patient: true },
  });

  await prisma.contractEvent.create({
    data: {
      id: randomUUID(),
      contractId: id,
      fromStatus: "aguardando_assinatura",
      toStatus: "assinado_recebido",
      note: `Assinado eletronicamente por ${nome}. Verificação ${verificacao}.`,
    },
  });

  avisarEmSegundoPlano("recibo de assinatura", () =>
    enviarContratoAssinado({
      para: contrato.patient.email ?? "",
      nome: contrato.patient.fullName ?? "",
      assinadoEm: agora,
      codigoVerificacao: verificacao,
    })
  );

  const perfil = await prisma.user.findFirst({ select: { notificationEmail: true } });
  avisarEmSegundoPlano("contrato assinado", () =>
    avisarJoaneContratoAssinado({ recipientEmail: perfil?.notificationEmail || undefined })
  );

  return NextResponse.json({
    success: true,
    assinadoEm: agora.toISOString(),
    codigoVerificacao: verificacao,
    contrato: { id: atualizado.id, status: atualizado.status },
  });
}
