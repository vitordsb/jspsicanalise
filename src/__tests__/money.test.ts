import { describe, it, expect } from "vitest";
import {
  centsToBrl,
  floatToCents,
  centsToFloat,
  parseCents,
  isValidCents,
} from "@/lib/money";

describe("centsToBrl", () => {
  it("formata centavos em BRL com virgula decimal", () => {
    // Intl pode variar o espaco - compara apenas os digitos
    expect(centsToBrl(18000)).toMatch("180,00");
  });

  it("formata valor com centavos", () => {
    expect(centsToBrl(18050)).toMatch("180,50");
  });

  it("formata zero", () => {
    expect(centsToBrl(0)).toMatch("0,00");
  });
});

describe("floatToCents", () => {
  it("converte 180.0 para 18000", () => {
    expect(floatToCents(180.0)).toBe(18000);
  });

  it("converte 180.5 para 18050", () => {
    expect(floatToCents(180.5)).toBe(18050);
  });

  it("arredonda imprecisao de float", () => {
    // 0.1 + 0.2 = 0.30000000000000004 em JS
    expect(floatToCents(0.1 + 0.2)).toBe(30);
  });

  it("converte zero", () => {
    expect(floatToCents(0)).toBe(0);
  });
});

describe("centsToFloat", () => {
  it("converte 18000 para 180.0", () => {
    expect(centsToFloat(18000)).toBe(180.0);
  });

  it("converte 18050 para 180.5", () => {
    expect(centsToFloat(18050)).toBe(180.5);
  });
});

describe("parseCents", () => {
  it("aceita numero inteiro direto", () => {
    expect(parseCents(180)).toBe(18000);
  });

  it("aceita numero float", () => {
    expect(parseCents(180.5)).toBe(18050);
  });

  it("aceita string numerica", () => {
    expect(parseCents("180")).toBe(18000);
  });

  it("aceita string com virgula decimal", () => {
    expect(parseCents("180,50")).toBe(18050);
  });

  it("aceita string com simbolo BRL", () => {
    expect(parseCents("R$ 180,50")).toBe(18050);
  });

  it("aceita string com ponto de milhar e virgula decimal", () => {
    expect(parseCents("1.800,00")).toBe(180000);
  });

  it("retorna null para string invalida", () => {
    expect(parseCents("abc")).toBeNull();
  });

  it("retorna null para numero negativo", () => {
    expect(parseCents(-10)).toBeNull();
  });

  it("retorna null para null", () => {
    expect(parseCents(null)).toBeNull();
  });

  it("retorna null para objeto", () => {
    expect(parseCents({})).toBeNull();
  });

  it("retorna null para Infinity", () => {
    expect(parseCents(Infinity)).toBeNull();
  });
});

describe("isValidCents", () => {
  it("aceita valor positivo inteiro", () => {
    expect(isValidCents(18000)).toBe(true);
  });

  it("aceita 1 centavo", () => {
    expect(isValidCents(1)).toBe(true);
  });

  it("aceita o teto maximo (R$ 99.999,99)", () => {
    expect(isValidCents(9_999_999)).toBe(true);
  });

  it("rejeita zero", () => {
    expect(isValidCents(0)).toBe(false);
  });

  it("rejeita negativo", () => {
    expect(isValidCents(-1)).toBe(false);
  });

  it("rejeita acima do teto", () => {
    expect(isValidCents(10_000_000)).toBe(false);
  });

  it("rejeita float (nao-inteiro)", () => {
    expect(isValidCents(180.5)).toBe(false);
  });
});
