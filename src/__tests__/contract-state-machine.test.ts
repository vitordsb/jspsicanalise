/**
 * Testes da maquina de estados do contrato.
 * Valida as transicoes permitidas e bloqueadas, e o schema de recusa.
 */

import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  refuseContractSchema,
  CONTRACT_TRANSITIONS,
  type ContractStatus,
} from "@/lib/validate";

describe("isValidTransition - transicoes permitidas", () => {
  it("rascunho -> gerado", () => {
    expect(isValidTransition("rascunho", "gerado")).toBe(true);
  });

  it("gerado -> aguardando_assinatura", () => {
    expect(isValidTransition("gerado", "aguardando_assinatura")).toBe(true);
  });

  it("aguardando_assinatura -> assinado_recebido", () => {
    expect(isValidTransition("aguardando_assinatura", "assinado_recebido")).toBe(true);
  });

  it("assinado_recebido -> aprovado", () => {
    expect(isValidTransition("assinado_recebido", "aprovado")).toBe(true);
  });

  it("assinado_recebido -> recusado", () => {
    expect(isValidTransition("assinado_recebido", "recusado")).toBe(true);
  });

  it("recusado -> aguardando_assinatura (nova tentativa)", () => {
    expect(isValidTransition("recusado", "aguardando_assinatura")).toBe(true);
  });
});

describe("isValidTransition - transicoes bloqueadas", () => {
  it("rascunho nao pode ir direto para aprovado", () => {
    expect(isValidTransition("rascunho", "aprovado")).toBe(false);
  });

  it("rascunho nao pode ir para assinado_recebido", () => {
    expect(isValidTransition("rascunho", "assinado_recebido")).toBe(false);
  });

  it("gerado nao pode ir para aprovado sem passar pelo fluxo", () => {
    expect(isValidTransition("gerado", "aprovado")).toBe(false);
  });

  it("gerado nao pode ir para assinado_recebido diretamente", () => {
    expect(isValidTransition("gerado", "assinado_recebido")).toBe(false);
  });

  it("aguardando_assinatura nao pode ser aprovado diretamente", () => {
    expect(isValidTransition("aguardando_assinatura", "aprovado")).toBe(false);
  });

  it("aprovado e estado final - nenhuma transicao permitida", () => {
    const toStates: ContractStatus[] = [
      "rascunho",
      "gerado",
      "aguardando_assinatura",
      "assinado_recebido",
      "aprovado",
      "recusado",
    ];
    for (const to of toStates) {
      expect(isValidTransition("aprovado", to)).toBe(false);
    }
  });

  it("recusado nao pode ir direto para aprovado", () => {
    expect(isValidTransition("recusado", "aprovado")).toBe(false);
  });

  it("recusado nao pode ir para assinado_recebido diretamente", () => {
    expect(isValidTransition("recusado", "assinado_recebido")).toBe(false);
  });
});

describe("isValidTransition - mesmos estados", () => {
  const allStatuses: ContractStatus[] = [
    "rascunho",
    "gerado",
    "aguardando_assinatura",
    "assinado_recebido",
    "aprovado",
    "recusado",
  ];

  for (const status of allStatuses) {
    it(`${status} -> ${status} e bloqueado`, () => {
      expect(isValidTransition(status, status)).toBe(false);
    });
  }
});

describe("CONTRACT_TRANSITIONS - completude", () => {
  it("todos os status tem entrada no mapa de transicoes", () => {
    const statuses: ContractStatus[] = [
      "rascunho",
      "gerado",
      "aguardando_assinatura",
      "assinado_recebido",
      "aprovado",
      "recusado",
    ];
    for (const s of statuses) {
      expect(Array.isArray(CONTRACT_TRANSITIONS[s])).toBe(true);
    }
  });
});

describe("refuseContractSchema", () => {
  it("aceita motivo valido", () => {
    const result = refuseContractSchema.safeParse({ reason: "Assinatura nao reconhecida." });
    expect(result.success).toBe(true);
  });

  it("rejeita motivo vazio", () => {
    const result = refuseContractSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita motivo com menos de 5 chars", () => {
    const result = refuseContractSchema.safeParse({ reason: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch("5");
    }
  });

  it("rejeita ausencia do campo reason", () => {
    const result = refuseContractSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejeita motivo acima de 2000 chars", () => {
    const result = refuseContractSchema.safeParse({ reason: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("aceita exatamente 5 chars", () => {
    const result = refuseContractSchema.safeParse({ reason: "12345" });
    expect(result.success).toBe(true);
  });
});
