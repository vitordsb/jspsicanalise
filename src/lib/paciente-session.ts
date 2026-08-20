/**
 * Helpers de sessao do paciente que dependem de "next/headers".
 * Importar apenas em Route Handlers e Server Components.
 */

import { cookies } from "next/headers";
import { PACIENTE_COOKIE_NAME, verificarSessaoPaciente } from "./paciente-auth";

/** Id do paciente autenticado, ou null. */
export async function pacienteAtual(): Promise<string | null> {
  const store = await cookies();
  const c = store.get(PACIENTE_COOKIE_NAME);
  if (!c?.value) return null;
  return verificarSessaoPaciente(c.value)?.patientId ?? null;
}

/**
 * Guard das rotas da area do paciente.
 * Retorna { patientId } quando autenticado, ou uma Response 401.
 *
 * Toda consulta feita depois deste guard precisa ser filtrada por este
 * patientId. Nunca aceitar id vindo do corpo ou da query: e assim que uma
 * pessoa acabaria vendo a ficha de outra.
 */
export async function exigirPaciente(): Promise<
  { patientId: string; erro: null } | { patientId: null; erro: Response }
> {
  const patientId = await pacienteAtual();
  if (!patientId) {
    return {
      patientId: null,
      erro: Response.json(
        { error: "Sessão expirada. Entre novamente com seu CPF e código de acesso." },
        { status: 401 }
      ),
    };
  }
  return { patientId, erro: null };
}
