"use client";

/**
 * Calendario de escolha de horario pelo paciente.
 *
 * Mesma grade semanal do painel da Joane, para quem usa os dois lados ver a
 * agenda do mesmo jeito. A diferenca e o que cada um enxerga: ela ve as
 * consultas marcadas, ele ve apenas as vagas livres, sem nome nem sinal de
 * quem ocupa os outros horarios.
 *
 * A navegacao entre semanas e limitada as semanas que tem vaga, e a grade
 * mostra apenas os dias que tem horario livre. O paciente nao pode marcar em
 * dia sem vaga, entao coluna vazia so ocupa espaco: no celular, as sete
 * colunas empurravam as vagas de sexta para fora da tela e quem nao
 * descobrisse a rolagem lateral concluiria que so havia um horario na semana.
 * A Joane continua vendo a semana inteira no painel dela, porque ela precisa
 * enxergar tambem onde nao ha atendimento.
 *
 * Escolher nao marca: abre uma confirmacao. Marcar consulta e compromisso, e
 * um toque errado na grade nao pode virar agendamento.
 */

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Check, X } from "lucide-react";
import { NOMES_DIA, formatarDataHora } from "@/lib/agenda";
import { Spinner } from "@/components/ui/Carregando";

export interface Vaga {
  inicioIso: string;
  /** "2026-08-27" */
  data: string;
  /** "09:00" */
  hora: string;
  diaSemana: number;
  nomeDia: string;
}

/** Segunda-feira da semana de uma data "YYYY-MM-DD", em texto. */
function segundaDa(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  const dow = dt.getUTCDay();
  // getUTCDay: 0 e domingo. Recuar ate a segunda.
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return dt.toISOString().slice(0, 10);
}

