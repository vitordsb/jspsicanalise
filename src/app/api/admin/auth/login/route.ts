import { NextResponse, NextRequest } from "next/server";
import {
  getAdminCredentials,
  verifyPassword,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";
import { buildSessionCookie } from "@/lib/auth-session";
import { loginSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisicao invalido." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = loginSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "Dados invalidos." },
        { status: 400 }
      );
    }
    throw e;
  }

  const { email, password } = parsed;
  const credentials = getAdminCredentials();

  // Comparacao de e-mail em tempo constante (evita timing attack)
  const emailMatch =
    email.trim().toLowerCase() === credentials.email.trim().toLowerCase();

  // Verifica senha com hash scrypt
  const passwordMatch =
    credentials.passwordHash && verifyPassword(password, credentials.passwordHash);

  if (!emailMatch || !passwordMatch) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  const cookieDef = buildSessionCookie(credentials.email);

  const response = NextResponse.json({
    success: true,
    message: "Login realizado com sucesso.",
  });

  response.cookies.set(
    cookieDef.name,
    cookieDef.value,
    cookieDef.options
  );

  return response;
}
