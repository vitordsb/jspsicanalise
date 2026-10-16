import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  gerarTokenPedido, hashTokenPedido, tokenPedidoPlausivel, expiracaoDoPedido,
  pedidoAgendamentoSchema, VALIDADE_PEDIDO_MIN,
} from "@/lib/pedido-agendamento";
import { faltamMenosDe } from "@/lib/agenda";

// CPF de teste com digitos verificadores validos.
const CPF_VALIDO = "529.982.247-25";

const base = {
  nome: "Maria da Silva",
  email: "maria@exemplo.com",
  telefone: "(11) 91234-5678",
  cpf: CPF_VALIDO,
  inicioIso: "2026-11-02T11:00:00.000Z",
};

describe("token do link de confirmacao", () => {
  it("tem o formato que a rota aceita e nunca repete", () => {
    const a = gerarTokenPedido();
    const b = gerarTokenPedido();
    expect(tokenPedidoPlausivel(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("o banco recebe so o hash, nunca o token", () => {
    const t = gerarTokenPedido();
    const h = hashTokenPedido(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain(t);
    expect(hashTokenPedido(t)).toBe(h);
  });

  it("recusa lixo antes de ir ao banco", () => {
    expect(tokenPedidoPlausivel("")).toBe(false);
    expect(tokenPedidoPlausivel("curto")).toBe(false);
    expect(tokenPedidoPlausivel(undefined)).toBe(false);
    expect(tokenPedidoPlausivel(123)).toBe(false);
    expect(tokenPedidoPlausivel("a".repeat(43) + "!")).toBe(false);
    expect(tokenPedidoPlausivel("../".repeat(15))).toBe(false);
  });
});

describe("validade do pedido", () => {
  it("vence em 30 minutos", () => {
    const agora = new Date("2026-10-16T12:00:00.000Z");
    expect(VALIDADE_PEDIDO_MIN).toBe(30);
    expect(expiracaoDoPedido(agora).toISOString()).toBe("2026-10-16T12:30:00.000Z");
  });
});

describe("dados do pedido", () => {
  it("normaliza o que a pessoa digitou", () => {
    const r = pedidoAgendamentoSchema.parse({
      ...base,
      nome: "  Maria   da Silva ",
      email: "  Maria@Exemplo.COM ",
    });
    expect(r.nome).toBe("Maria da Silva");
    expect(r.email).toBe("maria@exemplo.com");
    expect(r.telefone).toBe("11912345678");
    expect(r.cpf).toBe("52998224725");
  });

  it("pede nome completo, nao so um nome", () => {
    expect(pedidoAgendamentoSchema.safeParse({ ...base, nome: "Maria" }).success).toBe(false);
    expect(pedidoAgendamentoSchema.safeParse({ ...base, nome: "  " }).success).toBe(false);
  });

  it("recusa e-mail, telefone e CPF invalidos com mensagem legivel", () => {
    const msg = (campo: string, valor: string) => {
      const r = pedidoAgendamentoSchema.safeParse({ ...base, [campo]: valor });
      expect(r.success).toBe(false);
      return r.success ? "" : r.error.issues[0].message;
    };
    expect(msg("email", "sem-arroba")).toBe("Informe um e-mail válido.");
    expect(msg("telefone", "123")).toBe("Informe um telefone com DDD.");
    expect(msg("cpf", "111.111.111-11")).toContain("CPF inválido");
    expect(msg("cpf", "123")).toContain("CPF inválido");
  });

  it("exige o horario", () => {
    expect(pedidoAgendamentoSchema.safeParse({ ...base, inicioIso: "" }).success).toBe(false);
    expect(pedidoAgendamentoSchema.safeParse({ ...base, inicioIso: "ontem" }).success).toBe(false);
  });

  it("deixa passar o campo-isca para a rota decidir", () => {
    // Quem trata a isca e a rota (responde sucesso sem gravar). O schema nao
    // pode rejeitar com erro, senao o robo descobriria o que o derrubou.
    const r = pedidoAgendamentoSchema.parse({ ...base, website: "http://spam.example" });
    expect(r.website).toBe("http://spam.example");
  });
});

describe("faltamMenosDe", () => {
  const agora = new Date("2026-10-16T12:00:00.000Z");
  const emHoras = (h: number) => new Date(agora.getTime() + h * 3600_000);

  it("destaca a consulta que esta a menos de 2 horas", () => {
    expect(faltamMenosDe(emHoras(1), 2, agora)).toBe(true);
    expect(faltamMenosDe(emHoras(1.99), 2, agora)).toBe(true);
  });

  it("nao destaca quando ainda ha folga", () => {
    expect(faltamMenosDe(emHoras(2), 2, agora)).toBe(false);
    expect(faltamMenosDe(emHoras(30), 2, agora)).toBe(false);
  });

  it("consulta que ja comecou conta como urgente", () => {
    expect(faltamMenosDe(emHoras(-1), 2, agora)).toBe(true);
  });

  it("aceita data em texto", () => {
    expect(faltamMenosDe(emHoras(1).toISOString(), 2, agora)).toBe(true);
  });
});

describe("e-mails do agendamento publico", () => {
  const original = { ...process.env };
  const sendMail = vi.fn(async () => ({ messageId: "teste" }));
  // quinta, 03/09/2026, 09:00 em Sao Paulo
  const INICIO = new Date("2026-09-03T12:00:00.000Z");
  const corpo = () => (sendMail.mock.calls[0] as unknown as [Record<string, string>])[0];

  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.exemplo.com";
    process.env.SMTP_USER = "usuario";
    process.env.SMTP_PASS = "senha";
    process.env.APP_URL = "https://app.exemplo.com";
    sendMail.mockClear();
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

  it("link de confirmacao leva o botao, o horario e a validade", async () => {
    const { enviarLinkDeConfirmacao } = await import("@/lib/mail");
    const link = "https://app.exemplo.com/agendar/confirmar?t=abc";
    const r = await enviarLinkDeConfirmacao({
      para: "maria@exemplo.com", nome: "Maria da Silva", inicioEm: INICIO, link, validadeMinutos: 30,
    });
    expect(r.success).toBe(true);
    expect(corpo().to).toBe("maria@exemplo.com");
    expect(corpo().html).toContain(link);
    expect(corpo().text).toContain("09:00");
    expect(corpo().text).toContain("30 minutos");
    expect(corpo().text).toContain("ignorar este e-mail");
  });

  it("consulta confirmada de pessoa nova leva o codigo e o convite da anamnese", async () => {
    const { enviarConsultaConfirmada } = await import("@/lib/mail");
    await enviarConsultaConfirmada({
      para: "maria@exemplo.com", nome: "Maria", inicioEm: INICIO, duracaoMinutos: 50,
      codigo: "12345678", pedirAnamnese: true,
    });
    expect(corpo().text).toContain("1234 5678");
    expect(corpo().html).toContain("https://app.exemplo.com/preencher-anamnese");
    expect(corpo().text).toContain("anamnese");
  });

  it("paciente que ja existe nao recebe codigo, e quem ja tem ficha nao recebe convite", async () => {
    const { enviarConsultaConfirmada } = await import("@/lib/mail");
    await enviarConsultaConfirmada({
      para: "maria@exemplo.com", nome: "Maria", inicioEm: INICIO, pedirAnamnese: false,
    });
    expect(corpo().text).not.toContain("código de acesso:");
    expect(corpo().html).not.toContain("/preencher-anamnese");
    expect(corpo().html).toContain("/area-do-paciente");
  });

  it("pedido de anamnese da Joane aponta para o formulario", async () => {
    const { enviarPedidoDeAnamnese } = await import("@/lib/mail");
    await enviarPedidoDeAnamnese({ para: "maria@exemplo.com", nome: "Maria Souza", inicioEm: INICIO });
    expect(corpo().subject).toContain("anamnese");
    expect(corpo().html).toContain("https://app.exemplo.com/preencher-anamnese");
    expect(corpo().text).toContain("09:00");
  });

  it("aviso para a Joane diz quando a consulta veio sem anamnese", async () => {
    const { avisarJoaneSobreConsulta } = await import("@/lib/mail");
    await avisarJoaneSobreConsulta({
      recipientEmail: "joane@exemplo.com", tipo: "marcada", nomePaciente: "Maria",
      inicioEm: INICIO, semAnamnese: true,
    });
    expect(corpo().text).toContain("sem anamnese");
    expect(corpo().text).toContain("pedir a anamnese");
  });
});
