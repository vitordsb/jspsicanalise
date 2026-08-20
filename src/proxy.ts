/**
 * proxy.ts - substitui middleware.ts (deprecated no Next.js 16).
 * Valida a assinatura HMAC do cookie de sessao antes de liberar rotas /admin.
 * Executa no runtime Node.js (padrao no Next.js 16).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
