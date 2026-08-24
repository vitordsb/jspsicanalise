"use client";

/**
 * Layout da area do paciente. Existe para dar o provider de avisos: aqui a
 * pessoa envia contrato e marca consulta, e precisa saber se deu certo.
 */

import { ToastProvider } from "@/components/ui/Toast";

export default function AreaPacienteLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
