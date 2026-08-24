/**
 * Texto do contrato, em forma de dados.
 *
 * Fonte unica: a tela e o congelamento da assinatura leem daqui. Se o texto
 * vivesse solto no JSX, assinar teria que guardar uma copia escrita a mao, e
 * qualquer ajuste de redacao depois faria o "documento assinado" divergir do
 * que a pessoa leu. Aqui o que se renderiza e o que se assina sao literalmente
 * a mesma string.
 *
 * Enfase vai marcada com **asteriscos**. A tela transforma em negrito; o texto
 * canonico mantem o marcador, porque ele faz parte do conteudo assinado e
 * precisa ser estavel entre versoes.
 */

import { createHash } from "node:crypto";
import { formatCurrency, formatCPF, formatDate } from "./formatters";
import { sessoesPorMes } from "./money";

export interface LinhaDeQualificacao {
  rotulo: string;
  valor: string;
}

export interface ParteDoContrato {
  papel: string;
  nome: string;
  linhas: LinhaDeQualificacao[];
}

export interface ClausulaDoContrato {
  titulo: string;
  paragrafos: string[];
}

export interface DocumentoDoContrato {
  titulo: string;
  subtitulo: string;
  abertura: string;
  partes: ParteDoContrato[];
  preambuloClausulas: string;
  clausulas: ClausulaDoContrato[];
  encerramento: string;
  localData: string;
}

/** Campos do contrato que entram no documento. */
export interface DadosDoContrato {
  therapistName: string;
  professionalDocNumber: string;
  therapistAddress: string;
  therapistPhone: string;
  patientFullName: string;
  patientCpf: string;
  patientRg: string;
  patientNationality: string;
  patientMaritalStatus: string;
  patientOccupation: string;
  patientAddress: string;
  frequency: string;
  durationMinutes: number;
  modalidade: string;
  initialSessionsCount: number;
  sessionPriceCents: number;
  paymentMethod: string;
  paymentDueDay: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  cancellationHours: number;
  rescissionNoticeDays: number;
  foroCidade: string;
  customClauses: string;
  paymentPixKey: string;
  paymentPixKeyType: string;
  paymentPixHolderName: string;
  paymentBankName: string;
  paymentBankAgency: string;
  paymentBankAccount: string;
  patient?: { fullName?: string | null; cpf?: string | null };
}

const EXTENSO: Record<number, string> = {
  1: "uma", 2: "duas", 3: "três", 4: "quatro", 5: "cinco", 6: "seis",
  7: "sete", 8: "oito", 9: "nove", 10: "dez", 11: "onze",
  12: "doze", 15: "quinze", 24: "vinte e quatro", 30: "trinta", 45: "quarenta e cinco",
  48: "quarenta e oito", 50: "cinquenta", 60: "sessenta", 90: "noventa",
};

function porExtenso(n: number): string {
  return EXTENSO[n] ? `${n} (${EXTENSO[n]})` : String(n);
}

const ROTULO_CHAVE_PIX: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail",
  telefone: "Telefone", aleatoria: "Chave aleatória",
};

const NOME_MODALIDADE: Record<string, string> = {
  online: "online", presencial: "presencial", hibrido: "híbrida",
};

/** Campo vazio nao vira linha pontilhada: some. Documento com rotulo seguido
 *  de branco parece inacabado, e o que falta a Joane preenche antes de emitir. */
function qualificar(pares: [string, string | null | undefined][]): LinhaDeQualificacao[] {
  return pares
    .map(([rotulo, valor]) => ({ rotulo, valor: (valor || "").trim() }))
    .filter((l) => l.valor !== "");
}

/**
 * Monta o documento.
 *
 * `dataReferencia` e obrigatoria de proposito. Antes o documento usava
 * `new Date()` para "local e data", entao o mesmo contrato impresso em outro
 * dia saia com outra data: num documento assinado isso invalidaria a propria
 * assinatura. A data e sempre a da emissao ou da assinatura, nunca a de hoje.
 */
