"use client";

import React, { useState, useRef, useCallback } from "react";
import { ContractData, ContractEvent, ContractStatus } from "@/lib/types";
import { formatCurrency, formatCPF, formatDate, formatDateTime } from "@/lib/formatters";
import {
  CheckCircle,
  XCircle,
  Upload,
  Download,
  AlertTriangle,
  Clock,
  ArrowRight,
  Printer,
  FileText,
  Loader2,
} from "lucide-react";

// Mapa de labels pt-BR para os status
const STATUS_LABELS: Record<ContractStatus, string> = {
  rascunho: "Rascunho",
  gerado: "Gerado",
  aguardando_assinatura: "Aguardando Assinatura",
  assinado_recebido: "Assinado Recebido",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

// Cores e icones por status
const STATUS_CONFIG: Record<ContractStatus, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  rascunho:               { bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-300",   icon: FileText },
  gerado:                 { bg: "bg-blue-50",    text: "text-blue-800",   border: "border-blue-200",   icon: FileText },
  aguardando_assinatura:  { bg: "bg-amber-50",   text: "text-amber-800",  border: "border-amber-200",  icon: Clock },
  assinado_recebido:      { bg: "bg-purple-50",  text: "text-purple-800", border: "border-purple-200", icon: Upload },
  aprovado:               { bg: "bg-green-50",   text: "text-green-800",  border: "border-green-200",  icon: CheckCircle },
  recusado:               { bg: "bg-red-50",     text: "text-red-800",    border: "border-red-200",    icon: XCircle },
};

interface ContractDetailPanelProps {
  contract: ContractData;
  onRefresh: () => void;
}

export function ContractStatusBadge({ status }: { status: string }) {
  const knownStatus = status as ContractStatus;
  const cfg = STATUS_CONFIG[knownStatus] ?? STATUS_CONFIG.rascunho;
  const Icon = cfg.icon;
  const label = STATUS_LABELS[knownStatus] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

export function ContractDetailPanel({ contract, onRefresh }: ContractDetailPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [approving, setApproving] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [refuseError, setRefuseError] = useState("");
  const [showRefuseForm, setShowRefuseForm] = useState(false);

  const [signedUrlMsg, setSignedUrlMsg] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // Valida o arquivo antes de enviar (tipo e tamanho)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMsg("");
    setUploadState("idle");

    if (file.type !== "application/pdf") {
      setUploadMsg("Apenas arquivos PDF sao aceitos.");
      setUploadState("error");
      e.target.value = "";
      return;
    }

    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      setUploadMsg(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: 10 MB.`);
      setUploadState("error");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setUploadProgress(0);
    setUploadMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // XMLHttpRequest para ter progresso real
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/admin/contracts/${contract.id}/upload-signed`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = "Erro ao enviar o arquivo.";
            if (xhr.status === 502) {
              msg = "Falha ao armazenar o arquivo. O bucket 'contratos-assinados' pode nao existir no Supabase Storage. Crie-o no painel do Supabase antes de prosseguir.";
            } else if (xhr.status === 422) {
              try {
                const body = JSON.parse(xhr.responseText);
                msg = body.error || msg;
              } catch {
                // sem resposta JSON
              }
            } else if (xhr.status === 429) {
              msg = "Muitas tentativas de upload. Aguarde alguns minutos.";
            } else {
              try {
                const body = JSON.parse(xhr.responseText);
                msg = body.error || msg;
              } catch {
                // sem resposta JSON
              }
            }
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error("Falha de rede ao enviar o arquivo."));
        xhr.send(formData);
      });

      setUploadState("success");
      setUploadMsg("PDF assinado recebido com sucesso. Aguardando revisao.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onRefresh();
    } catch (err) {
      setUploadState("error");
      setUploadMsg(err instanceof Error ? err.message : "Erro desconhecido ao enviar.");
    }
  }, [selectedFile, contract.id, onRefresh]);

  const handleApprove = async () => {
    if (!confirm("Confirmar aprovacao do contrato assinado?")) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/approve`, { method: "POST" });
      if (res.ok) {
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Erro ao aprovar o contrato.");
      }
    } catch {
      alert("Erro de conexao ao aprovar.");
    } finally {
      setApproving(false);
    }
  };

  const handleRefuse = async () => {
    setRefuseError("");
    if (refuseReason.trim().length < 5) {
      setRefuseError("O motivo deve ter pelo menos 5 caracteres.");
      return;
    }
    setRefusing(true);
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/refuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refuseReason.trim() }),
      });
      if (res.ok) {
        setShowRefuseForm(false);
        setRefuseReason("");
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setRefuseError(json.error || "Erro ao recusar o contrato.");
      }
    } catch {
      setRefuseError("Erro de conexao ao recusar.");
    } finally {
      setRefusing(false);
    }
  };

  const handleDownloadSigned = async () => {
    setFetchingUrl(true);
    setSignedUrlMsg("");
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/signed-url`);
      if (res.ok) {
        const json = await res.json();
        window.open(json.url, "_blank");
      } else {
        const json = await res.json().catch(() => ({}));
        setSignedUrlMsg(json.error || "Erro ao obter link de download.");
      }
    } catch {
      setSignedUrlMsg("Erro de conexao ao buscar o link.");
    } finally {
      setFetchingUrl(false);
    }
  };

  const canUpload =
    contract.status === "aguardando_assinatura" || contract.status === "recusado";
  const canApproveOrRefuse = contract.status === "assinado_recebido";
  const hasSignedFile = !!contract.signedFileKey;

  // Compatibilidade com contratos antigos que usavam 'sessionPrice' (BRL) em vez de 'sessionPriceCents'
  const legacyPrice = (contract as unknown as Record<string, unknown>).sessionPrice;
  const sessionPriceBRL =
    contract.sessionPriceCents > 0
      ? contract.sessionPriceCents / 100
      : typeof legacyPrice === "number"
      ? legacyPrice
      : 0;

  return (
    <div className="space-y-6">
      {/* Cabecalho do contrato */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#5d0c1d]">{contract.title}</h3>
          <p className="text-xs text-[#6f5f62] mt-0.5">
            Paciente: <strong>{contract.patientFullName || contract.patient?.fullName}</strong>
            {" - "}CPF: {formatCPF(contract.patientCpf || contract.patient?.cpf || "")}
          </p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      {/* Abre a pagina dedicada de impressao. Rota propria, sem modal nem
          layout do painel, porque ancestral com overflow ou altura fixa
          quebra a paginacao do navegador. */}
      <a
        href={`/admin/contratos/${contract.id}/imprimir`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-semibold transition self-start"
      >
        <Printer className="w-4 h-4" />
        <span>Abrir contrato para impressão</span>
      </a>

      {/* Dados do contrato */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Valor da sessao</p>
          <p className="font-bold text-[#241a1c]">{formatCurrency(sessionPriceBRL)}</p>
        </div>
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Duracao</p>
          <p className="font-bold text-[#241a1c]">{contract.durationMinutes} min</p>
        </div>
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Periodicidade</p>
          <p className="font-bold text-[#241a1c]">{contract.frequency}</p>
        </div>
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Pagamento</p>
          <p className="font-bold text-[#241a1c]">{contract.paymentMethod}</p>
        </div>
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Vencimento</p>
          <p className="font-bold text-[#241a1c]">Dia {contract.paymentDueDay}</p>
        </div>
        <div className="bg-[#fbf3ef] rounded-2xl p-3 border border-[#f0ded8]">
          <p className="text-[#9c8b8e] mb-0.5">Criado em</p>
          <p className="font-bold text-[#241a1c]">{formatDate(contract.createdAt)}</p>
        </div>
      </div>

      {/* Motivo de recusa (se recusado) */}
      {contract.status === "recusado" && contract.refusalReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-red-800 mb-1">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Motivo da recusa</span>
          </div>
          <p className="text-red-700">{contract.refusalReason}</p>
          {contract.decisionAt && (
            <p className="text-red-500 text-xs mt-1">Em {formatDateTime(contract.decisionAt)}</p>
          )}
        </div>
      )}

      {/* Aprovado */}
      {contract.status === "aprovado" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              Contrato aprovado
              {contract.decisionAt ? ` em ${formatDateTime(contract.decisionAt)}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* UPLOAD DO PDF ASSINADO */}
      {canUpload && (
        <div className="border border-[#f0ded8] rounded-3xl p-5 space-y-4 bg-[#fbf3ef]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#5d0c1d]" />
            <h4 className="font-serif font-bold text-[#5d0c1d]">Enviar PDF Assinado</h4>
          </div>
          <p className="text-xs text-[#6f5f62]">
            Envie o PDF escaneado com a assinatura do paciente. Apenas arquivos PDF ate 10 MB sao aceitos.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#f0ded8] bg-white text-xs font-semibold text-[#5d0c1d] hover:bg-[#f8dad2] cursor-pointer transition">
              <FileText className="w-4 h-4" />
              <span>{selectedFile ? selectedFile.name : "Selecionar PDF..."}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </label>

            {selectedFile && uploadState !== "uploading" && (
              <button
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-semibold transition"
              >
                <Upload className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            )}
          </div>

          {/* Barra de progresso */}
          {uploadState === "uploading" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#6f5f62]">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-[#f0ded8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5d0c1d] transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de resultado */}
          {uploadMsg && (
            <div
              className={`text-xs p-3 rounded-2xl flex items-start gap-2 ${
                uploadState === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {uploadState === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{uploadMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* APROVAR / RECUSAR */}
      {canApproveOrRefuse && (
        <div className="border border-[#f0ded8] rounded-3xl p-5 space-y-4 bg-[#fbf3ef]">
          <h4 className="font-serif font-bold text-[#5d0c1d]">Revisao do Contrato Assinado</h4>
          <p className="text-xs text-[#6f5f62]">
            O paciente enviou o PDF assinado. Revise o documento antes de aprovar ou recusar.
          </p>

          {hasSignedFile && (
            <div className="flex items-center gap-2">
              {signedUrlMsg && (
                <p className="text-xs text-red-700">{signedUrlMsg}</p>
              )}
              <button
                onClick={handleDownloadSigned}
                disabled={fetchingUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#f0ded8] bg-white text-xs font-semibold text-[#5d0c1d] hover:bg-[#f8dad2] transition"
              >
                {fetchingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Baixar PDF Assinado</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Aprovar</span>
            </button>

            <button
              onClick={() => {
                setShowRefuseForm(!showRefuseForm);
                setRefuseError("");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-300 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Recusar</span>
            </button>
          </div>

          {/* Formulario de recusa */}
          {showRefuseForm && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#241a1c]">
                Motivo da recusa <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                value={refuseReason}
                onChange={(e) => {
                  setRefuseReason(e.target.value);
                  setRefuseError("");
                }}
                placeholder="Descreva o motivo (minimo 5 caracteres)..."
                className="w-full p-3 rounded-2xl border border-red-200 bg-white text-xs text-[#241a1c] focus:outline-none focus:border-red-500 resize-y"
              />
              {refuseError && (
                <p className="text-xs text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {refuseError}
                </p>
              )}
              <button
                onClick={handleRefuse}
                disabled={refusing}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
              >
                {refusing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Confirmar Recusa</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DOWNLOAD DO ASSINADO (para contratos aprovados ou recusados que tem arquivo) */}
      {!canApproveOrRefuse && hasSignedFile && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSigned}
            disabled={fetchingUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#f0ded8] bg-white text-xs font-semibold text-[#5d0c1d] hover:bg-[#f8dad2] transition"
          >
            {fetchingUrl ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Baixar PDF Assinado</span>
          </button>
          {signedUrlMsg && (
            <p className="text-xs text-red-700">{signedUrlMsg}</p>
          )}
        </div>
      )}

      {/* HISTORICO DE TRANSICOES */}
      {contract.events && contract.events.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-[#5d0c1d] text-sm">Historico de Transicoes</h4>
          <div className="space-y-2">
            {contract.events.map((ev: ContractEvent) => {
              const fromLabel = STATUS_LABELS[ev.fromStatus as ContractStatus] ?? ev.fromStatus;
              const toLabel   = STATUS_LABELS[ev.toStatus   as ContractStatus] ?? ev.toStatus;
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3 bg-[#fbf3ef] rounded-2xl border border-[#f0ded8] text-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#9c8b8e] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap font-medium text-[#362c2d]">
                      <span>{fromLabel}</span>
                      <ArrowRight className="w-3 h-3 text-[#9c8b8e] shrink-0" />
                      <span>{toLabel}</span>
                    </div>
                    {ev.note && (
                      <p className="text-[#6f5f62] mt-0.5 break-words">{ev.note}</p>
                    )}
                    <p className="text-[#9c8b8e] mt-0.5">{formatDateTime(ev.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
