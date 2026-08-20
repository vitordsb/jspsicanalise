/**
 * cpf.ts - utilitarios de CPF sem dependencias externas.
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
