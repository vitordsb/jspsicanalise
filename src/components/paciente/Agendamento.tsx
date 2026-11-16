"use client";

/**
 * Consultas do paciente e escolha de horario.
 *
 * Mostra TODAS as consultas marcadas, nao so a proxima: a Joane pode marcar
 * varias pela agenda dela, e antes a tela exibia apenas a primeira da lista,
 * que podia inclusive ser uma consulta ja passada.
 *
 * Remarcar aqui e um pedido, nao uma acao. Quem escolhe o novo horario e a
 * Joane. Deixar o paciente cancelar e remarcar sozinho abriria um buraco na
 * agenda que outra pessoa poderia ocupar no meio do caminho, e ele acabaria
 * sem consulta nenhuma. Enquanto o pedido esta aberto o horario dele continua
 * reservado.
 *
 * As vagas chegam prontas do servidor. A tela apenas agrupa por dia e envia a
 * escolhida de volta: o servidor revalida tudo antes de gravar.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Check, X, AlertTriangle, CalendarClock, History, MessageSquareText,
} from "lucide-react";
import { formatarDataHora } from "@/lib/agenda";
import { Spinner, EsqueletoCartoes } from "@/components/ui/Carregando";
import { useToast } from "@/components/ui/Toast";
import { CalendarioPaciente, type Vaga } from "./CalendarioPaciente";

interface MeuAgendamento {
  id: string;
  inicioEm: string;
  duracaoMinutos: number;
  status: string;
  observacao?: string | null;
  remarcacaoPedidaEm?: string | null;
  remarcacaoMotivo?: string | null;
  remarcacaoRecusadaEm?: string | null;
  remarcacaoRecusaMotivo?: string | null;
}

const ROTULO_STATUS: Record<string, string> = {
  agendado: "Agendada",
  realizado: "Realizada",
  cancelado: "Cancelada",
  falta: "Não compareceu",
};

export function Agendamento({ aoMudar }: { aoMudar?: () => void }) {
  const toast = useToast();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [proximas, setProximas] = useState<MeuAgendamento[]>([]);
  const [historico, setHistorico] = useState<MeuAgendamento[]>([]);
  const [verHistorico, setVerHistorico] = useState(false);
  const [pedindo, setPedindo] = useState("");
  const [motivoPedido, setMotivoPedido] = useState("");
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
      setProximas(d.proximas ?? d.meusAgendamentos ?? []);
      setHistorico(d.historico ?? []);
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

  const pedirRemarcacao = async (id: string) => {
    setSalvando(id);
    try {
      const res = await fetch(`/api/paciente/agenda/${id}/remarcar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoPedido }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.erro(d.error || "Não foi possível enviar o pedido.");
        return;
      }
      toast.sucesso("Pedido enviado. A Dra. Joane vai escolher um novo horário.");
      setPedindo("");
      setMotivoPedido("");
      await carregar();
      aoMudar?.();
    } catch {
      toast.erro("Falha de conexão.");
    } finally {
      setSalvando("");
    }
  };

  const desistirDoPedido = async (id: string) => {
    setSalvando(id);
    try {
      const res = await fetch(`/api/paciente/agenda/${id}/remarcar`, { method: "DELETE" });
      if (!res.ok) {
        toast.erro("Não foi possível cancelar o pedido.");
        return;
      }
      toast.aviso("Pedido cancelado. Sua consulta segue no horário original.");
      await carregar();
    } catch {
      toast.erro("Falha de conexão.");
    } finally {
      setSalvando("");
    }
  };

  if (carregando) return <EsqueletoCartoes itens={2} altura="h-24" />;

  // Um cartao por consulta futura. Antes era so a primeira da lista.
  const listaProximas = proximas.length > 0 && (
    <div className="space-y-3">
      {proximas.map((c) => {
        const pedidoAberto = Boolean(c.remarcacaoPedidaEm);
        const ocupado = salvando === c.id;

        return (
          <div
            key={c.id}
            className="bg-success-container border border-success-outline rounded-3xl p-5 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-sm text-success">
                  {proximas.length > 1 ? "Consulta marcada" : "Sua consulta está marcada"}
                </p>
                <p className="text-sm text-success mt-1 first-letter:uppercase">
                  {formatarDataHora(c.inicioEm)}
                </p>
                <p className="text-[12px] text-success/80 mt-1">
                  Duração de {c.duracaoMinutos} minutos. Horário de Brasília.
                </p>
              </div>
            </div>

            {c.remarcacaoRecusadaEm && !pedidoAberto && (
              <div className="bg-white/70 border border-success-outline rounded-2xl p-3 text-xs text-on-surface-variant space-y-1">
                <p className="font-semibold text-success">
                  A Dra. Joane não conseguiu remarcar desta vez.
                </p>
                {c.remarcacaoRecusaMotivo?.trim() && (
                  <p className="flex items-start gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                    <span>{c.remarcacaoRecusaMotivo}</span>
                  </p>
                )}
              </div>
            )}

            {pedidoAberto ? (
              <div className="bg-warning-container border border-warning-outline rounded-2xl p-3 text-xs text-on-warning-container space-y-2">
                <p className="flex items-start gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Pedido de remarcação enviado. Enquanto a Dra. Joane não responde,
                    este horário continua reservado para você.
                  </span>
                </p>
                <button
                  onClick={() => desistirDoPedido(c.id)}
                  disabled={ocupado}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-on-warning-container hover:underline disabled:opacity-60"
                >
                  {ocupado ? <Spinner tamanho="sm" /> : <X className="w-3 h-3" />}
                  <span>Desistir do pedido</span>
                </button>
              </div>
            ) : pedindo === c.id ? (
              <div className="space-y-2">
                <textarea
                  value={motivoPedido}
                  onChange={(e) => setMotivoPedido(e.target.value.slice(0, 500))}
                  rows={2}
                  autoFocus
                  placeholder="Quer dizer o motivo ou sugerir dias melhores? (opcional)"
                  className="w-full text-xs p-2.5 rounded-xl border border-success-outline bg-white focus:border-success focus:outline-none resize-none"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => pedirRemarcacao(c.id)}
                    disabled={ocupado}
                    className="px-3.5 py-2 rounded-full bg-success text-white text-xs font-semibold hover:bg-success-dark disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {ocupado && <Spinner tamanho="sm" />}
                    Enviar pedido
                  </button>
                  <button
                    onClick={() => { setPedindo(""); setMotivoPedido(""); }}
                    disabled={ocupado}
                    className="px-3.5 py-2 rounded-full border border-success-outline text-success text-xs font-semibold hover:bg-white"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 flex-wrap items-center">
                <button
                  onClick={() => { setPedindo(c.id); setMotivoPedido(""); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-success hover:underline"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Pedir para remarcar</span>
                </button>
                <button
                  onClick={() => cancelar(c.id)}
                  disabled={ocupado}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline disabled:opacity-60"
                >
                  {ocupado ? <Spinner tamanho="sm" /> : <X className="w-3.5 h-3.5" />}
                  <span>Cancelar consulta</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Historico fechado por padrao: interessa quando a pessoa vai procurar, nao
  // toda vez que ela abre a area.
  const blocoHistorico = historico.length > 0 && (
    <div className="bg-white border border-outline-variant rounded-3xl overflow-hidden">
      <button
        onClick={() => setVerHistorico((v) => !v)}
        className="w-full flex items-center gap-2 p-4 text-xs font-semibold text-primary hover:bg-surface-low transition"
      >
        <History className="w-4 h-4" />
        <span className="flex-1 text-left">
          Consultas anteriores ({historico.length})
        </span>
        <span className="text-on-surface-subtle">{verHistorico ? "Ocultar" : "Ver"}</span>
      </button>
      {verHistorico && (
        <ul className="border-t border-outline-variant divide-y divide-outline-variant">
          {historico.map((c) => (
            <li key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-on-surface-variant first-letter:uppercase">
                {formatarDataHora(c.inicioEm)}
              </span>
              <span
                className={`text-[12px] font-semibold shrink-0 ${
                  c.status === "realizado"
                    ? "text-success"
                    : c.status === "falta"
                      ? "text-secondary"
                      : "text-on-surface-subtle"
                }`}
              >
                {ROTULO_STATUS[c.status] ?? c.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Com consulta futura marcada nao se escolhe horario novo: a regra de uma
  // consulta ativa por vez vive no servidor, e a tela precisa concordar.
  if (proximas.length > 0) {
    return (
      <div className="space-y-4">
        {listaProximas}
        {blocoHistorico}
      </div>
    );
  }

  if (semJanelas) {
    return (
      <div className="bg-warning-container border border-warning-outline rounded-3xl p-5 text-xs text-on-warning-container flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          A agenda ainda não foi configurada. Fale com a Dra. Joane pelo WhatsApp
          para marcar sua consulta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocoHistorico}
      {erro && (
        <div className="bg-secondary-container border border-primary-container-high text-secondary p-3.5 rounded-2xl text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {vagas.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-3xl p-5 text-xs text-on-surface-variant">
          Não há horários livres nas próximas semanas. Fale com a Dra. Joane pelo
          WhatsApp.
        </div>
      ) : (
        <CalendarioPaciente
          vagas={vagas}
          duracaoMinutos={duracao}
          salvando={salvando}
          aoMarcar={marcar}
        />
      )}
    </div>
  );
}
