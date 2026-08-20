"use client";

import React, { useState, useEffect } from "react";
import { PatientData } from "@/lib/types";
import { formatCurrency, formatDate, formatCPF, formatDateTime } from "@/lib/formatters";
import {
  X,
  Printer,
  FileSignature,
  CheckCircle,
  Save,
  AlertTriangle,
} from "lucide-react";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientData;
  submissionId?: string;
  onSaved?: () => void;
}

interface FormFields {
  therapistName: string;
  therapistAddress: string;
  therapistPhone: string;
  professionalDocType: string;
  professionalDocNumber: string;
  sessionPriceCents: number;
  frequency: string;
  durationMinutes: number;
  cancellationHours: number;
  paymentMethod: string;
  paymentDueDay: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  rescissionNoticeDays: number;
  foroCidade: string;
  hasWitnesses: boolean;
  customClauses: string;
}

interface MissingField {
  campo: string;
  descricao: string;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  patient,
  submissionId,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<FormFields>({
    therapistName: "Dra. Joane Souza Oliveira de Andrade",
    therapistAddress: "",
    therapistPhone: "",
    professionalDocType: "nenhum",
    professionalDocNumber: "",
    sessionPriceCents: 18000,
    frequency: "Semanal (1 sessão por semana)",
    durationMinutes: 50,
    cancellationHours: 24,
    paymentMethod: "PIX",
    paymentDueDay: 5,
    lateFeePercent: 0,
    lateInterestPercent: 0,
    rescissionNoticeDays: 30,
    foroCidade: "",
    hasWitnesses: false,
    customClauses: "",
  });

  // Campos pendentes que serao avisados antes de imprimir
  const missingFields: MissingField[] = [];
  if (!form.professionalDocNumber) {
    missingFields.push({
      campo: "Registro profissional",
      descricao: "Numero de registro profissional da contratada nao preenchido.",
    });
  }
  if (!form.therapistAddress) {
    missingFields.push({
      campo: "Endereco profissional",
      descricao: "Endereco profissional da contratada nao preenchido.",
    });
  }
  if (!patient.phone) {
    missingFields.push({
      campo: "Telefone do paciente",
      descricao: "Telefone do paciente nao disponivel.",
    });
  }

