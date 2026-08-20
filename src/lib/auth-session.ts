/**
 * auth-session.ts - helpers de sessao que dependem de "next/headers".
 * Importar apenas em Server Components e Route Handlers (nao no proxy.ts).
 */

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyToken, generateToken } from "./auth";

/** Verifica se existe sessao valida no cookie do request atual. */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!session?.value) return false;
  return verifyToken(session.value) !== null;
}

/**
 * Guard para route handlers.
 * Retorna Response 401 se nao autenticado, null se OK.
 *
 * Uso:
 *   const authError = await requireAuth();
 *   if (authError) return authError;
 */
export async function requireAuth(): Promise<Response | null> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return Response.json(
      { error: "Nao autenticado. Faca login para continuar." },
      { status: 401 }
    );
  }
  return null;
}

/** Gera um novo token e o seta no cookie httpOnly. Retorna o token gerado. */
export function buildSessionCookie(email: string): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    maxAge: number;
    path: string;
  };
} {
  const token = generateToken(email);
  return {
    name: ADMIN_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // maxAge conservador: 9 horas (token expira em 8h, cookie some em 9h)
      maxAge: 9 * 60 * 60,
      path: "/",
    },
  };
}
