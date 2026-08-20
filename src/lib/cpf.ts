/**
 * cpf.ts - utilitarios de CPF e CNPJ sem dependencias externas.
 * Pode ser importado em qualquer contexto (seed, testes, rotas, validate.ts).
 */

/** Remove toda formatacao do CPF, deixa so digitos. */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/** Valida o checksum do CPF (algoritmo oficial). */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  // Rejeita sequencias iguais (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number): number => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(digits[i]) * (factor - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10]);
}

/** Remove toda formatacao do CNPJ, deixa so digitos. */
export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/** Valida o checksum do CNPJ (algoritmo oficial da Receita Federal). */
export function isValidCnpj(cnpj: string): boolean {
  const digits = normalizeCnpj(cnpj);
  if (digits.length !== 14) return false;
  // Rejeita sequencias iguais (00.000.000/0000-00, etc)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (slice: string, weights: number[]): number => {
    const sum = slice
      .split("")
      .reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(digits.slice(0, 12), w1);
  const d2 = calcDigit(digits.slice(0, 13), w2);

  return d1 === parseInt(digits[12]) && d2 === parseInt(digits[13]);
}
