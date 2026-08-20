import { NextResponse, NextRequest } from "next/server";
import { getAdminCredentials, generateToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const credentials = getAdminCredentials();

    if (
      !email ||
      !password ||
      email.trim().toLowerCase() !== credentials.email.trim().toLowerCase() ||
      password !== credentials.password
    ) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = generateToken();

    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
    });

    // Seta cookie httpOnly
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao realizar login." },
      { status: 500 }
    );
  }
}