export function montarDocumento(
  c: DadosDoContrato,
  dataReferencia: Date
): DocumentoDoContrato {
  const nomePaciente = c.patientFullName || c.patient?.fullName || "";
  const cpfPaciente = c.patientCpf || c.patient?.cpf || "";
  const valorSessao = formatCurrency(c.sessionPriceCents / 100);
  const sessoesMes = sessoesPorMes(c.frequency);
  const totalMensal =
    sessoesMes !== null && c.sessionPriceCents > 0
      ? formatCurrency((c.sessionPriceCents * sessoesMes) / 100)
      : null;

  // --- pagamento ---
  const formasDePagamento: string[] = [];
  if (c.paymentPixKey?.trim()) {
    const tipo = ROTULO_CHAVE_PIX[c.paymentPixKeyType]
      ? ` (${ROTULO_CHAVE_PIX[c.paymentPixKeyType]})`
      : "";
    let t = `chave PIX${tipo} **${c.paymentPixKey.trim()}**`;
    if (c.paymentPixHolderName?.trim()) {
      t += `, em nome de **${c.paymentPixHolderName.trim()}**`;
    }
    formasDePagamento.push(t);
  }
  if (c.paymentBankName?.trim()) {
    let t = `banco **${c.paymentBankName.trim()}**`;
    if (c.paymentBankAgency?.trim()) t += `, agência **${c.paymentBankAgency.trim()}**`;
    if (c.paymentBankAccount?.trim()) t += `, conta **${c.paymentBankAccount.trim()}**`;
    formasDePagamento.push(t);
  }

  // --- clausulas ---
  const clausulas: ClausulaDoContrato[] = [];

  const objeto: string[] = [];
  let p1 =
    `O presente instrumento tem por objeto a prestação de serviços de atendimento ` +
    `psicanalítico e psicoterapêutico individual, na periodicidade **${c.frequency}**, ` +
    `com duração de **${porExtenso(c.durationMinutes)} minutos** por sessão, na ` +
    `modalidade **${NOME_MODALIDADE[c.modalidade] ?? "híbrida"}**.`;
  if (c.initialSessionsCount > 0) {
    p1 +=
      ` As primeiras **${porExtenso(c.initialSessionsCount)} sessões** destinam-se à ` +
      `avaliação inicial, para definição conjunta do enquadre do acompanhamento.`;
  }
  objeto.push(p1);
  clausulas.push({ titulo: "Cláusula primeira - do objeto", paragrafos: objeto });

  const pagamento: string[] = [
    `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de ` +
    `**${valorSessao}** por sessão, mediante **${c.paymentMethod}**, com vencimento ` +
    `até o dia **${c.paymentDueDay}** de cada mês.`,
  ];
  // O total mensal e estimativa, nao valor fixo: na periodicidade semanal o mes
  // pode ter quatro ou cinco sessoes. Cravar um valor abriria disputa sobre o
  // mes em que o numero de encontros nao bate.
  if (sessoesMes !== null && totalMensal) {
    pagamento.push(
      `Considerando a periodicidade contratada, estima-se **${porExtenso(sessoesMes)} sessões** ` +
      `por mês, o que corresponde a aproximadamente **${totalMensal}** mensais. O valor ` +
      `efetivamente devido em cada mês será apurado pelo número de sessões realizadas, ` +
      `observado o disposto na cláusula terceira quanto a faltas sem aviso prévio.`
    );
  }
  if (formasDePagamento.length > 0) {
    pagamento.push(
      `Os pagamentos serão realizados por meio dos seguintes dados: ${formasDePagamento.join("; ")}.`
    );
  }
  if (c.lateFeePercent > 0 || c.lateInterestPercent > 0) {
    pagamento.push(
      `O atraso no pagamento implicará multa de **${c.lateFeePercent}%** sobre o valor ` +
      `devido, acrescida de juros de **${c.lateInterestPercent}% ao mês**.`
    );
  }
  clausulas.push({
    titulo: "Cláusula segunda - dos honorários e do pagamento",
    paragrafos: pagamento,
  });

  clausulas.push({
    titulo: "Cláusula terceira - das sessões, faltas e remarcações",
    paragrafos: [
      `As sessões ocorrerão em dia e horário previamente ajustados entre as partes. ` +
      `O atraso da CONTRATANTE não prorroga o horário de término da sessão nem reduz ` +
      `o valor devido.`,
      `Desmarcações e remarcações devem ser comunicadas com antecedência mínima de ` +
      `**${porExtenso(c.cancellationHours)} horas**. Faltas sem aviso no prazo ` +
      `estabelecido serão cobradas integralmente, ressalvadas situações de força maior ` +
      `devidamente comunicadas.`,
    ],
  });

  clausulas.push({
    titulo: "Cláusula quarta - do sigilo profissional e da proteção de dados",
    paragrafos: [
      `Todo o conteúdo das sessões está protegido pelo sigilo profissional, não podendo ` +
      `ser revelado a terceiros, salvo nas hipóteses previstas em lei, notadamente ` +
      `situações de risco à vida da própria CONTRATANTE ou de terceiros e determinação ` +
      `judicial. É vedada a gravação das sessões por qualquer das partes, bem como a ` +
      `presença de terceiros, salvo acordo prévio e expresso.`,
      `Os dados pessoais e de saúde da CONTRATANTE serão tratados exclusivamente para a ` +
      `finalidade deste contrato, em conformidade com a Lei Geral de Proteção de Dados ` +
      `Pessoais (Lei 13.709/2018), permanecendo sob guarda e responsabilidade da CONTRATADA.`,
    ],
  });

  clausulas.push({
    titulo: "Cláusula quinta - da vigência e da rescisão",
    paragrafos: [
      `O presente contrato vigora por prazo indeterminado, acompanhando a evolução do ` +
      `processo terapêutico. Qualquer das partes pode rescindi-lo mediante comunicação ` +
      `prévia de **${porExtenso(c.rescissionNoticeDays)} dias**. A CONTRATANTE pode ` +
      `interromper o acompanhamento a qualquer tempo, sendo devidos apenas os valores ` +
      `das sessões já realizadas e os do período de aviso prévio.`,
    ],
  });

  const temExtras = Boolean(c.customClauses?.trim());
  if (temExtras) {
    clausulas.push({
      titulo: "Cláusula sexta - disposições gerais",
      paragrafos: [c.customClauses.trim()],
    });
  }

  // Sem comarca a clausula inteira sai: eleicao de foro e facultativa e na
  // ausencia vale a regra geral de competencia. Melhor omitir do que imprimir
  // um espaco em branco no meio da frase.
  if (c.foroCidade?.trim()) {
    const numero = temExtras ? "sétima" : "sexta";
    clausulas.push({
      titulo: `Cláusula ${numero} - do foro`,
      paragrafos: [
        `As partes elegem o foro da comarca de **${c.foroCidade.trim()}** para dirimir ` +
        `controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais ` +
        `privilegiado que seja.`,
      ],
    });
  }

  const data = formatDate(dataReferencia);

  return {
    titulo: "Contrato de Prestação de Serviços",
    subtitulo: "Atendimento psicanalítico e psicoterapêutico individual",
    abertura:
      "Pelo presente instrumento particular, celebrado entre as partes abaixo " +
      "qualificadas, de um lado:",
    partes: [
      {
        papel: "CONTRATADA",
        nome: c.therapistName,
        linhas: qualificar([
          ["Registro profissional", c.professionalDocNumber],
          ["Endereço profissional", c.therapistAddress],
          ["Telefone", c.therapistPhone],
        ]),
      },
      {
        papel: "CONTRATANTE",
        nome: nomePaciente,
        linhas: qualificar([
          ["CPF", cpfPaciente ? formatCPF(cpfPaciente) : ""],
          ["RG", c.patientRg],
          ["Nacionalidade", c.patientNationality],
          ["Estado civil", c.patientMaritalStatus],
          ["Profissão", c.patientOccupation],
          ["Endereço", c.patientAddress],
        ]),
      },
    ],
    preambuloClausulas: "Acordam, mutuamente, as seguintes cláusulas e condições:",
    clausulas,
    encerramento:
      "E, por estarem justas e contratadas, as partes firmam o presente instrumento " +
      "em duas vias de igual teor e forma.",
    localData: c.foroCidade?.trim() ? `${c.foroCidade.trim()}, ${data}.` : `${data}.`,
  };
}

