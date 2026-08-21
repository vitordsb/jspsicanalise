"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WhatsAppSidebar } from "@/components/admin/WhatsAppSidebar";
import { PatientDetailView } from "@/components/admin/PatientDetailView";
import { SubmissionData } from "@/lib/types";
import {
  MessageSquareText,
  ArrowLeft,
} from "lucide-react";

function ClientesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id");

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Paginacao
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchSubmissions = async (targetPage = page) => {
    try {
      setIsLoading(true);
      const url = new URL("/api/admin/submissions", window.location.origin);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      if (statusFilter && statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }
      if (searchTerm) {
        url.searchParams.set("search", searchTerm);
      }

      const res = await fetch(url.toString());

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (res.ok) {
        const json = await res.json();
        // O backend retorna objeto paginado: { data, total, page, pageSize, totalPages }
        const list: SubmissionData[] = Array.isArray(json) ? json : (json.data ?? []);
        setSubmissions(list);
        setTotal(json.total ?? list.length);
        setTotalPages(json.totalPages ?? 1);
        if (!selectedId && list.length > 0) {
          setSelectedId(list[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar submissoes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reseta para pagina 1 ao mudar filtro ou busca
  useEffect(() => {
    setPage(1);
    fetchSubmissions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    if (page > 1) {
      fetchSubmissions(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (initialId) {
      setSelectedId(initialId);
    }
  }, [initialId]);

  const selectedSubmission = submissions.find((s) => s.id === selectedId);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/submissions/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === selectedId ? { ...sub, status: newStatus as SubmissionData["status"] } : sub
          )
        );
      }
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
    }
  };

  const handleNotesSave = async (notes: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/submissions/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicalNotes: notes }),
    });
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (res.ok) {
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedId ? { ...sub, clinicalNotes: notes } : sub
        )
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (WHATSAPP LIST) */}
        <div
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } w-full md:w-auto shrink-0 h-full`}
        >
          <WhatsAppSidebar
            submissions={submissions}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            onRefresh={() => fetchSubmissions(page)}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>

        {/* MAIN AREA (WHATSAPP CHAT / DOSSIE DO PACIENTE) */}
        <div
          className={`${
            !selectedId ? "hidden md:flex" : "flex"
          } flex-1 flex-col overflow-hidden h-full`}
        >
          {selectedSubmission ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* BOTAO VOLTAR PARA MOBILE */}
              <div className="md:hidden p-2.5 bg-[#fbf5f2] border-b border-[#f0ded8] flex items-center shrink-0">
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d0c1d] p-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para a lista de pacientes</span>
                </button>
              </div>

              <PatientDetailView
                key={selectedSubmission.id}
                submission={selectedSubmission}
                onStatusChange={handleStatusChange}
                onNotesSave={handleNotesSave}
                onRefresh={() => fetchSubmissions(page)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center whatsapp-bg">
              <div className="bg-white p-8 rounded-3xl border border-[#e5e0da] max-w-md shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#fbf5f2] text-[#5d0c1d] flex items-center justify-center mx-auto shadow-inner">
                  <MessageSquareText className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#5d0c1d]">
                  Painel de Atendimentos & Anamneses
                </h3>
                <p className="text-xs text-[#5f5456] leading-relaxed">
                  Selecione um paciente na lista ao lado para visualizar a ficha de anamnese completa, anotacoes clinicas e gerar contratos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminClientesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Carregando painel...</div>}>
      <ClientesContent />
    </Suspense>
  );
}
