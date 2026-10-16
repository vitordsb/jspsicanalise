"use client";

/**
 * Pagina aberta pelo link do e-mail de confirmacao.
 *
 * Abrir a pagina so mostra o resumo. Quem marca a consulta e o botao: programas
 * de e-mail abrem todo link sozinhos, e isso nao pode confirmar por ninguem.
 */

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HeartHandshake, AlertTriangle, CheckCircle2, FileText, LogIn, CalendarCheck,
} from "lucide-react";
import { BotaoConteudo, TelaCarregando } from "@/components/ui/Carregando";

interface Resumo {
  nome: string;
  quando: string;
  duracaoMinutos: number;
}

interface Confirmada {
  quando: string;
  duracaoMinutos: number;
  novo: boolean;
  precisaAnamnese: boolean;
  tokenAcesso: string;
  autenticado: boolean;
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff6f4] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shadow-md shadow-[#5d0c1d]/20 mb-3">
            <HeartHandshake className="w-7 h-7" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Confirmacao() {
  const token = useSearchParams().get("t") ?? "";
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [invalido, setInvalido] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [pronta, setPronta] = useState<Confirmada | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!token) {
        setInvalido("Este link está incompleto. Abra o link do e-mail de novo.");
        setCarregando(false);
        return;
      }
      try {
        const res = await fetch(`/api/agendar/confirmar?t=${encodeURIComponent(token)}`);
        const d = await res.json().catch(() => ({}));
        if (!vivo) return;
        if (!res.ok) setInvalido(d.error || "Este link venceu ou já foi usado.");
        else setResumo(d);
      } catch {
        if (vivo) setInvalido("Falha de conexão. Verifique sua internet e abra o link de novo.");
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, [token]);

  const confirmar = async () => {
    setErro("");
    setConfirmando(true);
    try {
      const res = await fetch("/api/agendar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Link usado ou horario perdido: nao adianta clicar de novo.
        if (res.status === 410 || res.status === 409) setInvalido(d.error || "Não foi possível confirmar.");
        else setErro(d.error || "Não foi possível confirmar. Tente novamente.");
        return;
      }
      setPronta(d);
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setConfirmando(false);
    }
  };

  if (carregando) return <TelaCarregando mensagem="Abrindo seu pedido..." />;

  if (pronta) {
    return (
      <Moldura>
        <section
          aria-live="polite"
          className="bg-white rounded-3xl border border-[#f0ded8] p-7 text-center shadow-xs"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-[#e7f4ec] text-[#245f3c] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-[#5d0c1d]">Consulta confirmada</h1>
          <p className="text-sm font-semibold text-[#241a1c] mt-3 first-letter:uppercase">{pronta.quando}</p>
          <p className="text-xs text-[#6f5f62] mt-1">
            {pronta.duracaoMinutos} minutos. Horário de Brasília. Também enviamos
            esses dados por e-mail.
          </p>

          {pronta.tokenAcesso && (
            <div className="mt-5 bg-[#fbf3ef] border border-[#f0ded8] rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#9c8b8e]">
                Seu código de acesso
              </p>
              <p className="font-mono text-2xl font-bold tracking-[0.18em] text-[#5d0c1d] mt-1">
                {pronta.tokenAcesso.slice(0, 4)} {pronta.tokenAcesso.slice(4)}
              </p>
              <p className="text-[11px] text-[#6f5f62] mt-2 leading-relaxed">
                Com seu CPF, ele abre a sua área para ver ou remarcar a consulta.
                Anote: ele também foi para o seu e-mail.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            {pronta.precisaAnamnese && (
              <>
                <Link
                  href="/preencher-anamnese"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-sm font-bold shadow-md shadow-[#5d0c1d]/25 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Preencher a anamnese</span>
                </Link>
                <p className="text-[11px] text-[#6f5f62] leading-relaxed">
                  Opcional agora, mas a Dra. Joane pede que esteja preenchida antes da
                  consulta. Leva poucos minutos.
                </p>
              </>
            )}
            <Link
              href={pronta.autenticado ? "/area-do-paciente" : "/area-do-paciente/entrar"}
              className={`w-full inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm font-bold transition ${
                pronta.precisaAnamnese
                  ? "border border-[#e6d8d3] text-[#5d0c1d] hover:bg-[#fbf3ef]"
                  : "bg-[#5d0c1d] hover:bg-[#aa2d47] text-white shadow-md shadow-[#5d0c1d]/25"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Ir para a minha área</span>
            </Link>
          </div>
        </section>
      </Moldura>
    );
  }

  if (invalido || !resumo) {
    return (
      <Moldura>
        <section
          role="alert"
          className="bg-white rounded-3xl border border-[#f0ded8] p-7 text-center shadow-xs"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-[#fff0f3] text-[#aa2d47] flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-[#5d0c1d]">Não foi possível confirmar</h1>
          <p className="text-sm text-[#6f5f62] mt-2 leading-relaxed">
            {invalido || "Este link venceu ou já foi usado."}
          </p>
          <Link
            href="/agendar"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-sm font-bold transition"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Escolher um horário</span>
          </Link>
        </section>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <section className="bg-white rounded-3xl border border-[#f0ded8] p-7 text-center shadow-xs">
        <h1 className="font-serif text-xl font-bold text-[#5d0c1d]">
          {resumo.nome ? `${resumo.nome}, confirme sua consulta` : "Confirme sua consulta"}
        </h1>
        <p className="text-sm text-[#6f5f62] mt-2">Com a Dra. Joane Souza Oliveira de Andrade.</p>
        <p className="text-sm font-semibold text-[#241a1c] mt-4 first-letter:uppercase">{resumo.quando}</p>
        <p className="text-xs text-[#6f5f62] mt-1">{resumo.duracaoMinutos} minutos. Horário de Brasília.</p>

        {erro && (
          <div
            role="alert"
            className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3 rounded-2xl text-xs flex items-start gap-2 mt-4 text-left"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={confirmando}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-[#5d0c1d]/25 transition"
        >
          <BotaoConteudo carregando={confirmando} rotuloCarregando="Confirmando...">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar minha consulta</span>
          </BotaoConteudo>
        </button>
        <p className="text-[11px] text-[#9c8b8e] mt-4 leading-relaxed">
          Não foi você que pediu? É só fechar esta página: nada será marcado.
        </p>
      </section>
    </Moldura>
  );
}

export default function ConfirmarAgendamentoPage() {
  // useSearchParams exige Suspense: sem ele a pagina inteira deixa de ser
  // pre-renderizada e o build reclama.
  return (
    <Suspense fallback={<TelaCarregando mensagem="Abrindo seu pedido..." />}>
      <Confirmacao />
    </Suspense>
  );
}
