"use client";

/**
 * Agendamento pelo link publico, sem login e sem anamnese.
 *
 * Tres passos: escolher o horario, deixar os dados e conferir o e-mail. A
 * consulta so existe depois do clique no link do e-mail (ver
 * /api/agendar/confirmar), e e isso que a tela do ultimo passo explica.
 *
 * O texto evita jargao e promessa: quem chega aqui esta dando um passo dificil.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HeartHandshake, AlertTriangle, MailCheck, ArrowLeft, CalendarClock, Lock, Send,
} from "lucide-react";
import { formatCPF, formatPhone } from "@/lib/formatters";
import { isValidCpf } from "@/lib/cpf";
import { formatarDataHora } from "@/lib/agenda";
import { BotaoConteudo, EsqueletoCartoes } from "@/components/ui/Carregando";
import { CalendarioPaciente, type Vaga } from "@/components/paciente/CalendarioPaciente";

type Passo = "horario" | "dados" | "enviado";

const CAMPO =
  "w-full h-12 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none";

export default function AgendarPage() {
  const [passo, setPasso] = useState<Passo>("horario");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [duracao, setDuracao] = useState(50);
  const [semJanelas, setSemJanelas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [escolhida, setEscolhida] = useState("");
  const [validade, setValidade] = useState(30);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  // O aviso fica no topo e o botao la embaixo: sem rolar ate ele, em celular a
  // pessoa tocaria em enviar e nao veria nada acontecer.
  const avisoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (erro) avisoRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [erro]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  // Campo-isca: pessoa nao ve nem preenche, robo preenche.
  const [website, setWebsite] = useState("");

  // Contador que dispara nova busca. O fetch fica dentro do effect (setState
  // so depois do await), e recarregar e so incrementar este numero.
  const [tentativa, setTentativa] = useState(0);
  const recarregarVagas = () => {
    setCarregando(true);
    setTentativa((n) => n + 1);
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch("/api/agendar");
        if (!vivo) return;
        if (!res.ok) {
          setErro("Não foi possível carregar os horários. Tente de novo em instantes.");
          return;
        }
        const d = await res.json();
        if (!vivo) return;
        setVagas(d.vagas ?? []);
        setDuracao(d.duracaoMinutos ?? 50);
        setSemJanelas(Boolean(d.semJanelas));
      } catch {
        if (vivo) setErro("Falha de conexão. Verifique sua internet e tente novamente.");
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, [tentativa]);

  const validar = (): string => {
    if (nome.trim().split(/\s+/).filter(Boolean).length < 2) return "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um e-mail válido.";
    if (telefone.replace(/\D/g, "").length < 10) return "Informe um telefone com DDD.";
    if (!isValidCpf(cpf)) return "CPF inválido. Confira os números digitados.";
    return "";
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, email, telefone, cpf, inicioIso: escolhida, website,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(d.error || "Não foi possível enviar seu pedido.");
        // Vaga tomada ou fora da regra: volta para a lista atualizada.
        if (res.status === 409 || res.status === 422) {
          setEscolhida("");
          setPasso("horario");
          recarregarVagas();
        }
        return;
      }
      setValidade(d.validadeMinutos ?? 30);
      setPasso("enviado");
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff6f4] px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6f5f62] hover:text-[#5d0c1d] transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao início</span>
        </Link>

        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white shadow-md shadow-[#5d0c1d]/20 mb-3">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5d0c1d]">
            Agende sua consulta
          </h1>
          <p className="text-sm text-[#6f5f62] mt-1.5 leading-relaxed max-w-md mx-auto">
            Escolha um horário com a Dra. Joane. Não precisa preencher a ficha de
            anamnese agora: ela pode ser feita depois.
          </p>
        </div>

        {erro && (
          <div
            ref={avisoRef}
            role="alert"
            className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3.5 rounded-2xl text-xs flex items-start gap-2 mb-5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {passo === "horario" && (
          <section aria-label="Escolha do horário">
            {carregando ? (
              <EsqueletoCartoes />
            ) : semJanelas || vagas.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#f0ded8] p-6 text-center">
                <CalendarClock className="w-8 h-8 mx-auto text-[#ccb38d] mb-2" />
                <p className="text-sm font-semibold text-[#241a1c]">
                  Não há horários livres no momento.
                </p>
                <p className="text-xs text-[#6f5f62] mt-1 leading-relaxed">
                  Fale com a Dra. Joane pelo WhatsApp para combinar um horário.
                </p>
              </div>
            ) : (
              <CalendarioPaciente
                vagas={vagas}
                duracaoMinutos={duracao}
                salvando=""
                aoMarcar={(inicioIso) => {
                  setEscolhida(inicioIso);
                  setErro("");
                  setPasso("dados");
                }}
                tituloDialogo="Usar este horário?"
                textoDialogo="No próximo passo você deixa seus dados. O horário só fica marcado depois que você confirmar pelo e-mail."
                rotuloConfirmar="Continuar"
              />
            )}
          </section>
        )}

        {passo === "dados" && (
          <form
            onSubmit={enviar}
            className="bg-white rounded-3xl border border-[#f0ded8] p-6 sm:p-7 shadow-xs space-y-5"
            noValidate
          >
            <div className="bg-[#fbf3ef] rounded-2xl p-3.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#9c8b8e]">Horário escolhido</p>
                <p className="text-sm font-semibold text-[#5d0c1d] first-letter:uppercase">
                  {formatarDataHora(escolhida)}
                </p>
                <p className="text-[11px] text-[#6f5f62] mt-0.5">
                  {duracao} minutos. Horário de Brasília.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPasso("horario"); setErro(""); }}
                className="text-xs font-semibold text-[#5d0c1d] underline underline-offset-2 shrink-0"
              >
                Trocar
              </button>
            </div>

            <div>
              <label htmlFor="ag-nome" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Nome completo
              </label>
              <input
                id="ag-nome"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={CAMPO}
              />
            </div>

            <div>
              <label htmlFor="ag-email" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                E-mail
              </label>
              <input
                id="ag-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CAMPO}
              />
              <p className="text-[11px] text-[#9c8b8e] mt-1.5 ml-2">
                É para ele que enviamos o link de confirmação.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="ag-tel" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Telefone com DDD
                </label>
                <input
                  id="ag-tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  className={CAMPO}
                />
              </div>
              <div>
                <label htmlFor="ag-cpf" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  CPF
                </label>
                <input
                  id="ag-cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className={CAMPO}
                />
              </div>
            </div>

            {/* Isca contra robo: fora da tela e fora da navegacao por teclado. */}
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
              <label htmlFor="ag-site">Não preencha este campo</label>
              <input
                id="ag-site"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-[#5d0c1d]/25 transition"
            >
              <BotaoConteudo carregando={enviando} rotuloCarregando="Enviando...">
                <Send className="w-4 h-4" />
                <span>Receber o link de confirmação</span>
              </BotaoConteudo>
            </button>

            <div className="border-t border-[#f3e4e0] pt-4 flex items-start gap-2 text-[11px] text-[#6f5f62] leading-relaxed">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#ccb38d]" />
              <p>
                Usamos seus dados apenas para marcar a consulta e entrar em contato,
                com sigilo profissional e proteção da LGPD. Se você não confirmar
                pelo e-mail, o pedido é apagado.
              </p>
            </div>
          </form>
        )}

        {passo === "enviado" && (
          <section
            aria-live="polite"
            className="bg-white rounded-3xl border border-[#f0ded8] p-7 text-center shadow-xs"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-[#e7f4ec] text-[#245f3c] flex items-center justify-center mb-3">
              <MailCheck className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#5d0c1d]">Falta só um passo</h2>
            <p className="text-sm text-[#6f5f62] mt-2 leading-relaxed">
              Enviamos um e-mail para você com o botão de confirmação. A consulta só
              fica marcada depois que você clicar nele.
            </p>
            <p className="text-sm font-semibold text-[#241a1c] mt-4 first-letter:uppercase">
              {formatarDataHora(escolhida)}
            </p>
            <p className="text-xs text-[#6f5f62] mt-1">
              O horário fica reservado por {validade} minutos.
            </p>
            <p className="text-[11px] text-[#9c8b8e] mt-5 leading-relaxed">
              Não chegou? Olhe a caixa de spam. Se continuar sem aparecer, volte e
              tente de novo ou fale com a Dra. Joane pelo WhatsApp.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
