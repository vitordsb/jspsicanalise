"use client";

import React, { useState, useEffect, useRef } from "react";
import { SubmissionData, FormSection } from "@/lib/types";
import { formatDate, formatDateTime, calculateAge, formatCPF } from "@/lib/formatters";
import { ContractModal } from "./ContractModal";
import { useToast } from "@/components/ui/Toast";
import { ContractEditForm } from "./ContractEditForm";
import {
  User,
  FileSignature,
  Printer,
  KeyRound,
  ArrowDown,
  Pencil,
  Trash2,
  ArrowUp,
  MessageCircle,
  Sparkles,
  Save,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { BotaoConteudo } from "@/components/ui/Carregando";
import { temSinalDeRisco } from "@/lib/risco-clinico";

interface PatientDetailViewProps {
  submission: SubmissionData;
  onStatusChange: (status: string) => void;
  onNotesSave: (notes: string) => void;
  onRefresh: () => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  submission,
  onStatusChange,
  onNotesSave,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"anamnese" | "anotacoes" | "contratos">("anamnese");
  const [clinicalNotes, setClinicalNotes] = useState(submission.clinicalNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  // Codigo de acesso do paciente: so existe em claro no instante da emissao.
  const [reemitindo, setReemitindo] = useState(false);
  const [codigoNovo, setCodigoNovo] = useState("");
  const toast = useToast();
  // Contrato aberto para edicao na aba de contratos. Carregado sob demanda:
  // a listagem traz so o resumo, e o formulario precisa do registro inteiro.
  const [contratoEditando, setContratoEditando] = useState<Record<string, unknown> | null>(null);
  const [carregandoContrato, setCarregandoContrato] = useState("");
  const [excluindoContrato, setExcluindoContrato] = useState("");
  // Atalho de rolagem da ficha: com 36 perguntas, chegar ao fim na mao cansa.
  const areaFicha = useRef<HTMLDivElement>(null);
  const [perto, setPerto] = useState<"topo" | "meio" | "fim">("topo");
  const [temRolagem, setTemRolagem] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const { patient, answers, templateSnapshot, createdAt, status } = submission;
  const age = calculateAge(patient.birthDate);
  const riskFlag = temSinalDeRisco(answers ?? {});

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSavedSuccess(false);
    try {
      await onNotesSave(clinicalNotes);
      toast.sucesso("Anotações salvas.");
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    } catch (e) {
      console.error("Erro ao salvar anotações:", e);
      toast.erro("Não foi possível salvar as anotações. Copie o texto antes de sair da tela.");
    } finally {
      setSavingNotes(false);
    }
  };

  const cleanPhone = patient.phone.replace(/\D/g, "");
  // Acompanha a posicao para o botao oferecer a acao util: descer quando esta
  // em cima, voltar quando ja chegou ao fim.
  const aoRolar = () => {
    const el = areaFicha.current;
    if (!el) return;
    const sobra = el.scrollHeight - el.clientHeight;
    setTemRolagem(sobra > 240);
    if (sobra <= 0) return;
    const pos = el.scrollTop / sobra;
    setPerto(pos < 0.05 ? "topo" : pos > 0.95 ? "fim" : "meio");
  };

  // Recalcula ao trocar de paciente ou de aba: o conteudo muda de tamanho.
  useEffect(() => {
    const el = areaFicha.current;
    if (!el) return;
    el.scrollTop = 0;
    const t = setTimeout(aoRolar, 120);
    return () => clearTimeout(t);
  }, [submission.id, activeTab]);

  const rolarPara = (destino: "topo" | "fim") => {
    const el = areaFicha.current;
    if (!el) return;
    el.scrollTo({ top: destino === "fim" ? el.scrollHeight : 0, behavior: "smooth" });
  };

  const abrirEdicaoContrato = async (id: string) => {
    setCarregandoContrato(id);
    try {
      const res = await fetch(`/api/admin/contracts/${id}`);
      if (!res.ok) {
        toast.erro("Não foi possível abrir o contrato para edição.");
        return;
      }
      setContratoEditando(await res.json());
    } catch {
      toast.erro("Falha de conexão ao abrir o contrato.");
    } finally {
      setCarregandoContrato("");
    }
  };

  const excluirContrato = async (id: string) => {
    if (!confirm("Excluir este contrato? A ação não pode ser desfeita.")) return;
    setExcluindoContrato(id);
    try {
      const res = await fetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
      const dados = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.sucesso("Contrato excluído.");
        onRefresh?.();
      } else {
        // Contrato assinado e recusado pelo servidor de proposito.
        toast.erro(dados.error || "Não foi possível excluir o contrato.");
      }
    } catch {
      toast.erro("Falha de conexão ao excluir.");
    } finally {
      setExcluindoContrato("");
    }
  };

  const reemitirCodigo = async () => {
    if (!confirm("Emitir um novo código de acesso? O código anterior deixa de funcionar imediatamente.")) return;
    setReemitindo(true);
    setCodigoNovo("");
    try {
      const res = await fetch(`/api/admin/pacientes/${patient.id}/reemitir-codigo`, { method: "POST" });
      const dados = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodigoNovo(dados.codigoFormatado || dados.codigo || "");
        toast.sucesso("Novo código emitido. Passe para o paciente agora.");
      } else {
        toast.erro(dados.error || "Não foi possível emitir o código.");
      }
    } catch {
      toast.erro("Falha de conexão ao emitir o código.");
    } finally {
      setReemitindo(false);
    }
  };

  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${patient.fullName.split(" ")[0]}, tudo bem? Sou a Dra. Joane Souza Oliveira de Andrade, psicanalista. Recebi sua ficha de anamnese e gostaria de conversar com você!`
  )}`;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] md:h-screen bg-surface-low overflow-hidden">
      {/* WHATSAPP WEB TOP BAR */}
      <div className="p-3.5 bg-surface-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4 shrink-0 no-print">
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-full sm:basis-auto">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {patient.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-bold text-primary truncate">
                {patient.fullName}
              </h2>
              {age !== null && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-container text-primary font-semibold">
                  {age} anos
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              CPF: {formatCPF(patient.cpf)} • Recebido em {formatDateTime(createdAt)}
            </p>
          </div>
        </div>

        {/* ALERTA DE RISCO NO TOPO - visivel imediatamente */}
        {riskFlag && (
          <div className="shrink-0 ml-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shadow">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Atencao: risco</span>
            </div>
          </div>
        )}

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WHATSAPP DIRECT */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir conversa no WhatsApp"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-success-container hover:bg-success-outline text-success text-xs font-semibold border border-success-outline transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* GERAR CONTRATO */}


          {/* CODIGO DE ACESSO DO PACIENTE */}
          <button
            onClick={reemitirCodigo}
            disabled={reemitindo}
            title="Emitir novo código de acesso à área do paciente"
            className="p-2 rounded-full bg-white border border-outline-variant text-primary hover:bg-surface-low disabled:opacity-60 transition"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* IMPRIMIR */}
          <button
            onClick={() => window.print()}
            title="Imprimir Ficha Completa"
            className="p-2 rounded-full bg-white border border-outline-variant text-primary hover:bg-surface-low transition"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* STATUS SELECTOR */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-full border border-outline-variant bg-white text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
          >
            <option value="pending">🟡 Novo</option>
            <option value="in_review">🔵 Em Análise</option>
            <option value="approved">🟢 Aprovado / Ativo</option>
            <option value="archived">⚪ Arquivado</option>
          </select>
        </div>
      </div>

      {/* CODIGO DE ACESSO RECEM EMITIDO
          Aparece uma unica vez, logo apos a emissao. Guardamos so o hash,
          entao nao ha como exibir de novo depois que a Joane fechar a tela. */}
      {codigoNovo && (
        <div className="bg-warning-container border-b-2 border-warning-outline px-4 sm:px-6 py-3 flex items-start gap-3 shrink-0 no-print">
          <KeyRound className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-on-warning-container space-y-1 flex-1">
            <p className="font-bold">
              Novo código de acesso:{" "}
              <span className="text-base tracking-[0.18em] text-primary select-all">
                {codigoNovo}
              </span>
            </p>
            <p>
              Passe para o paciente agora. Ele não aparece de novo, e o código
              anterior deixou de funcionar.
            </p>
          </div>
          <button
            onClick={() => setCodigoNovo("")}
            className="text-warning text-xs font-semibold hover:underline shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* BANNER DE RISCO - aparece logo abaixo da barra de topo */}
      {riskFlag && (
        <div className="bg-red-50 border-b-2 border-red-400 px-4 sm:px-6 py-3 flex items-start gap-3 shrink-0 no-print">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-red-800 space-y-0.5">
            <p className="font-bold">Sinalizacao de risco identificada nesta ficha</p>
            <p>
              {answers["q_ideacao"] && answers["q_ideacao"] !== "Não" && answers["q_ideacao"] !== "Prefiro não responder aqui" && (
                <span>Ideacao: <strong>{String(answers["q_ideacao"])}</strong>. </span>
              )}
              {answers["q_autolesao"] === "Sim, recentemente" && (
                <span>Autolesao recente sinalizada.</span>
              )}
            </p>
            <p className="text-red-700 font-medium">Prioridade de retorno recomendada.</p>
          </div>
        </div>
      )}

      {/* WHATSAPP TABS */}
      <div className="bg-white border-b border-outline-variant px-4 sm:px-6 flex items-center gap-6 shrink-0 no-print">
        <button
          onClick={() => setActiveTab("anamnese")}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "anamnese"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ficha de Anamnese & Cadastro</span>
        </button>

        <button
          onClick={() => setActiveTab("anotacoes")}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "anotacoes"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Anotações Clínicas</span>
          {clinicalNotes && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("contratos")}
          className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "contratos"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Contratos ({submission.contracts?.length || 0})</span>
        </button>
      </div>

      {/* CHAT / CONTENT AREA WITH DOODLE BACKGROUND */}
      <div
        ref={areaFicha}
        onScroll={aoRolar}
        className="flex-1 overflow-y-auto whatsapp-bg p-4 sm:p-6 relative"
      >
        {/* Atalho de rolagem. So aparece quando ha conteudo suficiente para
            justificar, e troca de acao conforme a posicao. */}
        {temRolagem && (
          <button
            onClick={() => rolarPara(perto === "fim" ? "topo" : "fim")}
            className="no-print sticky top-0 float-right z-20 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-secondary text-white text-xs font-semibold shadow-lg shadow-primary/20 transition"
          >
            {perto === "fim" ? (
              <>
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Voltar ao topo</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Ir até o final</span>
              </>
            )}
          </button>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {/* TAB 1: FICHA DE ANAMNESE COMPLETA */}
          {activeTab === "anamnese" && (
            <div className="space-y-6">
              {/* FICHA DE CADASTRO DO PACIENTE */}
              <div className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs print-page">
                <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                  <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Ficha de Cadastro do Paciente</span>
                  </h3>
                  <span className="text-xs text-on-surface-subtle">
                    ID: {patient.id.slice(-6)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-on-surface-subtle block">Nome Completo:</span>
                    <strong className="text-on-surface">{patient.fullName}</strong>
                  </div>

                  <div>
                    <span className="text-on-surface-subtle block">CPF:</span>
                    <strong className="text-on-surface">{formatCPF(patient.cpf)}</strong>
                  </div>

                  <div>
                    <span className="text-on-surface-subtle block">Data de Nascimento:</span>
                    <strong className="text-on-surface">
                      {formatDate(patient.birthDate)} {age !== null && `(${age} anos)`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-on-surface-subtle block">Telefone / WhatsApp:</span>
                    <strong className="text-on-surface">{patient.phone}</strong>
                  </div>

                  <div>
                    <span className="text-on-surface-subtle block">E-mail:</span>
                    <strong className="text-on-surface">{patient.email}</strong>
                  </div>

                  {patient.occupation && (
                    <div>
                      <span className="text-on-surface-subtle block">Profissão:</span>
                      <strong className="text-on-surface">{patient.occupation}</strong>
                    </div>
                  )}

                  {patient.gender && (
                    <div>
                      <span className="text-on-surface-subtle block">Identidade de Gênero:</span>
                      <strong className="text-on-surface">{patient.gender}</strong>
                    </div>
                  )}

                  {patient.maritalStatus && (
                    <div>
                      <span className="text-on-surface-subtle block">Estado Civil:</span>
                      <strong className="text-on-surface">{patient.maritalStatus}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÕES DA ANAMNESE PREENCHIDA */}
              {templateSnapshot && Array.isArray(templateSnapshot) && templateSnapshot.map((section: FormSection, idx: number) => (
                <div
                  key={section.id || idx}
                  className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs space-y-4 print-page"
                >
                  <div className="border-b border-outline-variant pb-3">
                    <h4 className="font-serif text-lg font-bold text-primary">
                      {section.title}
                    </h4>
                    {section.description && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{section.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((q) => {
                      const answer = answers[q.id];
                      const hasAnswer = answer !== undefined && answer !== null && answer !== "";

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl bg-surface-low border border-outline-variant space-y-1.5"
                        >
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {q.label}
                          </p>

                          {!hasAnswer ? (
                            <p className="text-xs italic text-on-surface-subtle">Não respondido</p>
                          ) : q.type === "checkbox" && Array.isArray(answer) ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {answer.map((item: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-container text-primary"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : q.type === "scale_1_10" ? (
                            <div className="flex items-center gap-3 pt-1">
                              <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                {answer}
                              </span>
                              <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden max-w-xs">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${(Number(answer) / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-on-surface-variant">escala de 1 a 10</span>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                              {String(answer)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ANOTAÇÕES DA PSICANALISTA */}
          {activeTab === "anotacoes" && (
            <div className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Anotações & Hipóteses Clínicas</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Espaço confidencial exclusivo para suas observações diagnósticas, enquadre e evolução terapêutica.
                  </p>
                </div>

                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition"
                >
                  <BotaoConteudo carregando={savingNotes} rotuloCarregando="Salvando...">
                    <Save className="w-4 h-4" />
                    <span>Salvar Anotações</span>
                  </BotaoConteudo>
                </button>
              </div>

              {notesSavedSuccess && (
                <div className="bg-success-container border border-success-outline text-success p-3 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Anotações salvas com sucesso!</span>
                </div>
              )}

              <textarea
                rows={12}
                placeholder="Escreva aqui suas impressões clínicas sobre a queixa do paciente, significantes recorrentes, histórico transferencial, hipóteses diagnósticas e metas do tratamento..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full p-4 rounded-2xl border border-outline-variant bg-surface-container text-sm text-on-surface placeholder-on-surface-subtle focus:bg-white focus:border-primary focus:outline-none transition leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: CONTRATOS */}
          {activeTab === "contratos" && contratoEditando && (
            <div className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-primary">
                Editar contrato
              </h3>
              <ContractEditForm
                contract={contratoEditando}
                onCancel={() => setContratoEditando(null)}
                onSaved={() => {
                  setContratoEditando(null);
                  toast.sucesso("Contrato atualizado.");
                  onRefresh?.();
                }}
              />
            </div>
          )}

          {activeTab === "contratos" && !contratoEditando && (
            <div className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary" />
                    <span>Contratos do Paciente</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Gere e visualize contratos de prestação de serviços baseados nos dados da anamnese.
                  </p>
                </div>

                {submission.contracts && submission.contracts.length > 0 && (
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary hover:bg-secondary text-white text-xs font-semibold shadow-xs transition"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Gerar Novo Contrato</span>
                </button>
                )}
              </div>

              {(!submission.contracts || submission.contracts.length === 0) ? (
                <div className="p-8 text-center text-xs text-on-surface-subtle bg-surface-low rounded-2xl border border-dashed border-outline-variant space-y-3">
                  <FileText className="w-8 h-8 mx-auto text-tertiary" />
                  <p className="font-serif font-bold text-sm text-primary">Nenhum contrato gerado para este paciente ainda.</p>
                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-primary font-semibold text-xs hover:bg-primary-container-high transition"
                  >
                    Gerar Contrato Agora &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submission.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="p-4 rounded-2xl bg-surface-low border border-outline-variant flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-sm text-primary">{contract.title}</h4>
                        <p className="text-xs text-on-surface-variant">
                          Sessao: R$ {(contract.sessionPriceCents / 100).toFixed(2)} - {contract.frequency} - {contract.durationMinutes} min
                        </p>
                        <p className="text-[12px] text-on-surface-subtle">
                          Criado em {formatDateTime(contract.createdAt)}
                        </p>
                      </div>

                      {/* Leva para a pagina dedicada de impressao, a mesma
                          usada pelos contratos avulsos. O modal so serve para
                          CRIAR: abrir contrato existente por ele rendia um
                          documento sem logotipo, marca d'agua nem dados de
                          pagamento. */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                          href={`/admin/contratos/${contract.id}/imprimir`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-outline-variant text-xs font-semibold text-primary hover:bg-primary-container transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </a>

                        {/* Contrato assinado nao aparece com editar nem excluir:
                            o servidor recusa, e oferecer o botao so geraria erro. */}
                        {contract.status !== "assinado_recebido" && contract.status !== "aprovado" && (
                          <>
                            <button
                              onClick={() => abrirEdicaoContrato(contract.id)}
                              disabled={carregandoContrato === contract.id}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-outline-variant text-xs font-semibold text-primary hover:bg-primary-container disabled:opacity-60 transition"
                            >
                              <BotaoConteudo
                                carregando={carregandoContrato === contract.id}
                                rotuloCarregando="Abrindo..."
                                claro={false}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </BotaoConteudo>
                            </button>

                            <button
                              onClick={() => excluirContrato(contract.id)}
                              disabled={excluindoContrato === contract.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-secondary hover:bg-secondary-container disabled:opacity-60 transition"
                            >
                              <BotaoConteudo
                                carregando={excluindoContrato === contract.id}
                                rotuloCarregando="Excluindo..."
                                claro={false}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </BotaoConteudo>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONTRATO */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        patient={patient}
        submissionId={submission.id}
        onSaved={onRefresh}
      />
    </div>
  );
};
