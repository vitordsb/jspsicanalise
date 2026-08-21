"use client";

/**
 * Agenda da Joane: consultas marcadas pelos pacientes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CalendarDays, MessageSquareText, Clock } from "lucide-react";
import { formatarDataHora, formatarHora, formatarDataCurta } from "@/lib/agenda";
import { formatCPF } from "@/lib/formatters";
import { TelaCarregando, EsqueletoCartoes } from "@/components/ui/Carregando";

interface Item {
  id: string;
  inicioEm: string;
  duracaoMinutos: number;
  status: string;
  patient: { id: string; fullName: string; phone: string; cpf: string };
}

const ROTULO: Record<string, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  falta: "Falta",
};

export default function AdminAgendaPage() {
  const router = useRouter();
  const [proximos, setProximos] = useState<Item[]>([]);
  const [passados, setPassados] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/agenda");
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (res.ok) {
        const d = await res.json();
        setProximos(d.proximos ?? []);
        setPassados(d.passados ?? []);
      }
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => { carregar(); }, [carregar]);

  const Cartao = ({ it, passado }: { it: Item; passado?: boolean }) => (
    <div className={`bg-white border border-[#f0ded8] rounded-3xl p-4 flex items-start justify-between gap-3 flex-wrap ${passado ? "opacity-70" : ""}`}>
      <div className="min-w-0">
        <p className="font-serif font-bold text-sm text-[#241a1c] capitalize">
          {formatarDataHora(it.inicioEm)}
        </p>
        <p className="text-xs text-[#6f5f62] mt-0.5">
          {it.patient.fullName} - CPF {formatCPF(it.patient.cpf)}
        </p>
        <p className="text-[11px] text-[#9c8b8e] mt-0.5">
          {it.duracaoMinutos} minutos - {ROTULO[it.status] ?? it.status}
        </p>
      </div>
      {it.patient.phone && (
        <a
          href={`https://wa.me/55${it.patient.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e7f4ec] text-[#245f3c] text-xs font-semibold hover:bg-[#d5ecdf] transition shrink-0"
        >
          <MessageSquareText className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      <AdminHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Consultas marcadas pelos pacientes</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">Agenda</h1>
          <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
            Horários de Brasília. Os pacientes escolhem dentro das faixas definidas nas Configurações.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#5d0c1d]">Próximas</h2>
          {carregando ? (
            <EsqueletoCartoes itens={3} altura="h-24" />
          ) : proximos.length === 0 ? (
            <p className="text-sm text-[#6f5f62] bg-white border border-[#f0ded8] rounded-3xl p-5">
              Nenhuma consulta marcada no momento.
            </p>
          ) : (
            proximos.map((it) => <Cartao key={it.id} it={it} />)
          )}
        </section>

        {passados.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#5d0c1d] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Anteriores</span>
            </h2>
            {passados.map((it) => <Cartao key={it.id} it={it} passado />)}
          </section>
        )}
      </main>
    </div>
  );
}
