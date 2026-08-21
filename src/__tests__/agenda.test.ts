import { describe, it, expect } from "vitest";
import { gerarVagas, vagaEhValida, lerJanelas, type JanelaAtendimento } from "@/lib/agenda";

const JANELAS: JanelaAtendimento[] = [
  { dia: 1, inicio: "08:00", fim: "11:00" },
  { dia: 2, inicio: "08:00", fim: "11:00" },
  { dia: 3, inicio: "09:00", fim: "10:00" },
  { dia: 4, inicio: "09:00", fim: "10:00" },
  { dia: 5, inicio: "16:00", fim: "19:00" },
];

// Segunda, 24/08/2026, 00:00 em Brasilia (03:00 UTC)
const SEGUNDA = new Date("2026-08-24T03:00:00.000Z");

const base = {
  janelas: JANELAS,
  duracaoMinutos: 50,
  antecedenciaHoras: 0,
  ocupados: [],
  agora: SEGUNDA,
};

describe("geracao de vagas", () => {
  it("janela de 3 horas rende 3 vagas com sessao de 50 minutos", () => {
    const v = gerarVagas({ ...base, diasAFrente: 0 });
    expect(v.map((x) => x.hora)).toEqual(["08:00", "09:00", "10:00"]);
  });

  it("janela de 1 hora rende apenas 1 vaga", () => {
    const v = gerarVagas({ ...base, diasAFrente: 2 }).filter((x) => x.diaSemana === 3);
    expect(v.map((x) => x.hora)).toEqual(["09:00"]);
  });

  it("nao gera vaga em dia sem janela configurada", () => {
    const v = gerarVagas({ ...base, diasAFrente: 6 });
    // Sabado (6) e domingo (0) nao tem janela
    expect(v.some((x) => x.diaSemana === 0 || x.diaSemana === 6)).toBe(false);
  });

  it("sexta a tarde gera 3 vagas", () => {
    const v = gerarVagas({ ...base, diasAFrente: 4 }).filter((x) => x.diaSemana === 5);
    expect(v.map((x) => x.hora)).toEqual(["16:00", "17:00", "18:00"]);
  });

  it("horario ja ocupado sai da lista", () => {
    const todas = gerarVagas({ ...base, diasAFrente: 0 });
    const semPrimeira = gerarVagas({
      ...base, diasAFrente: 0, ocupados: [todas[0].inicioIso],
    });
    expect(semPrimeira).toHaveLength(todas.length - 1);
    expect(semPrimeira.find((x) => x.inicioIso === todas[0].inicioIso)).toBeUndefined();
  });

  it("respeita a antecedencia minima", () => {
    // 09:30 de segunda: com 2h de antecedencia so sobra vaga a partir das 12h,
    // e nao ha janela na segunda a tarde
    const agora = new Date("2026-08-24T12:30:00.000Z");
    const v = gerarVagas({ ...base, agora, diasAFrente: 0, antecedenciaHoras: 2 });
    expect(v).toHaveLength(0);
  });

  it("sessao mais longa reduz o numero de vagas", () => {
    const v = gerarVagas({ ...base, diasAFrente: 0, duracaoMinutos: 120 });
    // 08:00 e 09:00 cabem em 3h; 10:00 terminaria 12:00, fora da janela
    expect(v.map((x) => x.hora)).toEqual(["08:00", "09:00"]);
  });

  it("sem janelas configuradas nao ha vaga", () => {
    expect(gerarVagas({ ...base, janelas: [], diasAFrente: 30 })).toHaveLength(0);
  });
});

describe("validacao de vaga", () => {
  it("aceita inicio valido dentro da janela", () => {
    const v = gerarVagas({ ...base, diasAFrente: 0 })[0];
    expect(vagaEhValida(v.inicioIso, JANELAS, 50)).toBe(true);
  });

  it("recusa horario fora da janela", () => {
    // Segunda as 14:00 de Brasilia
    expect(vagaEhValida("2026-08-24T17:00:00.000Z", JANELAS, 50)).toBe(false);
  });

  it("recusa dia sem atendimento", () => {
    // Sabado as 09:00 de Brasilia
    expect(vagaEhValida("2026-08-29T12:00:00.000Z", JANELAS, 50)).toBe(false);
  });

  it("recusa inicio quebrado dentro da janela", () => {
    // Segunda as 08:30, que nao e inicio de vaga
    expect(vagaEhValida("2026-08-24T11:30:00.000Z", JANELAS, 50)).toBe(false);
  });

  it("recusa sessao que ultrapassa o fim da janela", () => {
    // Quarta as 09:00 com sessao de 90 minutos passa das 10:00
    expect(vagaEhValida("2026-08-26T12:00:00.000Z", JANELAS, 90)).toBe(false);
  });

  it("recusa data invalida", () => {
    expect(vagaEhValida("nao-e-data", JANELAS, 50)).toBe(false);
  });
});

describe("leitura das janelas", () => {
  it("le JSON valido", () => {
    expect(lerJanelas('[{"dia":1,"inicio":"08:00","fim":"11:00"}]')).toHaveLength(1);
  });
  it("tolera JSON invalido", () => {
    expect(lerJanelas("{quebrado")).toEqual([]);
    expect(lerJanelas(null)).toEqual([]);
  });
  it("descarta entrada malformada", () => {
    expect(lerJanelas('[{"dia":9,"inicio":"08:00","fim":"11:00"},{"dia":1,"inicio":"x","fim":"y"}]')).toEqual([]);
  });
});
