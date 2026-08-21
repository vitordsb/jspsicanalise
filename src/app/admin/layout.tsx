"use client";

/**
 * Layout do painel: navegacao lateral fixa mais a area de conteudo.
 *
 * Duas rotas ficam de fora: o login, que e a porta de entrada e nao deve
 * mostrar navegacao, e a pagina de impressao do contrato, que precisa do
 * documento sozinho no body para o navegador paginar corretamente.
 */

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const semNavegacao =
    pathname === "/admin/login" || /^\/admin\/contratos\/[^/]+\/imprimir$/.test(pathname);

  if (semNavegacao) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-[#fff6f4]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
