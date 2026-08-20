import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-session";
import { getPixConfig } from "@/lib/pix";

/**
 * GET /api/admin/pix-config
 * Retorna configuracao PIX lida das env vars.
 * Autenticado: somente o admin ve os dados de pagamento.
 *
 * Response quando configurado:
 *   { configured: true, bank, holderName, key, keyType }
 * Response quando NAO configurado:
 *   { configured: false }
 *   -> frontend deve exibir aviso "dados de pagamento nao configurados"
 */
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  return NextResponse.json(getPixConfig());
}
