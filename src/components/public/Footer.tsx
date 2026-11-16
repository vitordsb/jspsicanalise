import Link from "next/link";
import { Heart, Lock, Phone, ShieldCheck } from "lucide-react";

export const PublicFooter = () => {
  return (
    <footer className="bg-surface-low border-t border-outline-variant py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-primary block mb-1">
              Atendimento Psicológico & Psicanalítico
            </span>
            <h3 className="font-serif text-xl font-bold text-primary mb-2">
              Dra. Joane Souza Oliveira de Andrade
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-xs sm:text-sm">
              Espaço ético, confidencial e acolhedor dedicado à escuta clínica, elaboração de conflitos subjetivos e desenvolvimento pessoal.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-base font-bold text-primary mb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" /> Sigilo & Ética Profissional
            </h4>
            <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
              Todas as informações preenchidas na anamnese são estritamente sigilosas e resguardadas pelo Código de Ética Profissional e pela LGPD.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-base font-bold text-primary mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-primary" /> Atendimentos
            </h4>
            <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
              Sessões online para todo o Brasil e exterior, e atendimento presencial.
            </p>
            <div className="mt-3">
              <Link
                href="/preencher-anamnese"
                className="text-xs font-bold text-primary hover:text-secondary transition underline underline-offset-4"
              >
                Preencher ficha de anamnese online &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-subtle gap-4">
          <p>© {new Date().getFullYear()} Dra. Joane Souza Oliveira de Andrade • Psicanálise Clínica. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com carinho</span>
            <Heart className="w-3.5 h-3.5 text-primary fill-current inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
