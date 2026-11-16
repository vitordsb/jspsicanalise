"use client";

/**
 * Navegacao lateral do painel.
 *
 * Substitui a barra superior, que quebrava em duas linhas: com cinco itens
 * mais o nome da profissional e dois botoes de acao, nao havia largura que
 * coubesse, e cada item novo pioraria.
 *
 * Em telas largas fica como trilho de icones, e expande para mostrar os
 * rotulos. A escolha e lembrada no navegador. Em telas pequenas vira gaveta,
 * aberta por um botao na barra fina do topo.
 *
 * A tela de clientes ja tem a propria lista lateral, entao o trilho estreito
 * e o padrao: duas barras largas lado a lado nao caberiam.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquareText,
  FileText,
  FileSignature,
  Settings,
  CalendarDays,
  ExternalLink,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  HeartHandshake,
} from "lucide-react";

const ITENS = [
  { href: "/admin/clientes", label: "Clientes & Anamneses", curto: "Clientes", icone: MessageSquareText },
  { href: "/admin/anamneses", label: "Modelos de Anamnese", curto: "Modelos", icone: FileText },
  { href: "/admin/agenda", label: "Agenda", curto: "Agenda", icone: CalendarDays },
  { href: "/admin/contratos", label: "Contratos", curto: "Contratos", icone: FileSignature },
  { href: "/admin/configuracoes", label: "Configurações", curto: "Ajustes", icone: Settings },
];

const CHAVE_EXPANDIDA = "joane_sidebar_expandida";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandida, setExpandida] = useState(false);
  const [gaveta, setGaveta] = useState(false);

  // Preferencia lembrada por navegador. Leitura protegida: em aba anonima ou
  // com armazenamento bloqueado, o acesso lanca excecao.
  useEffect(() => {
    try {
      setExpandida(localStorage.getItem(CHAVE_EXPANDIDA) === "1");
    } catch {
      // Sem preferencia guardada, segue recolhida.
    }
  }, []);

  const alternar = () => {
    setExpandida((atual) => {
      const novo = !atual;
      try {
        localStorage.setItem(CHAVE_EXPANDIDA, novo ? "1" : "0");
      } catch {
        // Preferencia nao persistida nao impede o uso.
      }
      return novo;
    });
  };

  const sair = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const ativo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const largura = expandida ? "w-56" : "w-[68px]";

  const Conteudo = ({ comRotulo }: { comRotulo: boolean }) => (
    <>
      <div className={`flex items-center gap-2.5 px-3 h-16 shrink-0 ${comRotulo ? "" : "justify-center"}`}>
        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
          <HeartHandshake className="w-4.5 h-4.5" />
        </div>
        {comRotulo && (
          <div className="min-w-0">
            <p className="font-serif text-xs font-bold text-primary leading-tight truncate">
              Joane S. O. de Andrade
            </p>
            <p className="text-[11px] text-on-surface-subtle truncate">Painel clínico</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {ITENS.map((item) => {
          const Icone = item.icone;
          const on = ativo(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setGaveta(false)}
              title={comRotulo ? undefined : item.label}
              aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold transition ${
                on
                  ? "bg-primary text-white shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-low hover:text-primary"
              } ${comRotulo ? "" : "justify-center"}`}
            >
              <Icone className="w-4.5 h-4.5 shrink-0" />
              {comRotulo && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3 pt-2 border-t border-outline-variant space-y-1">
        <a
          href="/preencher-anamnese"
          target="_blank"
          rel="noopener noreferrer"
          title={comRotulo ? undefined : "Ver formulário público"}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-low hover:text-primary transition ${
            comRotulo ? "" : "justify-center"
          }`}
        >
          <ExternalLink className="w-4.5 h-4.5 shrink-0" />
          {comRotulo && <span className="truncate">Ver formulário</span>}
        </a>

        <button
          onClick={sair}
          title={comRotulo ? undefined : "Sair"}
          className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary-container transition ${
            comRotulo ? "" : "justify-center"
          }`}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {comRotulo && <span className="truncate">Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra fina do topo, apenas em telas pequenas */}
      <div className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-outline-variant flex items-center gap-2 px-3 no-print">
        <button
          onClick={() => setGaveta(true)}
          className="p-2 rounded-full text-primary hover:bg-surface-low transition"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif text-sm font-bold text-primary truncate">
          {ITENS.find((i) => ativo(i.href))?.curto ?? "Painel"}
        </span>
      </div>

      {/* Gaveta no mobile */}
      {gaveta && (
        <div className="md:hidden fixed inset-0 z-50 no-print">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setGaveta(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-outline-variant flex flex-col">
            <button
              onClick={() => setGaveta(false)}
              className="absolute right-2 top-3 p-2 rounded-full text-on-surface-variant hover:bg-surface-low"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
            <Conteudo comRotulo />
          </div>
        </div>
      )}

      {/* Trilho fixo em telas medias e grandes */}
      <aside
        className={`hidden md:flex ${largura} shrink-0 flex-col bg-white border-r border-outline-variant h-screen sticky top-0 transition-[width] duration-200 no-print`}
      >
        <Conteudo comRotulo={expandida} />
        <button
          onClick={alternar}
          className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-semibold text-on-surface-subtle hover:bg-surface-low hover:text-primary transition"
          aria-label={expandida ? "Recolher menu" : "Expandir menu"}
        >
          {expandida ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          {expandida && <span>Recolher</span>}
        </button>
      </aside>
    </>
  );
}
