/**
 * Autenticacao da area do paciente.
 *
 * Separada da autenticacao do admin de proposito: cookie proprio, payload com
 * tipo explicito e verificacao que recusa token do outro dominio. Um token de
 * paciente nunca pode abrir o painel da Joane, e vice-versa.
 *
 * O token de acesso e numerico porque precisa ser ditado por WhatsApp e
 * anotado no papel. Numerico e mais fraco que senha, entao a compensacao vem
 * de tres lados:
 *   1. oito digitos, ou seja 100 milhoes de combinacoes
 *   2. CPF exigido junto, funcionando como segundo fator
 *   3. rate limit por CPF e por IP na rota de login
 * Alem disso guardamos somente o hash: vazamento do banco nao entrega acesso.
 */

import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

export const PACIENTE_COOKIE_NAME = "joane_paciente";

/** Sessao curta: a area do paciente e de consulta pontual, nao de uso diario. */
const SESSAO_MS = 2 * 60 * 60 * 1000;

const DIGITOS_TOKEN = 8;

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET ausente ou curto demais (minimo 32 chars).");
  }
  // Deriva um segredo proprio para a area do paciente. Assim, mesmo com o
  // mesmo material de base, uma assinatura de paciente nunca vale no admin.
  return createHmac("sha256", s).update("area-do-paciente").digest("hex");
}

/** Gera um token numerico de 8 digitos usando fonte criptografica. */
export function gerarTokenAcesso(): string {
  let t = "";
  for (let i = 0; i < DIGITOS_TOKEN; i++) t += String(randomInt(0, 10));
  return t;
}

/** Formata o token em dois blocos, so para leitura: 1234 5678. */
export function formatarToken(token: string): string {
  const d = token.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
}

/** Hash do token no mesmo esquema usado para a senha do admin. */
export function hashToken(token: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(token, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Comparacao em tempo constante do token informado com o hash guardado. */
export function verificarToken(token: string, guardado: string): boolean {
  if (!guardado) return false;
  const sep = guardado.indexOf(":");
  if (sep < 1) return false;
  const salt = guardado.slice(0, sep);
  const esperado = guardado.slice(sep + 1);
  try {
    const candidato = scryptSync(token, salt, 64).toString("hex");
    const a = Buffer.from(candidato, "hex");
    const b = Buffer.from(esperado, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Token de sessao do paciente, assinado com HMAC e com prazo de validade. */
export function gerarSessaoPaciente(patientId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ pid: patientId, tipo: "paciente", iat: Date.now() })
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Valida a sessao do paciente. Retorna o id do paciente ou null. */
export function verificarSessaoPaciente(token: string): { patientId: string } | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;

  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const esperado = createHmac("sha256", getSecret()).update(payload).digest("base64url");

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(esperado, "utf8");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    // O campo tipo impede que uma sessao de admin seja aceita aqui.
    if (d.tipo !== "paciente") return null;
    if (typeof d.pid !== "string" || typeof d.iat !== "number") return null;
    if (Date.now() - d.iat > SESSAO_MS) return null;
    return { patientId: d.pid };
  } catch {
    return null;
  }
}

/** Definicao do cookie de sessao do paciente. */
export function cookieSessaoPaciente(patientId: string) {
  return {
    name: PACIENTE_COOKIE_NAME,
    value: gerarSessaoPaciente(patientId),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: Math.floor(SESSAO_MS / 1000) + 600,
      path: "/",
    },
  };
}
