/**
 * auth.ts - funcoes puras de criptografia de sessao e senha.
 * Este modulo NAO importa "next/headers", pode ser usado no proxy.ts e em route handlers.
 */

import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// Nome do cookie de sessao
export const ADMIN_COOKIE_NAME = "joane_session";

// Tempo de vida da sessao: 8 horas
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Retorna o segredo da sessao, exige pelo menos 32 caracteres. */
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET ausente ou curto demais (minimo 32 chars)."
    );
  }
  return secret;
}

/**
 * Email e hash da senha do admin, vindos do ambiente.
 *
 * Falha alto quando falta configuracao, como getSecret. Antes havia um email
 * embutido como reserva e um hash vazio: ambiente mal configurado nao
 * quebrava, passava a aceitar uma credencial que ninguem escolheu e que
 * estava escrita no repositorio. Erro de configuracao tem que aparecer no
 * deploy, nao virar porta de entrada.
 */
export function getAdminCredentials(): { email: string; passwordHash: string } {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) {
    throw new Error(
      "ADMIN_EMAIL e ADMIN_PASSWORD_HASH precisam estar configurados."
    );
  }
  return { email, passwordHash };
}

/**
 * Gera token de sessao assinado com HMAC-SHA256.
 * Formato: base64url(payload).base64url(assinatura)
 * Payload: JSON { email, iat (timestamp em ms) }
 */
export function generateToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, iat: Date.now() })
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Valida e decodifica o token de sessao.
 * Retorna o payload se valido, null caso invalido ou expirado.
 */
export function verifyToken(token: string): { email: string } | null {
  if (!token) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex < 1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  // Recalcula assinatura esperada
  const expectedSig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  // Comparacao em tempo constante para evitar timing attacks
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.email !== "string" || typeof data.iat !== "number") {
      return null;
    }
    // Verifica expiracao
    if (Date.now() - data.iat > SESSION_TTL_MS) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

/**
 * Gera hash de senha usando scrypt (node:crypto).
 * Formato de saida: "salt_hex:hash_hex"
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica senha contra o hash armazenado.
 * Usa comparacao em tempo constante.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const colonIndex = stored.indexOf(":");
  if (colonIndex < 1) return false;
  const salt = stored.slice(0, colonIndex);
  const storedHash = stored.slice(colonIndex + 1);
  try {
    const candidate = scryptSync(password, salt, 64).toString("hex");
    const candidateBuf = Buffer.from(candidate, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (candidateBuf.length !== storedBuf.length) return false;
    return timingSafeEqual(candidateBuf, storedBuf);
  } catch {
    return false;
  }
}
