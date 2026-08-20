"use client";

/**
 * Página dedicada de impressão do contrato.
 *
 * Renderiza o documento sozinho, sem modal e sem o layout do painel, para que
 * o navegador pagine corretamente. Protegida pelo proxy.ts, que ja cobre /admin.
 */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatCPF, formatDate, formatDateTime } from "@/lib/formatters";
import { ESTILOS_IMPRESSAO } from "./estilos";
import { TelaCarregando } from "@/components/ui/Carregando";

interface ContratoImpressao {
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
  patient?: { fullName?: string; cpf?: string; email?: string; phone?: string; birthDate?: string };
}

/** Número por extenso para os valores que aparecem no contrato. */
const EXTENSO: Record<number, string> = {
  1: "uma", 2: "duas", 3: "três", 4: "quatro", 5: "cinco", 6: "seis",
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

export default function ImprimirContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contrato, setContrato] = useState<ContratoImpressao | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/contracts/${id}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          setErro("Não foi possível carregar o contrato.");
          return;
        }
        const dados = await res.json();
        if (ativo) setContrato(dados);
      } catch {
        if (ativo) setErro("Falha de conexão ao carregar o contrato.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id, router]);

  if (carregando) {
    return <TelaCarregando mensagem="Preparando o contrato para impressão..." />;
  }
  if (erro || !contrato) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>{erro || "Contrato não encontrado."}</p>;
  }

  const c = contrato;
  const nomePaciente = c.patientFullName || c.patient?.fullName || "";
  const cpfPaciente = c.patientCpf || c.patient?.cpf || "";
  const valorSessao = formatCurrency(c.sessionPriceCents / 100);
  const dataHoje = formatDate(new Date());

  // Campos que a Joane ainda nao preencheu no painel. Aparecem como aviso na
  // tela, nunca dentro do documento que vai para o paciente.
  const pendencias: string[] = [];
  if (!c.professionalDocNumber?.trim()) pendencias.push("Registro profissional");
  if (!c.therapistAddress?.trim()) pendencias.push("Endereço profissional");
  if (!c.foroCidade?.trim()) pendencias.push("Comarca do foro");
  if (!c.paymentPixKey?.trim() && !c.paymentBankName?.trim()) {
    pendencias.push("Dados de pagamento (PIX ou conta bancária)");
  }

  const temPagamento = Boolean(c.paymentPixKey?.trim() || c.paymentBankName?.trim());
  const temClausulasExtras = Boolean(c.customClauses?.trim());
  const numeroForo = temClausulasExtras ? "SÉTIMA" : "SEXTA";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESTILOS_IMPRESSAO }} />

      <div className="barra-acoes nao-imprimir">
        <button
          onClick={() => router.back()}
          style={{
            padding: "9px 16px", borderRadius: 999, border: "1px solid #d8cfcb",
            background: "#fff", cursor: "pointer", fontSize: 13, color: "#5d0c1d",
          }}
        >
          Voltar
        </button>
        {pendencias.length > 0 && (
          <span style={{ fontSize: 12, color: "#8a6d3b", flex: 1, textAlign: "center" }}>
            Não preenchido no painel, então fica de fora do documento: {pendencias.join(", ")}.
          </span>
        )}
        <button
          onClick={() => window.print()}
          style={{
            padding: "9px 20px", borderRadius: 999, border: "none",
            background: "#5d0c1d", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Imprimir / Salvar PDF
        </button>
      </div>

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
          {temPagamento && (
            <p>
              Dados para pagamento:{" "}
              {c.paymentPixKey?.trim() && (
                <>
                  chave PIX{" "}
                  {c.paymentPixKeyType && ROTULO_CHAVE_PIX[c.paymentPixKeyType]
                    ? `(${ROTULO_CHAVE_PIX[c.paymentPixKeyType]}) `
                    : ""}
                  <strong>{c.paymentPixKey}</strong>
                  {c.paymentPixHolderName?.trim() && <>, titular <strong>{c.paymentPixHolderName}</strong></>}
                  {c.paymentBankName?.trim() ? "; " : "."}
                </>
              )}
              {c.paymentBankName?.trim() && (
                <>
                  banco <strong>{c.paymentBankName}</strong>
                  {c.paymentBankAgency?.trim() && <>, agência <strong>{c.paymentBankAgency}</strong></>}
                  {c.paymentBankAccount?.trim() && <>, conta <strong>{c.paymentBankAccount}</strong></>}.
                </>
              )}
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
              <div className="risco">
                <p className="nome">{c.therapistName}</p>
                <p className="doc">
                  {c.professionalDocNumber?.trim() ? c.professionalDocNumber : "CONTRATADA"}
                </p>
              </div>
            </div>
            <div className="assinatura">
              <div className="risco">
                <p className="nome">{nomePaciente}</p>
                <p className="doc">{cpfPaciente ? `CPF ${formatCPF(cpfPaciente)}` : "CONTRATANTE"}</p>
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

        <div className="rodape-doc">
          <p>Documento emitido em {formatDateTime(new Date())}.</p>
        </div>
      </div>
    </>
  );
}
