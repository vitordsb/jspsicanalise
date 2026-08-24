/**
 * GET /api/admin/contracts/[id]/verificar
 *
 * Confere se o documento assinado continua intacto.
 *
 * Recalcula o SHA-256 do texto congelado e compara com o hash gravado, e
 * tambem remonta o documento a partir dos campos atuais para ver se ele ainda
 * bate com o que foi assinado. A rota de edicao ja recusa mexer em contrato
 * assinado; isto aqui pega o que passaria por fora dela, como alteracao feita
 * direto no banco.
 *
 * Uma assinatura que ninguem consegue conferir nao serve para nada numa
 * discussao. E este endpoint que transforma "confie em mim" em prova.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import {
  montarDocumento, textoCanonico, hashDoDocumento,
  type DadosDoContrato,
} from "@/lib/contrato-texto";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const c = await prisma.contract.findUnique({ where: { id } });

  if (!c) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }
  if (!c.signedAt || !c.signedText) {
    return NextResponse.json(
      { error: "Este contrato não tem assinatura eletrônica para conferir." },
      { status: 409 }
    );
  }

  // 1. O texto guardado ainda corresponde ao hash gravado?
  const hashRecalculado = hashDoDocumento(c.signedText);
  const textoIntacto = hashRecalculado === c.signedTextHash;

  // 2. Os campos de hoje ainda produzem o mesmo documento?
  const referencia = c.issuedAt ?? c.createdAt;
  const textoDeAgora = textoCanonico(
    montarDocumento(c as unknown as DadosDoContrato, referencia)
  );
  const camposIntactos = hashDoDocumento(textoDeAgora) === c.signedTextHash;

  return NextResponse.json({
    integro: textoIntacto && camposIntactos,
    textoIntacto,
    camposIntactos,
    assinadoEm: c.signedAt,
    assinadoPor: c.signerName,
    cpfDoAssinante: c.signerCpf,
    ip: c.signerIp,
    navegador: c.signerUserAgent,
    codigoVerificacao: c.verificationCode,
    hash: c.signedTextHash,
    emitidoEm: c.issuedAt,
    emitidoPor: c.issuedByName,
  });
}
