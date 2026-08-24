"use client";

/**
 * Escolha de horario da consulta pelo paciente.
 *
 * As vagas chegam prontas do servidor. A tela apenas agrupa por dia e envia a
 * escolhida de volta: o servidor revalida tudo antes de gravar.
 */

import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, X, AlertTriangle, Clock } from "lucide-react";
import { formatarDataHora, NOMES_DIA } from "@/lib/agenda";
import { Spinner, BotaoConteudo, EsqueletoCartoes } from "@/components/ui/Carregando";
import { useToast } from "@/components/ui/Toast";

interface Vaga {
  inicioIso: string;
  data: string;
  hora: string;
  diaSemana: number;
  nomeDia: string;
}

interface MeuAgendamento {
  id: string;
  inicioEm: string;
  duracaoMinutos: number;
  status: string;
}

export function Agendamento({ aoMudar }: { aoMudar?: () => void }) {
  const toast = useToast();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [meus, setMeus] = useState<MeuAgendamento[]>([]);
  const [semJanelas, setSemJanelas] = useState(false);
  const [duracao, setDuracao] = useState(50);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/paciente/agenda");
      if (!res.ok) {
        setErro("Não foi possível carregar os horários.");
        return;
      }
      const d = await res.json();
      setVagas(d.vagas ?? []);
      setMeus(d.meusAgendamentos ?? []);
      setSemJanelas(Boolean(d.semJanelas));
      setDuracao(d.duracaoMinutos ?? 50);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const marcar = async (inicioIso: string) => {
    setSalvando(inicioIso);
    setErro("");
    try {
      const res = await fetch("/api/paciente/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inicioIso }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(d.error || "Não foi possível marcar.");
        toast.erro(d.error || "Não foi possível marcar sua consulta.");
        // Vaga pode ter sido tomada por outra pessoa: recarrega a lista.
        if (res.status === 409) carregar();
        return;
      }
      toast.sucesso("Consulta marcada. Guarde a data e o horário.");
      await carregar();
      aoMudar?.();
    } catch {
      setErro("Falha de conexão ao marcar.");
      toast.erro("Falha de conexão. Verifique sua internet.");
    } finally {
      setSalvando("");
    }
  };

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar esta consulta? Você poderá escolher outro horário depois.")) return;
    setSalvando(id);
    try {
      const res = await fetch(`/api/paciente/agenda/${id}/cancelar`, { method: "POST" });
      if (res.ok) {
        toast.aviso("Consulta cancelada. Escolha um novo horário quando quiser.");
        await carregar();
        aoMudar?.();
      } else {
        toast.erro("Não foi possível cancelar. Tente novamente.");
      }
    } finally {
      setSalvando("");
    }
  };

  if (carregando) return <EsqueletoCartoes itens={2} altura="h-24" />;

  const ativo = meus.find((m) => m.status === "agendado");

  if (ativo) {
    return (
      <div className="bg-[#e7f4ec] border border-[#c7e6d2] rounded-3xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-[#245f3c] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-serif font-bold text-sm text-[#245f3c]">
              Sua consulta está marcada
            </p>
            <p className="text-sm text-[#245f3c] mt-1 capitalize">
              {formatarDataHora(ativo.inicioEm)}
            </p>
            <p className="text-[11px] text-[#245f3c]/80 mt-1">
              Duração de {ativo.duracaoMinutos} minutos. Horário de Brasília.
            </p>
          </div>
        </div>
        <button
          onClick={() => cancelar(ativo.id)}
          disabled={salvando === ativo.id}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#aa2d47] hover:underline disabled:opacity-60"
        >
          {salvando === ativo.id ? <Spinner tamanho="sm" /> : <X className="w-3.5 h-3.5" />}
          <span>Cancelar e escolher outro horário</span>
        </button>
      </div>
    );
  }

  if (semJanelas) {
    return (
      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-5 text-xs text-[#78350f] flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          A agenda ainda não foi configurada. Fale com a Dra. Joane pelo WhatsApp
          para marcar sua consulta.
        </p>
      </div>
    );
  }

  // Agrupa por dia preservando a ordem cronologica.
  const porDia = new Map<string, Vaga[]>();
  for (const v of vagas) {
    if (!porDia.has(v.data)) porDia.set(v.data, []);
    porDia.get(v.data)!.push(v);
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3.5 rounded-2xl text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {porDia.size === 0 ? (
        <div className="bg-white border border-[#f0ded8] rounded-3xl p-5 text-xs text-[#6f5f62]">
          Não há horários livres nas próximas semanas. Fale com a Dra. Joane pelo
          WhatsApp.
        </div>
      ) : (
        <>
          <p className="text-[11px] text-[#6f5f62] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#ccb38d]" />
            Sessão de {duracao} minutos. Horários de Brasília.
          </p>

          <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
            {[...porDia.entries()].map(([data, lista]) => {
              const [ano, mes, dia] = data.split("-");
              return (
                <div key={data} className="bg-white border border-[#f0ded8] rounded-3xl p-4">
                  <p className="font-serif font-bold text-xs text-[#5d0c1d] mb-2.5 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {NOMES_DIA[lista[0].diaSemana]}, {dia}/{mes}/{ano}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lista.map((v) => (
                      <button
                        key={v.inicioIso}
                        onClick={() => marcar(v.inicioIso)}
                        disabled={salvando !== ""}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs font-semibold text-[#5d0c1d] hover:bg-[#5d0c1d] hover:text-white hover:border-[#5d0c1d] disabled:opacity-50 transition"
                      >
                        <BotaoConteudo
                          carregando={salvando === v.inicioIso}
                          rotuloCarregando="..."
                          claro={false}
                        >
                          <span>{v.hora}</span>
                        </BotaoConteudo>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
