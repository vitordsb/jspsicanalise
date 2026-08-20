import type { Metadata } from "next";
import { Source_Sans_3, Lora } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "JS Psicanálise | Dra. Joane Silva - Acolhimento & Anamnese Clínica",
  description:
    "Espaço ético e acolhedor de escuta psicanalítica, anamnese virtual e acompanhamento terapêutico com a Dra. Joane Silva.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${sourceSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#fff6f4] text-[#241a1c]">
        {children}
      </body>
    </html>
  );
}
