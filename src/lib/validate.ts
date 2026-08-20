/**
 * validate.ts - schemas Zod para validacao de entrada nas rotas.
 * Centraliza todas as regras de validacao do backend.
 * Compativel com Zod v4.
 */

import { z } from "zod";
import { normalizeCpf, isValidCpf, normalizeCnpj, isValidCnpj } from "./cpf";

// Re-exporta para conveniencia de importacoes externas
export { normalizeCpf, isValidCpf, normalizeCnpj, isValidCnpj } from "./cpf";

// --- Schemas ---

export const loginSchema = z.object({
  email: z
    .string()
    .email("E-mail inválido.")
    .max(254, "E-mail muito longo."),
  password: z
    .string()
    .min(1, "A senha não pode ficar em branco.")
    .max(200, "Senha muito longa."),
});

export const checkCpfSchema = z.object({
  cpf: z
    .string()
    .transform(normalizeCpf)
    .refine((v) => v.length === 11, { message: "O CPF deve ter 11 dígitos." })
    .refine(isValidCpf, { message: "CPF inválido. Confira os números digitados." }),
});

export const submitAnamnesisSchema = z.object({
  templateId: z.string().min(1, "templateId e obrigatorio."),
  // A mensagem vai tambem no z.boolean, nao so no refine: quando o campo vem
  // ausente o Zod falha na checagem de tipo e nunca chega no refine, e o
  // paciente acabava vendo o texto cru "expected boolean, received undefined".
  lgpdConsent: z
    .boolean({ error: "É preciso aceitar o termo de consentimento para enviar." })
    .refine((v) => v === true, {
      message: "É preciso aceitar o termo de consentimento para enviar.",
    }),
  personalInfo: z.object({
    fullName: z
      .string()
      .min(3, "O nome deve ter pelo menos 3 caracteres.")
      .max(200, "O nome informado é longo demais."),
    email: z
      .string()
      .email("E-mail inválido.")
      .max(254),
    phone: z
      .string()
      .min(10, "Telefone inválido.")
      .max(20),
    cpf: z
      .string()
      .transform(normalizeCpf)
      .refine((v) => v.length === 11, { message: "O CPF deve ter 11 dígitos." })
      .refine(isValidCpf, { message: "CPF inválido. Confira os números digitados." }),
    birthDate: z.string().optional().default(""),
    gender: z.string().optional().default(""),
    occupation: z.string().optional().default(""),
    maritalStatus: z.string().optional().default(""),
  }),
  // Zod v4: z.record requer 2 args (keySchema, valueSchema)
  answers: z
    .record(z.string(), z.unknown())
    .refine(
      (v) => JSON.stringify(v).length <= 200_000,
      { message: "As respostas excedem o tamanho permitido." }
    ),
});

export const updateSubmissionSchema = z.object({
  status: z
    .enum(["pending", "in_review", "approved", "archived"])
    .optional(),
  clinicalNotes: z.string().max(10_000).optional(),
});

// Centavos: inteiro positivo, teto de R$ 99.999,99
const centsSchema = z.number().int().positive().max(9_999_999);

export const createContractSchema = z.object({
  patientId:    z.string().min(1, "patientId e obrigatorio."),
  submissionId: z.string().optional().nullable(),

  // Cabecalho
  title:  z.string().max(300).optional(),
  // Status atualizavel manualmente so ate "gerado"
  // Transicoes pos-geracao usam os endpoints especializados
  status: z
    .enum(["rascunho", "gerado", "aguardando_assinatura", "assinado_recebido", "aprovado", "recusado"])
    .optional(),

  // Contratada
  therapistName:         z.string().max(200).optional(),
  therapistCpfCnpj:      z.string().max(18).optional(),
  therapistAddress:      z.string().max(500).optional(),
  therapistPhone:        z.string().max(30).optional(),
  professionalDocType:   z.enum(["crp", "cbo", "associacao", "nenhum"]).optional(),
  professionalDocNumber: z.string().max(50).optional(),

  // Contratante snapshot
  patientFullName:      z.string().max(200).optional(),
  patientNationality:   z.string().max(100).optional(),
  patientMaritalStatus: z.string().max(50).optional(),
  patientOccupation:    z.string().max(200).optional(),
  patientRg:            z.string().max(20).optional(),
  patientCpf:           z.string().max(14).optional(),
  patientAddress:       z.string().max(500).optional(),

  // Objeto
  serviceType: z.enum(["psicanalise_clinica", "psicoterapia", "outro"]).optional(),
  modalidade:  z.enum(["presencial", "online", "hibrido"]).optional(),
  abordagem:   z.string().max(200).optional(),

  // Sessoes
  durationMinutes:      z.number().int().positive().max(300).optional(),
  frequency:            z.string().max(100).optional(),
  cancellationHours:    z.number().int().min(0).max(168).optional(),
  initialSessionsCount: z.number().int().min(0).max(20).optional(),

  // Pagamento em centavos
  sessionPriceCents:    centsSchema.optional(),
  evaluationPriceCents: centsSchema.optional().nullable(),
  paymentDueDay:        z.number().int().min(1).max(28).optional(),
  lateFeePercent:       z.number().int().min(0).max(20).optional(),
  lateInterestPercent:  z.number().int().min(0).max(10).optional(),
  paymentMethod:        z.string().max(300).optional(),

  // Vigencia
  rescissionNoticeDays: z.number().int().min(0).max(180).optional(),

  // Foro
  foroCidade: z.string().max(100).optional(),

  // Testemunhas
  hasWitnesses: z.boolean().optional(),
  witness1Name: z.string().max(200).optional().nullable(),
  witness1Cpf:  z.string().max(14).optional().nullable(),
  witness2Name: z.string().max(200).optional().nullable(),
  witness2Cpf:  z.string().max(14).optional().nullable(),

  // Clausulas extras
  customClauses: z.string().max(10_000).optional().nullable(),
});

