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

/**
 * Periodicidades oferecidas no contrato e quantas sessoes cada uma representa
 * por mes. A convencao comercial e de 4 semanas por mes, por isso o total
 * mensal e sempre apresentado como estimativa: mes com 5 semanas rende uma
 * sessao a mais, e o contrato precisa dizer isso para nao virar disputa.
 */
export const PERIODICIDADES = [
  { valor: "Semanal (1 sessão por semana)",      sessoesPorMes: 4 },
  { valor: "Duas vezes por semana",              sessoesPorMes: 8 },
  { valor: "Três vezes por semana",              sessoesPorMes: 12 },
  { valor: "Quinzenal (2 sessões por mês)",      sessoesPorMes: 2 },
  { valor: "Mensal (1 sessão por mês)",          sessoesPorMes: 1 },
] as const;

/**
 * Descobre quantas sessoes por mes uma periodicidade representa.
 *
 * Aceita tanto os valores da lista acima quanto texto livre digitado antes de
 * a periodicidade virar uma selecao, por isso o reconhecimento por palavra.
 * Retorna null quando nao da para afirmar: nesse caso o contrato nao imprime
 * total mensal, em vez de imprimir um numero inventado.
 */
export function sessoesPorMes(frequencia: string): number | null {
  const f = (frequencia || "").toLowerCase().trim();
  if (!f) return null;

  const exata = PERIODICIDADES.find((p) => p.valor.toLowerCase() === f);
  if (exata) return exata.sessoesPorMes;

  // "3x por semana", "2 vezes por semana"
  const porSemana = f.match(/(\d+)\s*(x|vezes?)\s*(por|na)?\s*semana/);
  if (porSemana) return Number(porSemana[1]) * 4;

  // "2x por mes", "3 vezes ao mes"
  const porMes = f.match(/(\d+)\s*(x|vezes?)\s*(por|ao|no)?\s*m[eê]s/);
  if (porMes) return Number(porMes[1]);

  if (/duas\s+vezes.*semana/.test(f)) return 8;
  if (/tr[eê]s\s+vezes.*semana/.test(f)) return 12;
  if (/quinzenal/.test(f)) return 2;
  if (/semanal/.test(f)) return 4;
  if (/mensal/.test(f)) return 1;

  return null;
}
