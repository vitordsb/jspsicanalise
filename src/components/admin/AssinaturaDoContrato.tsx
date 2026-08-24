"use client";

/**
 * Painel da assinatura eletronica, no lado da Joane.
 *
 * Mostra quem assinou, quando e de onde, e deixa conferir a integridade com
 * um toque. A conferencia e o que importa: assinatura que ninguem consegue
 * verificar nao ajuda em discussao nenhuma.
 *
 * Os dados de pericia (IP e navegador) ficam recolhidos por padrao. Servem
 * quando alguem contesta, nao no dia a dia.
 */

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, ChevronDown, Copy, Loader2 } from "lucide-react";
import { formatarDataHora } from "@/lib/agenda";
import { formatCPF } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface Verificacao {
  integro: boolean;
  textoIntacto: boolean;
  camposIntactos: boolean;
  ip?: string | null;
  navegador?: string | null;
  hash?: string | null;
}

export function AssinaturaDoContrato({
  contratoId,
  assinadoEm,
  assinadoPor,
  cpfDoAssinante,
  codigoVerificacao,
  emitidoEm,
  emitidoPor,
}: {
  contratoId: string;
  assinadoEm: string;
  assinadoPor?: string | null;
  cpfDoAssinante?: string | null;
  codigoVerificacao?: string | null;
  emitidoEm?: string | null;
  emitidoPor?: string | null;
}) {
  const toast = useToast();
  const [v, setV] = useState<Verificacao | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [aberto, setAberto] = useState(false);

  const conferir = async () => {
    setConferindo(true);
    try {
      const res = await fetch(`/api/admin/contracts/${contratoId}/verificar`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.erro(d.error || "Não foi possível conferir a assinatura.");
        return;
      }
      setV(d);
      setAberto(true);
      if (d.integro) toast.sucesso("Documento íntegro. Nada mudou desde a assinatura.");
      else toast.erro("O documento não confere com o que foi assinado.");
    } catch {
      toast.erro("Falha de conexão.");
    } finally {
      setConferindo(false);
    }
  };

  const alterado = v && !v.integro;

  return (
    <section
      className={`rounded-3xl border p-5 space-y-3 ${
        alterado ? "bg-[#fff0f3] border-[#f3cbc1]" : "bg-[#e7f4ec] border-[#c7e6d2]"
      }`}
    >
      <div className="flex items-start gap-3">
        {alterado ? (
          <ShieldAlert className="w-5 h-5 text-[#aa2d47] shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-[#245f3c] shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-serif text-sm font-bold ${alterado ? "text-[#aa2d47]" : "text-[#245f3c]"}`}>
            {alterado ? "Documento alterado após a assinatura" : "Assinado eletronicamente"}
          </h3>
          <p className={`text-xs mt-1 ${alterado ? "text-[#aa2d47]" : "text-[#245f3c]"}`}>
            <strong>{assinadoPor || "Paciente"}</strong>
            {cpfDoAssinante ? `, CPF ${formatCPF(cpfDoAssinante)}` : ""}
          </p>
          <p className="text-[11px] text-[#245f3c]/80 mt-0.5 first-letter:uppercase">
            {formatarDataHora(assinadoEm)}
          </p>
          {emitidoEm && (
            <p className="text-[11px] text-[#245f3c]/70 mt-1.5 first-letter:uppercase">
              Emitido por {emitidoPor || "você"} em {formatarDataHora(emitidoEm)}
            </p>
          )}
        </div>
      </div>

      {codigoVerificacao && (
        <div className="bg-white/70 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#9c8b8e] font-bold">
              Código de verificação
            </p>
            <p className="font-mono text-base font-bold text-[#5d0c1d] tracking-wider truncate">
              {codigoVerificacao}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(codigoVerificacao);
              toast.sucesso("Código copiado.");
            }}
            className="p-2 rounded-full text-[#5d0c1d] hover:bg-[#fbf3ef] shrink-0"
            aria-label="Copiar código"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={conferir}
          disabled={conferindo}
          className="px-4 py-2 rounded-full bg-[#245f3c] text-white text-xs font-semibold hover:bg-[#1c4b30] disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {conferindo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {conferindo ? "Conferindo..." : "Conferir autenticidade"}
        </button>

        {v && (
          <button
            onClick={() => setAberto((a) => !a)}
            className="text-xs font-semibold text-[#245f3c] hover:underline inline-flex items-center gap-1"
          >
            {aberto ? "Ocultar detalhes" : "Ver detalhes"}
            <ChevronDown className={`w-3.5 h-3.5 transition ${aberto ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {v && aberto && (
        <div className="bg-white/70 rounded-2xl p-4 space-y-2 text-[11px] text-[#4a3f41]">
          <Linha rotulo="Texto assinado confere com o registro" ok={v.textoIntacto} />
          <Linha rotulo="Campos do contrato continuam iguais" ok={v.camposIntactos} />
          {v.ip && <p><strong>IP:</strong> {v.ip}</p>}
          {v.navegador && (
            <p className="break-all"><strong>Navegador:</strong> {v.navegador}</p>
          )}
          {v.hash && (
            <p className="break-all font-mono text-[10px] text-[#9c8b8e]">
              <strong className="font-sans text-[11px] text-[#4a3f41]">SHA-256:</strong> {v.hash}
            </p>
          )}
          {alterado && (
            <p className="text-[#aa2d47] font-semibold pt-1">
              O conteúdo mudou depois da assinatura. Não use este documento como prova
              do que foi acordado: emita um novo contrato.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Linha({ rotulo, ok }: { rotulo: string; ok: boolean }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className={ok ? "text-[#245f3c]" : "text-[#aa2d47]"}>{ok ? "✓" : "✕"}</span>
      <span>{rotulo}</span>
    </p>
  );
}
