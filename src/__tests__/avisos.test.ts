import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// after() so existe dentro de um request do Next. Aqui interessa a regra de
// quando avisar, nao o agendamento em si.
vi.mock("next/server", () => ({ after: (fn: () => unknown) => fn() }));

import { consultaAindaVale } from "@/lib/avisos";

const daquiA = (horas: number) => new Date(Date.now() + horas * 3600_000);

describe("consultaAindaVale", () => {
  it("avisa consulta futura ainda agendada", () => {
    expect(consultaAindaVale(daquiA(48), "agendado")).toBe(true);
  });

  it("nao avisa consulta que ja passou", () => {
    // Apagar registro antigo e faxina de agenda. O paciente nao precisa
    // receber "sua consulta foi cancelada" sobre algo que ja aconteceu.
    expect(consultaAindaVale(daquiA(-2), "agendado")).toBe(false);
  });

  it("nao avisa de novo quem ja estava cancelado", () => {
    expect(consultaAindaVale(daquiA(48), "cancelado")).toBe(false);
  });

  it("nao avisa sobre anotacao interna de realizado ou falta", () => {
    expect(consultaAindaVale(daquiA(48), "realizado")).toBe(false);
    expect(consultaAindaVale(daquiA(48), "falta")).toBe(false);
  });
});

describe("envio de e-mail", () => {
  const original = { ...process.env };
  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.exemplo.com";
    process.env.SMTP_USER = "usuario";
    process.env.SMTP_PASS = "senha";
  });
  afterEach(() => { process.env = { ...original }; });

  it("paciente sem e-mail cadastrado nao vira erro", async () => {
    // Campo opcional no cadastro: a ausencia nao pode derrubar a rota que
    // acabou de marcar a consulta.
    const { enviarAvisoDeConsulta } = await import("@/lib/mail");
    const r = await enviarAvisoDeConsulta({
      para: "",
      nome: "Fulano de Tal",
      tipo: "marcada",
      inicioEm: daquiA(48),
    });
    expect(r.success).toBe(true);
    expect(r.simulated).toBe(true);
  });

  it("sem credencial de SMTP o envio e simulado, nao falha", async () => {
    delete process.env.SMTP_PASS;
    const { sendAnamnesisNotificationEmail } = await import("@/lib/mail");
    const r = await sendAnamnesisNotificationEmail({ recipientEmail: "a@b.com" });
    expect(r.success).toBe(true);
    expect(r.simulated).toBe(true);
  });
});
