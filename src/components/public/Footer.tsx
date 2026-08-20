import Link from "next/link";
import { Heart, Lock, Phone, ShieldCheck } from "lucide-react";

export const PublicFooter = () => {
  return (
    <footer className="bg-[#fbf3ef] border-t border-[#f0ded8] py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5d0c1d] block mb-1">
              Atendimento Psicológico & Psicanalítico
            </span>
            <h3 className="font-serif text-xl font-bold text-[#5d0c1d] mb-2">
              Dra. Joane Souza Oliveira de Andrade
            </h3>
            <p className="text-[#6f5f62] leading-relaxed text-xs sm:text-sm">
              Espaço ético, confidencial e acolhedor dedicado à escuta clínica, elaboração de conflitos subjetivos e desenvolvimento pessoal.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-base font-bold text-[#5d0c1d] mb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#5d0c1d]" /> Sigilo & Ética Profissional
            </h4>
            <p className="text-[#6f5f62] text-xs sm:text-sm leading-relaxed">
              Todas as informações preenchidas na anamnese são estritamente sigilosas e resguardadas pelo Código de Ética Profissional e pela LGPD.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-base font-bold text-[#5d0c1d] mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#5d0c1d]" /> Atendimentos
            </h4>
            <p className="text-[#6f5f62] text-xs sm:text-sm leading-relaxed">
              Sessões online para todo o Brasil e exterior, e atendimento presencial.
            </p>
            <div className="mt-3">
              <Link
                href="/preencher-anamnese"
                className="text-xs font-bold text-[#5d0c1d] hover:text-[#aa2d47] transition underline underline-offset-4"
              >
                Preencher ficha de anamnese online &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#ebd6ce] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#9c8b8e] gap-4">
          <p>© {new Date().getFullYear()} Dra. Joane Souza Oliveira de Andrade • Psicologia & Psicanálise. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com carinho</span>
            <Heart className="w-3.5 h-3.5 text-[#5d0c1d] fill-current inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
