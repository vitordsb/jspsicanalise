/**
 * pix.ts - dados de pagamento PIX lidos do perfil do admin no banco.
 *
 * ATENCAO: a chave PIX pode ser um CPF (dado pessoal da Dra. Joane).
 * NAO escreva o valor real em nenhum arquivo do repositorio.
 * A Dra. Joane preenche pelo painel de configuracoes.
 *
 * Historico: antes da migracao 20260820000003, os dados vinham de env vars
 * (PIX_KEY, PIX_BANK, PIX_HOLDER_NAME, PIX_KEY_TYPE). Essas variaveis foram
 * descontinuadas. Nao as use mais.
 */

/** Tipos validos de chave PIX. String vazia representa "nao configurado". */
export const VALID_PIX_KEY_TYPES = [
  "cpf",
  "cnpj",
  "email",
  "telefone",
  "aleatoria",
] as const;

export type PixKeyType = (typeof VALID_PIX_KEY_TYPES)[number];

export interface PixConfig {
  configured: boolean;
  bank?: string;
  agency?: string;
  account?: string;
  holderName?: string;
  key?: string;
  keyType?: PixKeyType;
}

/**
 * Campos do User necessarios para montar a configuracao PIX.
 * Compativel com o objeto retornado pelo Prisma (subconjunto de User).
 */
export interface UserPaymentFields {
  pixKey: string;
  pixKeyType: string;
  pixHolderName: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
}

function parseKeyType(raw: string): PixKeyType | undefined {
  const normalized = raw.trim().toLowerCase();
  return (VALID_PIX_KEY_TYPES as readonly string[]).includes(normalized)
    ? (normalized as PixKeyType)
    : undefined;
}

/**
 * Monta a configuracao PIX a partir dos campos do perfil do admin.
 * Retorna { configured: false } se chave ou banco estiverem vazios.
 * O contrato deve exibir aviso de "dados de pagamento nao configurados"
 * quando configured = false.
 */
export function getPixConfig(user: UserPaymentFields): PixConfig {
  const key = user.pixKey?.trim() ?? "";
  const bank = user.bankName?.trim() ?? "";

  if (!key || !bank) {
    return { configured: false };
  }

  const holderName = user.pixHolderName?.trim() || undefined;
  const agency = user.bankAgency?.trim() || undefined;
  const account = user.bankAccount?.trim() || undefined;
  const keyType = parseKeyType(user.pixKeyType);

  return {
    configured: true,
    key,
    bank,
    agency,
    account,
    holderName,
    keyType,
  };
}

/**
 * Retorna legenda legivel do tipo de chave.
 * Ex: "cpf" -> "CPF"
 */
export function pixKeyTypeLabel(keyType: string): string {
  const labels: Record<string, string> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-mail",
    telefone: "Telefone",
    aleatoria: "Chave aleatoria",
  };
  return labels[keyType] ?? keyType;
}
