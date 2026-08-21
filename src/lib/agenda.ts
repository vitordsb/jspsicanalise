/**
 * Regras da agenda.
 *
 * Fuso: a clinica atende em horario de Brasilia. O banco guarda UTC, e toda
 * conversao passa por aqui para nao espalhar calculo de fuso pelo codigo.
 * Sao Paulo nao tem mais horario de verao desde 2019, entao o deslocamento e
 * fixo em -3, mas a formatacao para leitura usa Intl com timeZone explicito
 * para nao depender do fuso do servidor (na Vercel, UTC).
 */

export const FUSO = "America/Sao_Paulo";
const OFFSET_HORAS = 3; // Brasilia esta 3 horas atras de UTC

export interface JanelaAtendimento {
  /** 0=domingo, 1=segunda ... 6=sabado */
  dia: number;
  /** "08:00" */
  inicio: string;
  /** "11:00" */
  fim: string;
}

export const NOMES_DIA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

/** Le as janelas guardadas no perfil, tolerando JSON invalido. */
export function lerJanelas(json: string | null | undefined): JanelaAtendimento[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v.filter(
      (j) =>
        typeof j?.dia === "number" && j.dia >= 0 && j.dia <= 6 &&
        /^\d{2}:\d{2}$/.test(j?.inicio) && /^\d{2}:\d{2}$/.test(j?.fim)
    );
  } catch {
    return [];
  }
}

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Constroi um Date em UTC a partir de uma data e hora locais de Brasilia. */
function dataLocalParaUtc(ano: number, mes: number, dia: number, minutos: number): Date {
  return new Date(Date.UTC(ano, mes, dia, Math.floor(minutos / 60) + OFFSET_HORAS, minutos % 60, 0, 0));
}

/** Componentes de data no fuso de Brasilia para um instante UTC. */
function partesEmBrasilia(d: Date) {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    ano: Number(p.year), mes: Number(p.month), dia: Number(p.day),
    hora: Number(p.hour), minuto: Number(p.minute),
  };
}

export interface Vaga {
  /** Instante de inicio em UTC, no formato ISO. */
  inicioIso: string;
  /** "2026-08-25" no fuso de Brasilia, para agrupar por dia. */
  data: string;
  /** "08:00" */
  hora: string;
  diaSemana: number;
  nomeDia: string;
}

/**
 * Gera as vagas livres a partir das janelas semanais.
 *
 * Uma vaga comeca a cada hora cheia dentro da janela e so entra na lista se a
 * sessao inteira couber antes do fim dela. Janela de 09:00 as 10:00 com sessao
 * de 50 minutos rende uma vaga; de 08:00 as 11:00 rende tres.
 */
export function gerarVagas(opcoes: {
  janelas: JanelaAtendimento[];
  duracaoMinutos: number;
  /** Dias a frente a considerar. */
  diasAFrente: number;
  /** Antecedencia minima entre agora e a consulta. */
  antecedenciaHoras: number;
  /** Inicios ja ocupados, em ISO. */
  ocupados: string[];
  /** Momento de referencia. Parametro para o calculo ser testavel. */
  agora: Date;
}): Vaga[] {
  const { janelas, duracaoMinutos, diasAFrente, antecedenciaHoras, ocupados, agora } = opcoes;
  if (janelas.length === 0) return [];

  const ocupadosSet = new Set(ocupados);
  const limiteInferior = new Date(agora.getTime() + antecedenciaHoras * 3600_000);
  const vagas: Vaga[] = [];

  const hoje = partesEmBrasilia(agora);

  for (let offset = 0; offset <= diasAFrente; offset++) {
    // Meio-dia evita que a soma de dias tropece em bordas de fuso.
    const base = new Date(Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia + offset, 12));
    const p = partesEmBrasilia(base);
    const diaSemana = new Date(Date.UTC(p.ano, p.mes - 1, p.dia)).getUTCDay();

    for (const janela of janelas.filter((j) => j.dia === diaSemana)) {
      const ini = paraMinutos(janela.inicio);
      const fim = paraMinutos(janela.fim);

      for (let m = ini; m + duracaoMinutos <= fim; m += 60) {
        const inicio = dataLocalParaUtc(p.ano, p.mes - 1, p.dia, m);
        if (inicio < limiteInferior) continue;

        const iso = inicio.toISOString();
        if (ocupadosSet.has(iso)) continue;

        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        vagas.push({
          inicioIso: iso,
          data: `${p.ano}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`,
          hora: `${hh}:${mm}`,
          diaSemana,
          nomeDia: NOMES_DIA[diaSemana],
        });
      }
    }
  }

  return vagas.sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
}

/** Formata um instante para leitura em portugues, no fuso da clinica. */
export function formatarDataHora(d: Date | string): string {
  const data = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, weekday: "long", day: "2-digit", month: "long",
    hour: "2-digit", minute: "2-digit",
  }).format(data);
}

/** Formata apenas a data, sem a hora. */
export function formatarDataCurta(d: Date | string): string {
  const data = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric",
  }).format(data);
}

/** Formata apenas a hora. */
export function formatarHora(d: Date | string): string {
  const data = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, hour: "2-digit", minute: "2-digit",
  }).format(data);
}

/** Confere se um instante corresponde mesmo a uma vaga valida das janelas. */
export function vagaEhValida(
  inicioIso: string,
  janelas: JanelaAtendimento[],
  duracaoMinutos: number
): boolean {
  const d = new Date(inicioIso);
  if (isNaN(d.getTime())) return false;

  const p = partesEmBrasilia(d);
  const diaSemana = new Date(Date.UTC(p.ano, p.mes - 1, p.dia)).getUTCDay();
  const minutos = p.hora * 60 + p.minuto;

  return janelas.some((j) => {
    if (j.dia !== diaSemana) return false;
    const ini = paraMinutos(j.inicio);
    const fim = paraMinutos(j.fim);
    if (minutos < ini || minutos + duracaoMinutos > fim) return false;
    // So aceita inicios em hora cheia a partir do comeco da janela.
    return (minutos - ini) % 60 === 0;
  });
}
