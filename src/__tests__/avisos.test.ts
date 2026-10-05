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

describe("aviso de mudanca na agenda para a Joane", () => {
  const original = { ...process.env };
  const sendMail = vi.fn(async () => ({ messageId: "teste" }));

  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.exemplo.com";
    process.env.SMTP_USER = "usuario";
    process.env.SMTP_PASS = "senha";
    sendMail.mockClear();
    // O bloco anterior ja carregou mail.ts com o nodemailer de verdade.
    vi.resetModules();
    vi.doMock("nodemailer", () => ({
      default: { createTransport: () => ({ sendMail }) },
    }));
  });
  afterEach(() => {
    process.env = { ...original };
    vi.doUnmock("nodemailer");
    vi.resetModules();
  });

  // quinta, 03/09/2026, 09:00 em Sao Paulo
  const INICIO = new Date("2026-09-03T12:00:00.000Z");

  const casos = [
    ["marcada", "Consulta marcada"],
    ["cancelada", "Consulta cancelada"],
    ["pedido-remarcacao", "Pedido de remarcação"],
    ["pedido-remarcacao-retirado", "Pedido de remarcação retirado"],
  ] as const;

  for (const [tipo, titulo] of casos) {
    it(`${tipo}: chega no e-mail configurado, com o horario no assunto`, async () => {
      const { avisarJoaneSobreConsulta } = await import("@/lib/mail");
      const r = await avisarJoaneSobreConsulta({
        recipientEmail: "joane@exemplo.com",
        tipo,
        nomePaciente: "Maria <b>Souza</b>",
        inicioEm: INICIO,
        duracaoMinutos: 50,
      });

      expect(r.success).toBe(true);
      expect(r.simulated).toBeUndefined();
      expect(sendMail).toHaveBeenCalledTimes(1);

      const msg = (sendMail.mock.calls[0] as unknown as [Record<string, string>])[0];
      expect(msg.to).toBe("joane@exemplo.com");
      // O horario e o que poupa a ida ate a agenda.
      expect(msg.subject.startsWith(`${titulo} - `)).toBe(true);
      expect(msg.subject).toContain("09:00");
      expect(msg.text).toContain("09:00");
      expect(msg.html).toContain("/admin/agenda");
      // Nome no corpo, escapado: e entrada livre do cadastro.
      expect(msg.text).toContain("Paciente: Maria <b>Souza</b>");
      expect(msg.html).toContain("Maria &lt;b&gt;Souza&lt;/b&gt;");
      expect(msg.html).not.toContain("<b>Souza</b>");
    });
  }

  it("sem e-mail configurado cai no padrao da Joane", async () => {
    const { avisarJoaneSobreConsulta } = await import("@/lib/mail");
    await avisarJoaneSobreConsulta({ tipo: "cancelada", nomePaciente: "Maria", inicioEm: INICIO });
    const msg = (sendMail.mock.calls[0] as unknown as [Record<string, string>])[0];
    expect(msg.to).toBe("enaoj22@gmail.com");
  });
});
