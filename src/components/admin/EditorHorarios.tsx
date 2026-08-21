"use client";

/**
 * Editor das janelas semanais de atendimento.
 *
 * Guarda em JSON no perfil. A geracao de vagas fatia cada janela em horarios
 * de hora em hora, entao uma janela de 08:00 as 11:00 com sessao de 50 minutos
 * oferece 08:00, 09:00 e 10:00.
 */

import React from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { NOMES_DIA, lerJanelas, type JanelaAtendimento } from "@/lib/agenda";

/**
 * Opcoes de horario em passos de 30 minutos, sempre em 24 horas.
 *
 * Trocamos <input type="time"> por selecao porque o input segue o idioma do
 * navegador: um Chrome em ingles mostra 8:00 AM, e nao ha atributo HTML que
 * force 24 horas. O valor enviado seria o mesmo, mas a Joane veria um formato
 * que nao e o que ela usa.
 */
const HORARIOS: string[] = (() => {
  const lista: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
      lista.push(`${String(h).padStart(2, "0")}:${m}`);
    }
  }
  return lista;
})();

interface Props {
  valorJson: string;
  aoMudar: (json: string) => void;
}

export function EditorHorarios({ valorJson, aoMudar }: Props) {
  const janelas = lerJanelas(valorJson);

  const atualizar = (novas: JanelaAtendimento[]) => {
    const ordenadas = [...novas].sort(
      (a, b) => a.dia - b.dia || a.inicio.localeCompare(b.inicio)
    );
    aoMudar(JSON.stringify(ordenadas));
  };

  const adicionar = () =>
    atualizar([...janelas, { dia: 1, inicio: "09:00", fim: "10:00" }]);

  const remover = (i: number) =>
    atualizar(janelas.filter((_, idx) => idx !== i));

  const editar = (i: number, campo: keyof JanelaAtendimento, valor: string | number) =>
    atualizar(janelas.map((j, idx) => (idx === i ? { ...j, [campo]: valor } : j)));

  const campo =
    "h-10 px-3 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none";

  return (
    <div className="space-y-3">
      {janelas.length === 0 && (
        <p className="text-xs text-[#9c8b8e]">
          Nenhum horário configurado. Sem isso, o paciente não consegue marcar
          consulta pelo site.
        </p>
      )}

      {janelas.map((j, i) => {
        // Janela invertida nao gera vaga nenhuma: avisa em vez de falhar calado.
        const invertida = j.fim <= j.inicio;
        return (
          <div key={i} className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={j.dia}
                onChange={(e) => editar(i, "dia", Number(e.target.value))}
                className={`${campo} min-w-[9rem]`}
                aria-label="Dia da semana"
              >
                {NOMES_DIA.map((nome, d) => (
                  <option key={d} value={d}>{nome}</option>
                ))}
              </select>

              <select
                value={j.inicio}
                onChange={(e) => editar(i, "inicio", e.target.value)}
                className={campo}
                aria-label="Hora de início"
              >
                {!HORARIOS.includes(j.inicio) && <option value={j.inicio}>{j.inicio}</option>}
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-xs text-[#9c8b8e]">até</span>
              <select
                value={j.fim}
                onChange={(e) => editar(i, "fim", e.target.value)}
                className={campo}
                aria-label="Hora de término"
              >
                {!HORARIOS.includes(j.fim) && <option value={j.fim}>{j.fim}</option>}
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => remover(i)}
                className="p-2 rounded-full text-[#aa2d47] hover:bg-[#fff0f3] transition"
                aria-label="Remover este horário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {invertida && (
              <p className="text-[11px] text-[#aa2d47] pl-2">
                O término precisa ser depois do início, senão esse dia não oferece
                nenhum horário.
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={adicionar}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] text-xs font-semibold hover:bg-[#fbf3ef] transition"
      >
        <Plus className="w-4 h-4" />
        <span>Adicionar horário</span>
      </button>

      <p className="text-[11px] text-[#9c8b8e] flex items-start gap-1.5 pt-1">
        <CalendarDays className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#ccb38d]" />
        <span>
          Horários em formato 24 horas. Cada faixa vira horários de hora em hora:
          das 08:00 às 11:00, com sessão de 50 minutos, o paciente vê 08:00,
          09:00 e 10:00.
        </span>
      </p>
    </div>
  );
}