/**
 * Serializacao estavel do documento, que e o que se assina.
 *
 * Precisa ser deterministica: mesmo contrato, mesmo texto, byte a byte. Por
 * isso nao entra nada de ambiente aqui (hora atual, locale do navegador,
 * ordem de chave de objeto).
 */
export function textoCanonico(doc: DocumentoDoContrato): string {
  const l: string[] = [doc.titulo, doc.subtitulo, "", doc.abertura, ""];
  for (const parte of doc.partes) {
    l.push(`${parte.papel}: ${parte.nome}`);
    for (const linha of parte.linhas) l.push(`${linha.rotulo}: ${linha.valor}`);
    l.push("");
  }
  l.push(doc.preambuloClausulas, "");
  for (const cl of doc.clausulas) {
    l.push(cl.titulo);
    l.push(...cl.paragrafos);
    l.push("");
  }
  l.push(doc.encerramento, "", doc.localData);
  return l.join("\n");
}

/** SHA-256 do texto assinado, em hexadecimal. */
export function hashDoDocumento(texto: string): string {
  return createHash("sha256").update(texto, "utf8").digest("hex");
}

/**
 * Codigo curto de verificacao, para carimbar em toda pagina.
 *
 * Nao e segredo nem prova por si: serve para casar uma folha impressa com o
 * registro no sistema. A prova e o hash.
 */
export function codigoDeVerificacao(hash: string): string {
  const base = hash.toUpperCase().replace(/[^0-9A-F]/g, "");
  return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}`;
}
