/**
 * Testes unitarios para cpf.ts
 * Cobre: normalizacao e validacao de checksum.
 */

import { describe, it, expect } from "vitest";
import { normalizeCpf, isValidCpf } from "@/lib/cpf";

describe("normalizeCpf", () => {
  it("deve remover pontos e tracado", () => {
    expect(normalizeCpf("123.456.789-09")).toBe("12345678909");
  });

  it("deve manter CPF ja normalizado", () => {
    expect(normalizeCpf("12345678909")).toBe("12345678909");
  });

  it("deve remover espacos e outros caracteres", () => {
    expect(normalizeCpf(" 123 456 789 09 ")).toBe("12345678909");
  });

  it("deve retornar string vazia para entrada vazia", () => {
    expect(normalizeCpf("")).toBe("");
  });
});

describe("isValidCpf", () => {
  // CPFs validos com checksum correto
  it("deve validar CPF 529.982.247-25 (classico exemplo valido)", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("deve validar CPF 111.444.777-35", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
  });

  it("deve rejeitar CPF com todos os digitos iguais (111.111.111-11)", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("000.000.000-00")).toBe(false);
    expect(isValidCpf("999.999.999-99")).toBe(false);
  });

  it("deve rejeitar CPF com checksum errado", () => {
    // Troca o ultimo digito
    expect(isValidCpf("529.982.247-26")).toBe(false);
    expect(isValidCpf("529.982.247-00")).toBe(false);
  });

  it("deve rejeitar CPF com menos de 11 digitos", () => {
    expect(isValidCpf("1234567890")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });

  it("deve rejeitar CPF com mais de 11 digitos", () => {
    expect(isValidCpf("123456789012")).toBe(false);
  });

  it("deve rejeitar string nao numerica", () => {
    expect(isValidCpf("abc.def.ghi-jk")).toBe(false);
  });
});
