"use client";

/**
 * Fila do que vem pela frente, da consulta mais proxima ate a mais distante.
 *
 * Independe da semana aberta no calendario: a Joane pode estar olhando uma
 * semana passada e ainda assim precisa saber quem ela atende em seguida.
 */

import React from "react";
import { MessageSquareText, CalendarDays } from "lucide-react";
import { formatarHora, chaveDia, NOMES_DIA, FUSO } from "@/lib/agenda";

interface Item {
  id: string;
  inicioEm: string;
  duracaoMinutos: number;
  patient: { id: string; fullName: string; phone: string; cpf: string };
}

/** Quanto falta, em texto curto: "em 2h", "amanha", "em 5 dias". */
function quandoE(iso: string, agora: Date): string {
  const alvo = new Date(iso);
  const diffMs = alvo.getTime() - agora.getTime();
  const horas = Math.floor(diffMs / 3600_000);

  if (horas < 1) {
    const min = Math.max(1, Math.floor(diffMs / 60_000));
    return `em ${min} min`;
  }
  if (horas < 24 && chaveDia(alvo) === chaveDia(agora)) return `em ${horas}h`;

  // Comparacao por dia de calendario, nao por horas cheias: uma consulta as
  // 08h de amanha esta a 20 horas, mas o que importa dizer e "amanha".
  const diasDeDiferenca = Math.round(
    (new Date(chaveDia(alvo)).getTime() - new Date(chaveDia(agora)).getTime()) / 86_400_000
  );
  if (diasDeDiferenca === 1) return "amanhã";
  if (diasDeDiferenca < 7) return `em ${diasDeDiferenca} dias`;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, day: "2-digit", month: "2-digit",
  }).format(alvo);
}

function iniciais(nome: string) {
  const p = nome.trim().split(" ").filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function ProximosAgendamentos({
  itens,
  selecionadoId,
  aoSelecionar,
}: {
  itens: Item[];
  selecionadoId?: string | null;
  aoSelecionar?: (id: string) => void;
}) {
  const agora = new Date();

  return (
    <aside className="bg-white border border-[#f0ded8] rounded-3xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#f3e4e0] bg-[#fbf3ef] shrink-0">
        <h2 className="font-serif text-sm font-bold text-[#5d0c1d] flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          Próximos agendamentos
        </h2>
        <p className="text-[11px] text-[#6f5f62] mt-0.5">
          {itens.length === 0
            ? "Nenhuma consulta marcada"
            : `${itens.length} consulta${itens.length === 1 ? "" : "s"} pela frente`}
        </p>
      </div>

      {itens.length === 0 ? (
        <p className="p-4 text-xs text-[#9c8b8e]">
          Quando um paciente marcar, a consulta aparece aqui.
        </p>
      ) : (
        <ul className="divide-y divide-[#fbf3ef] overflow-y-auto flex-1 min-h-0">
          {itens.map((it, i) => {
            const d = new Date(it.inicioEm);
            const diaSemana = new Date(`${chaveDia(d)}T12:00:00.000Z`).getUTCDay();
            const ativo = selecionadoId === it.id;
            return (
              <li key={it.id}>
                <button
                  onClick={() => aoSelecionar?.(it.id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${
                    ativo ? "bg-[#fbf5f2]" : "hover:bg-[#fbf3ef]"
                  }`}
                >
                  <div
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      i === 0
                        ? "bg-[#5d0c1d] text-white"
                        : "bg-[#f8dad2] text-[#5d0c1d]"
                    }`}
                  >
                    {iniciais(it.patient.fullName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#241a1c] truncate">
                      {it.patient.fullName}
                    </p>
                    <p className="text-[11px] text-[#6f5f62] mt-0.5">
                      {NOMES_DIA[diaSemana].slice(0, 3)}, {formatarHora(it.inicioEm)}
                      <span className="text-[#9c8b8e]"> · {quandoE(it.inicioEm, agora)}</span>
                    </p>
                  </div>

                  {it.patient.phone && (
                    <a
                      href={`https://wa.me/55${it.patient.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full text-[#245f3c] hover:bg-[#e7f4ec] transition shrink-0"
                      aria-label={`Chamar ${it.patient.fullName} no WhatsApp`}
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                    </a>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