function diasDaSemanaDe(segunda: string): { data: string; rotulo: string; nomeDia: string; diaSemana: number }[] {
  const [a, m, d] = segunda.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.UTC(a, m - 1, d + i));
    const data = dt.toISOString().slice(0, 10);
    const dow = dt.getUTCDay();
    return {
      data,
      diaSemana: dow,
      nomeDia: NOMES_DIA[dow],
      rotulo: `${String(dt.getUTCDate()).padStart(2, "0")}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  });
}

export function CalendarioPaciente({
  vagas,
  duracaoMinutos,
  salvando,
  aoMarcar,
}: {
  vagas: Vaga[];
  duracaoMinutos: number;
  salvando: string;
  aoMarcar: (inicioIso: string) => void;
}) {
  const [escolhida, setEscolhida] = useState<Vaga | null>(null);

  // Semanas que tem pelo menos uma vaga. A navegacao nunca sai delas.
  const semanas = useMemo(() => {
    const s = new Set(vagas.map((v) => segundaDa(v.data)));
    return [...s].sort();
  }, [vagas]);

  const [indice, setIndice] = useState(0);
  const semanaAtual = semanas[Math.min(indice, semanas.length - 1)];

  const porCelula = useMemo(() => {
    const m = new Map<string, Vaga>();
    for (const v of vagas) m.set(`${v.data}|${v.hora}`, v);
    return m;
  }, [vagas]);

  // Linhas de hora: so as horas que existem em alguma vaga da semana. Assim a
  // grade nao mostra faixa vazia so porque a Joane atende as 16h na sexta.
  const todosOsDias = useMemo(
    () => (semanaAtual ? diasDaSemanaDe(semanaAtual) : []),
    [semanaAtual]
  );
  const horas = useMemo(() => {
    const doDia = new Set(todosOsDias.map((d) => d.data));
    const s = new Set(vagas.filter((v) => doDia.has(v.data)).map((v) => v.hora));
    return [...s].sort();
  }, [vagas, todosOsDias]);

  // So os dias com vaga viram coluna.
  const comVaga = useMemo(() => new Set(vagas.map((v) => v.data)), [vagas]);
  const dias = useMemo(
    () => todosOsDias.filter((d) => comVaga.has(d.data)),
    [todosOsDias, comVaga]
  );

  if (semanas.length === 0) return null;

  const podeVoltar = indice > 0;
  const podeAvancar = indice < semanas.length - 1;
  const primeiro = todosOsDias[0];
  const ultimo = todosOsDias[6];
  // Teto na largura da coluna: com dois dias na semana, 1fr esticava o botao
  // de um horario por meia tela, e um alvo daquele tamanho para escolher
  // "09:00" parece outra coisa.
  const grade = { gridTemplateColumns: `46px repeat(${dias.length}, minmax(60px, 132px))` };
  const larguraMinima = dias.length > 4 ? { minWidth: 46 + dias.length * 78 } : undefined;

  return (
    <div className="space-y-3">
      {/* NAVEGACAO */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={!podeVoltar}
            className="p-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] hover:bg-[#fbf3ef] disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIndice((i) => Math.min(semanas.length - 1, i + 1))}
            disabled={!podeAvancar}
            className="p-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] hover:bg-[#fbf3ef] disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {semanas.length > 1 && (
            <span className="text-[11px] text-[#9c8b8e]">
              Semana {indice + 1} de {semanas.length}
            </span>
          )}
        </div>
        <p className="font-serif text-sm font-bold text-[#5d0c1d] flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          {primeiro.rotulo} a {ultimo.rotulo}
        </p>
      </div>

      {/* GRADE */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={larguraMinima}>
          <div className="grid gap-1 mb-1" style={grade}>
            <div />
            {dias.map((d) => {
              return (
                <div key={d.data} className="text-center py-1.5 rounded-xl text-[#5d0c1d]">
                  <p className="text-[10px] font-bold uppercase tracking-wide">
                    {d.nomeDia.slice(0, 3)}
                  </p>
                  <p className="text-[11px]">{d.rotulo}</p>
                </div>
              );
            })}
          </div>

          {horas.map((hora) => (
            <div key={hora} className="grid gap-1 mb-1" style={grade}>
              <div className="text-[11px] text-[#9c8b8e] text-right pr-1.5 pt-2.5">
                {hora}
              </div>
              {dias.map((d) => {
                const vaga = porCelula.get(`${d.data}|${hora}`);
                if (!vaga) {
                  return (
                    <div
                      key={`${d.data}|${hora}`}
                      className="min-h-[46px] rounded-xl bg-[#faf7f5] border border-dashed border-[#f0e8e4]"
                      aria-hidden="true"
                    />
                  );
                }
                const ativa = escolhida?.inicioIso === vaga.inicioIso;
                return (
                  <button
                    key={`${d.data}|${hora}`}
                    onClick={() => setEscolhida(vaga)}
                    disabled={Boolean(salvando)}
                    title={`${d.nomeDia}, ${d.rotulo} às ${hora}`}
                    className={`min-h-[46px] rounded-xl text-[11px] font-bold transition disabled:opacity-60 ${
                      ativa
                        ? "bg-[#5d0c1d] text-white ring-2 ring-[#aa2d47] ring-offset-1"
                        : "bg-[#e7f4ec] text-[#245f3c] border border-[#c7e6d2] hover:bg-[#5d0c1d] hover:text-white hover:border-[#5d0c1d]"
                    }`}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6f5f62]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#e7f4ec] border border-[#c7e6d2]" /> Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#faf7f5] border border-dashed border-[#f0e8e4]" /> Indisponível
        </span>
        <span>Sessão de {duracaoMinutos} minutos. Horários de Brasília.</span>
      </div>

      {/* CONFIRMACAO
          Escolher na grade nao marca nada. Um toque errado numa grade densa
          nao pode virar consulta agendada. */}
      {escolhida && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setEscolhida(null)}
            aria-label="Fechar"
          />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl border border-[#f0ded8] shadow-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#5d0c1d]">
                  Confirmar consulta
                </h3>
                <p className="text-sm text-[#241a1c] mt-2 first-letter:uppercase font-semibold">
                  {formatarDataHora(escolhida.inicioIso)}
                </p>
                <p className="text-xs text-[#6f5f62] mt-1">
                  Duração de {duracaoMinutos} minutos. Horário de Brasília.
                </p>
              </div>
              <button
                onClick={() => setEscolhida(null)}
                className="p-1.5 rounded-full text-[#6f5f62] hover:bg-[#fbf3ef] shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6f5f62] leading-relaxed bg-[#fbf3ef] rounded-2xl p-3">
              Você receberá um e-mail confirmando. Se precisar mudar depois, dá
              para pedir remarcação pela sua área.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { aoMarcar(escolhida.inicioIso); setEscolhida(null); }}
                disabled={Boolean(salvando)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#5d0c1d] text-white text-sm font-bold hover:bg-[#7d1128] disabled:opacity-60 transition"
              >
                {salvando ? <Spinner tamanho="sm" /> : <Check className="w-4 h-4" />}
                <span>Confirmar</span>
              </button>
              <button
                onClick={() => setEscolhida(null)}
                disabled={Boolean(salvando)}
                className="px-5 py-3 rounded-full border border-[#eae2d7] text-[#6f5f62] text-sm font-semibold hover:bg-[#fbf3ef] transition"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
