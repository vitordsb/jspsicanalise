/**
 * rate-limit.ts - limitador de taxa em memoria.
 *
 * Aviso: em ambiente serverless (Vercel), o estado e resetado a cada cold start.
 * Para um sistema de clinica de pequeno porte, isso e aceitavel.
 * Se o volume crescer, substituir por solucao distribuida (ex: Upstash Redis).
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

/**
 * Verifica se a chave esta dentro do limite.
 * @param key - identificador do cliente (ex: IP + rota)
 * @param maxRequests - numero maximo de requisicoes na janela
 * @param windowMs - duracao da janela em ms
 * @returns true se a requisicao e permitida, false se bloqueada
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/** Retorna o IP do request de forma segura, com fallback. */
export function getClientIp(req: Request): string {
  const forwarded = (req as any).headers?.get?.("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
