import { describe, it, expect, vi } from "vitest";

// A funcao testada vive num modulo que importa o Prisma no topo. Aqui so
// interessa a regra de risco, nao o banco.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { temSinalDeRisco } from "@/lib/limpeza-anamneses";

/**
 * Esta funcao decide se a ficha de alguem em crise sobrevive a limpeza de 24
 * horas. Errar para o lado de guardar custa espaco; errar para o lado de
 * apagar joga fora a informacao mais importante que o sistema coleta.
 */
describe("temSinalDeRisco", () => {
  it("guarda quem sinalizou ideacao", () => {
    expect(temSinalDeRisco({ q_ideacao: "Sim, tenho pensado nisso" })).toBe(true);
    expect(temSinalDeRisco({ q_ideacao: "Às vezes" })).toBe(true);
  });

  it("libera quem respondeu que nao", () => {
    expect(temSinalDeRisco({ q_ideacao: "Não" })).toBe(false);
    expect(temSinalDeRisco({ q_ideacao: "Prefiro não responder aqui" })).toBe(false);
    expect(temSinalDeRisco({ q_ideacao: "" })).toBe(false);
  });

  it("ignora acento, caixa e espaco na resposta negativa", () => {
    // O texto das opcoes e editavel pela Joane e vai ser redigitado uma hora.
    expect(temSinalDeRisco({ q_ideacao: "NÃO" })).toBe(false);
    expect(temSinalDeRisco({ q_ideacao: "  nao  " })).toBe(false);
  });

  it("guarda autolesao recente e libera a antiga", () => {
    expect(temSinalDeRisco({ q_autolesao: "Sim, recentemente" })).toBe(true);
    expect(temSinalDeRisco({ q_autolesao: "Sim, mas faz anos" })).toBe(false);
    expect(temSinalDeRisco({ q_autolesao: "Não" })).toBe(false);
  });

  it("sobrevive ao campo ser renomeado no modelo", () => {
    // O motivo de existir busca por padrao: com a chave cravada, renomear o
    // campo fazia a funcao devolver false para todo mundo, em silencio.
    expect(temSinalDeRisco({ q_ideacao_suicida: "Sim" })).toBe(true);
    expect(temSinalDeRisco({ pergunta_sobre_ideação: "Sim" })).toBe(true);
    expect(temSinalDeRisco({ q_autolesao_recente: "Sim, recentemente" })).toBe(true);
  });

  it("nao confunde pergunta comum com triagem de risco", () => {
    expect(temSinalDeRisco({ q_motivo: "Sim, quero terapia" })).toBe(false);
    expect(temSinalDeRisco({ q_sono: "Durmo mal" })).toBe(false);
  });

  it("aguenta resposta que nao e texto", () => {
    expect(temSinalDeRisco({ q_ideacao: true })).toBe(true);
    expect(temSinalDeRisco({ q_ideacao: ["pensamentos"] })).toBe(true);
    expect(temSinalDeRisco({ q_ideacao: null })).toBe(false);
    expect(temSinalDeRisco({})).toBe(false);
  });
});
