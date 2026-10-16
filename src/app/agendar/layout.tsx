import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar consulta | Joane Souza Oliveira de Andrade",
  description:
    "Escolha um horário e agende sua consulta com a Dra. Joane Souza Oliveira de Andrade, sem precisar preencher a anamnese antes.",
};

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
