"use client";

/**
 * Calendario semanal da agenda.
 *
 * Grade de dias por horas. Celula dentro da janela de atendimento aparece
 * disponivel; fora dela fica apagada, mas continua clicavel: as janelas
 * limitam o que o paciente escolhe sozinho, nao o que a Joane pode fazer.
 *
 * Remanejar e em dois toques: seleciona a consulta, depois toca no horario
 * novo. Preferi isso a arrastar porque funciona igual no celular, onde
 * arrastar disputa com a rolagem da pagina.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, CalendarDays, X, Check,
  MessageSquareText, AlertTriangle, Trash2, CircleSlash, MoveRight,
} from "lucide-react";
import {
  faixaDeHoras, dentroDaJanela, chaveDia, chaveHora, montarInstante,
  formatarDataHora, type JanelaAtendimento, type DiaDaSemana,
} from "@/lib/agenda";
import { formatCPF } from "@/lib/formatters";
import { TelaCarregando, BotaoConteudo, BarraProgresso } from "@/components/ui/Carregando";
import { ProximosAgendamentos } from "./ProximosAgendamentos";

interface Agendamento {
  id: string;
  inicioEm: string;
  duracaoMinutos: number;
  status: string;
  observacao: string | null;
  patient: { id: string; fullName: string; phone: string; cpf: string };
}

interface Dados {
  semanaInicio: string;
  dias: DiaDaSemana[];
  janelas: JanelaAtendimento[];
  agendamentos: Agendamento[];
  proximas: Agendamento[];
}

const COR_STATUS: Record<string, string> = {
  agendado: "bg-[#5d0c1d] text-white",
  realizado: "bg-[#e7f4ec] text-[#245f3c] border border-[#c7e6d2]",
  cancelado: "bg-[#f0edea] text-[#9c8b8e] line-through",
  falta: "bg-[#fff0f3] text-[#aa2d47] border border-[#f3cbc1]",
};

const ROTULO_STATUS: Record<string, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  falta: "Falta",
};

function iniciais(nome: string) {
  const p = nome.trim().split(" ").filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function CalendarioSemanal() {
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [semana, setSemana] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [selecionado, setSelecionado] = useState<Agendamento | null>(null);
  const [movendo, setMovendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarVazias, setMostrarVazias] = useState(false);

  const carregar = useCallback(
    async (alvo?: string | null, silencioso = false) => {
      if (silencioso) setAtualizando(true);
      try {
        const url = alvo ? `/api/admin/agenda?semana=${alvo}` : "/api/admin/agenda";
        const res = await fetch(url);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          setErro("Nao foi possivel carregar a agenda.");
          return;
        }
        setDados(await res.json());
      } catch {
        setErro("Falha de conexao.");
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [router]
  );

  useEffect(() => { carregar(semana, Boolean(dados)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [semana]);

  const irParaSemana = (delta: number) => {
    if (!dados) return;
    const base = new Date(dados.semanaInicio);
    base.setUTCDate(base.getUTCDate() + delta * 7);
    setSemana(base.toISOString().slice(0, 10));
    setSelecionado(null);
    setMovendo(false);
  };

  const patch = async (id: string, corpo: Record<string, unknown>) => {
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(j.error || "Nao foi possivel atualizar.");
        return false;
      }
      if (j.foraDaJanela) {
        setAviso("Consulta marcada fora do seu horario de atendimento. Ela vale, mas o paciente nao conseguiria escolher esse horario sozinho.");
      }
      await carregar(semana, true);
      return true;
    } catch {
      setErro("Falha de conexao.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const moverPara = async (data: string, hora: string) => {
    if (!selecionado) return;
    const ok = await patch(selecionado.id, { inicioIso: montarInstante(data, hora) });
    if (ok) {
      setMovendo(false);
      setSelecionado(null);
    }
  };

  if (carregando) return <TelaCarregando mensagem="Carregando a agenda..." />;
  if (!dados) return <p className="p-8 text-sm text-[#6f5f62]">{erro || "Nada encontrado."}</p>;

  const duracao = selecionado?.duracaoMinutos ?? 50;

  // Horas fora das janelas que ja tem consulta precisam aparecer na grade,
  // senao um remanejamento feito pela Joane sumiria da tela.
  const horasExtras = dados.agendamentos.map((a) => chaveHora(a.inicioEm));
  const todasAsHoras = faixaDeHoras(dados.janelas, horasExtras);

  // Faixa em que nenhum dia atende e nao ha consulta so ocupa espaco. Some por
  // padrao, mas continua acessivel pelo interruptor: a Joane pode querer
  // encaixar alguem fora do expediente.
  const horaUtil = (h: string) =>
    dados.dias.some((d) => dentroDaJanela(d.diaSemana, h, dados.janelas, duracao)) ||
    horasExtras.includes(h);
  const horas = mostrarVazias ? todasAsHoras : todasAsHoras.filter(horaUtil);
  const escondidas = todasAsHoras.length - horas.length;

  const porCelula = new Map<string, Agendamento>();
  for (const a of dados.agendamentos) {
    porCelula.set(`${chaveDia(a.inicioEm)}|${chaveHora(a.inicioEm)}`, a);
  }

  const primeiroDia = dados.dias[0];
  const ultimoDia = dados.dias[6];

  const grade = (
    <div className="space-y-4">
      {/* NAVEGACAO DE SEMANA */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => irParaSemana(-1)}
            className="p-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] hover:bg-[#fbf3ef] transition"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setSemana(null); setSelecionado(null); setMovendo(false); }}
            className="px-4 py-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] text-xs font-semibold hover:bg-[#fbf3ef] transition"
          >
            Hoje
          </button>
          <button
            onClick={() => irParaSemana(1)}
            className="p-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] hover:bg-[#fbf3ef] transition"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="font-serif text-sm font-bold text-[#5d0c1d]">
          {primeiroDia.rotulo} a {ultimoDia.rotulo}
        </p>
      </div>

      <BarraProgresso ativa={atualizando} />

      {erro && (
        <div className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3.5 rounded-2xl text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}
      {aviso && (
        <div className="bg-[#fffbeb] border border-[#fde68a] text-[#78350f] p-3.5 rounded-2xl text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{aviso}</span>
        </div>
      )}

      {movendo && selecionado && (
        <div className="bg-[#5d0c1d] text-white p-3.5 rounded-2xl text-xs flex items-center gap-2 flex-wrap">
          <MoveRight className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Escolha o novo horário para <strong>{selecionado.patient.fullName}</strong>.
          </span>
          <button
            onClick={() => setMovendo(false)}
            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {horas.length === 0 ? (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-5 text-xs text-[#78350f]">
          Nenhum horário de atendimento configurado. Defina suas faixas em
          Configurações para o calendário aparecer.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[640px]">
            {/* CABECALHO DOS DIAS */}
            <div className="grid grid-cols-[58px_repeat(7,1fr)] gap-1 mb-1">
              <div />
              {dados.dias.map((d) => (
                <div
                  key={d.data}
                  className={`text-center py-1.5 rounded-xl ${
                    d.ehHoje ? "bg-[#f8dad2] text-[#5d0c1d]" : "text-[#6f5f62]"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide">
                    {d.nomeDia.slice(0, 3)}
                  </p>
                  <p className="text-[11px]">{d.rotulo}</p>
                </div>
              ))}
            </div>

            {/* LINHAS DE HORA */}
            {horas.map((hora) => (
              <div key={hora} className="grid grid-cols-[58px_repeat(7,1fr)] gap-1 mb-1">
                <div className="text-[11px] text-[#9c8b8e] text-right pr-1.5 pt-2">
                  {hora}
                </div>

                {dados.dias.map((d) => {
                  const chave = `${d.data}|${hora}`;
                  const ag = porCelula.get(chave);
                  const trabalha = dentroDaJanela(d.diaSemana, hora, dados.janelas, duracao);

                  if (ag) {
                    const ativo = selecionado?.id === ag.id;
                    return (
                      <button
                        key={chave}
                        onClick={() => { setSelecionado(ag); setMovendo(false); }}
                        title={`${ag.patient.fullName} - ${ROTULO_STATUS[ag.status] ?? ag.status}`}
                        className={`min-h-[52px] rounded-xl px-1.5 py-1.5 text-[11px] font-semibold text-left transition ${
                          COR_STATUS[ag.status] ?? COR_STATUS.agendado
                        } ${ativo ? "ring-2 ring-[#aa2d47] ring-offset-1" : "hover:opacity-90"}`}
                      >
                        <span className="block truncate">{iniciais(ag.patient.fullName)}</span>
                        <span className="block truncate font-normal opacity-90">
                          {ag.patient.fullName.split(" ")[0]}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={chave}
                      onClick={() => movendo && moverPara(d.data, hora)}
                      disabled={!movendo || salvando}
                      title={trabalha ? "Horário de atendimento livre" : "Fora do seu horário de atendimento"}
                      className={`min-h-[52px] rounded-xl transition ${
                        trabalha
                          ? "bg-[#fbf3ef] border border-[#f0ded8]"
                          : "bg-[#f7f5f4] border border-dashed border-[#eae2d7]"
                      } ${
                        movendo
                          ? "hover:bg-[#f8dad2] hover:border-[#5d0c1d] cursor-pointer"
                          : "cursor-default"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {escondidas > 0 && (
        <button
          onClick={() => setMostrarVazias((v) => !v)}
          className="text-[11px] font-semibold text-[#5d0c1d] hover:underline"
        >
          {mostrarVazias
            ? "Ocultar horários fora do expediente"
            : `Mostrar ${escondidas} horário${escondidas === 1 ? "" : "s"} fora do expediente`}
        </button>
      )}

      {/* LEGENDA */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6f5f62]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#5d0c1d]" /> Agendado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#e7f4ec] border border-[#c7e6d2]" /> Realizado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#fff0f3] border border-[#f3cbc1]" /> Falta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#fbf3ef] border border-[#f0ded8]" /> Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#f7f5f4] border border-dashed border-[#eae2d7]" /> Fora do expediente
        </span>
      </div>

      {/* DETALHE DA CONSULTA SELECIONADA */}
      {selecionado && (
        <DetalheConsulta
          agendamento={selecionado}
          salvando={salvando}
          aoFechar={() => { setSelecionado(null); setMovendo(false); }}
          aoMover={() => setMovendo(true)}
          aoMudarStatus={(status) => patch(selecionado.id, { status })}
          aoExcluir={async () => {
            if (!confirm("Excluir este agendamento? A ação não pode ser desfeita.")) return;
            await fetch(`/api/admin/agenda/${selecionado.id}`, { method: "DELETE" });
            setSelecionado(null);
            carregar(semana, true);
          }}
        />
      )}

    </div>
  );

  return (
    // Calendario e fila lado a lado no desktop, empilhados no celular.
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
      {grade}
      <ProximosAgendamentos
        itens={dados.proximas}
        selecionadoId={selecionado?.id}
        aoSelecionar={(id) => {
          const alvo = dados.proximas.find((a) => a.id === id);
          if (!alvo) return;
          setSelecionado(alvo);
          setMovendo(false);
          // Leva o calendario para a semana da consulta escolhida.
          setSemana(alvo.inicioEm.slice(0, 10));
        }}
      />
    </div>
  );
}

/** Painel com os dados e as acoes da consulta selecionada. */
function DetalheConsulta({
  agendamento, salvando, aoFechar, aoMover, aoMudarStatus, aoExcluir,
}: {
  agendamento: Agendamento;
  salvando: boolean;
  aoFechar: () => void;
  aoMover: () => void;
  aoMudarStatus: (status: string) => void;
  aoExcluir: () => void;
}) {
  const a = agendamento;
  return (
    <div className="bg-white border border-[#f0ded8] rounded-3xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif font-bold text-sm text-[#241a1c]">{a.patient.fullName}</p>
          <p className="text-xs text-[#6f5f62] mt-0.5 capitalize">{formatarDataHora(a.inicioEm)}</p>
          <p className="text-[11px] text-[#9c8b8e] mt-0.5">
            {a.duracaoMinutos} minutos - CPF {formatCPF(a.patient.cpf)} - {ROTULO_STATUS[a.status] ?? a.status}
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={aoMover}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] disabled:opacity-70 text-white text-xs font-semibold transition"
        >
          <BotaoConteudo carregando={salvando} rotuloCarregando="Aguarde...">
            <MoveRight className="w-4 h-4" />
            <span>Remanejar</span>
          </BotaoConteudo>
        </button>

        {a.status !== "realizado" && (
          <button
            onClick={() => aoMudarStatus("realizado")}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#c7e6d2] bg-[#e7f4ec] text-[#245f3c] text-xs font-semibold hover:bg-[#d5ecdf] transition"
          >
            <Check className="w-4 h-4" />
            <span>Realizada</span>
          </button>
        )}

        {a.status !== "falta" && (
          <button
            onClick={() => aoMudarStatus("falta")}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#f3cbc1] bg-[#fff0f3] text-[#aa2d47] text-xs font-semibold hover:bg-[#ffe4ea] transition"
          >
            <CircleSlash className="w-4 h-4" />
            <span>Faltou</span>
          </button>
        )}

        {a.status !== "cancelado" && (
          <button
            onClick={() => aoMudarStatus("cancelado")}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#eae2d7] text-[#6f5f62] text-xs font-semibold hover:bg-[#fbf3ef] transition"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        )}

        {a.patient.phone && (
          <a
            href={`https://wa.me/55${a.patient.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e7f4ec] text-[#245f3c] text-xs font-semibold hover:bg-[#d5ecdf] transition"
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Avisar no WhatsApp</span>
          </a>
        )}

        <button
          onClick={aoExcluir}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[#aa2d47] text-xs font-semibold hover:bg-[#fff0f3] transition ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>

      <p className="text-[11px] text-[#9c8b8e]">
        Ao remanejar, avise o paciente: o sistema não envia aviso automático.
      </p>
    </div>
  );
}
