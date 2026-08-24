"use client";

/**
 * Avisos temporarios de acao.
 *
 * Antes cada tela resolvia do seu jeito: alert() do navegador, mensagem
 * inline que ficava presa na pagina, ou silencio quando dava errado. O pior
 * caso era o silencio: dezessete blocos de catch so escreviam no console, e
 * quem estava usando nao sabia que a acao falhou.
 *
 * Erro nao some sozinho de proposito: sucesso a pessoa ve de relance, mas
 * falha precisa ser lida e fechada por quem esta ali.
 *
 * Acessibilidade: a regiao e aria-live, entao leitor de tela anuncia sem
 * roubar o foco de quem esta digitando.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

type Tipo = "sucesso" | "erro" | "aviso";

interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
  /** Milissegundos ate sumir. Zero significa que fica ate fechar na mao. */
  duracao: number;
}

interface API {
  sucesso: (texto: string, duracao?: number) => void;
  erro: (texto: string, duracao?: number) => void;
  aviso: (texto: string, duracao?: number) => void;
}

const Ctx = createContext<API | null>(null);

/**
 * Acesso aos avisos.
 * Fora do provider vira operacao vazia em vez de quebrar: um componente
 * reaproveitado numa tela sem provider nao pode derrubar a pagina.
 */
export function useToast(): API {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  const vazio = () => {};
  return { sucesso: vazio, erro: vazio, aviso: vazio };
}

const ESTILO: Record<Tipo, { caixa: string; icone: React.ElementType; cor: string }> = {
  sucesso: {
    caixa: "bg-[#e7f4ec] border-[#c7e6d2] text-[#245f3c]",
    icone: CheckCircle2,
    cor: "text-[#245f3c]",
  },
  erro: {
    caixa: "bg-[#fff0f3] border-[#f3cbc1] text-[#aa2d47]",
    icone: XCircle,
    cor: "text-[#aa2d47]",
  },
  aviso: {
    caixa: "bg-[#fffbeb] border-[#fde68a] text-[#78350f]",
    icone: AlertTriangle,
    cor: "text-[#92400e]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const remover = useCallback((id: number) => {
    setAvisos((atual) => atual.filter((a) => a.id !== id));
  }, []);

  const adicionar = useCallback((tipo: Tipo, texto: string, duracao?: number) => {
    // Date.now sozinho colide quando duas acoes terminam no mesmo milissegundo.
    const id = Date.now() + Math.random();
    const padrao = tipo === "erro" ? 0 : tipo === "aviso" ? 7000 : 4000;
    setAvisos((atual) => {
      // Teto de tres: empilhar mais que isso vira parede na tela.
      const proximos = [...atual, { id, tipo, texto, duracao: duracao ?? padrao }];
      return proximos.slice(-3);
    });
  }, []);

  const api: API = {
    sucesso: useCallback((t, d) => adicionar("sucesso", t, d), [adicionar]),
    erro: useCallback((t, d) => adicionar("erro", t, d), [adicionar]),
    aviso: useCallback((t, d) => adicionar("aviso", t, d), [adicionar]),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[100] bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[22rem] flex flex-col gap-2 pointer-events-none no-print"
      >
        {avisos.map((a) => (
          <ItemToast key={a.id} aviso={a} aoFechar={() => remover(a.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ItemToast({ aviso, aoFechar }: { aviso: Aviso; aoFechar: () => void }) {
  const [saindo, setSaindo] = useState(false);
  const { caixa, icone: Icone, cor } = ESTILO[aviso.tipo];

  useEffect(() => {
    if (aviso.duracao <= 0) return;
    const t = setTimeout(() => {
      setSaindo(true);
      // Espera a animacao antes de tirar do DOM.
      setTimeout(aoFechar, 180);
    }, aviso.duracao);
    return () => clearTimeout(t);
  }, [aviso.duracao, aoFechar]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-lg text-xs ${caixa} ${
        saindo ? "animate-toast-saida" : "animate-toast-entrada"
      }`}
    >
      <Icone className={`w-4 h-4 shrink-0 mt-0.5 ${cor}`} aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{aviso.texto}</p>
      <button
        onClick={() => {
          setSaindo(true);
          setTimeout(aoFechar, 180);
        }}
        className={`shrink-0 p-0.5 rounded-full hover:bg-black/5 transition ${cor}`}
        aria-label="Fechar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
