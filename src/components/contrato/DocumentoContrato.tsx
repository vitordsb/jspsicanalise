"use client";

/**
 * Documento do contrato.
 *
 * Compartilhado entre a pagina de impressao do painel da Joane e a area do
 * paciente, para que o que a pessoa ve seja exatamente o que sera impresso.
 * Recebe o contrato ja carregado: quem busca os dados e a pagina, com o
 * endpoint correspondente ao seu tipo de sessao.
 */

import React from "react";
import { formatCurrency, formatCPF, formatDate, formatDateTime } from "@/lib/formatters";
import { sessoesPorMes } from "@/lib/money";

export interface ContratoImpressao {
  id: string;
  status: string;
  therapistName: string;
  professionalDocType: string;
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
  evaluationPriceCents: number | null;
  paymentMethod: string;
  paymentDueDay: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  cancellationHours: number;
  rescissionNoticeDays: number;
  foroCidade: string;
  hasWitnesses: boolean;
  customClauses: string;
  paymentPixKey: string;
  paymentPixKeyType: string;
  paymentPixHolderName: string;
  paymentBankName: string;
  paymentBankAgency: string;
  paymentBankAccount: string;
  createdAt: string;
  signatureMethod?: string | null;
  issuedAt?: string | null;
  issuedByName?: string | null;
  signedAt?: string | null;
  signerName?: string | null;
  signerCpf?: string | null;
  verificationCode?: string | null;
  patient?: { fullName?: string; cpf?: string; email?: string; phone?: string; birthDate?: string };
}

/** Número por extenso para os valores que aparecem no contrato. */
const EXTENSO: Record<number, string> = {
  1: "uma", 2: "duas", 3: "três", 4: "quatro", 5: "cinco", 6: "seis",
  7: "sete", 8: "oito", 9: "nove", 10: "dez", 11: "onze",
  12: "doze", 15: "quinze", 24: "vinte e quatro", 30: "trinta", 45: "quarenta e cinco",
  48: "quarenta e oito", 50: "cinquenta", 60: "sessenta", 90: "noventa",
};
function porExtenso(n: number): string {
  return EXTENSO[n] ? `${n} (${EXTENSO[n]})` : String(n);
}

/**
 * Linha de qualificacao das partes.
 *
 * Campo vazio nao vira linha pontilhada: a linha inteira some. Contrato com
 * varios rotulos seguidos de espaco em branco parece documento inacabado, e o
 * que falta a Joane preenche no painel antes de emitir.
 */
function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  const v = (valor || "").trim();
  if (!v) return null;
  return (
    <p>
      <strong>{rotulo}:</strong> {v}
    </p>
  );
}

const ROTULO_CHAVE_PIX: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
};

