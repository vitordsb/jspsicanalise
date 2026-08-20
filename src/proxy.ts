/**
 * proxy.ts - substitui middleware.ts (deprecated no Next.js 16).
 * Valida a assinatura HMAC do cookie de sessao antes de liberar rotas /admin.
 * Executa no runtime Node.js (padrao no Next.js 16).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { verificarSessaoPaciente, PACIENTE_COOKIE_NAME } from "@/lib/paciente-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Pagina de login e publica
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const session = request.cookies.get(ADMIN_COOKIE_NAME);

    // Verifica tanto a existencia quanto a validade criptografica do token
    if (!session?.value || !verifyToken(session.value)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Area do paciente: sessao propria, cookie proprio. Um token de admin nao
  // abre esta area, e um token de paciente nao abre o painel.
  if (pathname.startsWith("/area-do-paciente")) {
    if (pathname === "/area-do-paciente/entrar") {
      return NextResponse.next();
    }
    const sessao = request.cookies.get(PACIENTE_COOKIE_NAME);
    if (!sessao?.value || !verificarSessaoPaciente(sessao.value)) {
      return NextResponse.redirect(new URL("/area-do-paciente/entrar", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/area-do-paciente/:path*"],
};
