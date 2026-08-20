"use client";

import React from "react";
import { SubmissionData } from "@/lib/types";
import { formatDate, formatCPF } from "@/lib/formatters";
import {
  Search,
  RefreshCw,
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

/**
 * Detecta sinalizacao de risco nas respostas da anamnese.
 * Retorna true se q_ideacao for uma resposta de risco (nao "Nao" nem "Prefiro nao responder aqui")
 * ou se q_autolesao for "Sim, recentemente".
 */
export function hasRiskFlag(answers: Record<string, unknown>): boolean {
  const ideacao = answers["q_ideacao"] as string | undefined;
  const autolesao = answers["q_autolesao"] as string | undefined;

  const riskIdeacao =
    !!ideacao &&
    ideacao !== "Não" &&
    ideacao !== "Prefiro não responder aqui";

  const riskAutolesao = autolesao === "Sim, recentemente";

  return riskIdeacao || riskAutolesao;
}

interface WhatsAppSidebarProps {
  submissions: SubmissionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onFilterChange: (val: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export const WhatsAppSidebar: React.FC<WhatsAppSidebarProps> = ({
  submissions,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange,
  statusFilter,
  onFilterChange,
  onRefresh,
  isLoading,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
}) => {
  const filterTabs = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Novos" },
    { key: "in_review", label: "Em Análise" },
    { key: "approved", label: "Aprovados" },
    { key: "archived", label: "Arquivados" },
  ];

  // Helper para cores suaves de avatar
  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-[#f8dad2] text-[#5d0c1d]",
      "bg-[#fdece8] text-[#8b1c31]",
      "bg-[#f7efe5] text-[#5d0c1d]",
      "bg-[#edf8fe] text-[#2c6172]",
      "bg-[#faeae4] text-[#aa2d47]",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f8dad2] text-[#5d0c1d] border border-[#f0ded8] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5d0c1d] animate-pulse" />
            Novo
          </span>
        );
      case "in_review":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#edf8fe] text-[#1e5b7a] border border-[#cbe4f7]">
            Em Análise
          </span>
        );
      case "approved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e7f4ec] text-[#245f3c] border border-[#c7e6d2]">
            Aprovado
          </span>
        );
      case "archived":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0edea] text-[#6f5f62]">
            Arquivado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full md:w-96 lg:w-[410px] bg-white border-r border-[#f0ded8] flex flex-col h-[calc(100vh-64px)] shrink-0">
      {/* HEADER DA LISTA DE CONVERSAS */}
      <div className="p-3.5 bg-[#fbf3ef] border-b border-[#f0ded8] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#5d0c1d] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            JS
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-[#5d0c1d] leading-tight">
              Pacientes & Anamneses
            </h2>
            <p className="text-[11px] text-[#6f5f62]">
              {total > 0 ? `${total} registro${total === 1 ? "" : "s"}` : `${submissions.length} registro${submissions.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          title="Atualizar lista"
          className="p-2 rounded-full text-[#5d0c1d] hover:bg-[#f8dad2] transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#5d0c1d]" : ""}`} />
        </button>
      </div>

      {/* CAMPO DE PESQUISA ESTILO WHATSAPP */}
      <div className="p-3 border-b border-[#f3e4e0] bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8b8e]" />
          <input
            type="text"
            placeholder="Pesquisar paciente por nome, CPF ou queixa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f7efe5] border border-transparent focus:border-[#5d0c1d] focus:bg-white text-xs sm:text-sm text-[#241a1c] placeholder-[#9c8b8e] focus:outline-none transition"
          />
        </div>

        {/* FILTROS PILLS */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onFilterChange(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#5d0c1d] text-white shadow-xs"
                    : "bg-[#fbf3ef] text-[#6f5f62] hover:bg-[#f8dad2] hover:text-[#5d0c1d]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE PACIENTES */}
      <div className="overflow-y-auto divide-y divide-[#fbf3ef]" style={{ flex: 1, minHeight: 0 }}>
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9c8b8e] space-y-2">
            <User className="w-8 h-8 mx-auto text-[#ccb38d]" />
            <p className="font-serif font-bold text-sm text-[#5d0c1d]">Nenhum paciente encontrado</p>
            <p>Tente ajustar os termos da busca ou os filtros acima.</p>
          </div>
        ) : (
          // Fichas com sinalizacao de risco aparecem primeiro
          [...submissions]
            .sort((a, b) => {
              const aRisk = hasRiskFlag(a.answers ?? {}) ? 1 : 0;
              const bRisk = hasRiskFlag(b.answers ?? {}) ? 1 : 0;
              return bRisk - aRisk;
            })
            .map((sub) => {
            const isSelected = selectedId === sub.id;
            const isPending = sub.status === "pending";
            const isRisk = hasRiskFlag(sub.answers ?? {});

            return (
              <div
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative ${
                  isRisk
                    ? isSelected
                      ? "bg-red-50 border-l-4 border-red-600"
                      : "bg-red-50/60 border-l-4 border-red-400 hover:bg-red-50"
                    : isSelected
                    ? "bg-[#f8dad2]/50 border-l-4 border-[#5d0c1d]"
                    : "hover:bg-[#fbf3ef] bg-white"
                }`}
              >
                {/* AVATAR */}
                <div
                  className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-sm shadow-2xs ${
                    isRisk ? "bg-red-100 text-red-800" : getAvatarBg(sub.patient.fullName)
                  }`}
                >
                  {isRisk ? (
                    <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    getInitials(sub.patient.fullName)
                  )}
                </div>

                {/* INFO & PREVIEW */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isRisk ? "text-red-800 font-bold" : isPending ? "text-[#5d0c1d] font-bold" : "text-[#241a1c]"
                      }`}
                    >
                      {sub.patient.fullName}
                    </h3>
                    <span className="text-[11px] text-[#9c8b8e] shrink-0">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>

                  {/* Alerta de risco */}
                  {isRisk && (
                    <p className="text-[11px] font-bold text-red-700 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>Atencao: sinalizacao de risco</span>
                    </p>
                  )}

                  {/* PREVIEW DA QUEIXA / MENSAGEM */}
                  <p className="text-xs text-[#6f5f62] line-clamp-1 mb-1.5 font-normal">
                    {String(sub.answers["q_motivo"] ||
                      sub.answers["motivo"] ||
                      sub.answers["queixa"] ||
                      "Ficha de anamnese preenchida")}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#9c8b8e] truncate">
                      CPF: {formatCPF(sub.patient.cpf)}
                    </span>
                    {getStatusBadge(sub.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONTROLES DE PAGINACAO */}
      {totalPages > 1 && onPageChange && (
        <div className="shrink-0 border-t border-[#f0ded8] bg-[#fbf3ef] px-3.5 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#f0ded8] bg-white text-xs font-semibold text-[#5d0c1d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8dad2] transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <span className="text-[11px] font-medium text-[#6f5f62]">
            Pag. {page} de {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#f0ded8] bg-white text-xs font-semibold text-[#5d0c1d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8dad2] transition"
          >
            <span>Proxima</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