  // Carrega perfil da Joane ao abrir
  useEffect(() => {
    if (isOpen) {
      setSuccessMsg("");
      setErrorMsg("");
      fetch("/api/admin/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data && data.name) {
            // Monta o nome completo: titulo do perfil + nome, ou "Dra." como prefixo padrao
            const title = (data.title || "").trim();
            const name = (data.name || "").trim();
            const fullName = title
              ? `${title} ${name}`
              : name.startsWith("Dr")
                ? name
                : name
                  ? `Dra. ${name}`
                  : "";
            setForm((prev) => ({
              ...prev,
              therapistName: fullName || prev.therapistName,
              therapistAddress: data.address || prev.therapistAddress,
              therapistPhone: data.phone || prev.therapistPhone,
              professionalDocNumber: data.crp || prev.professionalDocNumber,
              foroCidade: data.clinicName || prev.foroCidade,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (field: keyof FormFields, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          submissionId: submissionId ?? null,
          title: `Contrato de Prestacao de Servicos - ${patient.fullName}`,
          status: "gerado",
          ...form,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Contrato gerado e salvo com sucesso.");
        if (onSaved) onSaved();
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error || "Erro ao salvar o contrato.");
      }
    } catch {
      setErrorMsg("Erro de conexao ao salvar o contrato.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    // Abre uma janela limpa com apenas o contrato para impressao.
    // Isola completamente o documento do layout do painel (modal/flex/overflow).
    const contractEl = document.querySelector(".contract-print-document");
    if (!contractEl) { window.print(); return; }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // innerHTML ja inclui a marca dagua e todo o conteudo do documento
    const contractHTML = (contractEl as HTMLElement).innerHTML;

    const printWindow = window.open("", "_blank", "width=900,height=1100,scrollbars=yes");
    if (!printWindow) { window.print(); return; }

    const css = `
    @page { size: A4 portrait; margin: 20mm 20mm 20mm 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #000;
      background: white;
    }
    p {
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      orphans: 3;
      widows: 3;
      margin-bottom: 0.5em;
    }
    strong { font-weight: bold; }

    /* Marca dagua: position:fixed repete em cada pagina no print */
    .contract-watermark {
      display: block !important;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 55%;
      max-width: 14cm;
      height: auto;
      opacity: 0.07;
      pointer-events: none;
      z-index: -1;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* Cabecalho do documento */
    .contrato-titulo {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.3em;
      display: block;
      color: #000;
    }
    .contrato-subtitulo {
      font-size: 10pt;
      text-align: center;
      color: #444;
      display: block;
    }
    /* O primeiro div filho (cabecalho) ganha borda inferior */
    .contract-print-document > div:first-of-type {
      border-bottom: 1.5px solid #000;
      padding-bottom: 0.7em;
      margin-bottom: 1em;
      text-align: center;
    }

    /* Blocos de identificacao das partes */
    .bloco-parte {
      border-left: 2px solid #000;
      padding: 0.3em 0 0.3em 0.7em;
      margin: 0.5em 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .bloco-parte p {
      font-size: 10.5pt;
      text-align: left;
      margin-bottom: 0.1em;
    }

    /* Separador horizontal */
    hr, .separador {
      border: none;
      border-top: 1px solid #000;
      margin: 0.8em 0;
    }

    /* Titulos de clausulas */
    .clausula-titulo {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-top: 1.1em;
      margin-bottom: 0.2em;
      display: block;
    }
    .clausula-bloco {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 0.2em;
    }

    /* Assinaturas */
    .bloco-assinaturas {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-top: 1.8em;
    }
    /* A div de grid de assinaturas (filha direta de bloco-assinaturas) */
    .bloco-assinaturas > div {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2cm;
    }
    .linha-assinatura {
      border-top: 1px solid #000;
      margin-top: 2em;
      padding-top: 0.3em;
      text-align: center;
    }
    .linha-assinatura p {
      text-align: center;
      font-size: 10pt;
      margin: 0.1em 0;
    }

    /* Rodape */
    .rodape-documento {
      margin-top: 1.2em;
      padding-top: 0.5em;
      border-top: 1px solid #888;
      font-size: 8pt;
      color: #555;
      text-align: center;
    }

    /* Utilitarios minimos que podem estar no HTML */
    .text-center { text-align: center; }
    .underline { text-decoration: underline; }
    .decoration-dotted { text-decoration-style: dotted; }
    `;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <base href="${origin}/" />
  <title>Contrato de Prestacao de Servicos</title>
  <style>${css}</style>
</head>
<body>
  <div class="contract-print-document">
    ${contractHTML}
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    // Aguarda imagem carregar antes de imprimir
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 800);
    }, 700);
  };

  // Converte centavos para reais para exibicao
  const sessionPriceBRL = form.sessionPriceCents / 100;
  const today = formatDate(new Date());

  // Texto da politica de cancelamento montado a partir dos campos
  const cancelText = `Desmarcacoes ou reagendamentos devem ser comunicados com no minimo ${form.cancellationHours} horas de antecedencia. Faltas sem aviso previo serao cobradas integralmente.`;

  return (
    <div className="contract-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="contract-modal-card bg-white rounded-3xl border border-[#f0ded8] w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">

        {/* CABECALHO DO MODAL - oculto na impressao */}
        <div className="p-4 sm:p-5 border-b border-[#f3e4e0] flex items-center justify-between bg-[#fbf3ef] no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f8dad2] text-[#5d0c1d] flex items-center justify-center">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#5d0c1d] leading-tight">
                Gerar Contrato de Prestacao de Servicos
              </h2>
              <p className="text-xs text-[#6f5f62]">
                Paciente: <strong>{patient.fullName}</strong> - CPF: {formatCPF(patient.cpf)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Gerar PDF / Imprimir"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f8dad2] text-[#5d0c1d] border border-[#f0ded8] text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Registro"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#5d0c1d] hover:bg-[#f8dad2] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="contract-modal-body flex-1 overflow-y-auto p-6 space-y-6">

          {/* Mensagens - ocultas na impressao */}
          {successMsg && (
            <div className="bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c] p-3.5 rounded-2xl text-xs flex items-center gap-2 no-print font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3.5 rounded-2xl text-xs flex items-center gap-2 no-print font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Aviso de campos pendentes - so aparece na tela */}
          {missingFields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs no-print">
              <div className="flex items-center gap-2 font-semibold mb-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Campos pendentes antes de imprimir:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {missingFields.map((f) => (
                  <li key={f.campo}>{f.descricao}</li>
                ))}
              </ul>
              <p className="mt-2 text-amber-700">
                Esses campos aparecerao em branco no documento impresso. Voce pode preenche-los nas Configuracoes ou diretamente nos campos abaixo.
              </p>
            </div>
          )}

          {/* FORMULARIO DE EDICAO - oculto na impressao */}
          <div className="bg-[#fbf3ef] border border-[#f0ded8] rounded-3xl p-6 space-y-5 no-print">
            <h3 className="font-serif text-sm font-bold text-[#5d0c1d] uppercase tracking-wider">
              Clausulas e Valores (Pre-visualizacao)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valor da sessao */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Valor da Sessão (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={sessionPriceBRL}
                  onChange={(e) => set("sessionPriceCents", Math.round(Number(e.target.value) * 100))}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Periodicidade */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Periodicidade
                </label>
                <input
                  type="text"
                  value={form.frequency}
                  onChange={(e) => set("frequency", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Duracao */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Duração da Sessão (minutos)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={form.durationMinutes}
                  onChange={(e) => set("durationMinutes", Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Antecedencia de cancelamento */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Antecedência mínima para cancelar (horas)
                </label>
                <input
                  type="number"
                  min={0}
                  max={168}
                  value={form.cancellationHours}
                  onChange={(e) => set("cancellationHours", Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Forma de Pagamento
                </label>
                <input
                  type="text"
                  value={form.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Vencimento */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Dia de vencimento do mes
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={form.paymentDueDay}
                  onChange={(e) => set("paymentDueDay", Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Aviso rescisao */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Aviso prévio para rescisão (dias)
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={form.rescissionNoticeDays}
                  onChange={(e) => set("rescissionNoticeDays", Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Foro */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Foro da comarca (cidade)
                </label>
                <input
                  type="text"
                  value={form.foroCidade}
                  onChange={(e) => set("foroCidade", e.target.value)}
                  placeholder="Ex: São Paulo/SP"
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Registro profissional */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Registro profissional da terapeuta
                </label>
                <input
                  type="text"
                  value={form.professionalDocNumber}
                  onChange={(e) => set("professionalDocNumber", e.target.value)}
                  placeholder="Deixar em branco se ainda nao disponivel"
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              {/* Clausulas extras */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Cláusulas adicionais (opcional)
                </label>
                <textarea
                  rows={3}
                  value={form.customClauses}
                  onChange={(e) => set("customClauses", e.target.value)}
                  placeholder="Disposições específicas que não constam nas cláusulas padrão..."
                  className="w-full p-3 rounded-2xl border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d] resize-y"
                />
              </div>
            </div>
          </div>

          {/* ================================================================
              DOCUMENTO DO CONTRATO - visivel na tela E na impressao
              A classe contract-print-document ativa o CSS de impressao formal
          ================================================================ */}
          <div className="contract-print-document bg-white p-8 sm:p-12 border border-[#f0ded8] rounded-3xl shadow-xs text-[#241a1c]">

            {/* MARCA D'AGUA - visivel apenas na impressao, repetida em cada pagina via position:fixed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logotipo-marca-dagua.png"
              alt=""
              aria-hidden="true"
              className="contract-watermark"
            />

            {/* CABECALHO DO DOCUMENTO */}
            <div className="text-center mb-8 pb-6 border-b border-[#ddd]">
              <p className="contrato-titulo font-serif text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#5d0c1d]">
                Contrato de Prestação de Serviços
              </p>
              <p className="contrato-subtitulo text-sm text-[#6f5f62] mt-1">
                Atendimento Psicanalítico e Psicoterapeútico Individual
              </p>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-justify text-[#241a1c]">

              {/* Introducao */}
              <p>
                Pelo presente instrumento particular, celebrado entre as partes
                abaixo qualificadas, de um lado:
              </p>

              {/* BLOCO CONTRATADA */}
              <div className="bloco-parte pl-4 border-l-2 border-[#5d0c1d] space-y-1 text-sm">
                <p><strong>CONTRATADA (TERAPEUTA):</strong> {form.therapistName}</p>
                {form.professionalDocNumber ? (
                  <p><strong>REGISTRO PROFISSIONAL:</strong> {form.professionalDocNumber}</p>
                ) : (
                  <p><strong>REGISTRO PROFISSIONAL:</strong> <span className="underline decoration-dotted">______________________________</span></p>
                )}
                {form.therapistAddress ? (
                  <p><strong>ENDEREÇO PROFISSIONAL:</strong> {form.therapistAddress}</p>
                ) : (
                  <p><strong>ENDEREÇO PROFISSIONAL:</strong> <span className="underline decoration-dotted">______________________________</span></p>
                )}
                {form.therapistPhone && (
                  <p><strong>TELEFONE:</strong> {form.therapistPhone}</p>
                )}
              </div>

              <p>E, do outro lado:</p>

              {/* BLOCO CONTRATANTE */}
              <div className="bloco-parte pl-4 border-l-2 border-[#5d0c1d] space-y-1 text-sm">
                <p><strong>CONTRATANTE (PACIENTE):</strong> {patient.fullName}</p>
                <p><strong>CPF:</strong> {formatCPF(patient.cpf)}</p>
                {patient.email && <p><strong>E-MAIL:</strong> {patient.email}</p>}
                {patient.phone ? (
                  <p><strong>TELEFONE:</strong> {patient.phone}</p>
                ) : (
                  <p><strong>TELEFONE:</strong> <span className="underline decoration-dotted">______________________________</span></p>
                )}
                {patient.birthDate && (
                  <p><strong>DATA DE NASCIMENTO:</strong> {formatDate(patient.birthDate)}</p>
                )}
              </div>

              <p>
                Acordam, mutuamente, as seguintes cláusulas e condições:
              </p>

              <hr className="separador border-t border-[#ccc] my-4" />

              {/* CLAUSULA 1 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLÁUSULA PRIMEIRA - DO OBJETO
                </p>
                <p>
                  O presente instrumento tem por objeto a prestação de serviços de atendimento
                  psicanalítico e psicoterapeútico individual, com encontros na periodicidade
                  de <strong>{form.frequency}</strong>, com duração média de{" "}
                  <strong>{form.durationMinutes} (
                  {form.durationMinutes === 50 ? "cinquenta" :
                   form.durationMinutes === 60 ? "sessenta" :
                   String(form.durationMinutes)}) minutos</strong> por sessão.
                  A modalidade de atendimento será definida de comum acordo entre as partes.
                </p>
              </div>

              {/* CLAUSULA 2 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLÁUSULA SEGUNDA - DOS HONORÁRIOS E PAGAMENTO
                </p>
                <p>
                  Pelos serviços prestados, o CONTRATANTE pagará à CONTRATADA o valor de{" "}
                  <strong>{formatCurrency(sessionPriceBRL)}</strong> por sessão. O pagamento
                  será realizado por meio de <strong>{form.paymentMethod}</strong>, com
                  vencimento até o dia <strong>{form.paymentDueDay}</strong> de cada mês.
                </p>
                {(form.lateFeePercent > 0 || form.lateInterestPercent > 0) && (
                  <p className="mt-2">
                    Em caso de atraso no pagamento, incidirá multa de{" "}
                    <strong>{form.lateFeePercent}%</strong> sobre o valor devido, acrescida
                    de juros moratórios de <strong>{form.lateInterestPercent}% ao mês</strong>.
                  </p>
                )}
              </div>

              {/* CLAUSULA 3 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLÁUSULA TERCEIRA - DAS DESMARCAÇÕES E FALTAS
                </p>
                <p>
                  Desmarcações ou reagendamentos devem ser comunicados com no mínimo{" "}
                  <strong>{form.cancellationHours} ({
                    form.cancellationHours === 24 ? "vinte e quatro" :
                    form.cancellationHours === 48 ? "quarenta e oito" :
                    String(form.cancellationHours)
                  }) horas</strong> de antecedência. Faltas sem aviso prévio no prazo
                  estabelecido serão cobradas integralmente, salvo situações de força maior
                  devidamente comunicadas.
                </p>
              </div>

              {/* CLAUSULA 4 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLÁUSULA QUARTA - DO SIGILO PROFISSIONAL
                </p>
                <p>
                  Todo o conteúdo das sessões está resguardado pelo sigilo ético profissional,
                  em conformidade com o código de ética da categoria, não podendo ser revelado
                  a terceiros salvo nas exceções previstas em lei. As informações pessoais e
                  de saúde serão tratadas em conformidade com a Lei Geral de Proteção de Dados
                  (LGPD - Lei 13.709/2018).
                </p>
              </div>

              {/* CLAUSULA 5 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLÁUSULA QUINTA - DA VIGÊNCIA E RESCISÃO
                </p>
                <p>
                  O presente contrato vigorará por prazo indeterminado, podendo ser rescindido
                  por qualquer das partes mediante aviso prévio de{" "}
                  <strong>{form.rescissionNoticeDays} ({
                    form.rescissionNoticeDays === 30 ? "trinta" :
                    form.rescissionNoticeDays === 15 ? "quinze" :
                    form.rescissionNoticeDays === 60 ? "sessenta" :
                    String(form.rescissionNoticeDays)
                  }) dias</strong>, por escrito. A rescisão sem aviso prévio implica
                  o pagamento das sessões correspondentes ao período de aviso.
                </p>
              </div>

              {/* CLAUSULA 6 - apenas se houver clausulas extras */}
              {form.customClauses && form.customClauses.trim() && (
                <div className="clausula-bloco">
                  <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                    CLÁUSULA SEXTA - DISPOSIÇÕES GERAIS
                  </p>
                  <p>{form.customClauses}</p>
                </div>
              )}

              {/* CLAUSULA DO FORO */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  {form.customClauses && form.customClauses.trim()
                    ? "CLÁUSULA SÉTIMA"
                    : "CLÁUSULA SEXTA"} - DO FORO
                </p>
                <p>
                  As partes elegem o foro da comarca de{" "}
                  {form.foroCidade ? (
                    <strong>{form.foroCidade}</strong>
                  ) : (
                    <span className="underline decoration-dotted">______________________________</span>
                  )}{" "}
                  para dirimir quaisquer controvérsias oriundas do presente contrato,
                  com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>

              {/* Encerramento */}
              <p className="mt-4">
                E, por estarem justos e contratados, firmam o presente instrumento em duas
                vias de igual teor e forma, para que produza seus jurídicos e legais efeitos.
              </p>

              {/* Local e data */}
              <p className="text-center mt-6">
                {form.foroCidade || "____________________"}, {today}.
              </p>

              {/* BLOCO DE ASSINATURAS */}
              <div className="bloco-assinaturas mt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 text-center">
                  {/* Contratada */}
                  <div>
                    <div className="linha-assinatura border-t border-[#555] pt-2 mt-12">
                      <p className="font-bold text-sm">{form.therapistName}</p>
                      {form.professionalDocNumber ? (
                        <p className="text-xs text-[#555]">{form.professionalDocNumber}</p>
                      ) : (
                        <p className="text-xs text-[#555]">CONTRATADA</p>
                      )}
                    </div>
                  </div>

                  {/* Contratante */}
                  <div>
                    <div className="linha-assinatura border-t border-[#555] pt-2 mt-12">
                      <p className="font-bold text-sm">{patient.fullName}</p>
                      <p className="text-xs text-[#555]">CPF: {formatCPF(patient.cpf)}</p>
                    </div>
                  </div>
                </div>

                {/* Testemunhas (se habilitadas) */}
                {form.hasWitnesses && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 text-center mt-10">
                    <div>
                      <div className="linha-assinatura border-t border-[#555] pt-2 mt-12">
                        <p className="font-bold text-sm">1ª Testemunha</p>
                        <p className="text-xs text-[#555]">CPF: ___________________</p>
                      </div>
                    </div>
                    <div>
                      <div className="linha-assinatura border-t border-[#555] pt-2 mt-12">
                        <p className="font-bold text-sm">2ª Testemunha</p>
                        <p className="text-xs text-[#555]">CPF: ___________________</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RODAPE DO DOCUMENTO */}
              <div className="rodape-documento mt-8 pt-4 border-t border-[#ccc] text-center">
                <p className="text-[11px] text-[#888]">
                  Documento gerado eletronicamente em {formatDateTime(new Date())} via plataforma clínica.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
