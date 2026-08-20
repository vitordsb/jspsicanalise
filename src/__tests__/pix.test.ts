import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { getPixConfig, pixKeyTypeLabel } from "@/lib/pix";

// Limpa as vars de ambiente de PIX apos cada teste
afterEach(() => {
  delete process.env.PIX_KEY;
  delete process.env.PIX_BANK;
  delete process.env.PIX_HOLDER_NAME;
  delete process.env.PIX_KEY_TYPE;
});

describe("getPixConfig - nao configurado", () => {
  it("retorna { configured: false } quando nenhuma var esta definida", () => {
    const config = getPixConfig();
    expect(config.configured).toBe(false);
    expect(config.key).toBeUndefined();
  });

  it("retorna { configured: false } quando apenas PIX_KEY esta definida", () => {
    process.env.PIX_KEY = "111.444.777-35";
    const config = getPixConfig();
    expect(config.configured).toBe(false);
  });

  it("retorna { configured: false } quando PIX_BANK falta", () => {
    process.env.PIX_KEY         = "111.444.777-35";
    process.env.PIX_HOLDER_NAME = "Joane Andrade";
    const config = getPixConfig();
    expect(config.configured).toBe(false);
  });
});

describe("getPixConfig - configurado", () => {
  beforeEach(() => {
    process.env.PIX_KEY         = "chave-pix-teste";
    process.env.PIX_BANK        = "Banco Teste";
    process.env.PIX_HOLDER_NAME = "Titular Teste";
  });

  it("retorna configured = true com todas as vars presentes", () => {
    const config = getPixConfig();
    expect(config.configured).toBe(true);
    expect(config.key).toBe("chave-pix-teste");
    expect(config.bank).toBe("Banco Teste");
    expect(config.holderName).toBe("Titular Teste");
  });

  it("usa keyType 'cpf' como default quando PIX_KEY_TYPE nao esta definido", () => {
    const config = getPixConfig();
    if (config.configured) {
      expect(config.keyType).toBe("cpf");
    }
  });

  it("usa keyType 'email' quando PIX_KEY_TYPE=email", () => {
    process.env.PIX_KEY_TYPE = "email";
    const config = getPixConfig();
    if (config.configured) {
      expect(config.keyType).toBe("email");
    }
  });

  it("cai para 'cpf' em keyType desconhecido", () => {
    process.env.PIX_KEY_TYPE = "invalido";
    const config = getPixConfig();
    if (config.configured) {
      expect(config.keyType).toBe("cpf");
    }
  });

  it("ignora espaco em branco nas vars", () => {
    process.env.PIX_KEY = "  chave-com-espaco  ";
    const config = getPixConfig();
    if (config.configured) {
      expect(config.key).toBe("chave-com-espaco");
    }
  });
});

describe("pixKeyTypeLabel", () => {
  it("retorna 'CPF' para cpf", () => {
    expect(pixKeyTypeLabel("cpf")).toBe("CPF");
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
