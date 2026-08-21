/**
 * Contrato visto pelo proprio paciente.
 *
 * Mesmo shape usado na impressao do painel, para que o documento renderizado
 * seja identico. O contrato so e devolvido se pertencer ao paciente da sessao.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const { id } = await params;

  // Filtro por patientId da sessao: id da URL sozinho nao basta.
  // signedFileKey e signedFileHash sao caminhos e hashes internos do Storage:
  // o paciente nao precisa deles e expor o caminho e desnecessario.
  const contrato = await prisma.contract.findFirst({
    where: { id, patientId },
    omit: { signedFileKey: true, signedFileHash: true },
  });

  if (!contrato) {
    return NextResponse.json({ error: "Contrato nao encontrado." }, { status: 404 });
  }

  // Contrato ainda nao assinado reflete o que esta nas Configuracoes, igual
  // ao painel. Depois de assinado vale o snapshot congelado.
  const aindaNaoAssinado =
    contrato.status === "rascunho" ||
    contrato.status === "gerado" ||
    contrato.status === "aguardando_assinatura";

  const semPagamento =
    !contrato.paymentPixKey?.trim() && !contrato.paymentBankName?.trim();
  const semForo = !contrato.foroCidade?.trim();

  if (aindaNaoAssinado && (semPagamento || semForo)) {
    const perfil = await prisma.user.findFirst();
    if (perfil) {
      return NextResponse.json({
        ...contrato,
        ...(semPagamento && {
          paymentPixKey: perfil.pixKey ?? "",
          paymentPixKeyType: perfil.pixKeyType ?? "",
          paymentPixHolderName: perfil.pixHolderName ?? "",
          paymentBankName: perfil.bankName ?? "",
          paymentBankAgency: perfil.bankAgency ?? "",
          paymentBankAccount: perfil.bankAccount ?? "",
        }),
        ...(semForo && { foroCidade: perfil.foroCidade ?? "" }),
      });
    }
  }

  return NextResponse.json(contrato);
}
