/**
 * Testes unitarios para rate-limit.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// Nota: o store e um Map global no modulo. Precisamos re-importar
// a cada teste ou usar timestamps distintos por chave para isolar.

describe("checkRateLimit", () => {
  it("deve permitir requisicoes dentro do limite", () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("deve bloquear apos atingir o limite", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 60_000); // 1
    checkRateLimit(key, 2, 60_000); // 2
    const result = checkRateLimit(key, 2, 60_000); // 3 - deve bloquear
    expect(result).toBe(false);
  });

  it("deve resetar o contador apos a janela de tempo", () => {
    const realNow = Date.now;
    const fakeNow = realNow();

    vi.spyOn(Date, "now").mockReturnValue(fakeNow);
    const key = `test-reset-${fakeNow}`;

    // Esgota o limite
    checkRateLimit(key, 1, 1_000); // 1
    expect(checkRateLimit(key, 1, 1_000)).toBe(false); // bloqueado

    // Avanca o tempo alem da janela
    vi.spyOn(Date, "now").mockReturnValue(fakeNow + 2_000);
    expect(checkRateLimit(key, 1, 1_000)).toBe(true); // resetou

    vi.restoreAllMocks();
  });

  it("deve manter contadores separados por chave", () => {
    const ts = Date.now();
    const key1 = `test-sep-a-${ts}`;
    const key2 = `test-sep-b-${ts}`;

    checkRateLimit(key1, 1, 60_000); // key1: 1 (limite)
    expect(checkRateLimit(key1, 1, 60_000)).toBe(false); // key1 bloqueado
    expect(checkRateLimit(key2, 1, 60_000)).toBe(true);  // key2 ainda livre
  });
});
