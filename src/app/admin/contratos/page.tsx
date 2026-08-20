"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContractModal } from "@/components/admin/ContractModal";
import { PatientData } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  FileSignature,
  Plus,
  Printer,
  Trash2,
  FileText,
  Search,
} from "lucide-react";

export default function AdminContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, patientsRes] = await Promise.all([
        fetch("/api/admin/contracts"),
        fetch("/api/admin/submissions"),
      ]);

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData);
      }

      if (patientsRes.ok) {
        const subsData = await patientsRes.json();
        const uniquePatients: PatientData[] = [];
        const seen = new Set();
        subsData.forEach((s: any) => {
          if (!seen.has(s.patient.id)) {
            seen.add(s.patient.id);
            uniquePatients.push(s.patient);
          }
        });
        setPatients(uniquePatients);
      }
    } catch (e) {
      console.error("Erro ao carregar contratos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNew = () => {
    if (patients.length > 0) {
      setSelectedPatient(patients[0]);
    } else {
      setSelectedPatient({
        id: "new",
        fullName: "Paciente Exemplo",
        email: "paciente@exemplo.com",
        phone: "(11) 99999-9999",
        birthDate: "1990-01-01",
        cpf: "000.000.000-00",
        createdAt: "",
        updatedAt: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleViewContract = (contract: any) => {
    setSelectedPatient(contract.patient);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return;
    try {
      const res = await fetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Erro ao excluir contrato:", e);
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient?.cpf?.includes(searchTerm) ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
              <FileSignature className="w-3.5 h-3.5" />
              <span>Contratos de Prestação de Serviços</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
              Gerador de Contratos
            </h1>
            <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
              Contratos com dados estáticos da Dra. Joane e dados dinâmicos resgatados das anamneses dos pacientes.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Novo Contrato</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8b8e]" />
            <input
              type="text"
              placeholder="Pesquisar contrato por paciente ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full border border-[#f0ded8] bg-white text-xs sm:text-sm text-[#241a1c] placeholder-[#9c8b8e] focus:outline-none focus:border-[#5d0c1d]"
            />
          </div>
        </div>

        {/* LISTA DE CONTRATOS */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#f0ded8] p-12 text-center space-y-3 shadow-xs">
            <FileText className="w-12 h-12 mx-auto text-[#ccb38d]" />
            <h3 className="font-serif text-xl font-bold text-[#5d0c1d]">
              Nenhum contrato gerado ainda
            </h3>
            <p className="text-xs text-[#6f5f62] max-w-md mx-auto">
              Você pode gerar contratos diretamente da ficha de qualquer paciente na aba Clientes ou clicando no botão acima.
            </p>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] text-xs font-bold hover:bg-[#f3cbc1] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Primeiro Contrato</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-3xl border border-[#f0ded8] p-7 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5d0c1d]">
                        Contrato Clínico
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#5d0c1d]">
                        {contract.patient?.fullName || "Paciente"}
                      </h3>
                      <p className="text-xs text-[#6f5f62]">
                        CPF: {contract.patient?.cpf}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f4ec] text-[#245f3c]">
                      {contract.status === "signed" ? "Assinado" : "Emitido"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#362c2d] bg-[#fbf3ef] p-4 rounded-2xl border border-[#f0ded8]">
                    <p><strong>Valor:</strong> {formatCurrency(contract.sessionPrice)}</p>
                    <p><strong>Duração:</strong> {contract.durationMinutes} min</p>
                    <p className="col-span-2"><strong>Frequência:</strong> {contract.frequency}</p>
                  </div>

                  <p className="text-[11px] text-[#9c8b8e]">
                    Gerado em {formatDateTime(contract.createdAt)}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f3e4e0] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewContract(contract)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#f8dad2] hover:bg-[#f3cbc1] text-[#5d0c1d] text-xs font-semibold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Visualizar / Imprimir A4</span>
                  </button>

                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="p-2 text-[#9c8b8e] hover:text-[#aa2d47] hover:bg-[#fff0f3] rounded-full transition"
                    title="Excluir contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {selectedPatient && (
          <ContractModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
            onSaved={fetchData}
          />
        )}
      </main>
    </div>
  );
}
