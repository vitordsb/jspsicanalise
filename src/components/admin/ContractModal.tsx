"use client";

import React, { useState, useEffect } from "react";
import { PatientData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  X,
  Printer,
  FileSignature,
  CheckCircle,
  Save,
} from "lucide-react";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientData;
  submissionId?: string;
  onSaved?: () => void;
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

  const [formData, setFormData] = useState({
    therapistName: "Dra. Joane Silva",
    therapistDoc: "Reg. CBO 2515-50 / Psicanálise Clínica",
    therapistAddress: "Atendimento Online e Consultório - São Paulo/SP",
    sessionPrice: 180,
    frequency: "Semanal (1 sessão por semana)",
    durationMinutes: 50,
    paymentMethod: "PIX ou Transferência Bancária até o dia 05 de cada mês",
    cancellationPolicy: "Desmarcações ou reagendamentos devem ser comunicados com no mínimo 24 horas de antecedência. Faltas sem aviso prévio serão cobradas integralmente.",
    customClauses: "As partes concordam em manter o estrito sigilo de todo o conteúdo abordado em sessão, de acordo com o código de ética profissional.",
  });

  // Busca dados padrão da Joane ao abrir
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.name) {
            setFormData((prev) => ({
              ...prev,
              therapistName: data.name || prev.therapistName,
              therapistDoc: data.crp || prev.therapistDoc,
              therapistAddress: data.address || prev.therapistAddress,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveContract = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          submissionId: submissionId || null,
          title: `Contrato de Prestação de Serviços - ${patient.fullName}`,
          ...formData,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Contrato gerado e salvo com sucesso!");
        if (onSaved) onSaved();
      }
    } catch (e) {
      console.error("Erro ao salvar contrato:", e);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#f0ded8] w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* MODAL HEADER (NO-PRINT) */}
        <div className="p-4 sm:p-5 border-b border-[#f3e4e0] flex items-center justify-between bg-[#fbf3ef] no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f8dad2] text-[#5d0c1d] flex items-center justify-center">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#5d0c1d] leading-tight">
                Gerar Contrato de Prestação de Serviços
              </h2>
              <p className="text-xs text-[#6f5f62]">
                Paciente: <strong>{patient.fullName}</strong> • CPF: {patient.cpf}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f8dad2] text-[#5d0c1d] border border-[#f0ded8] text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleSaveContract}
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

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c] p-3.5 rounded-2xl text-xs flex items-center gap-2 no-print font-medium">
              <CheckCircle className="w-4 h-4 text-[#245f3c]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* EDIT FORM (NO-PRINT) */}
          <div className="bg-[#fbf3ef] border border-[#f0ded8] rounded-3xl p-6 space-y-4 no-print">
            <h3 className="font-serif text-sm font-bold text-[#5d0c1d] uppercase tracking-wider">
              Ajustar Cláusulas e Valores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Valor da Sessão (R$)
                </label>
                <input
                  type="number"
                  value={formData.sessionPrice}
                  onChange={(e) => setFormData({ ...formData, sessionPrice: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Periodicidade
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Duração da Sessão (minutos)
                </label>
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Forma e Prazo de Pagamento
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#241a1c] mb-1">
                  Política de Desmarcação (24 Horas)
                </label>
                <textarea
                  rows={2}
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-[#eae2d7] bg-white text-xs text-[#241a1c] focus:outline-none focus:border-[#5d0c1d]"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW DO CONTRATO FORMATADO EM A4 */}
          <div className="bg-white p-8 sm:p-12 border border-[#f0ded8] rounded-3xl shadow-xs text-[#241a1c] print-page">
            <div className="text-center border-b border-[#f0ded8] pb-6 mb-6">
              <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#5d0c1d]">
                Contrato de Prestação de Serviços Psicológicos / Psicanalíticos
              </h1>
              <p className="text-xs text-[#6f5f62] mt-1">
                Acolhimento, Psicoterapia e Prática Clínica
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#362c2d] leading-relaxed text-justify">
              <p>
                Pelo presente instrumento particular, de um lado:
              </p>
              
              <div className="bg-[#fbf3ef] p-4 rounded-2xl border border-[#f0ded8] space-y-1 text-xs">
                <p><strong>CONTRATADA (TERAPEUTA):</strong> {formData.therapistName}</p>
                <p><strong>REGISTRO PROFISSIONAL:</strong> {formData.therapistDoc}</p>
                <p><strong>ENDEREÇO PROFISSIONAL:</strong> {formData.therapistAddress}</p>
              </div>

              <p>E, de outro lado:</p>

              <div className="bg-[#fbf3ef] p-4 rounded-2xl border border-[#f0ded8] space-y-1 text-xs">
                <p><strong>CONTRATANTE (PACIENTE):</strong> {patient.fullName}</p>
                <p><strong>CPF:</strong> {patient.cpf}</p>
                <p><strong>E-MAIL:</strong> {patient.email}</p>
                <p><strong>TELEFONE:</strong> {patient.phone}</p>
                {patient.birthDate && <p><strong>DATA DE NASCIMENTO:</strong> {formatDate(patient.birthDate)}</p>}
              </div>

              <p>
                Têm entre si, justo e contratado, o seguinte acordo de prestação de serviços:
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="font-serif font-bold text-[#5d0c1d]">CLÁUSULA 1ª – DO OBJETO</h4>
                  <p>
                    O presente contrato tem por objeto a prestação de serviços de atendimento psicanalítico/psicoterápico individual, com encontros na periodicidade de <strong>{formData.frequency}</strong>, com duração média de <strong>{formData.durationMinutes} minutos</strong> por sessão.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-[#5d0c1d]">CLÁUSULA 2ª – DOS HONORÁRIOS E PAGAMENTO</h4>
                  <p>
                    Pelos serviços prestados, o(a) CONTRATANTE pagará à CONTRATADA o valor de <strong>{formatCurrency(formData.sessionPrice)}</strong> por sessão. O pagamento será realizado através de: <strong>{formData.paymentMethod}</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-[#5d0c1d]">CLÁUSULA 3ª – DAS DESMARCAÇÕES E FALTAS</h4>
                  <p>
                    {formData.cancellationPolicy}
                  </p>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-[#5d0c1d]">CLÁUSULA 4ª – DO SIGILO PROFISSIONAL</h4>
                  <p>
                    Todas as informações compartilhadas durante os atendimentos estão resguardadas pelo estrito <strong>sigilo ético profissional</strong>, em conformidade com as normas e diretrizes que regem a prática clínica e a legislação vigente de proteção de dados (LGPD).
                  </p>
                </div>

                {formData.customClauses && (
                  <div>
                    <h4 className="font-serif font-bold text-[#5d0c1d]">CLÁUSULA 5ª – DISPOSIÇÕES GERAIS</h4>
                    <p>{formData.customClauses}</p>
                  </div>
                )}
              </div>

              <p className="pt-4">
                E, por estarem justos e contratados, firmam o presente instrumento para que produza seus efeitos jurídicos.
              </p>

              {/* ASSINATURAS */}
              <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-[#6f5f62] pt-2">
                  <p className="font-serif font-bold text-[#5d0c1d]">{formData.therapistName}</p>
                  <p className="text-[#6f5f62]">{formData.therapistDoc}</p>
                </div>

                <div className="border-t border-[#6f5f62] pt-2">
                  <p className="font-serif font-bold text-[#5d0c1d]">{patient.fullName}</p>
                  <p className="text-[#6f5f62]">CPF: {patient.cpf}</p>
                </div>
              </div>

              <div className="text-center pt-8 text-[11px] text-[#9c8b8e]">
                Documento emitido eletronicamente em {formatDate(new Date())}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
