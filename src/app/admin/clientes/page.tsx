"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WhatsAppSidebar } from "@/components/admin/WhatsAppSidebar";
import { PatientDetailView } from "@/components/admin/PatientDetailView";
import { SubmissionData } from "@/lib/types";
import {
  MessageSquareText,
  ShieldCheck,
  UserCheck,
  HeartHandshake,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

function ClientesContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/admin/submissions", window.location.origin);
      if (statusFilter && statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }
      if (searchTerm) {
        url.searchParams.set("search", searchTerm);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        // Se houver um initialId ou se não houver seleção e tiver itens, seleciona o primeiro
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchTerm]);

  // Se o searchParams mudar via link externo (ex: email com ?id=...)
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
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === selectedId ? { ...sub, status: newStatus as any } : sub
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
    if (res.ok) {
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedId ? { ...sub, clinicalNotes: notes } : sub
        )
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf9]">
      <AdminHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (WHATSAPP LIST) */}
        <div
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } w-full md:w-auto shrink-0`}
        >
          <WhatsAppSidebar
            submissions={submissions}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            onRefresh={fetchSubmissions}
            isLoading={isLoading}
          />
        </div>

        {/* MAIN AREA (WHATSAPP CHAT / RECORD) */}
        <div
          className={`${
            !selectedId ? "hidden md:flex" : "flex"
          } flex-1 flex-col overflow-hidden`}
        >
          {selectedSubmission ? (
            <div>
              {/* BOTÃO VOLTAR PARA MOBILE */}
              <div className="md:hidden p-2 bg-[#fbf9f6] border-b border-[#ebdcd5] flex items-center">
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c86d5e] p-1.5"
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
                onRefresh={fetchSubmissions}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center whatsapp-bg">
              <div className="bg-white/90 backdrop-blur-xs p-8 rounded-3xl border border-[#ebdcd5] max-w-md shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#faeae7] text-[#c86d5e] flex items-center justify-center mx-auto shadow-inner">
                  <MessageSquareText className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#2c2523]">
                  Painel de Atendimentos & Anamneses
                </h3>
                <p className="text-xs text-[#746a65] leading-relaxed">
                  Selecione um paciente na lista ao lado para visualizar a ficha de anamnese completa, anotações clínicas e gerar contratos.
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
