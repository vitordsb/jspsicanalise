/**
 * POST /api/admin/pacientes/[id]/reemitir-codigo
 *
 * Emite um novo codigo de acesso para o paciente e devolve o valor em claro
 * uma unica vez, para a Joane repassar. O codigo anterior deixa de valer no
 * mesmo instante: guardamos apenas o hash, entao nao existe como recuperar o
 * antigo, so substituir.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { gerarTokenAcesso, hashToken, formatarToken } from "@/lib/paciente-auth";
import { enviarCodigoDeAcesso } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const paciente = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true },
  });

  if (!paciente) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const token = gerarTokenAcesso();
  await prisma.patient.update({
    where: { id },
    data: { accessTokenHash: hashToken(token), accessTokenAt: new Date() },
  });

  // Segundo e ultimo instante em que o codigo existe em claro. Mandar por
  // e-mail fecha o caminho de recuperacao: quem perdeu o codigo pede a
  // reemissao e recebe o novo sem depender de a Joane ditar numero por
  // numero no telefone.
  avisarEmSegundoPlano("novo codigo de acesso", () =>
    enviarCodigoDeAcesso({
      para: paciente.email,
      nome: paciente.fullName,
      codigo: token,
      reemissao: true,
    })
  );

  return NextResponse.json({
    success: true,
    paciente: paciente.fullName,
    codigo: token,
    codigoFormatado: formatarToken(token),
    // A tela avisa se deu para mandar por e-mail ou se a Joane vai ter que
    // repassar de outro jeito.
    enviadoPara: paciente.email || null,
  });
}
