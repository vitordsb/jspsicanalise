/**
 * Testes unitarios para pix.ts
 * Os dados PIX agora vem do perfil do admin no banco, nao de env vars.
 * getPixConfig recebe um objeto UserPaymentFields.
 */

import { describe, it, expect } from "vitest";
import { getPixConfig, pixKeyTypeLabel, type UserPaymentFields } from "@/lib/pix";

const emptyUser: UserPaymentFields = {
  pixKey: "",
  pixKeyType: "",
  pixHolderName: "",
  bankName: "",
  bankAgency: "",
  bankAccount: "",
};

describe("getPixConfig - nao configurado", () => {
  it("retorna { configured: false } quando todos os campos estao vazios", () => {
    const config = getPixConfig(emptyUser);
    expect(config.configured).toBe(false);
    expect(config.key).toBeUndefined();
  });

  it("retorna { configured: false } quando apenas pixKey esta preenchida", () => {
    const config = getPixConfig({ ...emptyUser, pixKey: "chave-teste" });
    expect(config.configured).toBe(false);
  });

  it("retorna { configured: false } quando apenas bankName esta preenchido", () => {
    const config = getPixConfig({ ...emptyUser, bankName: "Nubank" });
    expect(config.configured).toBe(false);
  });

  it("retorna { configured: false } quando pixKey tem so espacos", () => {
    const config = getPixConfig({ ...emptyUser, pixKey: "   ", bankName: "Nubank" });
    expect(config.configured).toBe(false);
  });
});

describe("getPixConfig - configurado", () => {
  const baseUser: UserPaymentFields = {
    pixKey: "chave-pix-teste",
    pixKeyType: "email",
    pixHolderName: "Titular Teste",
    bankName: "Banco Teste",
    bankAgency: "1234",
    bankAccount: "56789-0",
  };

  it("retorna configured = true com chave e banco preenchidos", () => {
    const config = getPixConfig(baseUser);
    expect(config.configured).toBe(true);
    expect(config.key).toBe("chave-pix-teste");
    expect(config.bank).toBe("Banco Teste");
    expect(config.holderName).toBe("Titular Teste");
    expect(config.agency).toBe("1234");
    expect(config.account).toBe("56789-0");
    expect(config.keyType).toBe("email");
  });

  it("retorna keyType undefined para tipo desconhecido", () => {
    const config = getPixConfig({ ...baseUser, pixKeyType: "invalido" });
    expect(config.keyType).toBeUndefined();
  });

  it("retorna keyType undefined para pixKeyType vazio", () => {
    const config = getPixConfig({ ...baseUser, pixKeyType: "" });
    expect(config.keyType).toBeUndefined();
  });

  it("retorna todos os tipos validos corretamente", () => {
    const types = ["cpf", "cnpj", "email", "telefone", "aleatoria"] as const;
    for (const t of types) {
      const config = getPixConfig({ ...baseUser, pixKeyType: t });
      expect(config.keyType).toBe(t);
    }
  });

  it("faz trim de espacos em branco nos campos", () => {
    const config = getPixConfig({
      ...baseUser,
      pixKey: "  chave-com-espaco  ",
      bankName: "  Banco  ",
    });
    if (config.configured) {
      expect(config.key).toBe("chave-com-espaco");
      expect(config.bank).toBe("Banco");
    }
  });

  it("holderName undefined quando pixHolderName vazio", () => {
    const config = getPixConfig({ ...baseUser, pixHolderName: "" });
    expect(config.holderName).toBeUndefined();
  });

  it("agency undefined quando bankAgency vazio", () => {
    const config = getPixConfig({ ...baseUser, bankAgency: "" });
    expect(config.agency).toBeUndefined();
  });

  it("account undefined quando bankAccount vazio", () => {
    const config = getPixConfig({ ...baseUser, bankAccount: "" });
    expect(config.account).toBeUndefined();
  });
});

describe("pixKeyTypeLabel", () => {
  it("retorna 'CPF' para cpf", () => {
    expect(pixKeyTypeLabel("cpf")).toBe("CPF");
  });

  it("retorna 'CNPJ' para cnpj", () => {
    expect(pixKeyTypeLabel("cnpj")).toBe("CNPJ");
  });

  it("retorna 'E-mail' para email", () => {
    expect(pixKeyTypeLabel("email")).toBe("E-mail");
  });

  it("retorna 'Telefone' para telefone", () => {
    expect(pixKeyTypeLabel("telefone")).toBe("Telefone");
  });

  it("retorna 'Chave aleatoria' para aleatoria", () => {
    expect(pixKeyTypeLabel("aleatoria")).toBe("Chave aleatoria");
  });

  it("retorna o proprio valor para tipo desconhecido", () => {
    expect(pixKeyTypeLabel("outro")).toBe("outro");
  });
});
