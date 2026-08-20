/**
 * Componentes de carregamento da plataforma.
 *
 * Objetivo: nenhuma acao demorada pode parecer travada. Toda espera mostra
 * sinal visual, e toda espera longa mostra o que esta acontecendo.
 *
 * Acessibilidade:
 * - role="status" e aria-live para leitor de tela anunciar a espera
 * - respeita prefers-reduced-motion (definido em globals.css): quem tem
 *   sensibilidade a movimento ve o elemento parado, nao girando
 */

import React from "react";

type Tamanho = "sm" | "md" | "lg";

const MEDIDAS: Record<Tamanho, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-4",
};

/** Anel giratorio. Use dentro de botao ou ao lado de um texto curto. */
export function Spinner({
  tamanho = "md",
  className = "",
  claro = false,
}: {
  tamanho?: Tamanho;
  className?: string;
  /** Use em fundo escuro, como dentro de botao bordo. */
  claro?: boolean;
}) {
  const cor = claro
    ? "border-white/30 border-t-white"
    : "border-[#f0ded8] border-t-[#5d0c1d]";
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block rounded-full animate-spin ${MEDIDAS[tamanho]} ${cor} ${className}`}
    />
  );
}

/** Tela inteira de carregamento, para quando a pagina ainda nao tem conteudo. */
export function TelaCarregando({ mensagem = "Carregando..." }: { mensagem?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-6 text-center"
    >
      <Spinner tamanho="lg" />
      <p className="text-sm text-[#6f5f62]">{mensagem}</p>
    </div>
  );
}

/** Bloco cinza pulsante, para reservar o espaco do conteudo que vai chegar. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-[#f0ded8]/60 rounded-xl animate-pulse ${className}`}
    />
  );
}

/**
 * Esqueleto de lista de pacientes (sidebar estilo WhatsApp).
 * Mostra a forma do conteudo antes dele chegar, o que reduz a sensacao de
 * espera mais do que um spinner solto.
 */
export function EsqueletoListaPacientes({ itens = 6 }: { itens?: number }) {
  return (
    <div role="status" aria-label="Carregando lista de pacientes" className="p-2 space-y-1">
      {Array.from({ length: itens }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
          <Esqueleto className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-3 w-2/3" />
            <Esqueleto className="h-2.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Esqueleto de cartoes, para grades de contratos e modelos de anamnese. */
export function EsqueletoCartoes({
  itens = 3,
  altura = "h-28",
}: {
  itens?: number;
  altura?: string;
}) {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {Array.from({ length: itens }).map((_, i) => (
        <Esqueleto key={i} className={`w-full ${altura} rounded-3xl`} />
      ))}
    </div>
  );
}

/** Esqueleto do painel de detalhe do paciente. */
export function EsqueletoDetalhe() {
  return (
    <div role="status" aria-label="Carregando ficha" className="p-6 space-y-5">
      <div className="flex items-center gap-4">
        <Esqueleto className="w-14 h-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Esqueleto className="h-4 w-52" />
          <Esqueleto className="h-3 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Esqueleto key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Esqueleto key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Conteudo de botao em acao.
 * Troca o rotulo pelo spinner mais um texto de progresso, para o usuario nao
 * clicar de novo achando que nao funcionou.
 */
export function BotaoConteudo({
  carregando,
  rotuloCarregando,
  children,
  claro = true,
}: {
  carregando: boolean;
  rotuloCarregando: string;
  children: React.ReactNode;
  claro?: boolean;
}) {
  if (!carregando) return <>{children}</>;
  return (
    <>
      <Spinner tamanho="sm" claro={claro} />
      <span>{rotuloCarregando}</span>
    </>
  );
}

/** Faixa fina de progresso indeterminado, para recarregar sem piscar a tela. */
export function BarraProgresso({ ativa }: { ativa: boolean }) {
  if (!ativa) return null;
  return (
    <div
      role="status"
      aria-label="Atualizando"
      className="h-0.5 w-full bg-[#f8dad2] overflow-hidden shrink-0"
    >
      <div className="h-full w-1/3 bg-[#5d0c1d] animate-barra-indeterminada" />
    </div>
  );
}
