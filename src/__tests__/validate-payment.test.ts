/**
 * Testes para a validacao dos campos de pagamento PIX em updateProfileSchema.
 * Cobre: campo vazio e valido, CPF invalido rejeitado, CNPJ invalido rejeitado,
 * e-mail invalido rejeitado, tipos sem validacao especifica passam.
 */

import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "@/lib/validate";

// CPF valido: 529.982.247-25
const CPF_VALIDO = "529.982.247-25";
// CPF invalido (checksum errado)
const CPF_INVALIDO = "111.111.111-11";

// CNPJ valido: 11.222.333/0001-81
const CNPJ_VALIDO = "11.222.333/0001-81";
// CNPJ invalido
const CNPJ_INVALIDO = "11.111.111/1111-11";

describe("updateProfileSchema - campos PIX ausentes (vazio e valido)", () => {
  it("aceita body sem nenhum campo PIX", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("aceita pixKey vazio e pixKeyType vazio", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "",
      pixKeyType: "",
    });
    expect(result.success).toBe(true);
  });

  it("aceita pixKey preenchida sem pixKeyType (nenhuma validacao especifica)", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "qualquer-valor",
      pixKeyType: "",
    });
    expect(result.success).toBe(true);
  });

  it("aceita pixKeyType preenchido sem pixKey", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "",
      pixKeyType: "cpf",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProfileSchema - pixKeyType=cpf", () => {
  it("aceita CPF valido como chave PIX", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: CPF_VALIDO,
      pixKeyType: "cpf",
    });
    expect(result.success).toBe(true);
  });

  it("aceita CPF valido sem formatacao", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "52998224725",
      pixKeyType: "cpf",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita CPF com checksum invalido", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: CPF_INVALIDO,
      pixKeyType: "cpf",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("pixKey");
      expect(result.error.issues[0].message).toMatch(/CPF/i);
    }
  });

  it("rejeita CPF com todos os digitos iguais", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "000.000.000-00",
      pixKeyType: "cpf",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema - pixKeyType=cnpj", () => {
  it("aceita CNPJ valido como chave PIX", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: CNPJ_VALIDO,
      pixKeyType: "cnpj",
    });
    expect(result.success).toBe(true);
  });

  it("aceita CNPJ valido sem formatacao", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "11222333000181",
      pixKeyType: "cnpj",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita CNPJ invalido", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: CNPJ_INVALIDO,
      pixKeyType: "cnpj",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("pixKey");
      expect(result.error.issues[0].message).toMatch(/CNPJ/i);
    }
  });
});

describe("updateProfileSchema - pixKeyType=email", () => {
  it("aceita e-mail valido como chave PIX", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "joane@exemplo.com.br",
      pixKeyType: "email",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail invalido", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "nao-e-um-email",
      pixKeyType: "email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("pixKey");
      expect(result.error.issues[0].message).toMatch(/e-mail/i);
    }
  });
});

describe("updateProfileSchema - pixKeyType=telefone e aleatoria", () => {
  it("aceita qualquer valor para tipo telefone", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "+5511999999999",
      pixKeyType: "telefone",
    });
    expect(result.success).toBe(true);
  });

  it("aceita qualquer valor para tipo aleatoria", () => {
    const result = updateProfileSchema.safeParse({
      pixKey: "a7b2c3d4-e5f6-7890-abcd-ef1234567890",
      pixKeyType: "aleatoria",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProfileSchema - campos bancarios (agencia e conta)", () => {
  it("aceita agencia e conta validas", () => {
    const result = updateProfileSchema.safeParse({
      bankAgency: "1234-5",
      bankAccount: "67890-1",
    });
    expect(result.success).toBe(true);
  });

  it("aceita agencia e conta vazias", () => {
    const result = updateProfileSchema.safeParse({
      bankAgency: "",
      bankAccount: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita agencia com mais de 20 caracteres", () => {
    const result = updateProfileSchema.safeParse({
      bankAgency: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita conta com mais de 30 caracteres", () => {
    const result = updateProfileSchema.safeParse({
      bankAccount: "1".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita agencia com caracteres invalidos", () => {
    const result = updateProfileSchema.safeParse({
      bankAgency: "1234<script>",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema - pixKeyType enum", () => {
  it("aceita pixKeyType vazio", () => {
    const result = updateProfileSchema.safeParse({ pixKeyType: "" });
    expect(result.success).toBe(true);
  });

  it("rejeita pixKeyType invalido", () => {
    const result = updateProfileSchema.safeParse({ pixKeyType: "boleto" });
    expect(result.success).toBe(false);
  });
});
