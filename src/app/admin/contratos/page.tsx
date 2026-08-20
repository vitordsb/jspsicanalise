"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContractModal } from "@/components/admin/ContractModal";
import { ContractDetailPanel, ContractStatusBadge } from "@/components/admin/ContractDetailPanel";
import { ContractData, ContractStatus, PatientData } from "@/lib/types";
import { formatDateTime, formatCurrency, formatCPF } from "@/lib/formatters";
import {
  FileSignature,
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";

type StatusFilter = "todos" | ContractStatus;

const STATUS_FILTER_OPTS: { value: StatusFilter; label: string }[] = [
  { value: "todos",                label: "Todos" },
  { value: "rascunho",             label: "Rascunho" },
  { value: "gerado",               label: "Gerado" },
  { value: "aguardando_assinatura",label: "Aguardando Assinatura" },
  { value: "assinado_recebido",    label: "Assinado Recebido" },
  { value: "aprovado",             label: "Aprovado" },
  { value: "recusado",             label: "Recusado" },
];

const PAGE_SIZE = 20;

export default function AdminContratosPage() {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Contrato selecionado para detalhe (busca individual com events)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal de novo contrato
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  const fetchContracts = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/contracts", window.location.origin);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (statusFilter !== "todos") {
        url.searchParams.set("status", statusFilter);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        // GET /api/admin/contracts retorna { data, meta: { total, page, limit, pages } }
        const list: ContractData[] = json.data ?? [];
        setContracts(list);
        setTotal(json.meta?.total ?? list.length);
        setTotalPages(json.meta?.pages ?? 1);
      }
    } catch (e) {
      console.error("Erro ao carregar contratos:", e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // Busca pacientes para o modal de novo contrato
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/submissions?pageSize=100");
      if (res.ok) {
        const json = await res.json();
        const subs = json.data ?? json;
        const seen = new Set<string>();
        const unique: PatientData[] = [];
        for (const s of subs) {
          if (s.patient && !seen.has(s.patient.id)) {
            seen.add(s.patient.id);
            unique.push(s.patient);
          }
        }
        setPatients(unique);
      }
    } catch (e) {
      console.error("Erro ao carregar pacientes:", e);
    }
  }, []);

  useEffect(() => {
    fetchContracts(1);
    fetchPatients();
  }, [statusFilter]);

  useEffect(() => {
    if (page > 1) fetchContracts(page);
  }, [page]);

  // Busca detalhes do contrato selecionado (incluindo events)
  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/contracts/${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedContract(json);
      }
    } catch (e) {
      console.error("Erro ao buscar detalhes:", e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleSelectContract = (id: string) => {
    setSelectedId(id);
    fetchDetail(id);
  };

  const handleOpenNew = () => {
    if (patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
    setIsModalOpen(true);
  };

  const handleRefreshDetail = () => {
    if (selectedId) fetchDetail(selectedId);
    fetchContracts(page);
  };

  // Filtra localmente por busca de texto (nome do paciente, CPF, titulo)
  const filtered = searchTerm
    ? contracts.filter((c) => {
        const q = searchTerm.toLowerCase();
        return (
          (c.patientFullName || c.patient?.fullName || "").toLowerCase().includes(q) ||
          (c.patientCpf || c.patient?.cpf || "").includes(searchTerm) ||
          c.title.toLowerCase().includes(q)
        );
      })
    : contracts;

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* Cabecalho da pagina */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
              <FileSignature className="w-3.5 h-3.5" />
              <span>Contratos de Prestacao de Servicos</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
              Contratos
            </h1>
            <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
              Gerencie, revise e acompanhe todos os contratos dos pacientes.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contrato</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Busca */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8b8e]" />
            <input
              type="text"
              placeholder="Buscar por paciente ou titulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-[#f0ded8] bg-white text-xs text-[#241a1c] placeholder-[#9c8b8e] focus:outline-none focus:border-[#5d0c1d]"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_FILTER_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  statusFilter === opt.value
                    ? "bg-[#5d0c1d] text-white"
                    : "bg-white border border-[#f0ded8] text-[#6f5f62] hover:bg-[#fbf3ef]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout em dois paineis */}
        <div className="flex gap-6">
          {/* LISTA DE CONTRATOS */}
          <div className={`flex-1 min-w-0 ${selectedId ? "hidden sm:block sm:w-96 sm:shrink-0 sm:flex-none" : ""}`}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#5d0c1d]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#f0ded8] p-12 text-center space-y-3 shadow-xs">
                <FileText className="w-12 h-12 mx-auto text-[#ccb38d]" />
                <h3 className="font-serif text-xl font-bold text-[#5d0c1d]">
                  Nenhum contrato encontrado
                </h3>
                <p className="text-xs text-[#6f5f62] max-w-sm mx-auto">
                  Gere contratos diretamente da ficha do paciente ou clicando em "Novo Contrato".
                </p>
                <button
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] text-xs font-bold hover:bg-[#f3cbc1] transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Contrato</span>
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectContract(c.id)}
                      className={`w-full text-left bg-white rounded-3xl border p-5 shadow-xs transition ${
                        selectedId === c.id
                          ? "border-[#5d0c1d] ring-1 ring-[#5d0c1d]"
                          : "border-[#f0ded8] hover:border-[#f3cbc1]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-sm text-[#5d0c1d] truncate">
                            {c.patientFullName || c.patient?.fullName || "Paciente"}
                          </p>
                          <p className="text-xs text-[#9c8b8e]">
                            CPF: {formatCPF(c.patientCpf || c.patient?.cpf || "")}
                          </p>
                        </div>
                        <ContractStatusBadge status={c.status} />
                      </div>

                      <div className="text-xs text-[#362c2d] space-y-0.5">
                        <p>
                          <span className="font-semibold">{formatCurrency(
                            c.sessionPriceCents > 0
                              ? c.sessionPriceCents / 100
                              : ((c as unknown as Record<string, unknown>).sessionPrice as number) ?? 0
                          )}</span>
                          {" - "}{c.frequency}
                        </p>
                        <p className="text-[#9c8b8e]">Criado {formatDateTime(c.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Paginacao */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-xs text-[#6f5f62]">
                    <span>
                      {total} contrato{total !== 1 ? "s" : ""} - pagina {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-full border border-[#f0ded8] bg-white hover:bg-[#fbf3ef] disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-full border border-[#f0ded8] bg-white hover:bg-[#fbf3ef] disabled:opacity-40 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PAINEL DE DETALHE */}
          {selectedId && (
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-3xl border border-[#f0ded8] p-6 shadow-xs">
                {/* Botao fechar no mobile */}
                <div className="flex items-center justify-between mb-4 sm:hidden">
                  <h3 className="font-serif font-bold text-[#5d0c1d]">Detalhe</h3>
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedContract(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-[#f8dad2] text-[#5d0c1d] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#5d0c1d]" />
                  </div>
                ) : selectedContract ? (
                  <ContractDetailPanel
                    contract={selectedContract}
                    onRefresh={handleRefreshDetail}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE NOVO CONTRATO */}
      {selectedPatient && (
        <ContractModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onSaved={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
            fetchContracts(1);
          }}
        />
      )}
    </div>
  );
}
