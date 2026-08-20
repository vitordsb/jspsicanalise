import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getPixConfig } from "@/lib/pix";

/**
 * GET /api/admin/pix-config
 * Retorna configuracao PIX lida do perfil do admin no banco.
 * Autenticado: somente o admin ve os dados de pagamento.
 *
 * Response quando configurado:
 *   { configured: true, bank, agency, account, holderName, key, keyType }
 * Response quando NAO configurado:
 *   { configured: false }
 *   -> frontend deve exibir aviso "dados de pagamento nao configurados"
 *
 * Nota: os campos agencia e conta (agency, account) sao novos nesta versao.
 * O frontend pode ler o perfil completo via GET /api/admin/profile se preferir.
 */
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const admin = await prisma.user.findFirst();
    if (!admin) {
      return NextResponse.json({ configured: false });
    }
    return NextResponse.json(getPixConfig(admin));
  } catch (error) {
    console.error("Erro ao buscar config PIX:", error);
    return NextResponse.json({ configured: false });
  }
}
