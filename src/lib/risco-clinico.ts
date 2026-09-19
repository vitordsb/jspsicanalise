/**
 * Deteccao de sinal de risco clinico (ideacao suicida / autolesao) nas
 * respostas de uma anamnese.
 *
 * Fonte unica de verdade: usada tanto no servidor (limpeza de fichas
 * expiradas, destaque no painel administrativo) quanto no cliente (banner
 * de acolhimento durante o preenchimento). Antes existiam tres copias
 * independentes dessa logica; duas delas casavam a chave exata ("q_ideacao")
 * e o texto exato da resposta, e sumiam em silencio se a Joane renomeasse a
 * pergunta ou reescrevesse uma opcao no editor de template. Este arquivo nao
 * pode importar nada especifico de servidor (Prisma etc) para poder ser
 * usado em componente "use client" sem puxar dependencia indevida pro bundle
 * do navegador.
 */

/**
 * Campos de triagem de risco, achados por padrao no nome e nao por chave
 * exata. O modelo de anamnese e editavel pela Joane; com a busca por
 * "q_ideacao" cravada, bastava ela renomear o campo para a deteccao parar de
 * funcionar em silencio. O padrao sobrevive a renomeacao.
 */
const CHAVE_IDEACAO = /ideacao|ideação|suicid/i;
const CHAVE_AUTOLESAO = /autolesao|autolesão/i;

/**
 * Respostas que significam "sem risco". Qualquer outra coisa conta como
 * risco, inclusive resposta que a Joane venha a escrever depois: na duvida
 * o sinal fica ligado.
 */
const SEM_RISCO = new Set([
  "não", "nao", "nunca", "não se aplica", "nao se aplica",
  "prefiro não responder aqui", "prefiro nao responder aqui",
  "prefiro não responder", "prefiro nao responder", "",
]);

export function temSinalDeRisco(respostas: Record<string, unknown>): boolean {
  for (const [chave, valor] of Object.entries(respostas ?? {})) {
    const ehIdeacao = CHAVE_IDEACAO.test(chave);
    const ehAutolesao = CHAVE_AUTOLESAO.test(chave);
    if (!ehIdeacao && !ehAutolesao) continue;

    if (typeof valor !== "string") {
      // Marcacao booleana ou lista preenchida tambem sinaliza.
      if (valor === true || (Array.isArray(valor) && valor.length > 0)) return true;
      continue;
    }

    const v = valor.trim().toLowerCase();
    if (SEM_RISCO.has(v)) continue;

    // Autolesao antiga nao e crise em curso; a recente e.
    if (ehAutolesao && !ehIdeacao) {
      if (/recent/i.test(v)) return true;
      continue;
    }
    return true;
  }
  return false;
}
