/**
 * pix.ts - dados de pagamento PIX lidos exclusivamente de env vars.
 *
 * ATENCAO: a chave PIX pode ser um CPF (dado pessoal da Dra. Joane).
 * NAO escreva o valor real em nenhum arquivo do repositorio.
 * Configure via variaveis de ambiente na Vercel ou no .env local (nao commitado).
 *
 * Variaveis esperadas:
 *   PIX_KEY          - chave PIX (CPF, e-mail, telefone ou chave aleatoria)
 *   PIX_BANK         - nome do banco (ex: "Bradesco")
 *   PIX_HOLDER_NAME  - nome do titular da conta
 *   PIX_KEY_TYPE     - tipo da chave: "cpf" | "email" | "telefone" | "aleatoria"
 *                      (opcional, default "cpf")
 */

export interface PixConfig {
  configured: boolean;
  bank?: string;
  holderName?: string;
  key?: string;
  keyType?: "cpf" | "email" | "telefone" | "aleatoria";
}

/** Tipos validos de chave PIX. */
const VALID_KEY_TYPES = ["cpf", "email", "telefone", "aleatoria"] as const;
type PixKeyType = (typeof VALID_KEY_TYPES)[number];

function parseKeyType(raw: string | undefined): PixKeyType {
  if (!raw) return "cpf";
  const normalized = raw.toLowerCase().trim() as PixKeyType;
  return VALID_KEY_TYPES.includes(normalized) ? normalized : "cpf";
}

/**
 * Retorna a configuracao PIX a partir das variaveis de ambiente.
 * Se qualquer variavel obrigatoria faltar, retorna { configured: false }.
 * O contrato deve exibir aviso de "dados de pagamento nao configurados"
 * quando configured = false.
 */
export function getPixConfig(): PixConfig {
  const key = process.env.PIX_KEY?.trim();
  const bank = process.env.PIX_BANK?.trim();
  const holderName = process.env.PIX_HOLDER_NAME?.trim();

  if (!key || !bank || !holderName) {
    return { configured: false };
  }

  return {
    configured: true,
    key,
    bank,
    holderName,
    keyType: parseKeyType(process.env.PIX_KEY_TYPE),
  };
}

/**
 * Retorna legenda legivel do tipo de chave.
 * Ex: "cpf" -> "CPF"
 */
export function pixKeyTypeLabel(keyType: string): string {
  const labels: Record<string, string> = {
    cpf: "CPF",
    email: "E-mail",
    telefone: "Telefone",
    aleatoria: "Chave aleatoria",
  };
  return labels[keyType] ?? keyType;
}
