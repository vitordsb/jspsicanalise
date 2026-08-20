/**
 * GET /api/admin/contracts/[id]/signed-url
 *
 * Retorna uma URL assinada de download do PDF assinado pelo paciente.
 * A URL expira em 15 minutos (900 segundos).
 * O Content-Disposition e: attachment (forcado pelo Supabase).
 *
 * Requer autenticacao.
 * Requer que o contrato tenha um arquivo (signedFileKey preenchido).
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { createSignedUrl } from "@/lib/supabase-storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    select: {
      signedFileKey:       true,
      signedFileHash:      true,
      signedFileSizeBytes: true,
      signedVersion:       true,
      status:              true,
    },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contrato nao encontrado." },
      { status: 404 }
    );
  }

  if (!contract.signedFileKey) {
    return NextResponse.json(
      { error: "Nenhum arquivo assinado disponivel para este contrato." },
      { status: 404 }
    );
  }

  try {
    const signedUrl = await createSignedUrl(contract.signedFileKey, 900);

    return NextResponse.json({
      url:            signedUrl,
      expiresInSecs:  900,
      hash:           contract.signedFileHash,
      sizeBytes:      contract.signedFileSizeBytes,
      version:        contract.signedVersion,
      contractStatus: contract.status,
    });
  } catch (err) {
    console.error("Erro ao gerar URL assinada:", err);
    return NextResponse.json(
      { error: "Falha ao gerar link de download. Tente novamente." },
      { status: 502 }
    );
  }
}
