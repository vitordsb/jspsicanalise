/**
 * money.ts - utilitarios para valores monetarios em centavos.
 *
 * Design: todos os valores sao armazenados como inteiros em centavos (Int).
 * Ex: R$ 180,00 = 18000 centavos. Inteiros sao exatos em JavaScript e no
 * Postgres, eliminando erros de arredondamento de ponto flutuante.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos para exibicao em pt-BR. Ex: 18000 -> "R$ 180,00" */
export function centsToBrl(cents: number): string {
  return BRL.format(cents / 100);
}

/**
 * Converte numero decimal (float) para centavos inteiros.
 * Ex: 180.0 -> 18000 | 180.5 -> 18050
 */
export function floatToCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Converte centavos para float.
 * Ex: 18000 -> 180.0
 */
export function centsToFloat(cents: number): number {
  return cents / 100;
}

/**
 * Valida e normaliza um valor de entrada como centavos.
 * Aceita: 180 | 180.0 | 180.00 | "180" | "180,50" | "R$ 180,50"
 * Retorna null se invalido.
 *
 * Teto: R$ 99.999,99 (centavos: 9999999) para evitar entradas absurdas.
 */
export function parseCents(input: unknown): number | null {
  if (typeof input === "number") {
    if (!isFinite(input) || input < 0) return null;
    return Math.round(input * 100);
  }
  if (typeof input === "string") {
    // Remove simbolo de moeda, espacos e converte virgula em ponto
    const clean = input.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".").trim();
    const num = parseFloat(clean);
    if (isNaN(num) || num < 0) return null;
    return Math.round(num * 100);
  }
  return null;
}

/** Valida centavos: positivo e dentro do teto de R$ 99.999,99 */
export function isValidCents(cents: number): boolean {
  return Number.isInteger(cents) && cents > 0 && cents <= 9_999_999;
}
