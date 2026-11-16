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
    <section className="bg-warning-container border border-warning-outline rounded-3xl p-4 space-y-3">
      <h2 className="font-serif text-sm font-bold text-on-warning-container flex items-center gap-2">
        <CalendarClock className="w-4 h-4" />
        {pedidos.length === 1
          ? "1 pedido de remarcação"
          : `${pedidos.length} pedidos de remarcação`}
      </h2>

      <ul className="space-y-2">
        {pedidos.map((p) => (
          <li
            key={p.id}
            className="bg-white border border-warning-outline rounded-2xl p-3.5 space-y-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-on-surface">{p.patient.fullName}</p>
              <p className="text-[12px] text-on-surface-variant mt-0.5 first-letter:uppercase">
                Marcada para {formatarDataHora(p.inicioEm)}
              </p>
            </div>

            {p.remarcacaoMotivo?.trim() && (
              <p className="text-xs text-on-surface-variant bg-surface-low rounded-xl p-2.5 flex items-start gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-on-surface-subtle" />
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
                  className="w-full text-xs p-2.5 rounded-xl border border-outline-variant focus:border-primary focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => recusar(p.id)}
                    disabled={salvando}
                    className="px-3.5 py-2 rounded-full bg-secondary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {salvando && <Spinner tamanho="sm" />}
                    Confirmar recusa
                  </button>
                  <button
                    onClick={() => { setRecusando(""); setMotivo(""); }}
                    disabled={salvando}
                    className="px-3.5 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-low"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => aoEscolherHorario(p.id)}
                  className="px-3.5 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-hover inline-flex items-center gap-1.5"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                  Escolher novo horário
                </button>
                <button
                  onClick={() => setRecusando(p.id)}
                  className="px-3.5 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-low inline-flex items-center gap-1.5"
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
