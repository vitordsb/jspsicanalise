import { describe, it, expect } from "vitest";
import {
  montarDocumento, textoCanonico, hashDoDocumento, codigoDeVerificacao,
  type DadosDoContrato,
} from "@/lib/contrato-texto";

const BASE: DadosDoContrato = {
  therapistName: "Joane Souza Oliveira de Andrade",
  professionalDocNumber: "", therapistAddress: "", therapistPhone: "1199999999",
  patientFullName: "Maria Aparecida de Souza", patientCpf: "11144477735",
  patientRg: "40.268.156-3", patientNationality: "brasileira",
  patientMaritalStatus: "solteira", patientOccupation: "professora",
  patientAddress: "Rua das Flores, 10", frequency: "Semanal (1 sessão por semana)",
  durationMinutes: 50, modalidade: "online", initialSessionsCount: 4,
  sessionPriceCents: 20000, paymentMethod: "PIX", paymentDueDay: 10,
  lateFeePercent: 2, lateInterestPercent: 1, cancellationHours: 24,
  rescissionNoticeDays: 30, foroCidade: "Cotia", customClauses: "",
  paymentPixKey: "chave-de-teste", paymentPixKeyType: "aleatoria",
  paymentPixHolderName: "Joane", paymentBankName: "Banco Teste",
  paymentBankAgency: "1234", paymentBankAccount: "56789-0",
};

const DIA = new Date("2026-08-24T15:00:00.000Z");
const hashDe = (c: Partial<DadosDoContrato>, d: Date = DIA) =>
  hashDoDocumento(textoCanonico(montarDocumento({ ...BASE, ...c }, d)));

describe("texto canonico do contrato", () => {
  it("e deterministico: mesmo contrato, mesmo hash", () => {
    expect(hashDe({})).toBe(hashDe({}));
  });

  it("nao depende da hora em que foi gerado", () => {
    // O documento usava new Date() e mudava de data a cada impressao. Num
    // contrato assinado isso invalidaria a propria assinatura.
    const a = textoCanonico(montarDocumento(BASE, DIA));
    const b = textoCanonico(montarDocumento(BASE, DIA));
    expect(a).toBe(b);
    expect(a).toContain("24/08/2026");
  });

  it("muda o hash se o valor da sessao mudar um centavo", () => {
    expect(hashDe({ sessionPriceCents: 20001 })).not.toBe(hashDe({}));
  });

  it("muda o hash em qualquer campo que aparece no documento", () => {
    const original = hashDe({});
    expect(hashDe({ patientFullName: "Outra Pessoa" })).not.toBe(original);
    expect(hashDe({ cancellationHours: 48 })).not.toBe(original);
    expect(hashDe({ foroCidade: "São Paulo" })).not.toBe(original);
    expect(hashDe({ customClauses: "Cláusula nova." })).not.toBe(original);
    expect(hashDe({ paymentPixKey: "outra-chave" })).not.toBe(original);
  });

  it("muda o hash se a data de referencia mudar", () => {
    expect(hashDe({}, new Date("2026-08-25T15:00:00.000Z"))).not.toBe(hashDe({}));
  });

  it("omite campo vazio em vez de deixar rotulo em branco", () => {
    const texto = textoCanonico(montarDocumento({ ...BASE, patientRg: "" }, DIA));
    expect(texto).not.toContain("RG:");
    expect(texto).toContain("CPF:");
  });

  it("sem comarca, a clausula de foro inteira sai fora", () => {
    const comForo = textoCanonico(montarDocumento(BASE, DIA));
    const semForo = textoCanonico(montarDocumento({ ...BASE, foroCidade: "" }, DIA));
    expect(comForo).toContain("do foro");
    expect(semForo).not.toContain("do foro");
  });

  it("numera a clausula de foro conforme houver clausulas extras", () => {
    const sem = textoCanonico(montarDocumento(BASE, DIA));
    const com = textoCanonico(montarDocumento({ ...BASE, customClauses: "Extra." }, DIA));
    expect(sem).toContain("Cláusula sexta - do foro");
    expect(com).toContain("Cláusula sétima - do foro");
    expect(com).toContain("Cláusula sexta - disposições gerais");
  });

  it("o codigo de verificacao deriva do hash e acompanha a mudanca", () => {
    const h = hashDe({});
    expect(codigoDeVerificacao(h)).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(codigoDeVerificacao(h)).toBe(codigoDeVerificacao(h));
    expect(codigoDeVerificacao(hashDe({ sessionPriceCents: 30000 })))
      .not.toBe(codigoDeVerificacao(h));
  });

  it("dado de pagamento ausente nao vira frase quebrada", () => {
    const texto = textoCanonico(montarDocumento(
      { ...BASE, paymentPixKey: "", paymentBankName: "" }, DIA
    ));
    expect(texto).not.toContain("Os pagamentos serão realizados");
  });
});
