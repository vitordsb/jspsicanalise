"use client";

/**
 * Vinculo de um contrato avulso a uma anamnese.
 *
 * Lista apenas anamneses do mesmo paciente que ainda nao tem contrato. O
 * servidor confere de novo: a tela filtra por conveniencia, a regra e dele.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link2, X, FileText, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { EsqueletoCartoes, Spinner } from "@/components/ui/Carregando";
import { useToast } from "@/components/ui/Toast";

interface Candidata {
  id: string;
  titulo: string;
  status: string;
  enviadaEm: string;
  resumo: string;
}

const ROTULO_STATUS: Record<string, string> = {
  pending: "Nova",
  in_review: "Em análise",
  approved: "Aprovada",
  archived: "Arquivada",
};

export function VincularAnamnese({
  contratoId,
  nomePaciente,
  aoFechar,
  aoVincular,
}: {
  contratoId: string;
  nomePaciente: string;
  aoFechar: () => void;
  aoVincular: () => void;
}) {
  const toast = useToast();
  const [anamneses, setAnamneses] = useState<Candidata[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/contracts/${contratoId}/vincular`);
      if (!res.ok) {
        toast.erro("Não foi possível carregar as anamneses.");
        return;
      }
      const d = await res.json();
      setAnamneses(d.anamneses ?? []);
    } catch {
      toast.erro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [contratoId, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aoFechar]);

  const vincular = async (submissionId: string) => {
    setSalvandoId(submissionId);
    try {
      const res = await fetch(`/api/admin/contracts/${contratoId}/vincular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.erro(d.error || "Não foi possível vincular.");
        return;
      }
      toast.sucesso("Contrato vinculado à anamnese.");
      aoVincular();
      aoFechar();
    } catch {
      toast.erro("Falha de conexão ao vincular.");
    } finally {
      setSalvandoId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button className="absolute inset-0 bg-black/40" onClick={aoFechar} aria-label="Fechar" />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border border-[#f0ded8] shadow-xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-[#f3e4e0] shrink-0 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#5d0c1d] flex items-center gap-2">
              <Link2 className="w-4.5 h-4.5" />
              Vincular a uma anamnese
            </h3>
            <p className="text-xs text-[#6f5f62] mt-1">
              Fichas de <strong>{nomePaciente}</strong> ainda sem contrato.
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

        <div className="overflow-y-auto flex-1 min-h-0 p-4">
          {carregando ? (
            <EsqueletoCartoes itens={2} altura="h-20" />
          ) : anamneses.length === 0 ? (
            <div className="text-center text-xs text-[#6f5f62] space-y-2 py-6">
              <AlertTriangle className="w-6 h-6 mx-auto text-[#ccb38d]" />
              <p className="font-semibold text-[#241a1c]">
                Nenhuma anamnese disponível para vincular.
              </p>
              <p className="max-w-xs mx-auto leading-relaxed">
                Ou este paciente ainda não preencheu a ficha, ou as fichas dele já
                estão vinculadas a outros contratos. Se a anamnese existe mas não
                aparece aqui, ela foi enviada com um CPF diferente e ficou em outro
                cadastro.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {anamneses.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => vincular(a.id)}
                    disabled={salvandoId !== ""}
                    className="w-full text-left p-4 rounded-2xl border border-[#f0ded8] bg-[#fbf3ef] hover:bg-[#f8dad2] hover:border-[#5d0c1d] disabled:opacity-60 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#241a1c] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-[#5d0c1d]" />
                          <span className="truncate">{a.titulo}</span>
                        </p>
                        <p className="text-[11px] text-[#9c8b8e] mt-0.5">
                          Enviada em {formatDateTime(a.enviadaEm)} · {ROTULO_STATUS[a.status] ?? a.status}
                        </p>
                        {a.resumo && (
                          <p className="text-xs text-[#6f5f62] mt-1.5 line-clamp-2">
                            {a.resumo}
                          </p>
                        )}
                      </div>
                      {salvandoId === a.id && <Spinner tamanho="sm" />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
