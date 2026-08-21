"use client";

/**
 * Agenda da Joane: calendario semanal com remanejamento.
 */

import { CalendarDays } from "lucide-react";
import { CalendarioSemanal } from "@/components/admin/CalendarioSemanal";

export default function AdminAgendaPage() {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Consultas marcadas pelos pacientes</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">Agenda</h1>
          <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
            Toque numa consulta para remanejar, marcar como realizada ou registrar falta.
            Horários de Brasília, formato 24 horas.
          </p>
        </div>

        <CalendarioSemanal />
      </main>
    </div>
  );
}
