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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 mb-3">
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
          className="bg-white rounded-3xl border border-outline-variant p-7 text-center shadow-xs"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-success-container text-success flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-primary">Consulta confirmada</h1>
          <p className="text-sm font-semibold text-on-surface mt-3 first-letter:uppercase">{pronta.quando}</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {pronta.duracaoMinutos} minutos. Horário de Brasília. Também enviamos
            esses dados por e-mail.
          </p>

          {pronta.tokenAcesso && (
            <div className="mt-5 bg-surface-low border border-outline-variant rounded-2xl p-4">
              <p className="text-[12px] uppercase tracking-[0.08em] text-on-surface-subtle">
                Seu código de acesso
              </p>
              <p className="font-mono text-2xl font-bold tracking-[0.18em] text-primary mt-1">
                {pronta.tokenAcesso.slice(0, 4)} {pronta.tokenAcesso.slice(4)}
              </p>
              <p className="text-[12px] text-on-surface-variant mt-2 leading-relaxed">
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
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary hover:bg-secondary text-white text-sm font-bold shadow-md shadow-primary/25 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Preencher a anamnese</span>
                </Link>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Opcional agora, mas a Dra. Joane pede que esteja preenchida antes da
                  consulta. Leva poucos minutos.
                </p>
              </>
            )}
            <Link
              href={pronta.autenticado ? "/area-do-paciente" : "/area-do-paciente/entrar"}
              className={`w-full inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm font-bold transition ${
                pronta.precisaAnamnese
                  ? "border border-outline-variant text-primary hover:bg-surface-low"
                  : "bg-primary hover:bg-secondary text-white shadow-md shadow-primary/25"
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
          className="bg-white rounded-3xl border border-outline-variant p-7 text-center shadow-xs"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-secondary-container text-secondary flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-primary">Não foi possível confirmar</h1>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
            {invalido || "Este link venceu ou já foi usado."}
          </p>
          <Link
            href="/agendar"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary hover:bg-secondary text-white text-sm font-bold transition"
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
      <section className="bg-white rounded-3xl border border-outline-variant p-7 text-center shadow-xs">
        <h1 className="font-serif text-xl font-bold text-primary">
          {resumo.nome ? `${resumo.nome}, confirme sua consulta` : "Confirme sua consulta"}
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Com a Dra. Joane Souza Oliveira de Andrade.</p>
        <p className="text-sm font-semibold text-on-surface mt-4 first-letter:uppercase">{resumo.quando}</p>
        <p className="text-xs text-on-surface-variant mt-1">{resumo.duracaoMinutos} minutos. Horário de Brasília.</p>

        {erro && (
          <div
            role="alert"
            className="bg-secondary-container border border-primary-container-high text-secondary p-3 rounded-2xl text-xs flex items-start gap-2 mt-4 text-left"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={confirmando}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-primary/25 transition"
        >
          <BotaoConteudo carregando={confirmando} rotuloCarregando="Confirmando...">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar minha consulta</span>
          </BotaoConteudo>
        </button>
        <p className="text-[12px] text-on-surface-subtle mt-4 leading-relaxed">
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
