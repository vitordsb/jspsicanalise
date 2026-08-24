import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
});

const carregar = async () => await import("@/lib/paciente-auth");

describe("token de acesso do paciente", () => {
  it("gera 8 digitos", async () => {
    const { gerarTokenAcesso } = await carregar();
    for (let i = 0; i < 20; i++) {
      expect(gerarTokenAcesso()).toMatch(/^\d{8}$/);
    }
  });

  it("nao repete entre chamadas", async () => {
    const { gerarTokenAcesso } = await carregar();
    const vistos = new Set(Array.from({ length: 50 }, () => gerarTokenAcesso()));
    expect(vistos.size).toBeGreaterThan(45);
  });

  it("guarda hash, nunca o valor", async () => {
    const { hashToken, verificarToken } = await carregar();
    const guardado = hashToken("12345678");
    expect(guardado).not.toContain("12345678");
    expect(verificarToken("12345678", guardado)).toBe(true);
    expect(verificarToken("12345679", guardado)).toBe(false);
  });

  it("recusa hash vazio ou malformado", async () => {
    const { verificarToken } = await carregar();
    expect(verificarToken("12345678", "")).toBe(false);
    expect(verificarToken("12345678", "semseparador")).toBe(false);
  });
});

describe("sessao do paciente", () => {
  it("aceita a propria sessao", async () => {
    const { gerarSessaoPaciente, verificarSessaoPaciente } = await carregar();
    const t = gerarSessaoPaciente("paciente-123");
    expect(verificarSessaoPaciente(t)?.patientId).toBe("paciente-123");
  });

  it("recusa token adulterado", async () => {
    const { gerarSessaoPaciente, verificarSessaoPaciente } = await carregar();
    const t = gerarSessaoPaciente("paciente-123");
    const [payload, assinatura] = t.split(".");
    const outro = Buffer.from(JSON.stringify({ patientId: "outro", tipo: "paciente", iat: Date.now() })).toString("base64url");
    expect(verificarSessaoPaciente(`${outro}.${assinatura}`)).toBeNull();
    expect(verificarSessaoPaciente(`${payload}.assinaturafalsa`)).toBeNull();
  });

  it("nao aceita sessao de admin na area do paciente", async () => {
    // A separacao entre os dois dominios e o que impede uma sessao virar a
    // outra. Se cair, um paciente autenticado alcanca o painel da Joane.
    const { verificarSessaoPaciente } = await carregar();
    const { generateToken } = await import("@/lib/auth");
    expect(verificarSessaoPaciente(generateToken("enaoj22@gmail.com"))).toBeNull();
  });

  it("recusa lixo", async () => {
    const { verificarSessaoPaciente } = await carregar();
    for (const v of ["", "abc", "a.b", "..", "x.y.z"]) {
      expect(verificarSessaoPaciente(v)).toBeNull();
    }
  });
});
