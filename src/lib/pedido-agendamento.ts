/**
 * Pedido de consulta feito pelo link publico /agendar.
 *
 * So regras puras e validacao, sem banco: o que toca o Prisma mora em
 * agendamento-publico.ts. Fica separado para poder ser testado sem conexao.
 *
 * Fluxo: a pessoa escolhe o horario e preenche os dados, o pedido fica
 * guardado por alguns minutos e um link vai por e-mail. Ela so vira paciente
 * e so ocupa a agenda quando clica nesse link. Isso e o que segura robo e
 * digitacao errada, ja que a pagina e aberta a qualquer um.
 */

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { normalizeCpf, isValidCpf } from "./cpf";

/** Por quanto tempo o horario fica reservado esperando a confirmacao. */
export const VALIDADE_PEDIDO_MIN = 30;

/** Token do link do e-mail: 32 bytes aleatorios, em base64url (43 caracteres). */
export function gerarTokenPedido(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Guardamos so o hash. O token tem entropia de sobra, entao SHA-256 basta: o
 * scrypt usado no codigo numerico de 8 digitos existe porque aquele e curto.
 */
export function hashTokenPedido(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Barra lixo antes de ir ao banco: so aceita o formato que gerarTokenPedido produz. */
export function tokenPedidoPlausivel(valor: unknown): valor is string {
  return typeof valor === "string" && /^[A-Za-z0-9_-]{43}$/.test(valor);
}

/** Instante em que um pedido criado em `agora` deixa de valer. */
export function expiracaoDoPedido(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + VALIDADE_PEDIDO_MIN * 60_000);
}

const MENSAGEM_NOME = "Informe seu nome completo.";

export const pedidoAgendamentoSchema = z.object({
  nome: z
    .string({ error: MENSAGEM_NOME })
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .refine((v) => v.length >= 3, { message: MENSAGEM_NOME })
    .refine((v) => v.length <= 200, { message: "O nome informado é longo demais." })
    // Pelo menos duas palavras: o contrato e o prontuario precisam de nome completo.
    .refine((v) => v.includes(" "), { message: MENSAGEM_NOME }),
  email: z
    .string({ error: "Informe um e-mail válido." })
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email("Informe um e-mail válido.").max(254, "E-mail muito longo.")),
  telefone: z
    .string({ error: "Informe um telefone com DDD." })
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, {
      message: "Informe um telefone com DDD.",
    }),
  cpf: z
    .string({ error: "Informe um CPF válido." })
    .transform(normalizeCpf)
    .refine(isValidCpf, { message: "CPF inválido. Confira os números digitados." }),
  inicioIso: z
    .string({ error: "Escolha um horário." })
    .min(1, "Escolha um horário.")
    .refine((v) => !isNaN(new Date(v).getTime()), { message: "Horário inválido." }),
  // Campo-isca: invisivel para quem usa a pagina, preenchido por robo que
  // completa todo input que enxerga. Qualquer valor aqui descarta o pedido.
  website: z.string().optional(),
});

export type PedidoAgendamentoInput = z.infer<typeof pedidoAgendamentoSchema>;
