/**
 * Testes unitarios para auth.ts
 * Cobre: geracao de token, validacao HMAC, expiracao, hash de senha.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Define o segredo antes de importar o modulo
process.env.ADMIN_SESSION_SECRET = "segredo_de_teste_com_mais_de_32_chars_ok";

import {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  getAdminCredentials,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";

describe("ADMIN_COOKIE_NAME", () => {
  it("deve ter o nome correto do cookie", () => {
    expect(ADMIN_COOKIE_NAME).toBe("joane_session");
  });
});

describe("generateToken / verifyToken", () => {
  it("deve gerar token valido e verificar com sucesso", () => {
    const token = generateToken("joane@psicanalise.com.br");
    const result = verifyToken(token);
    expect(result).not.toBeNull();
    expect(result?.email).toBe("joane@psicanalise.com.br");
  });

  it("deve retornar null para token vazio", () => {
    expect(verifyToken("")).toBeNull();
  });

  it("deve retornar null para token malformado", () => {
    expect(verifyToken("abc.def.ghi")).toBeNull();
    expect(verifyToken("semPonto")).toBeNull();
  });

  it("deve rejeitar token com assinatura alterada", () => {
    const token = generateToken("joane@psicanalise.com.br");
    // Altera o ultimo caractere da assinatura
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyToken(tampered)).toBeNull();
  });

  it("deve rejeitar token com payload alterado", () => {
    const token = generateToken("joane@psicanalise.com.br");
    const [payload, sig] = token.split(".");
    // Troca o email no payload sem re-assinar
    const fakePayload = Buffer.from(
      JSON.stringify({ email: "atacante@evil.com", iat: Date.now() })
    ).toString("base64url");
    const fakeToken = `${fakePayload}.${sig}`;
    expect(verifyToken(fakeToken)).toBeNull();
  });

  it("deve rejeitar token expirado (mock do Date.now)", () => {
    const realNow = Date.now;
    // Gera token
    const token = generateToken("joane@psicanalise.com.br");
    // Avanca o tempo em 9 horas (alem dos 8h de TTL)
    vi.spyOn(Date, "now").mockReturnValue(realNow() + 9 * 60 * 60 * 1000);
    expect(verifyToken(token)).toBeNull();
    vi.restoreAllMocks();
  });

  it("deve aceitar token dentro do TTL (mock do Date.now)", () => {
    const realNow = Date.now;
    const token = generateToken("joane@psicanalise.com.br");
    // Avanca apenas 7 horas (dentro do TTL de 8h)
    vi.spyOn(Date, "now").mockReturnValue(realNow() + 7 * 60 * 60 * 1000);
    const result = verifyToken(token);
    expect(result).not.toBeNull();
    vi.restoreAllMocks();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("deve gerar hash e verificar a senha corretamente", () => {
    const hash = hashPassword("minha_senha_segura");
    expect(hash).toContain(":");
    expect(verifyPassword("minha_senha_segura", hash)).toBe(true);
  });

  it("deve rejeitar senha incorreta", () => {
    const hash = hashPassword("senha_correta");
    expect(verifyPassword("senha_errada", hash)).toBe(false);
  });

  it("deve gerar hashes diferentes para a mesma senha (salt aleatorio)", () => {
    const hash1 = hashPassword("mesma_senha");
    const hash2 = hashPassword("mesma_senha");
    expect(hash1).not.toBe(hash2);
    // Mas ambos devem verificar a senha corretamente
    expect(verifyPassword("mesma_senha", hash1)).toBe(true);
    expect(verifyPassword("mesma_senha", hash2)).toBe(true);
  });

  it("deve retornar false para hash malformado", () => {
    expect(verifyPassword("senha", "sem_dois_pontos")).toBe(false);
    expect(verifyPassword("senha", "")).toBe(false);
  });
});

describe("getAdminCredentials", () => {
  it("deve retornar email e passwordHash das env vars", () => {
    process.env.ADMIN_EMAIL = "joane@psicanalise.com.br";
    process.env.ADMIN_PASSWORD_HASH = "salt:hash";
    const creds = getAdminCredentials();
    expect(creds.email).toBe("joane@psicanalise.com.br");
    expect(creds.passwordHash).toBe("salt:hash");
  });
});
