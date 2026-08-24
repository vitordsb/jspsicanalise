"use client";

/**
 * Escolha de quem agendar, a partir de um horario ja definido no calendario.
 *
 * Lista todos os pacientes cadastrados, com quem ja tem contrato no topo e
 * sinalizado. Nao bloqueia os demais: um contrato pode estar em preparo, e
 * impedir o encaixe atrapalharia mais do que ajudaria.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Search, X, UserPlus, FileSignature, AlertTriangle } from "lucide-react";
import { formatCPF } from "@/lib/formatters";
import { formatarDataHora } from "@/lib/agenda";
import { Spinner, BotaoConteudo, EsqueletoListaPacientes } from "@/components/ui/Carregando";

interface Paciente {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  temContrato: boolean;
  totalAgendamentos: number;
}

function iniciais(nome: string) {
  const p = nome.trim().split(" ").filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function EscolherPaciente({
  inicioIso,
  aoFechar,
  aoAgendar,
}: {
  inicioIso: string;
  aoFechar: () => void;
  aoAgendar: (patientId: string) => Promise<boolean>;
}) {
  const [busca, setBusca] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState("");

  const carregar = useCallback(async (termo: string) => {
    setCarregando(true);
    try {
      const url = termo ? `/api/admin/pacientes?busca=${encodeURIComponent(termo)}` : "/api/admin/pacientes";
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setPacientes(d.pacientes ?? []);
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  // Espera a digitacao parar antes de consultar, para nao disparar uma
  // requisicao por tecla.
  useEffect(() => {
    const t = setTimeout(() => carregar(busca), busca ? 320 : 0);
    return () => clearTimeout(t);
  }, [busca, carregar]);

  // Esc fecha, como em qualquer caixa de dialogo.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aoFechar]);

  const escolher = async (id: string) => {
    setSalvandoId(id);
    const ok = await aoAgendar(id);
    setSalvandoId("");
    if (ok) aoFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={aoFechar}
        aria-label="Fechar"
      />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border border-[#f0ded8] shadow-xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-[#f3e4e0] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#5d0c1d] flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5" />
                Agendar cliente
              </h3>
              <p className="text-xs text-[#6f5f62] mt-1 first-letter:uppercase">
                {formatarDataHora(inicioIso)}
              </p>
            </div>
            <button
              onClick={aoFechar}
              className="p-1.5 rounded-full text-[#6f5f62] hover:bg-[#fbf3ef] shrink-0"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8b8e]" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#f7efe5] border border-transparent focus:border-[#5d0c1d] focus:bg-white text-sm text-[#241a1c] focus:outline-none transition"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {carregando ? (
            <EsqueletoListaPacientes itens={4} />
          ) : pacientes.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6f5f62] space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto text-[#ccb38d]" />
              <p>
                {busca
                  ? "Nenhum paciente encontrado com esse termo."
                  : "Nenhum paciente cadastrado ainda."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#fbf3ef]">
              {pacientes.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => escolher(p.id)}
                    disabled={salvandoId !== ""}
                    className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-[#fbf3ef] disabled:opacity-60 transition"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#f8dad2] text-[#5d0c1d] flex items-center justify-center text-xs font-bold">
                      {iniciais(p.fullName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#241a1c] truncate">
                        {p.fullName}
                      </p>
                      <p className="text-[11px] text-[#9c8b8e]">
                        CPF {formatCPF(p.cpf)}
                        {p.totalAgendamentos > 0 && ` · ${p.totalAgendamentos} consulta${p.totalAgendamentos === 1 ? "" : "s"}`}
                      </p>
                    </div>

                    {p.temContrato && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e7f4ec] text-[#245f3c] text-[10px] font-bold">
                        <FileSignature className="w-3 h-3" />
                        Contrato
                      </span>
                    )}

                    {salvandoId === p.id && <Spinner tamanho="sm" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-[#f3e4e0] shrink-0">
          <p className="text-[11px] text-[#9c8b8e]">
            Quem já tem contrato aparece primeiro. Avise o paciente depois de
            marcar: o sistema não envia aviso automático.
          </p>
        </div>
      </div>
    </div>
  );
}