// Regex permissivo para agencia e conta bancaria:
// aceita digitos, letras, espacos, hifen, barra e ponto.
// Bancos variam demais para uma regra rigida.
const bankFieldRegex = /^[\w\s\-/.]*$/;

export const updateProfileSchema = z
  .object({
    name:              z.string().min(2).max(200).optional(),
    email:             z.string().email().max(254).optional(),
    title:             z.string().max(200).optional(),
    crp:               z.string().max(100).optional(),
    cpfCnpj:           z.string().max(18).optional(),
    phone:             z.string().max(30).optional(),
    notificationEmail: z.string().email().max(254).optional(),
    clinicName:        z.string().max(300).optional(),
    address:           z.string().max(500).optional(),
    // Campos de pagamento PIX (todos opcionais; campo vazio e sempre valido)
    pixKey:        z.string().max(200).optional(),
    // pixKeyType aceita string vazia (estado "nao configurado")
    pixKeyType:    z
      .enum(["", "cpf", "cnpj", "email", "telefone", "aleatoria"])
      .optional(),
    pixHolderName: z.string().max(200).optional(),
    bankName:      z.string().max(200).optional(),
    bankAgency:    z
      .string()
      .max(20, "Agencia: maximo 20 caracteres.")
      .regex(bankFieldRegex, "Agencia: caracteres invalidos.")
      .optional(),
    bankAccount:   z
      .string()
      .max(30, "Conta: maximo 30 caracteres.")
      .regex(bankFieldRegex, "Conta: caracteres invalidos.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const keyType = data.pixKeyType ?? "";
    const key = data.pixKey?.trim() ?? "";

    // Campo vazio sempre passa - e estado legitimo
    if (!keyType || !key) return;

    if (keyType === "cpf") {
      const normalized = normalizeCpf(key);
      if (!isValidCpf(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "Chave PIX (CPF) invalida.",
          path: ["pixKey"],
        });
      }
    } else if (keyType === "cnpj") {
      const normalized = normalizeCnpj(key);
      if (!isValidCnpj(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "Chave PIX (CNPJ) invalida.",
          path: ["pixKey"],
        });
      }
    } else if (keyType === "email") {
      const emailResult = z.string().email().safeParse(key);
      if (!emailResult.success) {
        ctx.addIssue({
          code: "custom",
          message: "Chave PIX (e-mail) invalida.",
          path: ["pixKey"],
        });
      }
    }
    // "telefone" e "aleatoria": sem validacao especifica de formato
  });

export const createTemplateSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio.").max(300),
  description: z.string().max(1000).optional().default(""),
  sections: z.unknown().optional(),
  isActive: z.boolean().optional().default(false),
  duplicateFromId: z.string().optional(),
  incrementVersion: z.boolean().optional(),
});

// Status validos do contrato (fonte da verdade no backend)
export const CONTRACT_STATUSES = [
  "rascunho",
  "gerado",
  "aguardando_assinatura",
  "assinado_recebido",
  "aprovado",
  "recusado",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

// Mapa de transicoes permitidas
export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  rascunho:               ["gerado"],
  gerado:                 ["aguardando_assinatura"],
  aguardando_assinatura:  ["assinado_recebido"],
  assinado_recebido:      ["aprovado", "recusado"],
  aprovado:               [],
  // Paciente pode reenviar apos recusa
  recusado:               ["aguardando_assinatura"],
};

export function isValidTransition(
  from: ContractStatus,
  to: ContractStatus
): boolean {
  return CONTRACT_TRANSITIONS[from]?.includes(to) ?? false;
}

// Schema para recusar contrato - motivo obrigatorio e nao-vazio
export const refuseContractSchema = z.object({
  reason: z
    .string()
    .min(5, "Motivo da recusa deve ter pelo menos 5 caracteres.")
    .max(2000, "Motivo muito longo."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CheckCpfInput = z.infer<typeof checkCpfSchema>;
export type SubmitAnamnesisInput = z.infer<typeof submitAnamnesisSchema>;
