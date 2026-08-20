/**
 * Login da area do paciente: CPF mais token numerico de acesso.
 *
 * Rate limit em duas dimensoes. Por CPF para travar quem tenta adivinhar o
 * token de uma pessoa especifica, e por IP para travar quem varre varios CPFs
 * a partir da mesma origem. Token de 8 digitos so e seguro com esse freio.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCpf, isValidCpf } from "@/lib/cpf";
import { verificarToken, cookieSessaoPaciente } from "@/lib/paciente-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados enviados." }, { status: 400 });
  }

  const { cpf, token } = (body ?? {}) as { cpf?: string; token?: string };
  const cpfLimpo = normalizeCpf(cpf ?? "");
  const tokenLimpo = (token ?? "").replace(/\D/g, "");

  // Freio por IP antes de qualquer consulta ao banco.
  if (!checkRateLimit(`paciente-login-ip:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  if (!isValidCpf(cpfLimpo) || tokenLimpo.length !== 8) {
    return NextResponse.json(
      { error: "CPF ou código de acesso inválido." },
      { status: 401 }
    );
  }

  // Freio por CPF: impede forca bruta contra uma pessoa especifica.
  if (!checkRateLimit(`paciente-login-cpf:${cpfLimpo}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas para este CPF. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  const paciente = await prisma.patient.findUnique({
    where: { cpf: cpfLimpo },
    select: { id: true, fullName: true, accessTokenHash: true },
  });

  // Mensagem unica para CPF inexistente e token errado: nao confirmamos se
  // determinada pessoa e paciente da clinica.
  const generico = NextResponse.json(
    { error: "CPF ou código de acesso inválido." },
    { status: 401 }
  );

  if (!paciente || !paciente.accessTokenHash) return generico;
  if (!verificarToken(tokenLimpo, paciente.accessTokenHash)) return generico;

  const cookie = cookieSessaoPaciente(paciente.id);
  const res = NextResponse.json({
    success: true,
    nome: paciente.fullName,
  });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
