"use client";

/**
 * Entrada da area do paciente: CPF mais o codigo de acesso recebido ao enviar
 * a anamnese.
 *
 * O texto evita jargao. Quem chega aqui acabou de preencher uma ficha sobre a
 * propria vida emocional, nao precisa lidar com "token" nem "autenticacao".
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, LogIn, AlertTriangle, HelpCircle } from "lucide-react";
import { formatCPF } from "@/lib/formatters";
import { BotaoConteudo } from "@/components/ui/Carregando";

export default function EntrarPacientePage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEntrando(true);
    try {
      const res = await fetch("/api/paciente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, token: codigo }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(dados.error || "Não foi possível entrar.");
        return;
      }
      router.push("/area-do-paciente");
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 mb-3">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Acompanhe seu atendimento
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Entre com o CPF e o código que você recebeu ao enviar sua ficha.
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="bg-white rounded-3xl border border-outline-variant p-6 sm:p-7 shadow-xs space-y-5"
        >
          {erro && (
            <div className="bg-secondary-container border border-primary-container-high text-secondary p-3.5 rounded-2xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label htmlFor="pac-cpf" className="block text-xs font-semibold text-on-surface mb-1.5">
              Seu CPF
            </label>
            <input
              id="pac-cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              className="w-full h-12 px-4 rounded-lg border border-outline bg-surface-container text-sm text-on-surface focus:bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="pac-codigo" className="block text-xs font-semibold text-on-surface mb-1.5">
              Código de acesso
            </label>
            <input
              id="pac-codigo"
              inputMode="numeric"
              autoComplete="off"
              placeholder="8 números"
              maxLength={9}
              value={codigo}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                setCodigo(d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d);
              }}
              className="w-full h-12 px-4 rounded-lg border border-outline bg-surface-container text-lg tracking-[0.25em] text-center text-on-surface focus:bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={entrando}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-primary/25 transition"
          >
            <BotaoConteudo carregando={entrando} rotuloCarregando="Entrando...">
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </BotaoConteudo>
          </button>

          <div className="border-t border-outline-variant pt-4 flex items-start gap-2 text-[12px] text-on-surface-variant leading-relaxed">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-tertiary" />
            <p>
              Perdeu o código? Por segurança ele não pode ser recuperado, apenas
              trocado por um novo. Fale com a Dra. Joane que ela emite outro para
              você.
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Ainda não preencheu sua ficha?{" "}
          <Link href="/preencher-anamnese" className="text-primary font-semibold underline underline-offset-2">
            Preencher agora
          </Link>
        </p>
      </div>
    </div>
  );
}
