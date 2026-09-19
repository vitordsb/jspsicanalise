/**
 * Login da area do paciente: CPF mais token numerico de acesso.
 *
 * Rate limit em duas dimensoes. Por CPF para travar quem tenta adivinhar o
 * token de uma pessoa especifica, e por IP para travar quem varre varios CPFs
 * a partir da mesma origem. Token de 8 digitos so e seguro com esse freio.
 */

import { NextRequest, NextResponse } from "next/server";
import { scryptSync } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizeCpf, isValidCpf } from "@/lib/cpf";
import { verificarToken, cookieSessaoPaciente } from "@/lib/paciente-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Hash fantasma para comparacao em tempo constante quando o CPF nao existe.
 * Sem isso, a ausencia do scrypt revela por timing que o CPF nao e paciente
 * da clinica, o que e dado sensivel para uma clinica psicanalitica.
 */
const HASH_FANTASMA = (() => {
  const salt = "00000000000000000000000000000000";
  return `${salt}:${scryptSync("fantasma", salt, 64).toString("hex")}`;
})();

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

  try {
    const paciente = await prisma.patient.findUnique({
      where: { cpf: cpfLimpo },
      select: { id: true, fullName: true, accessTokenHash: true },
    });

    // Mensagem unica para CPF inexistente e token errado: nao confirmamos se
    // determinada pessoa e paciente da clinica.
    // verificarToken roda sempre (com hash real ou fantasma) para nivelar o
    // tempo de resposta e impedir que um atacante descubra via timing quais
    // CPFs sao pacientes da clinica.
    const generico = NextResponse.json(
      { error: "CPF ou código de acesso inválido." },
      { status: 401 }
    );

    const hashParaComparar = paciente?.accessTokenHash || HASH_FANTASMA;
    const tokenValido = verificarToken(tokenLimpo, hashParaComparar);
    if (!paciente || !paciente.accessTokenHash || !tokenValido) return generico;

    const cookie = cookieSessaoPaciente(paciente.id);
    const res = NextResponse.json({
      success: true,
      nome: paciente.fullName,
    });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (error) {
    console.error("Erro ao processar login do paciente:", error);
    return NextResponse.json(
      { error: "Não foi possível entrar agora. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
