"use client";

/**
 * Acordeao de perguntas frequentes da landing page.
 *
 * So um item aberto por vez: manter varios abertos ao mesmo tempo faz a
 * pagina crescer descontroladamente e a pessoa perde a pergunta que estava
 * lendo. Comeca tudo fechado, sem nenhuma resposta assumida como a mais
 * importante.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Pergunta {
  pergunta: string;
  resposta: string;
}

export function AcordeaoFAQ({ itens }: { itens: Pergunta[] }) {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {itens.map((item, i) => {
        const ativo = aberto === i;
        return (
          <div
            key={item.pergunta}
            className={`bg-white rounded-2xl border transition ${
              ativo ? "border-[#ccb38d] shadow-sm" : "border-[#f0ded8]"
            }`}
          >
            <button
              onClick={() => setAberto(ativo ? null : i)}
              aria-expanded={ativo}
              className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 sm:py-5"
            >
              <span className="font-serif font-bold text-sm sm:text-base text-[#5d0c1d]">
                {item.pergunta}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-[#aa2d47] transition-transform duration-200 ${
                  ativo ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                ativo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-4 sm:pb-5 text-xs sm:text-sm text-[#6f5f62] leading-relaxed">
                  {item.resposta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
