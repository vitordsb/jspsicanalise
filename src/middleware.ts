import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que requerem autenticação administrativa
  if (pathname.startsWith("/admin")) {
    // Permite acessar a página de login
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get("js_admin_session");

    if (!sessionCookie || !sessionCookie.value) {
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