export function DocumentoContrato({ contrato }: { contrato: ContratoImpressao }) {
  const c = contrato;
  const nomePaciente = c.patientFullName || c.patient?.fullName || "";
  const cpfPaciente = c.patientCpf || c.patient?.cpf || "";
  const valorSessao = formatCurrency(c.sessionPriceCents / 100);

  // A data do documento e a da assinatura, ou a da emissao, ou a da criacao.
  // Nunca a de hoje: com new Date() o mesmo contrato impresso em outro dia
  // saia com outra data, o que num documento assinado invalidaria a propria
  // assinatura.
  const dataDoDocumento = c.signedAt || c.issuedAt || c.createdAt;
  const dataHoje = formatDate(dataDoDocumento);
  const assinado = Boolean(c.signedAt);

  const sessoesMes = sessoesPorMes(c.frequency);
  const totalMensal =
    sessoesMes !== null && c.sessionPriceCents > 0
      ? formatCurrency((c.sessionPriceCents * sessoesMes) / 100)
      : null;

  const temPagamento = Boolean(c.paymentPixKey?.trim() || c.paymentBankName?.trim());

  const blocosDePagamento: React.ReactNode[] = [];
  if (c.paymentPixKey?.trim()) {
    const rotuloTipo =
      c.paymentPixKeyType && ROTULO_CHAVE_PIX[c.paymentPixKeyType]
        ? ` (${ROTULO_CHAVE_PIX[c.paymentPixKeyType]})`
        : "";
    blocosDePagamento.push(
      <>
        chave PIX{rotuloTipo} <strong>{c.paymentPixKey.trim()}</strong>
        {c.paymentPixHolderName?.trim() && (
          <>, em nome de <strong>{c.paymentPixHolderName.trim()}</strong></>
        )}
      </>
    );
  }
  if (c.paymentBankName?.trim()) {
    blocosDePagamento.push(
      <>
        banco <strong>{c.paymentBankName.trim()}</strong>
        {c.paymentBankAgency?.trim() && (
          <>, agência <strong>{c.paymentBankAgency.trim()}</strong></>
        )}
        {c.paymentBankAccount?.trim() && (
          <>, conta <strong>{c.paymentBankAccount.trim()}</strong></>
        )}
      </>
    );
  }

  const temClausulasExtras = Boolean(c.customClauses?.trim());
  const numeroForo = temClausulasExtras ? "SÉTIMA" : "SEXTA";

  return (
      <div className="folha">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logotipo-marca-dagua.png" alt="" aria-hidden="true" className="marca-dagua" />

        <div className="doc-cabecalho">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-cabecalho.png" alt="" aria-hidden="true" className="doc-logo" />
          <p className="doc-titulo">Contrato de Prestação de Serviços</p>
          <p className="doc-subtitulo">
            Atendimento psicanalítico e psicoterapêutico individual
          </p>
        </div>

        <p>
          Pelo presente instrumento particular, celebrado entre as partes abaixo
          qualificadas, de um lado:
        </p>

        <div className="bloco-parte">
          <p><strong>CONTRATADA:</strong> {c.therapistName}</p>
          <Linha rotulo="Registro profissional" valor={c.professionalDocNumber} />
          <Linha rotulo="Endereço profissional" valor={c.therapistAddress} />
          <Linha rotulo="Telefone" valor={c.therapistPhone} />
        </div>

        <p>E, de outro lado:</p>

        <div className="bloco-parte">
          <p><strong>CONTRATANTE:</strong> {nomePaciente}</p>
          <Linha rotulo="CPF" valor={cpfPaciente ? formatCPF(cpfPaciente) : ""} />
          <Linha rotulo="RG" valor={c.patientRg} />
          <Linha rotulo="Nacionalidade" valor={c.patientNationality} />
          <Linha rotulo="Estado civil" valor={c.patientMaritalStatus} />
          <Linha rotulo="Profissão" valor={c.patientOccupation} />
          <Linha rotulo="Endereço" valor={c.patientAddress} />
        </div>

        <p>Acordam, mutuamente, as seguintes cláusulas e condições:</p>

        <hr className="separador" />

        <div className="clausula">
          <p className="clausula-titulo">Cláusula primeira - do objeto</p>
          <p>
            O presente instrumento tem por objeto a prestação de serviços de atendimento
            psicanalítico e psicoterapêutico individual, na periodicidade{" "}
            <strong>{c.frequency}</strong>, com duração de{" "}
            <strong>{porExtenso(c.durationMinutes)} minutos</strong> por sessão, na
            modalidade <strong>{c.modalidade === "online" ? "online" : c.modalidade === "presencial" ? "presencial" : "híbrida"}</strong>.
            {c.initialSessionsCount > 0 && (
              <>
                {" "}As primeiras <strong>{porExtenso(c.initialSessionsCount)} sessões</strong>{" "}
                destinam-se à avaliação inicial, para definição conjunta do enquadre do
                acompanhamento.
              </>
            )}
          </p>
        </div>

        <div className="clausula">
          <p className="clausula-titulo">Cláusula segunda - dos honorários e do pagamento</p>
          <p>
            Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de{" "}
            <strong>{valorSessao}</strong> por sessão, mediante{" "}
            <strong>{c.paymentMethod}</strong>, com vencimento até o dia{" "}
            <strong>{c.paymentDueDay}</strong> de cada mês.
          </p>
          {/* Total mensal apresentado como estimativa, e nao como valor fixo:
              na periodicidade semanal o mes pode ter quatro ou cinco sessoes.
              Afirmar um valor fechado abriria margem para disputa sobre o mes
              em que o numero de encontros nao bate. */}
          {sessoesMes !== null && totalMensal && (
            <p>
              Considerando a periodicidade contratada, estima-se{" "}
              <strong>{porExtenso(sessoesMes)} sessões</strong> por mês, o que
              corresponde a aproximadamente <strong>{totalMensal}</strong> mensais.
              O valor efetivamente devido em cada mês será apurado pelo número de
              sessões realizadas, observado o disposto na cláusula terceira quanto
              a faltas sem aviso prévio.
            </p>
          )}
          {temPagamento && (
            <p>
              Os pagamentos serão realizados por meio dos seguintes dados:{" "}
              {blocosDePagamento.map((bloco, i) => (
                <React.Fragment key={i}>
                  {i > 0 && "; "}
                  {bloco}
                </React.Fragment>
              ))}
              .
            </p>
          )}
          {(c.lateFeePercent > 0 || c.lateInterestPercent > 0) && (
            <p>
              O atraso no pagamento implicará multa de <strong>{c.lateFeePercent}%</strong>{" "}
              sobre o valor devido, acrescida de juros de{" "}
              <strong>{c.lateInterestPercent}% ao mês</strong>.
            </p>
          )}
        </div>

        <div className="clausula">
          <p className="clausula-titulo">Cláusula terceira - das sessões, faltas e remarcações</p>
          <p>
            As sessões ocorrerão em dia e horário previamente ajustados entre as partes. O
            atraso da CONTRATANTE não prorroga o horário de término da sessão nem reduz o
            valor devido.
          </p>
          <p>
            Desmarcações e remarcações devem ser comunicadas com antecedência mínima de{" "}
            <strong>{porExtenso(c.cancellationHours)} horas</strong>. Faltas sem aviso no
            prazo estabelecido serão cobradas integralmente, ressalvadas situações de força
            maior devidamente comunicadas.
          </p>
        </div>

        <div className="clausula">
          <p className="clausula-titulo">Cláusula quarta - do sigilo profissional e da proteção de dados</p>
          <p>
            Todo o conteúdo das sessões está protegido pelo sigilo profissional, não podendo
            ser revelado a terceiros, salvo nas hipóteses previstas em lei, notadamente
            situações de risco à vida da própria CONTRATANTE ou de terceiros e determinação
            judicial. É vedada a gravação das sessões por qualquer das partes, bem como a
            presença de terceiros, salvo acordo prévio e expresso.
          </p>
          <p>
            Os dados pessoais e de saúde da CONTRATANTE serão tratados exclusivamente para a
            finalidade deste contrato, em conformidade com a Lei Geral de Proteção de Dados
            Pessoais (Lei 13.709/2018), permanecendo sob guarda e responsabilidade da
            CONTRATADA.
          </p>
        </div>

        <div className="clausula">
          <p className="clausula-titulo">Cláusula quinta - da vigência e da rescisão</p>
          <p>
            O presente contrato vigora por prazo indeterminado, acompanhando a evolução do
            processo terapêutico. Qualquer das partes pode rescindi-lo mediante comunicação
            prévia de <strong>{porExtenso(c.rescissionNoticeDays)} dias</strong>. A
            CONTRATANTE pode interromper o acompanhamento a qualquer tempo, sendo devidos
            apenas os valores das sessões já realizadas e os do período de aviso prévio.
          </p>
        </div>

        {temClausulasExtras && (
          <div className="clausula">
            <p className="clausula-titulo">Cláusula sexta - disposições gerais</p>
            <p>{c.customClauses}</p>
          </div>
        )}

        {/* Sem comarca definida a clausula inteira sai fora: eleicao de foro e
            facultativa, e na ausencia dela vale a regra geral de competencia.
            Melhor omitir do que imprimir um espaco em branco no meio da frase. */}
        {c.foroCidade?.trim() && (
          <div className="clausula">
            <p className="clausula-titulo">Cláusula {numeroForo.toLowerCase()} - do foro</p>
            <p>
              As partes elegem o foro da comarca de <strong>{c.foroCidade}</strong> para
              dirimir controvérsias oriundas deste contrato, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>
          </div>
        )}

        <p className="encerramento">
          E, por estarem justas e contratadas, as partes firmam o presente instrumento em
          duas vias de igual teor e forma.
        </p>

        <p className="local-data">
          {c.foroCidade?.trim() ? `${c.foroCidade}, ${dataHoje}.` : `${dataHoje}.`}
        </p>

        <div className="assinaturas">
          <div className="assinaturas-linha">
            <div className="assinatura">
              {assinado && <p className="rubrica">{c.therapistName}</p>}
              <div className={assinado ? "risco risco-assinado" : "risco"}>
                <p className="nome">{c.therapistName}</p>
                <p className="doc">
                  {c.professionalDocNumber?.trim() ? c.professionalDocNumber : "CONTRATADA"}
                </p>
                {assinado && c.issuedAt && (
                  <p className="assinado-em">
                    Emitido e assinado eletronicamente em {formatDateTime(c.issuedAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="assinatura">
              {assinado && <p className="rubrica">{c.signerName || nomePaciente}</p>}
              <div className={assinado ? "risco risco-assinado" : "risco"}>
                <p className="nome">{nomePaciente}</p>
                <p className="doc">{cpfPaciente ? `CPF ${formatCPF(cpfPaciente)}` : "CONTRATANTE"}</p>
                {assinado && (
                  <p className="assinado-em">
                    Assinado eletronicamente em {formatDateTime(c.signedAt!)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {c.hasWitnesses && (
            <div className="assinaturas-linha">
              <div className="assinatura">
                <div className="risco">
                  <p className="nome">1ª testemunha</p>
                  <p className="doc">CPF</p>
                </div>
              </div>
              <div className="assinatura">
                <div className="risco">
                  <p className="nome">2ª testemunha</p>
                  <p className="doc">CPF</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {assinado && c.verificationCode && (
          <div className="selo-assinatura">
            <p className="selo-titulo">Assinatura eletrônica</p>
            <p>
              Documento assinado eletronicamente por{" "}
              <strong>{c.signerName || nomePaciente}</strong>
              {c.signerCpf ? `, CPF ${formatCPF(c.signerCpf)}` : ""}, em{" "}
              {formatDateTime(c.signedAt!)}, mediante autenticação por CPF e código de
              acesso pessoal, nos termos da Lei 14.063/2020 e da MP 2.200-2/2001.
            </p>
            <p>
              A autenticidade pode ser conferida pelo código{" "}
              <strong className="codigo">{c.verificationCode}</strong>, que identifica de
              forma única o conteúdo deste documento. Qualquer alteração no texto produz
              um código diferente.
            </p>
          </div>
        )}

        <div className="rodape-doc">
          <p>Documento emitido em {formatDateTime(dataDoDocumento)}.</p>
        </div>

        {/* Carimbo repetido em toda pagina impressa: e o que permite casar uma
            folha solta com o registro no sistema. Fica no rodape fixo, junto
            da marca d'agua, e some da tela. */}
        {assinado && c.verificationCode && (
          <div className="carimbo-assinatura" aria-hidden="true">
            Assinado eletronicamente · {c.verificationCode}
          </div>
        )}
      </div>
  );
}

/** Campos ainda em branco no painel. Aviso de tela, nunca do documento. */
export function pendenciasDoContrato(c: ContratoImpressao): string[] {
  const p: string[] = [];
  if (!c.professionalDocNumber?.trim()) p.push("Registro profissional");
  if (!c.therapistAddress?.trim()) p.push("Endereço profissional");
  if (!c.foroCidade?.trim()) p.push("Comarca do foro");
  if (!c.paymentPixKey?.trim() && !c.paymentBankName?.trim()) {
    p.push("Dados de pagamento (PIX ou conta bancária)");
  }
  return p;
}
