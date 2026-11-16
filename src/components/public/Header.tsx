"use client";

import Link from "next/link";
import { HeartHandshake, ShieldCheck, UserCheck, ArrowRight } from "lucide-react";

export const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* LOGO & NOME */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                Psicanálise clínica
              </span>
            </div>
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-primary block leading-none">
              Joane Souza Oliveira de Andrade
            </span>
          </div>
        </Link>

        {/* NAVEGAÇÃO & CTA */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/preencher-anamnese"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-primary hover:bg-secondary shadow-sm shadow-primary/20 transition transform active:scale-98"
          >
            <span>Preencher Anamnese</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/clientes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-primary bg-primary-container hover:bg-primary-container-high transition"
          >
            <UserCheck className="w-4 h-4 text-primary" />
            <span>Painel da Joane</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
