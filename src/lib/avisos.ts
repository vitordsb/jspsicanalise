/**
 * Disparo de aviso por e-mail sem segurar a resposta do usuario.
 *
 * Existe por causa de uma pegadinha de serverless: promise solta depois do
 * `return` e aposta, porque a funcao pode ser suspensa assim que a resposta
 * sai e o envio morre no meio, sem erro e sem log. Foi exatamente o que
 * aconteceu com o primeiro aviso de anamnese em producao.
 *
 * `after` faz a plataforma segurar a funcao viva ate a tarefa terminar, e
 * quem esta do outro lado da tela nao espera por isso.
 *
 * O catch e parte do contrato: e-mail e conveniencia. Falha de envio nunca
 * pode derrubar uma anamnese salva nem desfazer uma consulta marcada.
 */

import { after } from "next/server";

export function avisarEmSegundoPlano(
  contexto: string,
  tarefa: () => Promise<unknown>
): void {
  after(async () => {
    try {
      await tarefa();
    } catch (e) {
      console.error(`Falha ao enviar aviso (${contexto}):`, e);
    }
  });
}

/** Consulta futura e ainda valendo: so nesse caso avisar faz sentido. */
export function consultaAindaVale(inicioEm: Date, status: string): boolean {
  return status === "agendado" && inicioEm.getTime() > Date.now();
}
