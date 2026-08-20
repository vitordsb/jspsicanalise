"use client";

import Link from "next/link";
import { HeartHandshake, ShieldCheck, UserCheck, ArrowRight } from "lucide-react";

export const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-40 bg-[#fff6f4]/95 backdrop-blur-md border-b border-[#f3e4e0] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* LOGO & NOME */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shadow-md shadow-[#5d0c1d]/20 group-hover:scale-105 transition">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5d0c1d]">
                Psicóloga & Psicanalista
              </span>
            </div>
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#5d0c1d] block leading-none">
              Joane Silva
            </span>
          </div>
        </Link>

        {/* NAVEGAÇÃO & CTA */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/preencher-anamnese"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#5d0c1d] hover:bg-[#aa2d47] shadow-sm shadow-[#5d0c1d]/20 transition transform active:scale-98"
          >
            <span>Preencher Anamnese</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/clientes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#5d0c1d] bg-[#f8dad2] hover:bg-[#f3cbc1] transition"
          >
            <UserCheck className="w-4 h-4 text-[#5d0c1d]" />
            <span>Painel da Joane</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
