"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquareText,
  FileText,
  FileSignature,
  Settings,
  ExternalLink,
  HeartHandshake,
  LogOut,
} from "lucide-react";

export const AdminHeader = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "Clientes & Anamneses",
      href: "/admin/clientes",
      icon: MessageSquareText,
    },
    {
      label: "Modelos de Anamnese",
      href: "/admin/anamneses",
      icon: FileText,
    },
    {
      label: "Contratos",
      href: "/admin/contratos",
      icon: FileSignature,
    },
    {
      label: "Configurações",
      href: "/admin/configuracoes",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Erro ao sair:", e);
      window.location.href = "/admin/login";
    }
  };

  return (
    <header className="bg-white border-b border-[#f0ded8] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* LOGO & TITLE */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            {/* Nome completo so visivel em telas largas (lg+) pois o header tem muitos itens em md */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-[#5d0c1d] leading-none">
                  Joane Souza Oliveira de Andrade
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] uppercase tracking-wide">
                  Painel Clínico
                </span>
              </div>
              <span className="text-xs text-[#6f5f62]">Psicologia & Psicanálise</span>
            </div>
            {/* Em md mostra so o badge compacto */}
            <span className="lg:hidden text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] uppercase tracking-wide">
              Painel Clínico
            </span>
          </div>

          {/* NAV LINKS */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#5d0c1d] text-white shadow-xs"
                      : "text-[#6f5f62] hover:bg-[#fbf3ef] hover:text-[#5d0c1d]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ACTIONS: VER LINK PÚBLICO & LOGOUT */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/preencher-anamnese"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#f0ded8] text-xs font-semibold text-[#5d0c1d] bg-[#fbf3ef] hover:bg-[#f8dad2] transition"
            >
              <span>Ver Formulário</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#5d0c1d]" />
            </Link>

            <button
              onClick={handleLogout}
              title="Sair do painel"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[#9c8b8e] hover:text-[#aa2d47] hover:bg-[#fff0f3] transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#f3e4e0]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  isActive
                    ? "bg-[#5d0c1d] text-white"
                    : "text-[#6f5f62] hover:bg-[#fbf3ef]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
