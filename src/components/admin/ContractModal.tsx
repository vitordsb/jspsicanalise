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
    frequency: "Semanal (1 sessao por semana)",
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
            setForm((prev) => ({
              ...prev,
              therapistName: data.name || prev.therapistName,
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
    window.print();
  };

  // Converte centavos para reais para exibicao
  const sessionPriceBRL = form.sessionPriceCents / 100;
  const today = formatDate(new Date());

  // Texto da politica de cancelamento montado a partir dos campos
  const cancelText = `Desmarcacoes ou reagendamentos devem ser comunicados com no minimo ${form.cancellationHours} horas de antecedencia. Faltas sem aviso previo serao cobradas integralmente.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#f0ded8] w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">

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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
              Clausulas e Valores
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valor da sessao */}
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Valor da Sessao (R$)
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
                  Duracao da Sessao (minutos)
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
                  Antecedencia minima para cancelar (horas)
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
                  Aviso previo para rescisao (dias)
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
                  placeholder="Ex: Sao Paulo/SP"
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
                  Clausulas adicionais (opcional)
                </label>
                <textarea
                  rows={3}
                  value={form.customClauses}
                  onChange={(e) => set("customClauses", e.target.value)}
                  placeholder="Disposicoes especificas que nao constam nas clausulas padrao..."
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

            {/* CABECALHO DO DOCUMENTO */}
            <div className="text-center mb-8 pb-6 border-b border-[#ddd]">
              <p className="contrato-titulo font-serif text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#5d0c1d]">
                Contrato de Prestacao de Servicos
              </p>
              <p className="contrato-subtitulo text-sm text-[#6f5f62] mt-1">
                Atendimento Psicanalitico e Psicoterapeutico Individual
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
                  <p><strong>ENDERECO PROFISSIONAL:</strong> {form.therapistAddress}</p>
                ) : (
                  <p><strong>ENDERECO PROFISSIONAL:</strong> <span className="underline decoration-dotted">______________________________</span></p>
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
                Acordam, mutuamente, as seguintes clausulas e condicoes:
              </p>

              <hr className="separador border-t border-[#ccc] my-4" />

              {/* CLAUSULA 1 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLAUSULA PRIMEIRA - DO OBJETO
                </p>
                <p>
                  O presente instrumento tem por objeto a prestacao de servicos de atendimento
                  psicanalitico e psicoterapeutico individual, com encontros na periodicidade
                  de <strong>{form.frequency}</strong>, com duracao media de{" "}
                  <strong>{form.durationMinutes} (
                  {form.durationMinutes === 50 ? "cinquenta" :
                   form.durationMinutes === 60 ? "sessenta" :
                   String(form.durationMinutes)}) minutos</strong> por sessao.
                  A modalidade de atendimento sera definida de comum acordo entre as partes.
                </p>
              </div>

              {/* CLAUSULA 2 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLAUSULA SEGUNDA - DOS HONORARIOS E PAGAMENTO
                </p>
                <p>
                  Pelos servicos prestados, o CONTRATANTE pagara a CONTRATADA o valor de{" "}
                  <strong>{formatCurrency(sessionPriceBRL)}</strong> por sessao. O pagamento
                  sera realizado por meio de <strong>{form.paymentMethod}</strong>, com
                  vencimento ate o dia <strong>{form.paymentDueDay}</strong> de cada mes.
                </p>
                {(form.lateFeePercent > 0 || form.lateInterestPercent > 0) && (
                  <p className="mt-2">
                    Em caso de atraso no pagamento, incidira multa de{" "}
                    <strong>{form.lateFeePercent}%</strong> sobre o valor devido, acrescida
                    de juros moratorious de <strong>{form.lateInterestPercent}% ao mes</strong>.
                  </p>
                )}
              </div>

              {/* CLAUSULA 3 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLAUSULA TERCEIRA - DAS DESMARCACOES E FALTAS
                </p>
                <p>
                  Desmarcacoes ou reagendamentos devem ser comunicados com no minimo{" "}
                  <strong>{form.cancellationHours} ({
                    form.cancellationHours === 24 ? "vinte e quatro" :
                    form.cancellationHours === 48 ? "quarenta e oito" :
                    String(form.cancellationHours)
                  }) horas</strong> de antecedencia. Faltas sem aviso previo no prazo
                  estabelecido serao cobradas integralmente, salvo situacoes de forca maior
                  devidamente comunicadas.
                </p>
              </div>

              {/* CLAUSULA 4 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLAUSULA QUARTA - DO SIGILO PROFISSIONAL
                </p>
                <p>
                  Todo o conteudo das sessoes esta resguardado pelo sigilo etico profissional,
                  em conformidade com o codigo de etica da categoria, nao podendo ser revelado
                  a terceiros salvo nas excecoes previstas em lei. As informacoes pessoais e
                  de saude serao tratadas em conformidade com a Lei Geral de Protecao de Dados
                  (LGPD - Lei 13.709/2018).
                </p>
              </div>

              {/* CLAUSULA 5 */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  CLAUSULA QUINTA - DA VIGENCIA E RESCISAO
                </p>
                <p>
                  O presente contrato vigorara por prazo indeterminado, podendo ser rescindido
                  por qualquer das partes mediante aviso previo de{" "}
                  <strong>{form.rescissionNoticeDays} ({
                    form.rescissionNoticeDays === 30 ? "trinta" :
                    form.rescissionNoticeDays === 15 ? "quinze" :
                    form.rescissionNoticeDays === 60 ? "sessenta" :
                    String(form.rescissionNoticeDays)
                  }) dias</strong>, por escrito. A rescisao sem aviso previo implica
                  o pagamento das sessoes correspondentes ao periodo de aviso.
                </p>
              </div>

              {/* CLAUSULA 6 - apenas se houver clausulas extras */}
              {form.customClauses && form.customClauses.trim() && (
                <div className="clausula-bloco">
                  <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                    CLAUSULA SEXTA - DISPOSICOES GERAIS
                  </p>
                  <p>{form.customClauses}</p>
                </div>
              )}

              {/* CLAUSULA DO FORO */}
              <div className="clausula-bloco">
                <p className="clausula-titulo font-serif font-bold uppercase text-[#5d0c1d] text-sm">
                  {form.customClauses && form.customClauses.trim()
                    ? "CLAUSULA SETIMA"
                    : "CLAUSULA SEXTA"} - DO FORO
                </p>
                <p>
                  As partes elegem o foro da comarca de{" "}
                  {form.foroCidade ? (
                    <strong>{form.foroCidade}</strong>
                  ) : (
                    <span className="underline decoration-dotted">______________________________</span>
                  )}{" "}
                  para dirimir quaisquer controversias oriundas do presente contrato,
                  com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>

              {/* Encerramento */}
              <p className="mt-4">
                E, por estarem justos e contratados, firmam o presente instrumento em duas
                vias de igual teor e forma.
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
                        <p className="font-bold text-sm">1a Testemunha</p>
                        <p className="text-xs text-[#555]">CPF: ___________________</p>
                      </div>
                    </div>
                    <div>
                      <div className="linha-assinatura border-t border-[#555] pt-2 mt-12">
                        <p className="font-bold text-sm">2a Testemunha</p>
                        <p className="text-xs text-[#555]">CPF: ___________________</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RODAPE DO DOCUMENTO */}
              <div className="rodape-documento mt-8 pt-4 border-t border-[#ccc] text-center">
                <p className="text-[11px] text-[#888]">
                  Documento gerado eletronicamente em {formatDateTime(new Date())} via plataforma clinica.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
