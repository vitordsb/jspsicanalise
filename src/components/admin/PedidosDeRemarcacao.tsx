"use client";

/**
 * Pedidos de remarcacao esperando resposta da Joane.
 *
 * Fica acima do calendario e nao dentro dele de proposito: pedido e coisa que
 * cobra resposta, e ficaria perdido se fosse so um detalhe visual em uma
 * celula da grade.
 *
 * Aprovar nao e um botao: ela toca em "Escolher novo horário", a grade entra
 * em modo de remanejamento e ela aponta o horario. Isso evita a tela de
 * aprovar sem saber para quando, que so empurraria a decisao para depois.
 */

import React, { useState } from "react";
import { CalendarClock, MoveRight, X, MessageSquareText } from "lucide-react";
import { formatarDataHora } from "@/lib/agenda";
import { Spinner } from "@/components/ui/Carregando";
import { useToast } from "@/components/ui/Toast";

export interface PedidoDeRemarcacao {
  id: string;
  inicioEm: string;
  remarcacaoPedidaEm?: string | null;
  remarcacaoMotivo?: string | null;
  patient: { id: string; fullName: string; phone: string; cpf: string };
}

export function PedidosDeRemarcacao({
  pedidos,
  aoEscolherHorario,
  aoResponder,
}: {
  pedidos: PedidoDeRemarcacao[];
  aoEscolherHorario: (id: string) => void;
  aoResponder: () => void;
}) {
  const toast = useToast();
  const [recusando, setRecusando] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (pedidos.length === 0) return null;

  const recusar = async (id: string) => {
    setSalvando(true);
    try {
      const res = await fetch(`/api/admin/agenda/${id}/recusar-remarcacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.erro(j.error || "Não foi possível recusar o pedido.");
        return;
      }
      toast.sucesso("Pedido recusado. O paciente foi avisado por e-mail.");
      setRecusando("");
      setMotivo("");
      aoResponder();
    } catch {
      toast.erro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-4 space-y-3">
      <h2 className="font-serif text-sm font-bold text-[#78350f] flex items-center gap-2">
        <CalendarClock className="w-4 h-4" />
        {pedidos.length === 1
          ? "1 pedido de remarcação"
          : `${pedidos.length} pedidos de remarcação`}
      </h2>

      <ul className="space-y-2">
        {pedidos.map((p) => (
          <li
            key={p.id}
            className="bg-white border border-[#fde68a] rounded-2xl p-3.5 space-y-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-[#241a1c]">{p.patient.fullName}</p>
              <p className="text-[11px] text-[#6f5f62] mt-0.5 first-letter:uppercase">
                Marcada para {formatarDataHora(p.inicioEm)}
              </p>
            </div>

            {p.remarcacaoMotivo?.trim() && (
              <p className="text-xs text-[#4a3f41] bg-[#fbf3ef] rounded-xl p-2.5 flex items-start gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#9c8b8e]" />
                <span>{p.remarcacaoMotivo}</span>
              </p>
            )}

            {recusando === p.id ? (
              <div className="space-y-2">
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
                  rows={2}
                  autoFocus
                  placeholder="Quer explicar o motivo? (opcional, vai no e-mail)"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#f0ded8] focus:border-[#5d0c1d] focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => recusar(p.id)}
                    disabled={salvando}
                    className="px-3.5 py-2 rounded-full bg-[#aa2d47] text-white text-xs font-semibold hover:bg-[#8f2139] disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {salvando && <Spinner tamanho="sm" />}
                    Confirmar recusa
                  </button>
                  <button
                    onClick={() => { setRecusando(""); setMotivo(""); }}
                    disabled={salvando}
                    className="px-3.5 py-2 rounded-full border border-[#eae2d7] text-[#6f5f62] text-xs font-semibold hover:bg-[#fbf3ef]"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => aoEscolherHorario(p.id)}
                  className="px-3.5 py-2 rounded-full bg-[#5d0c1d] text-white text-xs font-semibold hover:bg-[#7d1128] inline-flex items-center gap-1.5"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                  Escolher novo horário
                </button>
                <button
                  onClick={() => setRecusando(p.id)}
                  className="px-3.5 py-2 rounded-full border border-[#eae2d7] text-[#6f5f62] text-xs font-semibold hover:bg-[#fbf3ef] inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Recusar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
